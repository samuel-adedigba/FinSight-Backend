import { prisma } from "../db/prisma.js";

// Get current month's data
// const now = new Date();
// const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
// const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// const monthlyData = await prisma.sale.findMany({
//   where: {
//     date: { gte: firstDay, lte: lastDay }
//   }
// });
export async function getSummary({ userId, fromDate, toDate }) {
  // 1) Total Income (credits)
  const incomeAgg = await prisma.transaction.aggregate({
    where: {
      account: { userId },
      type:    'credit',
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      }
    },
    _sum: { amount: true }
  });

  // 2) Total Expense (debits)
  const expenseAgg = await prisma.transaction.aggregate({
    where: {
      account: { userId },
      type:    'debit',
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      }
    },
    _sum: { amount: true }
  });

  const totalIncome  = incomeAgg._sum.amount  || 0;
  const totalExpense = expenseAgg._sum.amount || 0;
  if(totalExpense > totalIncome) return ""
  return {
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense
  };
}

export async function getCategorySummary({
  userId, 
  fromDate, 
  toDate
}) {
  const categoryAgg = await prisma.transaction.groupBy({
    by: ['tag'],
    where: {
        account: { userId},
        type: 'debit',
        createdAt: {
          gte: new Date(fromDate),
          lte: new Date(toDate)
        }
    },
    _sum: { amount: true },
  })
  const categorySummary = categoryAgg.map(cat => ({
    category: cat.tag,
    total_spent: cat._sum.amount || 0
  }));
  return categorySummary
};



export async function getBoardByCategory({
  userId, fromDate, toDate, tag, page=1 , limit=10
}) {
  // let page = 1;
  // let limit = 10;
  const skip = ( page - 1) * limit
  // 1️⃣ Get total amount for this category (tag) and date range
  const categoryTotal = await prisma.transaction.aggregate({
    where: {
      account: { userId },
      type: 'debit',
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      },
      tag: tag // Filter by specific tag/category
    },
    _sum: {
      amount: true
    }
  });

  const totalCount = await prisma.transaction.count({
    where : {
      account: { userId },
      type:  'debit',
     createdAt: {
      gte: new Date (fromDate),
      lte: new Date (toDate)
     },
     tag
    }
  });

  // 2️⃣ Get the list of transactions matching the criteria
  const transactionBreakdown = await prisma.transaction.findMany({
    where: {
      account: { userId },
      type: 'debit',
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate)
      },
      tag: tag // Filter by specific tag/category
    },
    select: {
      id: true,
      tag: true,
      amount: true,
      description: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil( totalCount / limit)

  // 3️⃣ Return summary + breakdown in one payload
  return {
    category: tag,
    fromDate,
    toDate,
    totalExpense: categoryTotal._sum.amount || 0,
    meta: {
      totalCount,
      totalPages,
      currentPage: page,
      limit
    },
    transactions: transactionBreakdown
  };
};

// export async function getAnalyticsTrend( userId, fromDate, toDate, internal= 'monthly' ) {
//   const format = {
//     monthly: 'YYYY-MM',
//     weekly:  'YYYY-MM-DD',
//     daily:   'YYYY-MM-DD'
//   };
//   const setInterval = format[internal] || 'YYYY-MM';
//     const expenseTrend = await prisma.transaction.groupBy({
//       by : ['createdAt'],
//       where : {
//         account: { userId},
//         type: 'debit',
//         createdAt: {
//           gte: new Date(fromDate),
//           lte: new Date(toDate),
//         } 
//       },
//       _sum: { amount: true },
//     });

//       const incomeTrend = await prisma.transaction.groupBy({
//       by : ['createdAt'],
//       where : {
//         account: { userId},
//         type: 'credit',
//         createdAt: {
//           gte: new Date(fromDate),
//           lte: new Date(toDate),
//         }
//       },
//       _sum: { amount: true },
//     });

//   return (
//     {
//       expenseTrend: expenseTrend.map(item => ({
//         tag: item.tag,
//         totalExpense: item._sum.amount || 0
//       })),
//       incomeTrend: incomeTrend.map(item => ({
//         tag: item.tag,
//         totalIncome: item._sum.amount || 0
//       })),
//       fromDate,
//       toDate,
//       interval: setInterval
//     }
//   )
// };

// /**
//  * Returns time-series of income vs. expense for each period.
//  */
export async function getAnalyticsTrend({
  userId, fromDate, toDate, interval = 'monthly'
}) {
  // 1) Determine the PostgreSQL date format string
  const fmtMap = {
    daily:   'YYYY-MM-DD',
    weekly:  'IYYY-IW',   // ISO week
    monthly: 'YYYY-MM'
  };
  const fmt = fmtMap[interval] || fmtMap.monthly;

  // 2) Raw SQL query to group by that truncated date
  const sql = `
    SELECT 
      to_char("createdAt", '${fmt}') AS period,
      SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END)  AS total_income,
      SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END)  AS total_expense
    FROM "Transaction"
    WHERE "accountId" IN (
      SELECT id FROM "BankAccount" WHERE "userId" = $1
    )
      AND "createdAt" BETWEEN $2 AND $3
    GROUP BY period
    ORDER BY period;
  `;

  // 3) Execute the raw query, passing parameters
  const rows = await prisma.$queryRawUnsafe(sql, userId, fromDate, toDate);

  // 4) Return the array of { period, total_income, total_expense }
  return rows.map(r => ({
    period:       r.period,
    totalIncome:  Number(r.total_income) || 0,
    totalExpense: Number(r.total_expense) || 0
  }));
}

export async function getBudgetProgress({
  userId, startDate, endDate
}){
    const budgets = await prisma.budget.findMany({
      where : {userId, 
        startDate: {
          lte: new Date(endDate),
        },
        OR : [
          {endDate:  null} ,
          {
            endDate: { 
              gte:  new Date(startDate)
            }
          }
        ]
      },
      include : {category: true}

    })

const progressList = await Promise.all(
  budgets.map(async (b) => {
    const periodEnd = b.endDate || endDate;
    const spentAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        account:  { userId },
        type:      'debit',
        tag:       b.category.name,
        createdAt: {
          gte: b.startDate,
          lte: periodEnd
        }
      }
    });

    const spent = spentAgg._sum.amount || 0;
    return {
      budgetId:   b.id,
      category:   b.category.name,
      allocated:  b.amount,
      spent,
      remaining:  b.amount - spent
    };
  })
);
return progressList;
};