import type { WSMessage } from "@shared/schema";

let socket: WebSocket;
const messageHandlers: ((message: WSMessage) => void)[] = [];

export function initWebSocket() {
  const wsUrl = window.location.origin.replace(/^http/, 'ws') + '/ws';
  console.log('Connecting WebSocket to:', wsUrl);

  // Get cookies for authentication
  const cookies = document.cookie;

  // Create WebSocket connection with cookies
  socket = new WebSocket(wsUrl, ['cookie', cookies]);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as WSMessage;
    messageHandlers.forEach(handler => handler(message));
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed, attempting to reconnect...');
    // Attempt to reconnect after a delay
    setTimeout(() => initWebSocket(), 1000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
}

export function addMessageHandler(handler: (message: WSMessage) => void) {
  messageHandlers.push(handler);
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) messageHandlers.splice(index, 1);
  };
}