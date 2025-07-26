// File: src/utils/socketHelpers.ts

/**
 * Emit an event to all relevant user rooms.
 * Rooms are named "user-<userId>".
 * 
 * @param io - The Socket.IO server instance
 * @param type - The event type to emit
 * @param payload - The data payload, including user IDs to target rooms
 */

export function emitToRooms(
  io,
  type,
  payload
) {
  const rooms = new Set();
  if (payload.userId)      rooms.add(`user-${payload.userId}`);
  if (payload.fromUserId)  rooms.add(`user-${payload.fromUserId}`);
  if (payload.toUserId)    rooms.add(`user-${payload.toUserId}`);

  rooms.forEach(room => {
    io.to(room).emit(type, payload);
    console.log(`🚀 Emitted ${type} to room ${room}`);
  });
}