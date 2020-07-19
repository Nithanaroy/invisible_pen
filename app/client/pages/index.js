import Head from 'next/head'
import Camera from "../helpers/camera";
import HandTracker from "../helpers/hand-tracker/hand_tracker"
import DrawingCanvas from "../helpers/drawing_canvas"
import SocketIO from "../helpers/socket_communicator";

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      videoWidth: 640, videoHeight: 500,
      isTracking: false,
      debug: {
        showLiveCameraFeed: false,
        showIndexFingerTracking: false,
        showHandTracking: false
      }
    };
  }

  updateDebugState = (key, value) => {
    const newDebugState = {...this.state.debug, ...{[key]: value}};
    this.setState({debug: newDebugState});
    this.tracker.state.debug = newDebugState;
  };

  startTracking = () => {

    this.setState({isTracking: true});
    this.tracker.state.isTracking = true;
    this.info.textContent = 'Tracking is ON';
  };

  stopTracking = () => {
    this.setState({isTracking: false});
    this.tracker.state.isTracking = false;
    this.info.textContent = "Tracking is OFF";
  };

  clearCanvas = () => {
    this.drawingCanvas.cleanCanvas();
  };

  flipCamera = () => {
    const camera = new Camera(document.getElementById('video'), this.state.videoWidth, this.state.videoHeight, !this.tracker.camera.frontFacingCamera);
    this.initializeTracker(this.canvas, camera);
  };

  initializeTracker(videoCanvas, camera) {
    this.tracker = new HandTracker(videoCanvas, camera, this.state.debug, this.sendHandPredictions);
    this.tracker.state.isTracking = this.state.isTracking; //TODO: Not a scalable way to keep both the states in sync
    this.tracker.main(this.info, this.drawingCanvas);
  }

  sendHandPredictions = (predictions) => {
    if (predictions.length > 0) {
      const indexFingerTip = 3;
      this.socket.sendHandPredictions(predictions[0]["annotations"]["indexFinger"][indexFingerTip]);
    }
  };

  componentDidMount() {
    this.info = document.getElementById('info');
    this.canvas = document.getElementById('output');
    this.drawingCanvas = new DrawingCanvas(document.getElementById("freeFormCanvas"), false); // initialize the canvas
    const camera = new Camera(document.getElementById('video'), this.state.videoWidth, this.state.videoHeight);
    this.socket = new SocketIO("localhost", 5000, "test");

    this.initializeTracker(this.canvas, camera);
  }

  render() {
    return (
      <div className="container">
        <Head>
          <title>Invisible Pen</title>
          <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0, user-scalable=no"/>
          <link rel="icon" href="/favicon.ico"/>
        </Head>

        <main className="container-fluid">
          <p className="display-2">Magic Wand</p>
          <div id="info" className="alert alert-primary"/>
          <div className="panel">
            <h2>Debug Controls</h2>
            <div className="form-group">
              <div className="form-check">
                <input type="checkbox" id="liveFeed" className="form-check-input"
                       checked={this.state.debug.showLiveCameraFeed}
                       onChange={() => this.updateDebugState("showLiveCameraFeed", !this.state.debug.showLiveCameraFeed)}/>
                <label htmlFor="liveFeed" className="form-check-label">Show Live Feed</label>
              </div>

              <div className="form-check">
                <input type="checkbox" id="handTracking" className="form-check-input"
                       checked={this.state.debug.showHandTracking}
                       onChange={() => this.updateDebugState("showHandTracking", !this.state.debug.showHandTracking)}/>
                <label htmlFor="handTracking" className="form-check-label">Show Hand Tracking</label>
              </div>
              <div className="form-check">
                <input type="checkbox" id="indexFingerTracking" className="form-check-input"
                       checked={this.state.debug.showIndexFingerTracking}
                       onChange={() => this.updateDebugState("showIndexFingerTracking", !this.state.debug.showIndexFingerTracking)}/>
                <label htmlFor="indexFingerTracking" className="form-check-label">Show Index Finger Tracking</label>
              </div>
            </div>
            <button type="button" className="btn btn-info mr-3" onClick={this.flipCamera}
                    title="Reloads the model">Flip Camera
            </button>
            <button type="button" className={`btn btn-secondary ${this.state.isTracking ? "d-none" : ""}`}
                    onClick={this.startTracking}>
              Start Tracking
            </button>
            <button type="button" className={`btn btn-secondary ${!this.state.isTracking ? "d-none" : ""}`}
                    onClick={this.stopTracking}>
              Stop Tracking
            </button>
            <button type="button" className="btn btn-danger ml-3" onClick={this.clearCanvas}>Clear Canvas</button>
          </div>
          {/*<div id="predictions"/>*/}
          <div
            style={{"display": "flex", "flexDirection": "horizontal", "justifyContent": "center", "flexWrap": "wrap"}}>
            <div id="canvas-wrapper" style={{
              "margin": "0.75rem",
              "display": this.state.debug.showLiveCameraFeed ? "block" : "none"
            }}>
              <canvas id="output"/>
              <video id="video" playsInline style={{
                "WebkitTransform": "scaleX(-1)",
                "transform": "scaleX(-1)",
                "visibility": "hidden",
                "width": "auto",
                "height": "auto",
                "position": "absolute"
              }}>
              </video>
            </div>
            <canvas id="freeFormCanvas" style={{"margin": "0.75rem",}} height={this.state.videoHeight}
                    width={this.state.videoWidth}/>
          </div>
        </main>
      </div>
    )
  }
}

export default Home;
