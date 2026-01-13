import { io } from "socket.io-client";

let _socket = null;

export function connectSocket(token) {
  if (_socket && _socket.connected) return _socket;

  const base =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  _socket = io(base, {
    transports: ["websocket", "polling"], // ✅ đừng ép websocket-only
    auth: { token },
    withCredentials: true,
    reconnection: true,
  });

  return _socket;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
