// // src/middlewares/fileUpload/listModels.js
// import axios from 'axios';
// import config from "../../config/index.js";

// async function listModels() {
//   try {
//     const res = await axios.get(
//       "https://generativelanguage.googleapis.com/v1beta/models",
//       {
//         params: { key: config.geminiApiKey }
//       }
//     );
//     console.log(
//       "✅ Available models:",
//       res.data.models.map(m => m.name)
//     );
//   } catch (err) {
//     console.error("❌ Failed to list models:", err.response?.data || err.message);
//   }
// }

// listModels();
