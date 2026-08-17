const ONE_MINUTE = 60 * 1000;

export function shouldShowMessageTime(messages, index) {
  const message = messages[index];
  if (!message?.createdAt || message.type === 'date') return Boolean(message?.time);

  const nextMessage = messages[index + 1];
  if (!nextMessage || nextMessage.type === 'date' || nextMessage.sender !== message.sender || !nextMessage.createdAt) {
    return true;
  }

  return nextMessage.createdAt - message.createdAt >= ONE_MINUTE;
}

export function isClusteredMessage(messages, index) {
  const message = messages[index];
  const previousMessage = messages[index - 1];

  if (!message?.createdAt || message.type === 'date' || !previousMessage?.createdAt || previousMessage.type === 'date') {
    return false;
  }

  return message.sender === previousMessage.sender && message.createdAt - previousMessage.createdAt < ONE_MINUTE;
}
