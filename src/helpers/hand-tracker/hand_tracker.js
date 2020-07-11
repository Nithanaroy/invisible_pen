/**
 * Pulled from https://github.com/kingsleyljc/tfjs-models/blob/ccf446aac93e189151e6898c3ab026072074a7a3/handpose/demo/index.js
 */
import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import {version_wasm} from '@tensorflow/tfjs-backend-wasm';
import {isMobile} from "../demo_util"

class HandTracker {

  constructor(canvas, camera) {
    tfjsWasm.setWasmPath(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${version_wasm}/dist/tfjs-backend-wasm.wasm`);
    this.canvas = canvas;
    this.camera = camera;
    // scatterGLHasInitialized = false, scatterGL 
    this.fingerLookupIndices = {
      thumb: [0, 1, 2, 3, 4],
      indexFinger: [0, 5, 6, 7, 8],
      middleFinger: [0, 9, 10, 11, 12],
      ringFinger: [0, 13, 14, 15, 16],
      pinky: [0, 17, 18, 19, 20]
    };  // for rendering each finger as a polyline

    this.mobile = isMobile();
    // Don't render the point cloud on mobile in order to maximize performance and
    // to avoid crowding limited screen space.
    // const renderPointcloud = false; //mobile === false;

    this.state = {
      backend: 'webgl',
      isTracking: false
    };

    // if (renderPointcloud) {
    //   state.renderPointcloud = true;
    // }
  }

  // setupDatGui() {
  //   const gui = new dat.GUI();
  //   gui.add(state, 'backend', ['wasm', 'webgl', 'cpu', 'webgpu'])
  //     .onChange(async backend => {
  //       await tf.setBackend(backend);
  //     });
  //
  //   if (renderPointcloud) {
  //     gui.add(state, 'renderPointcloud').onChange(render => {
  //       document.querySelector('#scatter-gl-container').style.display =
  //         render ? 'inline-block' : 'none';
  //     });
  //   }
  // }

  drawPoint(ctx, y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }

    if (closePath) {
      region.closePath();
    }
    ctx.stroke(region);
  }

  drawKeypoints(ctx, keypoints) {
    const keypointsArray = keypoints;

    for (let i = 0; i < keypointsArray.length; i++) {
      const y = keypointsArray[i][0];
      const x = keypointsArray[i][1];
      this.drawPoint(ctx, x - 2, y - 2, 3);
    }

    const fingers = Object.keys(this.fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
      const finger = fingers[i];
      const points = this.fingerLookupIndices[finger].map(idx => keypoints[idx]);
      this.drawPath(ctx, points, false);
    }
  }

  async main(infoContainer) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    // await tf.setBackend(state.backend);
    await tf.ready();
    this.model = await handpose.load();
    let video;

    try {
      video = await this.camera.loadVideo();
    } catch (e) {
      infoContainer.textContent = e.message;
      // throw e;
    }

    this.landmarksRealTime(video);
  }

  async landmarksRealTime(video) {
    // setupDatGui();

    // const stats = new Stats();
    // stats.showPanel(0);
    // document.body.appendChild(stats.dom);

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;

    const ctx = this.canvas.getContext('2d');

    video.width = videoWidth;
    video.height = videoHeight;

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';

    ctx.translate(this.canvas.width, 0);
    ctx.scale(-1, 1);

    // These anchor points allow the hand pointcloud to resize according to its position in the input.
    // const ANCHOR_POINTS = [
    //   [0, 0, 0], [0, -VIDEO_HEIGHT, 0], [-VIDEO_WIDTH, 0, 0],
    //   [-VIDEO_WIDTH, -VIDEO_HEIGHT, 0]
    // ];

    const frameLandmarks = async () => {
      // stats.begin();
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, this.canvas.width, this.canvas.height);

      if (this.state.isTracking) {
        const predictions = await this.model.estimateHands(video);
        if (predictions.length > 0) {
          const result = predictions[0].landmarks;
          this.drawKeypoints(ctx, result, predictions[0].annotations);
        }
      }

      // if (renderPointcloud === true && scatterGL != null) {
      //   const pointsData = result.map(point => {
      //     return [-point[0], -point[1], -point[2]];
      //   });
      //
      //   const dataset =
      //     new ScatterGL.Dataset([...pointsData, ...ANCHOR_POINTS]);
      //
      //   if (!scatterGLHasInitialized) {
      //     scatterGL.render(dataset);
      //
      //     const fingers = Object.keys(fingerLookupIndices);
      //
      //     scatterGL.setSequences(
      //       fingers.map(finger => ({indices: fingerLookupIndices[finger]})));
      //     scatterGL.setPointColorer((index) => {
      //       if (index < pointsData.length) {
      //         return 'steelblue';
      //       }
      //       return 'white';  // Hide.
      //     });
      //   } else {
      //     scatterGL.updateDataset(dataset);
      //   }
      //   scatterGLHasInitialized = true;
      // }
      // stats.end();
      requestAnimationFrame(frameLandmarks);
    };

    frameLandmarks();

    // if (renderPointcloud) {
    //   document.querySelector('#scatter-gl-container').style =
    //     `width: ${VIDEO_WIDTH}px; height: ${VIDEO_HEIGHT}px;`;
    //
    //   scatterGL = new ScatterGL(
    //     document.querySelector('#scatter-gl-container'),
    //     {'rotateOnStart': false, 'selectEnabled': false});
    // }
  }
}


export default HandTracker;