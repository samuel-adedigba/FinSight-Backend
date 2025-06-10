export function handleUserEvent(data) {
  switch (data.type) {
    case 'USER_CREATED':
      console.log(`User created with ID: ${data.userId}`);
      break;
    default:
      console.warn('⚠️ Unknown event type:', data.type);
  }
}
