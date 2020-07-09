import Head from 'next/head'
import BoardAndPenDetector from "../helpers/board_pen_learner";
import Camera from "../helpers/camera";

class Home extends React.Component {
  constructor() {
    super();
    this.state = {}
  }

  startTracking = () => {
    if (!this.camera.guiState.modelReady) {
      this.info.textContent = "Model is not ready yet. Cannot start tracking until then."
    }
    this.camera.guiState.input.tracking = true;
    this.info.textContent = 'Tracking is ON';
  };

  stopTracking = () => {
    this.camera.guiState.input.tracking = false;
    this.info.textContent = "Tracking is OFF";
  };

  componentDidMount() {
    const canvas = document.getElementById('output');
    const video = document.getElementById('video');
    this.info = document.getElementById('info');
    this.bpCoco = new BoardAndPenDetector("/tfjs_wbp_coco_ssd_model/model.json", null);
    this.camera = new Camera(this.info, canvas, video, this.bpCoco);
    this.camera.bindPage();
  }

  render() {
    return (
      <div className="container">
        <Head>
          <title>Invisible Pen</title>
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
