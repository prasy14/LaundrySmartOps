import type { WSMessage } from "@shared/schema";

let socket: WebSocket;
const messageHandlers: ((message: WSMessage) => void)[] = [];

export function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as WSMessage;
    messageHandlers.forEach(handler => handler(message));
  };

  socket.onclose = () => {
    setTimeout(() => initWebSocket(), 1000);
  };
}

export function addMessageHandler(handler: (message: WSMessage) => void) {
  messageHandlers.push(handler);
  return () => {
    const index = messageHandlers.indexOf(handler);
    if (index > -1) messageHandlers.splice(index, 1);
  };
}
