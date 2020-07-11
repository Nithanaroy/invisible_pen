import Head from 'next/head'
import * as handpose from '@tensorflow-models/handpose';
import Camera from "../helpers/camera";
import HandTracker from "../helpers/hand-tracker/hand_tracker"

class Home extends React.Component {
  constructor() {
    super();
    this.state = {}
  }

  startTracking = () => {
    // if (!this.camera.guiState.modelReady) {
    //   this.info.textContent = "Model is not ready yet. Cannot start tracking until then."
    // }
    this.tracker.state.isTracking = true;
    this.info.textContent = 'Tracking is ON';
  };

  stopTracking = () => {
    this.tracker.state.isTracking = false;
    this.info.textContent = "Tracking is OFF";
  };

  videoReady = () => {
    return new Promise((resolve, reject) => {
      this.video.onloadeddata = () => resolve("Webcam is ready!");
    });
  };

  componentDidMount() {
    this.info = document.getElementById('info');
    const canvas = document.getElementById('output');
    const VIDEO_WIDTH = 640, VIDEO_HEIGHT = 500;
    const camera = new Camera(document.getElementById('video'), VIDEO_WIDTH, VIDEO_HEIGHT);
    this.tracker = new HandTracker(canvas, camera);
    this.tracker.main(this.info);
  }

  render() {
    return (
      <div className="container">
        <Head>
          <title>Invisible Pen</title>
          <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0, user-scalable=no"/>
          <link rel="icon" href="/favicon.ico"/>
        </Head>

        <main>
          <div id="info"/>
          <div id="predictions"/>
          <div id="canvas-wrapper">
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
          <button type="button" id="startTrackingBtn" onClick={this.startTracking}>Start Tracking</button>
          <button type="button" id="stopTrackingBtn" onClick={this.stopTracking}>Stop Tracking</button>
        </main>
      </div>
    )
  }
}

export default Home;
