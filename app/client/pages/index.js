import Head from 'next/head'
import Camera from "../helpers/camera";
import HandTracker from "../helpers/hand-tracker/hand_tracker"
import DrawingCanvas from "../helpers/drawing_canvas"
import SocketIO from "../helpers/socket_communicator";

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
      isTracking: false,
      debug: {
        showLiveCameraFeed: false,
        showIndexFingerTracking: false,
        showHandTracking: false
      }
    };
    const minInactivePeriod = 1000; // in milliseconds
    this.userAwayTimer = new UserAwayTimer(minInactivePeriod);
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
    this.initializeTracker(this.videoCanvas, camera);
  };

  initializeTracker(videoCanvas, camera) {
    this.tracker = new HandTracker(videoCanvas, camera, this.state.debug, this.sendHandPredictions, this.handleUserAway);
    this.drawingCanvas = new DrawingCanvas(document.getElementById("drawing-canvas"), this.tracker.camera.frontFacingCamera); // initialize the canvas
    this.tracker.state.isTracking = this.state.isTracking; //TODO: Not a scalable way to keep both the states in sync
    this.tracker.main(this.info, this.drawingCanvas);
  }

  sendHandPredictions = (predictions) => {
    if (predictions.length > 0) {
      const indexFingerTip = 3;
      this.userAwayTimer.stop();
      const [x, y, z] = predictions[0]["annotations"]["indexFinger"][indexFingerTip];
      this.socket.sendHandPredictions([this.state.videoWidth - x, y, z]);
    }
  };

  // when user is not actively using the invisible pen system
  handleUserAway = () => {
    this.userAwayTimer.startIfNotOn(() => this.socket.releaseMouse());
  };

  setTrackingOrigin = () => {
    // Give some time for the user to move their mouse to the origin of interest
    const timeout = 3;
    let timeoutTimer = timeout;
    const timer = setInterval(() => {
      if (timeoutTimer === 0) {
        clearInterval(timer);
        this.info.textContent = `Your tracker is setup!`;
      } else {
        this.info.textContent = `Capturing mouse position in ${timeoutTimer}s`;
        timeoutTimer--;
      }
    }, 1000);
    try {
      setTimeout(this.socket.setCurrMouseAsOrigin, timeout * 1000);
    } catch (error) {
      this.info.textContent = `Unable to setup the tracker. Please try again in sometime and check browser logs`;
      console.error(error);
    }
  };

  getContentSize(elem) {
    let {height, width, paddingLeft, paddingTop, paddingRight, paddingBottom} = getComputedStyle(elem);
    return {
      contentHeight: parseFloat(height) - parseFloat(paddingTop) - parseFloat(paddingBottom),
      contentWidth: parseFloat(width) - parseFloat(paddingLeft) - parseFloat(paddingRight)
    }
  }

  componentDidMount() {
    const domain = (new URLSearchParams(window.location.search)).get("mouse-controller-server") || "192.168.0.5";
    this.info = document.getElementById('info');
    this.videoCanvas = document.getElementById('output');
    const {contentWidth, contentHeight} = this.getContentSize(document.getElementById('drawing-canvas-div'));
    const camera = new Camera(document.getElementById('video'), contentWidth, contentHeight);
    this.setState({videoWidth: contentWidth, videoHeight: contentHeight});
    this.socket = new SocketIO(domain, 5000, "test");

    this.initializeTracker(this.videoCanvas, camera);
  }

  render() {
    return (
      <div className="container-fluid">
        <Head>
          <title>Invisible Pen</title>
          <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0, user-scalable=no"/>
          <link rel="icon" href="/favicon.ico"/>
        </Head>

        <main>
          <p className="display-2 text-center">Invisible Pen</p>
          <div id="info" className="alert alert-primary"/>
          <div className="card card-body col-md-6">
            <h2 className="card-title">Debug Controls</h2>
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
            <div className="">
              <button type="button" className="btn btn-info mr-3" onClick={this.flipCamera}
                      title="Reloads the model">Flip Camera
              </button>
              <button type="button" className="btn btn-info mr-3" onClick={this.setTrackingOrigin}
                      title="Use the current mouse position as the top-left corner of the screen">Setup Tracker
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
          {/*<div id="predictions"/>*/}
          <div className="row">
            <div id="canvas-wrapper" className="col-md-6" style={{
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
            <div id="drawing-canvas-div" className="col-md-6">
              <canvas id="drawing-canvas" height={this.state.videoHeight} width={this.state.videoWidth}/>
            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default Home;
