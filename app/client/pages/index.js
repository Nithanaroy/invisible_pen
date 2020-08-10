import Head from 'next/head'
import Camera from "../helpers/camera";
import HandTracker from "../helpers/hand-tracker/hand_tracker"
import DrawingCanvas from "../helpers/drawing_canvas"
import SocketIO from "../helpers/socket_communicator";

import Alert from "./alert";

class UserAwayTimer {
  /**
   * An interruptable, singleton timer class
   * @param {int} duration: number of milliseconds to set the timer for each time when started
   */
  constructor(duration) {
    this._isActive = false;
    this._timerHandle = -1;
    this._duration = duration;
  }
  startIfNotOn(timeUpCb) {
    if (!this._isActive) {
      this._timerHandle = setTimeout(timeUpCb, this._duration);
      this._isActive = true;
    }
  }
  stop() {
    window.clearTimeout(this._timerHandle);
    this._isActive = false;
  }
}

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      videoWidth: 640, videoHeight: 500,
      usingFrontCamera: true, // choosing this safe default as webcams are usually front facing
      isTracking: false,
      debug: {
        showLiveCameraFeed: true,
        showIndexFingerTracking: false,
        showHandTracking: true
      },
      alert: { type: "primary", content: "" },
      trackerOrientationCoordsRemap: {"x": "x", "y": "y", "z": "z"}
    };
    const minInactivePeriod = 1000; // in milliseconds
    this.userAwayTimer = new UserAwayTimer(minInactivePeriod);
  }

  updateDebugState = (key, value) => {
    const newDebugState = { ...this.state.debug, ...{ [key]: value } };
    this.setState({ debug: newDebugState });
    this.tracker.state.debug = newDebugState;
  };

  startTracking = () => {
    this.setState({ isTracking: true });
    this.tracker.state.isTracking = true;
    this.updateAlert("Tracking is ON");
  };

  stopTracking = () => {
    this.setState({ isTracking: false });
    this.tracker.state.isTracking = false;
    this.updateAlert("Tracking is OFF");
  };

  clearCanvas = () => {
    this.drawingCanvas.cleanCanvas();
  };

  flipCamera = async () => {
    const video = document.getElementById('video')
    const camera = new Camera(video, this.state.videoWidth, this.state.videoHeight, !this.state.usingFrontCamera);
    await this.initializeTracker(this.videoCanvas, camera); // wait for the camera to flip if possible
    this.syncLiveVideoState()
  };

  initializeTracker(videoCanvas, camera) {
    this.tracker = new HandTracker(videoCanvas, camera, this.state.debug, this.sendHandPredictions, this.handleUserAway);
    this.drawingCanvas = new DrawingCanvas(document.getElementById("drawing-canvas"), this.state.usingFrontCamera); // initialize the canvas
    this.tracker.state.isTracking = this.state.isTracking; // TODO: Not a scalable way to keep both the states in sync
    return this.tracker.main(this.updateAlert, this.drawingCanvas);
  }

  sendHandPredictions = (predictions) => {
    if (predictions.length > 0) {
      const indexFingerTip = 3;
      this.userAwayTimer.stop();
      const [x, y, z] = predictions[0]["annotations"]["indexFinger"][indexFingerTip];
      this.socket.sendHandPredictions(this.translateCoords({x, y, z}));
    }
  };

  // predCoords should be of the form, {x: 10, y: 20, z: 5}
  translateCoords = (predCoords) => {
    const {x, y, z} = this.state.trackerOrientationCoordsRemap;
    const [newX, newY, newZ] = [predCoords[x], predCoords[y], predCoords[z]]
    const correctedX = this.state.usingFrontCamera ? this.state.videoWidth - newX : newX; // adjust lateral inversion if any
    return [correctedX, newY]
  }

  // when user is not actively using the invisible pen system
  handleUserAway = () => {
    // comment this out if you have manual control enabled
    // this.userAwayTimer.startIfNotOn(() => this.socket.releaseMouse());
  };

  setTrackingOrigin = (originFor="mouse") => {
    // Give some time for the user to move their mouse or tracking finger to the origin of interest
    const timeout = 3;
    let timeoutTimer = timeout;
    const timer = setInterval(() => {
      if (timeoutTimer === 0) {
        clearInterval(timer);
        this.updateAlert(`Your ${originFor} tracker is setup!`)
      } else {
        this.updateAlert(`Capturing ${originFor} position in ${timeoutTimer}s`);
        timeoutTimer--;
      }
    }, 1000);
    let trackingFn = null;
    switch (originFor) {
      case "mouse":
        trackingFn = this.socket.setCurrMouseAsOrigin
        break;
      case "index finger":
        trackingFn = this.socket.setCurrFingerAsOrigin
        break;
      default:
        this.updateAlert(`Unable to setup the ${originFor} tracker. Please try again in sometime or check your browser logs if possible`, "error");
        // console.error(error);
    }
    
    setTimeout(trackingFn, timeout * 1000);
  };

  setFingerTrackingOrigin = () => {
    if(!this.state.isTracking) {
      this.updateAlert("Tracking needs to be ON to use the current finger's position as origin", "warning")
    } else {
      this.setTrackingOrigin("index finger");
    }
  }

  getContentSize(elem) {
    let { height, width, paddingLeft, paddingTop, paddingRight, paddingBottom } = getComputedStyle(elem);
    return {
      contentHeight: parseFloat(height) - parseFloat(paddingTop) - parseFloat(paddingBottom),
      contentWidth: parseFloat(width) - parseFloat(paddingLeft) - parseFloat(paddingRight)
    }
  }

  updateAlert = (message, type = "primary") => {
    const alertState = this.state.alert;
    this.setState({ "alert": { ...alertState, "type": type, "content": message } });
  }

  onMouseControllerConnection = () => {
    this.updateAlert("Connected to the mouse controller server in your home!", "success");
  };

  onMouseControllerDisconnection = () => {
    // TODO: Give an option to force retry / test connection state, as the connected callback is sometimes not fired
    this.updateAlert("Oops! lost the connection to server. Will update you once I'm able to reconnect again. Do check the browser logs if possible", "danger");
  };

  syncLiveVideoState = () => {
    // assumes the video stream is loaded
    try {
      const { facingMode, height, width } = this.webcam.srcObject.getVideoTracks()[0].getSettings()
      const isFrontFacing = facingMode === "environment" ? false : true;
      this.setState({usingFrontCamera: isFrontFacing, videoWidth: width, videoHeight: height});
      this.updateAlert(`Currently tracking via ${isFrontFacing ? "front": "back"} camera`)
      this.mediaDebugInfo();
    } catch (error) {
      this.updateAlert("Unable to identify whether front or back camera is being used. Please use front camera if available for consistent results", "warning")
      console.error(error)
      this.setState({ usingFrontCamera: true })
    }
  }

  loadTrackerOrientation = () => {
    // TODO: use phone orientation enum instead of taking x, y translations from user
    const x = (new URLSearchParams(window.location.search)).get("x") || "x";
    const y = (new URLSearchParams(window.location.search)).get("y") || "y";
    const z = (new URLSearchParams(window.location.search)).get("z") || "z";
    this.setState({trackerOrientationCoordsRemap: {x, y, z}})
  }

  async componentDidMount() {
    this.webcam = document.getElementById('video');
    const mouseServer = (new URLSearchParams(window.location.search)).get("mouse-controller-server") || "https://192.168.0.5:5000";
    this.videoCanvas = document.getElementById('output');
    const { contentWidth, contentHeight } = this.getContentSize(document.getElementById('drawing-canvas-div'));
    const camera = new Camera(this.webcam, contentWidth, contentHeight, this.state.usingFrontCamera); // Note: actual video dimensions may vary
    this.socket = new SocketIO(mouseServer, "test", this.onMouseControllerConnection, this.onMouseControllerDisconnection);
    this.loadTrackerOrientation();

    await this.initializeTracker(this.videoCanvas, camera); // wait for the camera to load
    this.syncLiveVideoState();
  }

  mediaDebugInfo() {
    const track = document.getElementById('video').srcObject.getVideoTracks()[0];
    const msg = `<pre>
    Video Track Info:
    Constraints: ${JSON.stringify(track.getConstraints())}
    Capabilities: ${JSON.stringify(track.getCapabilities())}
    Settings: ${JSON.stringify(track.getSettings())}
    </pre>`;
    document.getElementById("debug-container").innerHTML = msg;
  }

  render() {
    return (
      <div className="container-fluid">
        <Head>
          <title>Invisible Pen</title>
          <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0, user-scalable=no" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <p className="display-2 text-center">Invisible Pen</p>
          <Alert {...this.state.alert} />
          <p id="debug-container"></p>
          <div className="card card-body col-md-6">
            <h2 className="card-title">Control Center</h2>
            <div className="form-group">
              <div className="form-check">
                <input type="checkbox" id="liveFeed" className="form-check-input"
                  checked={this.state.debug.showLiveCameraFeed}
                  onChange={() => this.updateDebugState("showLiveCameraFeed", !this.state.debug.showLiveCameraFeed)} />
                <label htmlFor="liveFeed" className="form-check-label">Show Live Feed</label>
              </div>

              <div className="form-check">
                <input type="checkbox" id="handTracking" className="form-check-input"
                  checked={this.state.debug.showHandTracking}
                  onChange={() => this.updateDebugState("showHandTracking", !this.state.debug.showHandTracking)} />
                <label htmlFor="handTracking" className="form-check-label">Show Hand Tracking</label>
              </div>
              <div className="form-check">
                <input type="checkbox" id="indexFingerTracking" className="form-check-input"
                  checked={this.state.debug.showIndexFingerTracking}
                  onChange={() => this.updateDebugState("showIndexFingerTracking", !this.state.debug.showIndexFingerTracking)} />
                <label htmlFor="indexFingerTracking" className="form-check-label">Show Index Finger Tracking</label>
              </div>
            </div>
            <div className="">
              <button type="button" className="btn btn-info mr-3" onClick={this.flipCamera}
                title="Reloads the model">Flip Camera
              </button>
              <button type="button" className="btn btn-info mr-3" onClick={() => this.setTrackingOrigin("mouse")}
                title="Use the current mouse position as the top-left corner of the screen">Setup mouse tracker
              </button>
              <button type="button" className="btn btn-info mr-3" onClick={this.setFingerTrackingOrigin}
                title="Use the current index finger position as the top-left corner of the screen (requires tracking to be on)">Setup hand tracker
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
          </div>
          <div className="row mt-3">
            <div id="canvas-wrapper" className="col-md-6" style={{
              "display": this.state.debug.showLiveCameraFeed ? "block" : "none"
            }}>
              <canvas id="output" />
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
            <div id="drawing-canvas-div" className="col-md-6">
              <canvas id="drawing-canvas" height={this.state.videoHeight} width={this.state.videoWidth} />
            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default Home;
