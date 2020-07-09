/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

// import * as posenet from '@tensorflow-models/posenet';
// import dat from 'dat.gui';
// import Stats from 'stats.js';

import {isMobile, toggleLoadingUI} from './demo_util';

const videoWidth = 600;
const videoHeight = 500;

class Camera {
  constructor(info, canvas, video, model) {
    this.info = info;
    this.canvas = canvas;
    this.video = video;
    this.model = model;

    this.ctx = canvas.getContext('2d');
    this.guiState = {
      modelReady: false,
      input: {
        tracking: false
      },
      output: {
        showVideo: true
      }
    };
  }


  /**
   * Loads a the camera to be used in the demo
   */
  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const video = this.video;
    video.width = videoWidth;
    video.height = videoHeight;

    const mobile = isMobile();
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': {
        facingMode: 'user',
        width: mobile ? undefined : videoWidth,
        height: mobile ? undefined : videoHeight,
      },
    });

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }

  async loadVideo() {
    const video = await this.setupCamera();
    video.play();

    return video;
  }


  /**
   * Feeds an image to posenet to estimate poses - this is where the magic
   * happens. This function loops with a requestAnimationFrame method.
   */
  trackRealTime(video, net) {

    // since images are being fed from a webcam, we want to feed in the
    // original image and then just flip the keypoints' x coordinates. If instead
    // we flip the image, then correcting left-right keypoint pairs requires a
    // permutation on all the keypoints.
    const ctx = this.ctx;
    const canvas = this.canvas;
    const guiState = this.guiState;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    async function poseDetectionFrame() {
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      if (guiState.output.showVideo) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-videoWidth, 0);
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        ctx.restore();
      }

      if (guiState.modelReady && guiState.input.tracking) {
        const predictions = await net.infer(video, 2);
        ctx.beginPath();
        predictions.forEach(pred => {
          let [x, y, width, height] = pred.bbox;
          x = canvas.width - x - width; // flip horizontally
          ctx.rect(x, y, width, height);
          ctx.stroke();
        });
        // console.log(predictions);
      }

      requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
  }

  /**
   * Kicks off the demo by loading the posenet model, finding and loading
   * available camera devices, and setting off the detectPoseInRealTime function.
   */
  async bindPage() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    toggleLoadingUI(true);
    const net = this.model;
    await this.model.load();
    this.guiState.modelReady = true;
    toggleLoadingUI(false);

    let video;

    try {
      video = await this.loadVideo();
    } catch (e) {
      this.info.textContent = 'this browser does not support video capture, or this device does not have a camera';
      // info.style.display = 'block';
      throw e;
    }

    this.trackRealTime(video, net);
  }
}

export default Camera;