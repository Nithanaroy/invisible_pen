import socketio from "socket.io-client"

class SocketIO {
  constructor(url, namespace, connectedCb, disconnectCb, serverMsgCb) {
    // const portUrlPart = port.toString().length > 0 ? `:${port}` : "";
    const nsUrlPart = namespace.length > 0 ? `/${namespace}` : "";
    // this.s = socketio.connect(`https://${domain}${portUrlPart}${nsUrlPart}`);
    this.s = socketio.connect(`${url}${nsUrlPart}`);
    this.isConnected = false;

    this.connectedCb = connectedCb;
    this.disconnectCb = disconnectCb;
    this.serverMsgCb = serverMsgCb;

    this.s.on('connect', this.connected);
    this.s.on('message', this.messageReceived);
    this.s.on('disconnect', this.disconnected);
  }

  testConnection = () => {
    this.s.emit("test-connection");
    console.log("Test signal fired");
  };

  sendHandPredictions = (predictions) => {
    this.s.emit("move-mouse", predictions);
  };

  releaseMouse = () => {
    console.log("Requesting to release the mouse")
    this.s.emit("release-mouse");
  };

  setCurrMouseAsOrigin = () => {
    this.s.emit("set-mouse-origin");
  };

  setCurrFingerAsOrigin = () => {
    this.s.emit("set-finger-origin");
  };

  connected = () => {
    this.isConnected = true;
    console.log("Connected to server");
    this.connectedCb();
  }

  messageReceived = (data) => {
    // console.log(`Got ${data} from server`);
    this.serverMsgCb(data);
  }

  disconnected = () => {
    this.isConnected = false;
    console.log("Disconnected from server");
    this.disconnectCb();
  }


}

export default SocketIO;