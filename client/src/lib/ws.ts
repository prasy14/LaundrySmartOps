import type { WSMessage } from "@shared/schema";

let socket: WebSocket;
const messageHandlers: ((message: WSMessage) => void)[] = [];

export function initWebSocket() {
  const wsUrl = window.location.origin.replace(/^http/, 'ws') + '/ws';
  console.log('Connecting WebSocket to:', wsUrl);

  // Create WebSocket connection with credentials included
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as WSMessage;
    messageHandlers.forEach(handler => handler(message));
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed, attempting to reconnect...', event.code, event.reason);
    // Attempt to reconnect after a delay
    setTimeout(() => initWebSocket(), 1000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

export function addMessageHandler(handler: (message: WSMessage) => void) {
  messageHandlers.push(handler);
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) messageHandlers.splice(index, 1);
  };
}