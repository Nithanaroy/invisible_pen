import socketio from "socket.io-client"

class SocketIO {
  constructor(domain, port, namespace) {
    const portUrlPart = port.toString().length > 0 ? `:${port}` : "";
    const nsUrlPart = namespace.length > 0 ? `/${namespace}` : "";
    this.s = socketio.connect(`http://${domain}${portUrlPart}${nsUrlPart}`);
    this.isConnected = false;

    this.s.on('connect', this.connected);
    this.s.on('message', this.messageReceived);
    this.s.on('disconnect', this.disconnected);
  }

  sendHandPredictions = (predictions) => {
    // if (!this.isConnected) {
    //   console.warn("Could not send predictions as the connection to server is not established");
    //   return;
    // }
    this.s.emit("hand-predictions", predictions);
  };

  setCurrMouseAsOrigin = () => {
    this.s.emit("set-origin-auto");
  };

  connected() {
    this.isConnected = true;
    console.log("Connected to server");
  }

  messageReceived(data) {
    console.log(`Got ${data} from server`);
  }

  disconnected() {
    this.isConnected = false;
    console.log("Disconnected from server");
  }
}

export default SocketIO;