// import { prisma } from "../db/prisma.js";
// import { addMonths, differenceInDays, addDays, addYears } from "date-fns";
// import { findBestMatch } from "string-similarity";

// // We only trust a recurring pattern if we’ve seen at least 3 payments.
// const MIN_OCCURRENCES = 3;
// // When deciding if something is “monthly,” we allow ±3 days of wiggle room (to cover shorter months, weekends, etc.).
// const TOLERANCE_DAYS = 3;

// export async function analyzeUserTransactions(userId) {
//   // 1) fetch last 6 months of debit transactions
//   const cutoff = addMonths(new Date(), -6);
//   console.log(
//     `Analyzing transactions for user ${userId} since ${cutoff.toISOString()}`
//   );
//   const txns = await prisma.transaction.findMany({
//     where: { account: { userId }, type: "debit", createdAt: { gte: cutoff } },
//     orderBy: { createdAt: "asc" },
//   });
//   console.log(`Found ${txns.length} transactions for user ${userId}`);

//   // 2) cleanup & group by payee
//   const groups = {};
//   for (const t of txns) {
//     let desc = (t.tag || t.description || "")
//       .toLowerCase()
//       .replace(/[^a-z0-9\s]/g, "")
//       .trim();
//     const keys = Object.keys(groups);
//     if (keys.length && findBestMatch(desc, keys).bestMatch.rating > 0.7) {
//       const target = findBestMatch(desc, keys).bestMatch.target;
//       groups[target].push(t);
//     } else {
//       groups[desc] = [t];
//     }
//   }

//   // 3) detect patterns & upsert
//   for (const name in groups) {
//     const arr = groups[name];
//     if (arr.length < MIN_OCCURRENCES) continue;

//     // compute intervals & avg
//     const intervals = [];
//     let sumAmt = 0;
//     for (let i = 1; i < arr.length; i++) {
//       intervals.push(differenceInDays(arr[i].createdAt, arr[i - 1].createdAt));
//       sumAmt += arr[i].amount;
//     }
//     const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
//     let freq;
//     if (Math.abs(avgInterval - 30.44) <= TOLERANCE_DAYS) freq = "monthly";
//     else if (Math.abs(avgInterval - 7) <= 1) freq = "weekly";
//     else if (Math.abs(avgInterval - 365.25) <= 15) freq = "yearly";
//     if (!freq) continue;

//     const predictedAmount = sumAmt / intervals.length;
//     const lastTxn = arr[arr.length - 1];
//     let nextDate;
//     if (freq === "monthly") nextDate = addMonths(lastTxn.createdAt, 1);
//     if (freq === "weekly") nextDate = addDays(lastTxn.createdAt, 7);
//     if (freq === "yearly") nextDate = addYears(lastTxn.createdAt, 1);

//     await prisma.recurringTransaction.upsert({
//       where: { userId_name: { userId, name } },
//       update: {
//         predictedAmount,
//         predictedDate: nextDate,
//         frequency: freq,
//         confidenceScore: 0.9,
//         lastRealTransactionId: lastTxn.id,
//       },
//       create: {
//         userId,
//         name,
//         predictedAmount,
//         predictedDate: nextDate,
//         frequency: freq,
//         confidenceScore: 0.9,
//         lastRealTransactionId: lastTxn.id,
//       },
//     });
//   }
// }

// import { prisma } from "../db/prisma.js";
// import { addMonths, differenceInDays, addDays, addYears } from 'date-fns';
// import { findBestMatch } from 'string-similarity';

// const MIN_OCCURRENCES = 3;
// const TOLERANCE_DAYS = 3;
// // Confidence threshold for fuzzy matching descriptions
// const SIMILARITY_THRESHOLD = 0.7; 

// export async function analyzeUserTransactions(userId) {
//   const cutoff = addMonths(new Date(), -24);
//   console.log(`Analyzing transactions for user ${userId} since ${cutoff.toISOString()}`);
  
//   const txns = await prisma.transaction.findMany({
//     where: { 
//       account: { userId }, // Assuming this relation is correct
//       type: 'debit', 
//       createdAt: { gte: cutoff } 
//     },
//     orderBy: { createdAt: 'asc' }
//   });
//   console.log(`Found ${txns.length} transactions for user ${userId}`);

//   // --- REFINED GROUPING LOGIC ---
//   const groups = {};
//   const untaggedTransactions = [];

//   // Phase 1: Group by clean 'tag' first (High-Confidence)
//   for (const t of txns) {
//     if (t.tag && t.tag.trim() !== '') {
//       const tagName = t.tag.toLowerCase().trim();
//       if (!groups[tagName]) {
//         groups[tagName] = [];
//       }
//       groups[tagName].push(t);
//     } else {
//       untaggedTransactions.push(t);
//     }
//   }

//   // Phase 2: Group remaining untagged transactions by 'description' (Fuzzy-Matching)
//   for (const t of untaggedTransactions) {
//     // Clean up the raw description
//     const desc = (t.description || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
//     if (desc === '') continue; // Skip transactions with no usable description

//     const existingKeys = Object.keys(groups);
//     if (!existingKeys.length) {
//         groups[desc] = [t];
//         continue;
//     }
    
//     const { bestMatch } = findBestMatch(desc, existingKeys);

//     if (bestMatch.rating > SIMILARITY_THRESHOLD) {
//       // Found a similar existing group, add to it
//       groups[bestMatch.target].push(t);
//     } else {
//       // Not similar enough, create a new group for this description
//       groups[desc] = [t];
//     }
//   }
  
//   console.log(`Grouped transactions into ${Object.keys(groups).length} potential recurring payments.`);

//   // --- The rest of your pattern detection logic remains the same, as it's solid ---

//   // 3) Detect patterns & upsert
//   for (const name in groups) {
//     const arr = groups[name];
//     if (arr.length < MIN_OCCURRENCES) continue;

//     const intervals = [];
//     const amounts = []; // It's safer to use a dedicated amounts array
//     for (let i = 1; i < arr.length; i++) {
//       intervals.push(differenceInDays(arr[i].createdAt, arr[i-1].createdAt));
//       amounts.push(arr[i].amount); // Populate the amounts array
//     }
//     // Also include the first transaction's amount
//     if (arr.length > 0) {
//         amounts.push(arr[0].amount);
//     }

//     const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
//     let freq;
//     if (Math.abs(avgInterval - 30.44) <= TOLERANCE_DAYS) freq = 'monthly';
//     else if (Math.abs(avgInterval - 7) <= 1) freq = 'weekly';
//     else if (Math.abs(avgInterval - 365.25) <= 15) freq = 'yearly';
    
//     if (!freq) continue;

//     // More robust amount calculation
//     const predictedAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
//     const lastTxn = arr[arr.length - 1];
    
//     let nextDate;
//     if (freq === 'monthly') nextDate = addMonths(lastTxn.createdAt, 1);
//     else if (freq === 'weekly') nextDate = addDays(lastTxn.createdAt, 7);
//     else if (freq === 'yearly') nextDate = addYears(lastTxn.createdAt, 1);
    
//     console.log(`Found recurring transaction: [${name}] | Frequency: ${freq} | Next Due: ${nextDate.toISOString()}`);

//     await prisma.recurringTransaction.upsert({
//       where: { userId_name: { userId, name } },
//       update: { 
//         predictedAmount, 
//         predictedDate: nextDate, 
//         frequency: freq, 
//         confidenceScore: 0.9, // This can be made more dynamic later
//         lastRealTransactionId: lastTxn.id 
//       },
//       create: { 
//         userId, 
//         name, 
//         predictedAmount, 
//         predictedDate: nextDate, 
//         frequency: freq, 
//         confidenceScore: 0.9, 
//         lastRealTransactionId: lastTxn.id 
//       }
//     });
//   }
// }

// services/analyzeUserTransactions.js
import { prisma } from "../db/prisma.js";
import { addMonths, differenceInDays, addDays, addYears, addWeeks } from 'date-fns';
import { findBestMatch } from 'string-similarity';

// Minimal constants - only for data quality
const MIN_OCCURRENCES = 3;  // Minimum for statistical significance
const SIMILARITY_THRESHOLD = 0.7;  // For transaction grouping

export async function analyzeUserTransactions(userId) {
  console.log(`🎯 Starting ADAPTIVE analysis for user ${userId}`);
  console.log(`📋 Goal: Learn patterns from actual transaction data without assumptions`);
  
  try {
    const cutoff = addMonths(new Date(), -24);
    console.log(`📅 Analyzing transactions since ${cutoff.toISOString()}`);

    const txns = await prisma.transaction.findMany({
      where: {
        account: { userId },
        type: 'debit',
        createdAt: { gte: cutoff }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 Fetched ${txns.length} debit transactions for analysis`);

    if (txns.length === 0) {
      return { 
        message: "No transactions found", 
        groupsFormed: 0, 
        patternsDetected: 0 
      };
    }

    // Group transactions without assumptions
    const groups = await groupTransactions(txns);
    
    console.log(`📦 Formed ${Object.keys(groups).length} transaction groups`);

    // Adaptive pattern detection - learns from the data
    const analysisResults = await detectAdaptivePatterns(groups, userId);
    
    const summary = {
      message: "Adaptive analysis completed",
      userId,
      transactionsFetched: txns.length,
      groupsFormed: Object.keys(groups).length,
      patternsDetected: analysisResults.patternsDetected,
      dbOperationsSuccessful: analysisResults.dbOperationsSuccessful,
      dbOperationsFailed: analysisResults.dbOperationsFailed,
      detailedAnalysis: analysisResults.detailedAnalysis,
      adaptiveInsights: analysisResults.adaptiveInsights,
      groups: Object.keys(groups).map(key => ({
        name: key,
        transactionCount: groups[key].length,
        meetsMinOccurrences: groups[key].length >= MIN_OCCURRENCES
      }))
    };

    console.log(`\n🎯 ADAPTIVE ANALYSIS SUMMARY:`, summary);
    return summary;

  } catch (error) {
    console.error(`💥 Fatal error in adaptive analysis for user ${userId}:`, error);
    throw error;
  }
}

async function groupTransactions(txns) {
  const groups = {};
  const untagged = [];

  // Phase 1: Group by existing tags
  for (const t of txns) {
    if (t.tag && t.tag.trim() !== '') {
      const tagKey = t.tag.toLowerCase().trim();
      (groups[tagKey] ||= []).push(t);
    } else {
      untagged.push(t);
    }
  }

  console.log(`🏷️ Tagged groups: ${Object.keys(groups).length}`);
  console.log(`🔍 Untagged transactions: ${untagged.length}`);

  // Phase 2: Group untagged by description similarity
  for (const t of untagged) {
    const desc = cleanDescription(t.description);
    if (!desc) continue;

    const keys = Object.keys(groups);
    if (keys.length === 0) {
      groups[desc] = [t];
      continue;
    }

    const { bestMatch } = findBestMatch(desc, keys);
    if (bestMatch.rating > SIMILARITY_THRESHOLD) {
      groups[bestMatch.target].push(t);
    } else {
      groups[desc] = [t];
    }
  }

  return groups;
}

function cleanDescription(description) {
  if (!description) return '';
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function detectAdaptivePatterns(groups, userId) {
  let patternsDetected = 0;
  let dbOperationsSuccessful = 0;
  let dbOperationsFailed = 0;
  const detailedAnalysis = [];
  const adaptiveInsights = {
    totalGroups: Object.keys(groups).length,
    groupsAnalyzed: 0,
    patternsFound: 0,
    averageConfidence: 0,
    patternTypes: {},
    dataQualityMetrics: {}
  };

  // First pass: Analyze all groups to understand the data landscape
  const groupAnalyses = [];
  for (const [name, transactions] of Object.entries(groups)) {
    if (transactions.length >= MIN_OCCURRENCES) {
      const analysis = analyzeGroupStatistics(name, transactions);
      groupAnalyses.push(analysis);
      adaptiveInsights.groupsAnalyzed++;
    }
  }

  // Learn adaptive thresholds from the actual data
  const adaptiveThresholds = calculateAdaptiveThresholds(groupAnalyses);
  console.log(`🧠 Learned adaptive thresholds:`, adaptiveThresholds);

  // Second pass: Apply adaptive pattern detection
  for (const analysis of groupAnalyses) {
    console.log(`\n🔍 ========== ADAPTIVE ANALYSIS: "${analysis.name}" ==========`);
    
    const patternResult = detectPatternWithAdaptiveThresholds(analysis, adaptiveThresholds);
    
    const groupAnalysis = {
      name: analysis.name,
      transactionCount: analysis.transactionCount,
      intervals: analysis.intervals,
      statisticalMetrics: analysis.statisticalMetrics,
      patternDetected: patternResult.detected,
      ...patternResult
    };

    if (!patternResult.detected) {
      console.log(`❌ No reliable pattern for "${analysis.name}"`);
      console.log(`   Reason: ${patternResult.reason}`);
      groupAnalysis.status = 'no_pattern';
      detailedAnalysis.push(groupAnalysis);
      continue;
    }

    console.log(`✅ ADAPTIVE PATTERN DETECTED for "${analysis.name}"`);
    console.log(`   Pattern Type: ${patternResult.patternType}`);
    console.log(`   Confidence: ${patternResult.confidence.toFixed(3)}`);
    console.log(`   Frequency: ${patternResult.frequency}`);

    // Track pattern types for insights
    adaptiveInsights.patternTypes[patternResult.patternType] = 
      (adaptiveInsights.patternTypes[patternResult.patternType] || 0) + 1;

    groupAnalysis.status = 'pattern_detected';
    patternsDetected++;
    adaptiveInsights.patternsFound++;

    // Save to database
    try {
      const result = await prisma.recurringTransaction.upsert({
        where: { userId_name: { userId, name: analysis.name } },
        update: {
          predictedAmount: patternResult.predictedAmount,
          predictedDate: patternResult.nextDate,
          frequency: patternResult.frequency,
          confidenceScore: patternResult.confidence,
          lastRealTransactionId: patternResult.lastTransactionId
        },
        create: {
          userId,
          name: analysis.name,
          predictedAmount: patternResult.predictedAmount,
          predictedDate: patternResult.nextDate,
          frequency: patternResult.frequency,
          confidenceScore: patternResult.confidence,
          lastRealTransactionId: patternResult.lastTransactionId
        }
      });
      
      console.log(`✅ Saved adaptive pattern (ID: ${result.id})`);
      dbOperationsSuccessful++;
      groupAnalysis.savedToDb = true;
      
    } catch (dbError) {
      console.error(`❌ Database error for "${analysis.name}":`, dbError);
      dbOperationsFailed++;
      groupAnalysis.savedToDb = false;
    }

    detailedAnalysis.push(groupAnalysis);
  }

  // Calculate final insights
  if (adaptiveInsights.patternsFound > 0) {
    adaptiveInsights.averageConfidence = detailedAnalysis
      .filter(a => a.patternDetected)
      .reduce((sum, a) => sum + a.confidence, 0) / adaptiveInsights.patternsFound;
  }

  return { 
    patternsDetected, 
    dbOperationsSuccessful, 
    dbOperationsFailed,
    detailedAnalysis,
    adaptiveInsights
  };
}

function analyzeGroupStatistics(name, transactions) {
  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Calculate intervals between transactions
  const intervals = [];
  for (let i = 1; i < transactions.length; i++) {
    const daysDiff = differenceInDays(
      new Date(transactions[i].createdAt), 
      new Date(transactions[i-1].createdAt)
    );
    intervals.push(daysDiff);
  }

  // Calculate statistical metrics
  const amounts = transactions.map(t => t.amount);
  const statisticalMetrics = calculateStatisticalMetrics(intervals, amounts);

  console.log(`📊 Statistical analysis for "${name}":`);
  console.log(`   Transactions: ${transactions.length}`);
  console.log(`   Intervals: [${intervals.join(', ')}] days`);
  console.log(`   Interval stats: median=${statisticalMetrics.intervalMedian.toFixed(1)}, CV=${statisticalMetrics.intervalCV.toFixed(3)}`);
  console.log(`   Amount stats: median=$${statisticalMetrics.amountMedian.toFixed(2)}, CV=${statisticalMetrics.amountCV.toFixed(3)}`);

  return {
    name,
    transactions,
    transactionCount: transactions.length,
    intervals,
    amounts,
    statisticalMetrics
  };
}

function calculateStatisticalMetrics(intervals, amounts) {
  // Interval statistics
  const intervalMedian = calculateMedian(intervals);
  const intervalMean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const intervalStdDev = calculateStandardDeviation(intervals, intervalMean);
  const intervalCV = intervalStdDev / intervalMean; // Coefficient of Variation

  // Amount statistics
  const amountMedian = calculateMedian(amounts);
  const amountMean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const amountStdDev = calculateStandardDeviation(amounts, amountMean);
  const amountCV = amountStdDev / amountMean;

  // Consistency scores (lower CV = more consistent)
  const intervalConsistency = Math.max(0, 1 - intervalCV);
  const amountConsistency = Math.max(0, 1 - amountCV);
  const overallConsistency = (intervalConsistency + amountConsistency) / 2;

  return {
    intervalMedian,
    intervalMean,
    intervalStdDev,
    intervalCV,
    intervalConsistency,
    amountMedian,
    amountMean,
    amountStdDev,
    amountCV,
    amountConsistency,
    overallConsistency
  };
}

function calculateAdaptiveThresholds(groupAnalyses) {
  if (groupAnalyses.length === 0) {
    return {
      minConsistencyThreshold: 0.3,
      maxCVThreshold: 1.5,
      confidenceBase: 0.5
    };
  }

  // Learn from the actual data distribution
  const consistencyScores = groupAnalyses.map(g => g.statisticalMetrics.overallConsistency);
  const cvScores = groupAnalyses.map(g => g.statisticalMetrics.intervalCV);

  // Use percentiles to set adaptive thresholds
  const consistencyP25 = calculatePercentile(consistencyScores, 25);
  const cvP75 = calculatePercentile(cvScores, 75);

  console.log(`📈 Data-driven threshold calculation:`);
  console.log(`   Consistency scores: [${consistencyScores.map(s => s.toFixed(3)).join(', ')}]`);
  console.log(`   CV scores: [${cvScores.map(s => s.toFixed(3)).join(', ')}]`);
  console.log(`   Consistency 25th percentile: ${consistencyP25.toFixed(3)}`);
  console.log(`   CV 75th percentile: ${cvP75.toFixed(3)}`);

  return {
    minConsistencyThreshold: Math.max(0.2, consistencyP25 * 0.8), // Be slightly more lenient
    maxCVThreshold: Math.min(2.0, cvP75 * 1.2), // Allow slightly more variation
    confidenceBase: 0.4 + (consistencyP25 * 0.3) // Base confidence on data quality
  };
}

function detectPatternWithAdaptiveThresholds(analysis, thresholds) {
  const { statisticalMetrics, intervals, amounts, transactions } = analysis;
  
  // Check if pattern is consistent enough for prediction
  if (statisticalMetrics.overallConsistency < thresholds.minConsistencyThreshold) {
    return {
      detected: false,
      reason: `Inconsistent pattern (consistency: ${statisticalMetrics.overallConsistency.toFixed(3)}, threshold: ${thresholds.minConsistencyThreshold.toFixed(3)})`
    };
  }

  if (statisticalMetrics.intervalCV > thresholds.maxCVThreshold) {
    return {
      detected: false,
      reason: `Too variable intervals (CV: ${statisticalMetrics.intervalCV.toFixed(3)}, threshold: ${thresholds.maxCVThreshold.toFixed(3)})`
    };
  }

  // Determine pattern type based on interval characteristics
  const medianInterval = statisticalMetrics.intervalMedian;
  const patternType = classifyPatternType(medianInterval, statisticalMetrics.intervalCV);
  
  // Calculate confidence based on consistency
  const baseConfidence = thresholds.confidenceBase;
  const consistencyBonus = statisticalMetrics.overallConsistency * 0.4;
  const variabilityPenalty = statisticalMetrics.intervalCV * 0.1;
  const confidence = Math.max(0.3, Math.min(0.95, baseConfidence + consistencyBonus - variabilityPenalty));

  // Generate frequency label and next date
  const frequency = generateFrequencyLabel(medianInterval, patternType);
  const nextDate = calculateNextDate(transactions[transactions.length - 1], medianInterval, patternType);
  
  console.log(`   📊 Pattern classification:`);
  console.log(`      Median interval: ${medianInterval.toFixed(1)} days`);
  console.log(`      Pattern type: ${patternType}`);
  console.log(`      Frequency: ${frequency}`);
  console.log(`      Confidence: ${confidence.toFixed(3)}`);

  return {
    detected: true,
    patternType,
    frequency,
    confidence,
    predictedAmount: statisticalMetrics.amountMedian,
    nextDate,
    lastTransactionId: transactions[transactions.length - 1].id,
    medianInterval,
    reason: `Consistent ${patternType} pattern detected`
  };
}

function classifyPatternType(medianInterval, intervalCV) {
  // Classify based on interval length and consistency
  if (medianInterval <= 10) {
    return intervalCV < 0.5 ? 'high_frequency_regular' : 'high_frequency_irregular';
  } else if (medianInterval <= 20) {
    return intervalCV < 0.5 ? 'medium_frequency_regular' : 'medium_frequency_irregular';
  } else if (medianInterval <= 45) {
    return intervalCV < 0.5 ? 'monthly_like_regular' : 'monthly_like_irregular';
  } else if (medianInterval <= 100) {
    return intervalCV < 0.5 ? 'low_frequency_regular' : 'low_frequency_irregular';
  } else {
    return intervalCV < 0.5 ? 'very_low_frequency_regular' : 'very_low_frequency_irregular';
  }
}

function generateFrequencyLabel(medianInterval, patternType) {
  // Generate human-readable frequency labels
  if (medianInterval <= 10) {
    return `every_${Math.round(medianInterval)}_days`;
  } else if (medianInterval <= 20) {
    return `bi_weekly_like`;
  } else if (medianInterval <= 45) {
    return `monthly_like`;
  } else if (medianInterval <= 100) {
    return `bi_monthly_like`;
  } else if (medianInterval <= 200) {
    return `quarterly_like`;
  } else {
    return `long_term_${Math.round(medianInterval)}_days`;
  }
}

function calculateNextDate(lastTransaction, medianInterval, patternType) {
  const lastDate = new Date(lastTransaction.createdAt);
  
  // Use median interval for prediction
  return addDays(lastDate, Math.round(medianInterval));
}

// Utility functions
function calculateMedian(arr) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateStandardDeviation(arr, mean) {
  if (arr.length === 0) return 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Helper functions for business operations
export async function getCurrentRecurringTransactions(userId) {
  try {
    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId },
      orderBy: { predictedDate: 'asc' }
    });
    
    console.log(`📋 Current recurring transactions for user ${userId}:`, recurring.length);
    return recurring;
  } catch (error) {
    console.error(`Error fetching recurring transactions:`, error);
    throw error;
  }
}

export async function getUpcomingBills(userId, daysAhead = 30) {
  try {
    const futureDate = addDays(new Date(), daysAhead);
    
    const upcomingBills = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        predictedDate: {
          gte: new Date(),
          lte: futureDate
        }
      },
      orderBy: { predictedDate: 'asc' }
    });

    const totalUpcoming = upcomingBills.reduce((sum, bill) => sum + parseFloat(bill.predictedAmount), 0);
    
    console.log(`💳 Upcoming bills for user ${userId} (next ${daysAhead} days): $${totalUpcoming.toFixed(2)}`);
    
    return {
      bills: upcomingBills,
      totalAmount: totalUpcoming,
      count: upcomingBills.length
    };
  } catch (error) {
    console.error(`Error fetching upcoming bills:`, error);
    throw error;
  }
}