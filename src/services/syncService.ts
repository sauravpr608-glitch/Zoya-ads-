import { io, Socket } from "socket.io-client";

class SyncService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private onRemoteActionCallback: ((command: string) => void) | null = null;
  private onDeviceJoinedCallback: (() => void) | null = null;

  connect(userId: string) {
    if (this.socket?.connected) return;

    this.userId = userId;
    // Connect to the same origin
    this.socket = io(window.location.origin);

    this.socket.on("connect", () => {
      console.log("Connected to Zoya Bridge");
      this.socket?.emit("join-bridge", userId);
    });

    this.socket.on("remote-action", (command: string) => {
      console.log("Received remote action:", command);
      if (this.onRemoteActionCallback) {
        this.onRemoteActionCallback(command);
      }
    });

    this.socket.on("device-joined", () => {
      console.log("Remote device linked!");
      if (this.onDeviceJoinedCallback) {
        this.onDeviceJoinedCallback();
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Zoya Bridge");
    });
  }

  sendAction(command: string) {
    if (!this.socket?.connected || !this.userId) {
      console.warn("Socket not connected, cannot send action");
      return;
    }

    this.socket.emit("send-remote-command", {
      userId: this.userId,
      command
    });
  }

  onRemoteAction(callback: (command: string) => void) {
    this.onRemoteActionCallback = callback;
  }

  onDeviceJoined(callback: () => void) {
    this.onDeviceJoinedCallback = callback;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const syncService = new SyncService();
