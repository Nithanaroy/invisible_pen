/**
    This approach was dropped for
        1. poor performance in model
        2. complex in user experience
    To enable this install "@tensorflow/tfjs": "2.0.1" and remove tfjs-core and tfjs-converter packages
*/
import Head from 'next/head'
import BoardAndPenDetector from "../helpers/board_pen_learner";
import {ObjectTracker} from "../helpers/object-tracker/object_tracker";
import Camera from "../helpers/camera";

class Home extends React.Component {
  constructor() {
    super();
    this.state = {}
  }

  startTracking = () => {
    if (!this.tracker.guiState.modelReady) {
      this.info.textContent = "Model is not ready yet. Cannot start tracking until then."
    }
    this.tracker.guiState.input.tracking = true;
    this.info.textContent = 'Tracking is ON';
  };

  stopTracking = () => {
    this.tracker.guiState.input.tracking = false;
    this.info.textContent = "Tracking is OFF";
  };

  componentDidMount() {
    const canvas = document.getElementById('output');
    this.info = document.getElementById('info');

    const camera = new Camera(document.getElementById('video'));
    const bpCoco = new BoardAndPenDetector("/tfjs_wbp_coco_ssd_model/model.json", null);
    this.tracker = new ObjectTracker(bpCoco, canvas, 600, 500);
    this.tracker.bindPage(camera, this.info);
  }

  render() {
    return (
      <div className="container">
        <Head>
          <title>Invisible Pen</title>
          <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;"/>
          <link rel="icon" href="/favicon.ico"/>
        </Head>

        <main>
          <div id="info"><p>Tracking is OFF</p></div>
          <div id="loading" style={{"display": "flex"}}>
            <div className="spinner-text">Loading model...</div>
            <div className="sk-spinner sk-spinner-pulse"/>
          </div>
          <div id='main' style={{"display": "none"}}>
            <video id="video" playsInline style={{"display": "none"}}/>
            <canvas id="output"/>
          </div>
          <button type="button" id="startTrackingBtn" onClick={this.startTracking}>Start Tracking</button>
          <button type="button" id="stopTrackingBtn" onClick={this.stopTracking}>Stop Tracking</button>
        </main>

        <style jsx global>{``}</style>
      </div>
    )
  }
}

export default Home;
