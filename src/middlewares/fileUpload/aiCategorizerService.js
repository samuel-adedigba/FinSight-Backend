// // import { GoogleGenerativeAI } from "@google/generative-ai";
// import config from "../../config/index.js";
// import OpenAI from "openai";

// // Load your API key from environment variables
// // const genAI = new GoogleGenerativeAI(config.geminiApiKey);


// // Setup OpenAI client
// const openai = new OpenAI({
//   apiKey: config.openaiApiKey,
//    baseURL: process.env.OPENAI_BASE_URL,
// });
// // Timeout helper
// function withTimeout(promise, ms) {
//   let id;
//   const timeout = new Promise((_, rej) => {
//     id = setTimeout(() => rej(new Error("AI request timed out")), ms);
//   });
//   return Promise.race([promise.finally(() => clearTimeout(id)), timeout]);
// }
// async function safeGenerate(prompt, model) {
//   try {
//     const result = await withTimeout(model.generateContent(prompt), timeoutMs);
//     return result;
//   } catch (err) {
//     if (err.status === 429 && err.errorDetails) {
//       const retrySec = err.errorDetails
//         .find(d => d['@type'].endsWith('RetryInfo'))
//         ?.retryDelay
//         .replace(/s$/, '');
//       console.warn(`Rate‑limited, retrying in ${retrySec}s…`);
//       await new Promise(r => setTimeout(r, Number(retrySec) * 1000));
//       return model.generateContent(prompt);        // one more shot
//     }
//     throw err;
//   }
// }

// /**
//  * Uses Google's Gemini Pro to categorize a batch of transaction descriptions.
//  * @param {string[]} descriptions - An array of transaction descriptions to categorize.
//  * @param {string[]} availableCategories - An array of the user's existing category names.
//  * @returns {Promise<Object>} A promise that resolves to an object mapping descriptions to category names.
//  */
// export async function getCategoriesFromAI(
//   descriptions = [],
//   availableCategories = [],
//   chunkSize = 20,
//   timeoutMs = 10000
// ) {
//   if (!descriptions.length) return {};

//   const finalMap = {};

//   // Process in chunks
//   for (let i = 0; i < descriptions.length; i += chunkSize) {
//      const chunk = descriptions.slice(i, i + chunkSize);
//     // const chunk = descriptions.slice(i, i + chunkSize).map((desc, idx) => {
//     //   const txn = unknowns[i + idx];
//     //   const tagPart = txn.tag ? ` (merchant tag: “${txn.tag}”)` : "";
//     //   return `${desc}${tagPart}`;
//     // });

//     // This is the core of the magic: The Prompt
//     const prompt = `
//     You are an expert financial transaction categorizer for an app called FinSight.
//     Your task is to assign a category to each transaction description from a given list.
//     You must use one of the "Available Categories" provided.
//     If no existing category is a good fit, you are allowed to suggest a logical, common-sense new category, but keep it concise (e.g., "Coffee Shops", "Loan", "Withdrawal POS").

//     Available Categories: [${availableCategories.join(", ")}]

//     Transaction Descriptions to categorize:
// ${chunk.map(desc => `- ${desc}`).join("\n")}

//     Your response MUST be a valid JSON object where each key is a transaction description from the list and its value is the assigned category name. Do not include any other text, explanations, or markdown formatting in your response.


// If none fit, suggest a concise new category.

// Respond with a JSON object mapping each description exactly:
//     {
//       "CHEVRON 5543": "Transportation",
//       "SQ *THE CORNER CAFE": "Eating Out",
//       "bread": "Food",
//       "2.5gb for 2 days purchase": "Data",
//       "tfff": "Others",
//     }
//       No extra text or markdown.

//   `;

//   //   try {
//   //     // Fire the AI call with a timeout
//   //       const model = genAI.getGenerativeModel({ model: config.geminiModel });
//   //     const result = await safeGenerate(prompt, model);
//   //     const response = await result.response;
//   //     let text = response.text();

//   //     // Strip code fences if present
//   //     text = text
//   //       .replace(/```json/gi, "")
//   //       .replace(/```/g, "")
//   //       .trim();
//   //     // Ensure it starts at a JSON object
//   //     const firstBracket = text.indexOf("{");
//   //     if (firstBracket > 0) text = text.slice(firstBracket);

//   //     const parsed = JSON.parse(text);

//   //     // Validate shape: all keys and values
//   //     for (const [desc, cat] of Object.entries(parsed)) {
//   //       if (chunk.includes(desc) && typeof cat === "string" && cat.length > 0) {
//   //         finalMap[desc] = cat;
//   //       } else {
//   //         console.warn(
//   //           `AI output invalid mapping for "${desc}" → "${cat}", falling back`
//   //         );
//   //       }
//   //     }
//   //   } catch (err) {
//   //   console.error("AI error, falling back to rules:", err.message);
//   // // return an empty map so categorizeBatch will assign “Uncategorized”
//   // return {};
//   //   }
//       try {
//       const completion = await Promise.race([
//         openai.chat.completions.create({
//            model: 'deepseek-chat',
//           temperature: 0.3,
//           messages: [
//             {
//               role: "system",
//               content: "You are a financial categorization assistant for an app called FinSight.",
//             },
//             {
//               role: "user",
//               content: prompt,
//             },
//           ],
//       }),
//         new Promise((_, reject) =>
//           setTimeout(() => reject(new Error("Timeout")), timeoutMs)
//         ),
//       ]);
//       let content = completion.choices[0].message.content.trim();
//       console.log("gpt",content);

//       // Remove any code fences (just in case)
//       content = content
//         .replace(/```json/gi, "")
//         .replace(/```/g, "")
//         .trim();

//       const firstBrace = content.indexOf("{");
//       if (firstBrace > 0) content = content.slice(firstBrace);

//       const parsed = JSON.parse(content);

//       for (const [desc, cat] of Object.entries(parsed)) {
//         if (chunk.includes(desc) && typeof cat === "string" && cat.length > 0) {
//           finalMap[desc] = cat;
//         } else {
//           console.warn(
//             `Invalid mapping from AI → "${desc}": "${cat}"`
//           );
//         }
//       }
//     } catch (err) {
//       console.error("OpenAI error during categorization:", err.message);
//       return {};
//     }
//   }

//   return finalMap;
// }

import { pipeline, cos_sim } from '@xenova/transformers';
import path from 'path';

/**
 * EmbeddingPipeline: singleton loader for the AI model.
 * Ensures we only download & load once, caching to disk.
 */
class EmbeddingPipeline {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance = null;

  static async getInstance() {
    if (!this.instance) {
      console.log('🔄 Loading embedding model into memory...');
      const cacheDir = process.env.TRANSFORMERS_CACHE_PATH || undefined;
      this.instance = await pipeline(this.task, this.model, {
        cache_dir: cacheDir,
      });
      console.log('✅ Model loaded and ready');
    }
    return this.instance;
  }
}

/**
 * Precompute embeddings for every category name once.
 */
export async function precomputeCategoryEmbeddings(names) {
  if (!names || !names.length) return [];
  const embedder = await EmbeddingPipeline.getInstance();
  const out = [];
  for (const name of names) {
    const result = await embedder(name, { pooling: 'mean', normalize: true });
    out.push({ name, embedding: Array.from(result.data) });
  }
  return out;
}

/**
 * Batch‑categorize descriptions against precomputed category embeddings.
 * Returns Map<description, categoryName|null>.
 */
export async function batchCategorizeAI(descriptions, categories) {
  if (!descriptions.length) return new Map();
  const embedder = await EmbeddingPipeline.getInstance();
  // Batch embed all descriptions
  const descOutputs = await embedder(descriptions, {
    pooling: 'mean',
    normalize: true,
  });

  const SIM_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.4;
  const results = new Map();

  descriptions.forEach((desc, i) => {
    const descEmb = Array.from(descOutputs[i].data);
    let best = { name: null, score: 0 };
    for (const { name, embedding } of categories) {
      const score = cos_sim(descEmb, embedding);
      if (score > best.score) best = { name, score };
    }
    // If below threshold, mark null so we can fallback later
    results.set(desc, best.score >= SIM_THRESHOLD ? best.name : null);
  });

  return results;
}
