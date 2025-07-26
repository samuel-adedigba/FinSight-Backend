import { getAnalyticsTrend, getBoardByCategory, getCategorySummary, getSummary, getBudgetProgress } from "../services/analyticsService.js";


export async function summaryController(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ 
        error: 'Missing parameters: `from` and `to` query params are required',
        example: '/summary?from=2024-01-01&to=2024-01-31'
      });
    }

    // Create date objects and validate
    const startDate = new Date(from);
    let endDate = new Date(to);
    
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: `Invalid 'from' date format. Use YYYY-MM-DD` });
    }
    
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ error: `Invalid 'to' date format. Use YYYY-MM-DD` });
    }

    // Set endDate to 23:59:59.999 on the same day
    endDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23, 59, 59, 999
    );

    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({ 
        error: 'Invalid date range: `from` date must be before `to` date',
        received: { from, to }
      });
    }

    const summary = await getSummary({ 
      userId, 
      fromDate: startDate, 
      toDate: endDate  // Now includes full end day
    });

    // Format dates for better readability in response
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    res.json({ 
        message:"Income Statement Analytics",
      label: `Income statement from ${startDate.toDateString()} to ${endDate.toDateString()}`,
      summary 
    });

  } catch (error) {
    console.error('Summary controller error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export async function categoryBreakdownController(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ 
        error: 'Missing parameters: `from` and `to` query params are required',
        example: '/summary?from=2024-01-01&to=2024-01-31'
      });
    }

    // Create date objects and validate
    const startDate = new Date(from);
    let endDate = new Date(to);
    
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: `Invalid 'from' date format. Use YYYY-MM-DD` });
    }
    
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ error: `Invalid 'to' date format. Use YYYY-MM-DD` });
    }

    // Set endDate to 23:59:59.999 on the same day
    endDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23, 59, 59, 999
    );

    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({ 
        error: 'Invalid date range: `from` date must be before `to` date',
        received: { from, to }
      });
    }

    const categoryBreakdown = await getCategorySummary({ 
      userId, 
      fromDate: startDate, 
      toDate: endDate  // Now includes full end day
    });

    
    res.json({ 
        message:"Expense Category Breakdown received successfully",
      label: `Expense Category Breakdown from ${startDate.toDateString()} to ${endDate.toDateString()}`,
      categoryBreakdown 
    });

  } catch (error) {
    console.error('Summary controller error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};



export async function getBoardByCategoryController(req, res) {
  try {
    const userId = req.user?.id; // ✅ Optional chaining for safety
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { from, to, tag, page:p, limit: l } = req.query;
    const page = Math.max(1, parseInt(p) || 1)
    const limit = Math.max(1, parseInt(l) || 10)
    const validTag = tag && typeof tag === 'string' && tag.trim().length > 0 && tag.toLowerCase();
    // ✅ Validate required fields
    if (!from || !to || !validTag) {
      return res.status(400).json({
        error: 'Missing parameters: `from`, `to`, and `tag` query params are required',
        example: '/category-summary?from=2025-01-01&to=2025-01-31&tag=Groceries'
      });
    }

    // ✅ Parse dates safely
    const startDate = new Date(from);
    let endDate = new Date(to);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // ✅ Extend endDate to include the full day
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    // ✅ Fetch the summary with breakdown
    const result = await getBoardByCategory({
      userId, fromDate: startDate, toDate: endDate, tag, page, limit
    });

    res.json({
      message: `Expense summary for ${tag}`,
      category: result.category,
      dateRange: { from: result.fromDate, to: result.toDate },
      totalExpense: result.totalExpense,
      pagination: result.meta,
      transactions: result.transactions
    });

  } catch (error) {
    console.error('Category Board Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

export async function getAnalyticsTrendController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const { from, to, interval } = req.query;
    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing query params: `from` and `to` are required',
        example: '/api/analytics/trends?from=2025-01-01&to=2025-05-31&interval=monthly'
      });
    }

    const startDate = new Date(from);
    let endDate = new Date(to);
    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Extend endDate to include full day
    endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    const data = await getAnalyticsTrend({
      userId,
      fromDate: startDate,
      toDate:   endDate,
      interval: interval || 'monthly'
    });

    return res.json({
      message:   `Trends from ${from} to ${to} (${interval || 'monthly'})`,
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
      interval:  interval || 'monthly',
      trends:    data
    });
  } catch (err) {
    console.error('getAnalyticsTrendController error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

export async function budgetProgressController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { month } = req.query; // “YYYY-MM”
    if (!month) {
      return res.status(400).json({ error: '`month` query param is required' });
    }

    // 1) Compute exact dates
    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate   = new Date(year, mon, 0, 23, 59, 59, 999);

    // 2) Call service
    const progressList = await getBudgetProgress({ userId, startDate, endDate });
    const monthName = startDate.toLocaleString('default', { month: 'long' });

    // 3) Return
    return res.json({ message: `Budget Progress for each categpry in ( ${monthName} )`, progress: progressList });
  } catch (err) {
    console.error('Budget Progress Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

