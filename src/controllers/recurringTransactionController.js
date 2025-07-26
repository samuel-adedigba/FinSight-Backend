import { analyzeUserTransactions, getCurrentRecurringTransactions, getUpcomingBills } from "../services/recurringTransaction.js";

export async function getAnalyzeUserTransactions(req, res) {
  try {
    const userId = req.user.id;
    console.log(`🚀 Starting recurring transaction analysis for user ${userId}`);
    
    // Get current state before analysis
    const beforeAnalysis = await getCurrentRecurringTransactions(userId);
    console.log(`📊 Before analysis: ${beforeAnalysis.length} existing recurring transactions`);
    
    // Run the analysis
    const analysisResult = await analyzeUserTransactions(userId);
    
    // Get state after analysis
    const afterAnalysis = await getCurrentRecurringTransactions(userId);
    console.log(`📊 After analysis: ${afterAnalysis.length} recurring transactions`);
    
    const response = {
      message: "Recurring transaction analysis completed",
      analysis: analysisResult,
      before: beforeAnalysis,
      after: afterAnalysis,
      changes: {
        added: afterAnalysis.length - beforeAnalysis.length,
        total: afterAnalysis.length
      }
    };
    
    res.status(200).json(response);
    
  } catch(error) {
    console.error('❌ Recurring transaction analysis error:', error);
    res.status(500).json({ 
      error: 'Could not analyze recurring transactions',
      message: error.message 
    });
  }
}

// New endpoint to just view current recurring transactions
export async function getCurrentRecurring(req, res) {
  try {
    const userId = req.user.id;
    const recurring = await getCurrentRecurringTransactions(userId);
    res.status(200).json({
      message: "Current recurring transactions",
      data: recurring,
      count: recurring.length
    });
  } catch(error) {
    console.error('❌ Error fetching recurring transactions:', error);
    res.status(500).json({ 
      error: 'Could not fetch recurring transactions',
      message: error.message 
    });
  }
}

export async function getUpcomingBillsController(req, res) {
  try {
    const userId = req.user.id;
    
    // Get daysAhead from query parameters, default to 30 days
    const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead, 10) : 30;
    
    // Validate daysAhead parameter
    if (isNaN(daysAhead) || daysAhead < 1 || daysAhead > 365) {
      return res.status(400).json({
        error: 'Invalid daysAhead parameter',
        message: 'daysAhead must be a number between 1 and 365'
      });
    }
    
    console.log(`📅 Fetching upcoming bills for user ${userId} (next ${daysAhead} days)`);
    
    const upcomingBills = await getUpcomingBills(userId, daysAhead);
    
    res.status(200).json({
      message: `Upcoming bills for the next ${daysAhead} days`,
      data: {
        bills: upcomingBills.bills,
        summary: {
          totalAmount: upcomingBills.totalAmount,
          count: upcomingBills.count,
          daysAhead: daysAhead,
          averagePerBill: upcomingBills.count > 0 ? (upcomingBills.totalAmount / upcomingBills.count) : 0
        }
      }
    });
    
  } catch(error) {
    console.error('❌ Error fetching upcoming bills:', error);
    res.status(500).json({ 
      error: 'Could not fetch upcoming bills',
      message: error.message 
    });
  }
}