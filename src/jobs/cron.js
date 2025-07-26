// import cron from 'node-cron';
// import { analyzeUserTransactions } from '../services/recurringTransaction.js';
// import { prisma } from '../db/prisma.js';


// // every 6 hours
// cron.schedule('0 */6 * * *', async ()=>{
//   const users = await prisma.user.findMany({ select:{ id:true } });
//   for (const u of users) {
//     try { await analyzeUserTransactions(u.id); }
//     catch(e){ console.error('Analyzer error for',u.id,e); }
//   }
// });