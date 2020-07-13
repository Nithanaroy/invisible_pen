/**
 * Pulled from https://github.com/kingsleyljc/tfjs-models/blob/ccf446aac93e189151e6898c3ab026072074a7a3/handpose/demo/index.js
 */
import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import {version_wasm} from '@tensorflow/tfjs-backend-wasm';
import {isMobile} from "../demo_util"

class HandTracker {

  constructor(canvas, camera, debugState) {
    tfjsWasm.setWasmPath(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${version_wasm}/dist/tfjs-backend-wasm.wasm`);
    this.canvas = canvas;
    this.camera = camera;
    this.fingerLookupIndices = {
      thumb: [0, 1, 2, 3, 4],
      indexFinger: [0, 5, 6, 7, 8],
      middleFinger: [0, 9, 10, 11, 12],
      ringFinger: [0, 13, 14, 15, 16],
      pinky: [0, 17, 18, 19, 20]
    };  // for rendering each finger as a polyline

    this.mobile = isMobile();

    this.state = {
      backend: 'webgl',
      isTracking: false,
      debug: {
        showLiveCameraFeed: true,
        showIndexFingerTracking: true,
        showHandTracking: false,
        ...debugState
      }
    };

  }

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

  logPredictions = (predictions, ctx, outputContainer) => {
    let log = "";
    const tipIndex = 3; // for each finger, handpose returns 3 landmarks / points
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const tip = prediction["annotations"]["indexFinger"][tipIndex].map(coord => coord.toFixed(0)).join(", ");
      log += `Index finger ${i + 1}'s tip is at (${tip}) <br />`;
      this.drawPoint(ctx, prediction["annotations"]["indexFinger"][tipIndex][1] - 2, prediction["annotations"]["indexFinger"][tipIndex][0] - 2, 3)
    }
    outputContainer.innerHTML = log;
    this.drawPoint(ctx, 5, 5, 3) // mark (0, 0) for reference
  };

  /**
   * Draw user's gesture on the canvas
   * @param predictions: return value of handpose.estimateHands
   * @param c: an instance of FreeFormDrawingCanvas
   */
  drawOnCanvas(predictions, c) {
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const tipIndex = 3;
      c.drawLineTo(prediction["annotations"]["indexFinger"][tipIndex][0], prediction["annotations"]["indexFinger"][tipIndex][1], false);
      break;
    }
  }

  async landmarksRealTime(video, infoContainer, freeFormCanvas) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const ctx = this.canvas.getContext('2d');

    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;

    video.width = videoWidth;
    video.height = videoHeight;

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.translate(this.canvas.width, 0);
    ctx.scale(-1, 1);

    const frameLandmarks = async () => {
      // stats.begin();
      if (this.state.debug.showLiveCameraFeed) {
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, this.canvas.width, this.canvas.height);
      }
      if (this.state.isTracking) {
        const predictions = await this.model.estimateHands(video);
        if (predictions.length > 0) {
          if (this.state.debug.showHandTracking) {
            const result = predictions[0].landmarks;
            this.drawKeypoints(ctx, result, predictions[0].annotations);
          }
          if (this.state.debug.showIndexFingerTracking) {
            this.logPredictions(predictions, ctx, infoContainer);
          }
          this.drawOnCanvas(predictions, freeFormCanvas);
        }
      }
      // stats.end();
      requestAnimationFrame(frameLandmarks);
    };

    frameLandmarks();
  }

  async main(infoContainer, freeFormCanvas) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    // await tf.setBackend(state.backend); // comment to let tfjs automatically pick the best available backend
    await tf.ready();
    this.model = await handpose.load();

    try {
      const video = await this.camera.loadVideo();
      this.landmarksRealTime(video, infoContainer, freeFormCanvas);
    } catch (e) {
      infoContainer.textContent = e.message;
      // throw e;
    }
  }
}


export default HandTracker;