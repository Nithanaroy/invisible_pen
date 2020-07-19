import {toggleLoadingUI} from "../demo_util";

/**
 * Feeds an image to custom COCO SSD to estimate board and pen's locations - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
export class ObjectTracker {
  constructor(model, canvas, videoWidth, videoHeight) {
    this.model = model;
    this.ctx = canvas.getContext("2d");
    this.canvas = canvas;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
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

  track(video, net) {

    // since images are being fed from a webcam, we want to feed in the
    // original image and then just flip the keypoints' x coordinates. If instead
    // we flip the image, then correcting left-right keypoint pairs requires a
    // permutation on all the keypoints.
    const self = this;
    const ctx = self.ctx;
    const guiState = self.guiState;
    const videoWidth = self.videoWidth;
    const videoHeight = self.videoHeight;
    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;

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
          x = self.canvas.width - x - width; // flip horizontally
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
  async bindPage(camera, infoPanel) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    toggleLoadingUI(true);
    await this.model.load();
    this.guiState.modelReady = true;
    toggleLoadingUI(false);

    let video;

    try {
      video = await camera.loadVideo();
      this.track(video, this.model);
    } catch (e) {
      infoPanel.textContent = 'this browser does not support video capture, or this device does not have a camera';
      // info.style.display = 'block';
      // throw e;
    }
  }
}

