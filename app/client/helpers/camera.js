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

import {isMobile} from './demo_util';
// import { shimGetUserMedia, shimConstraints } from "./media_shims/safari_camera_shim";

class Camera {
  /**
   * Create a camera instance with following requests. Browser may or may not apply all these settings
   * @param {HTML5 video element} video instance of video DOM
   * @param {number} videoWidth intended width of the video stream
   * @param {number} videoHeight intended height of the video stream
   * @param {boolean} frontFacingCamera intended camera mode
   */
  constructor(video, videoWidth, videoHeight, frontFacingCamera) {
    this.video = video;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
    this.frontFacingCamera = frontFacingCamera;

    // shimGetUserMedia();
    // shimConstraints();
  }


  /**
   * Loads a the camera to be used in the demo
   */
  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }

    const video = this.video;
    const mobile = isMobile();

    video.width = this.videoWidth;
    video.height = this.videoHeight;

    video.srcObject = await navigator.mediaDevices.getUserMedia({
      'audio': false,
      'video': {
        facingMode: this.frontFacingCamera ? "user" : "environment",
        width: mobile ? undefined : this.videoWidth,
        height: mobile ? undefined : this.videoHeight,
        frameRate: 20,
        resizeMode: ["crop-and-scale"]
      },
    });
    const {isFrontFacing, height, width} = this.cameraState; // actual settings applied by the browser
    this.frontFacingCamera = isFrontFacing;
    this.height = height;
    this.width = width;

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

  get cameraState() {
    const { facingMode, height, width } = this.video.srcObject.getVideoTracks()[0].getSettings()
    const isFrontFacing = facingMode === "environment" ? false : true;
    return {isFrontFacing, height, width};
  }
}

export default Camera;