// // messaging/webhookPublisher.js
// import axios from 'axios';
// import config from '../config/index.js';

// export async function sendTransferWebhook(payload) {
//   await axios.post(
//     config.externalWebhookUrl,
//     {
//       eventType: 'transfer.processed',
//       data: payload
//     },
//     {
//       headers: {
//         'Content-Type':  'application/json',
//         'Authorization': `Bearer ${config.webhookSecret}`
//       }
//     }
//   );
// }
