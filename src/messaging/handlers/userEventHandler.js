// export function handleUserEvent(data) {
//   switch (data.type) {
//     case 'USER_CREATED':
//       console.log(`User created with ID: ${data.userId}`);
//       break;
//     default:
//       console.warn('⚠️ Unknown event type:', data.type);
//   }
// }

import { createNotification } from "../../services/notificationService.js";
import { analyzeUserTransactions } from "../../services/recurringTransaction.js";
import { emitToRooms } from "../../utils/socketHelpers.js";
import { STATEMENT_IMPORTED , USER_LOGIN, RUN_RECURRING} from '../../types/event.js';



/**
 * Central event dispatcher.
 * - Logs & persists notifications
 * - Emits via Socket.IO
 * - Kicks off any on‑demand jobs (analytics, etc.)
 */
export async function handleEvent(type, payload, io) {
  // 1) Persist as notification
  await createNotification(type, payload);

  // 2) Emit over websockets
  emitToRooms(io, type, payload);

  // 3) Run any on‑demand background work
  switch (type) {
    case USER_LOGIN:
       console.log(`🔄 Triggering STATEMENT_IMPORTED for user ${payload.userId} on upload`);
     // await analyzeUserTransactions(payload.userId);
        console.log(`✅ STATEMENT_IMPORTED complete for user ${payload.userId}`);
      break;
    case STATEMENT_IMPORTED:
      // after your controller/orchestrator has saved the file, you publish this event
      // here you can re‑run analytics, clear caches, recalc budgets, etc.
   //   await analyzeUserTransactions(payload.userId);
      break;
    case RUN_RECURRING:
     console.log(`🔄 Triggering analysis for user ${userId} on login`);
      try {
         await analyzeUserTransactions(payload.userId);
        console.log(`✅ Analysis complete for user ${userId}`);
      } catch (err) {
        console.error(`❌ Analysis failed for user ${userId}:`, err);
      }
  }
}
