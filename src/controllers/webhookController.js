// // controllers/webhookController.js
// import { processWebhookEvent } from '../services/webhookService.js';

// export async function handleWebhook(req, res) {
//   try {
//     // rawBody captured in app.json() verify
//     const raw = req.rawBody.toString();
//     const event = JSON.parse(raw);

//     // Optionally verify signature here
//     res.sendStatus(200);
//     // Process event (updates DB, returns enriched)
//     const result = await processWebhookEvent(event);

//     // Emit to user room
//     const io = req.app.get('io');
//     io.to(`user-${result.userId}`).emit(event.eventType, result);


//   } catch (error) {
//     console.error('Webhook handling error:', error);
//     res.sendStatus(400);
//   }
// }