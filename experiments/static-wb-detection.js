// Expects tjfs imported as tf

const CLASSES = {
  1: {
    name: '/m/01g317',
    id: 1,
    displayName: 'marker',
  },
  2: {
    name: '/m/0199g',
    id: 2,
    displayName: 'whiteboard',
  },
};

class BoardAndPenDetector {
  // Indices of outputs from model.predict()
  // Order is taken from "outputs" section of model.json of converted TF model using tfjs converter
  DETECTION_SCORES = 0;
  DETECTION_CLASSES = 1;
  RAW_DETECTION_BOXES = 2;
  DETECTION_MULTICLASS_SCORES = 3;
  NUM_DETECTIONS = 4;
  RAW_DETECTION_SCORES = 5;
  DETECTION_BOXES = 6;

  constructor(modelPath, imgDiv, scoreThreshold = 0.85) {
    this.scoreThreshold = scoreThreshold;
    this.imgDiv = imgDiv;
    this.modelPath = modelPath
  }

  drawBox(x, y, width, height, objectClass) {
    const div = document.createElement("div");
    const objInfo = document.createElement("p");
    objInfo.appendChild(document.createTextNode(objectClass));
    div.appendChild(objInfo);

    div.className = "box";
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    this.imgDiv.appendChild(div);
  }

  async load() {
    if (!!this.model) {
      console.warn("As the model is already loaded, not loading again.");
      return;
    }
    this.model = await tf.loadGraphModel(this.modelPath);

    const zeroTensor = tf.zeros([1, 300, 300, 3], 'int32');
    // Warmup the model.
    const result = await this.model.executeAsync(zeroTensor);
    await Promise.all(result.map(t => t.data()));
    result.map(t => t.dispose());
    zeroTensor.dispose();
  }

  async predict(img, maxNumBoxes) {
    const result = await this.model.executeAsync(tf.expandDims(tf.browser.fromPixels(img)));
    const num_detections = parseInt(result[this.NUM_DETECTIONS].arraySync());
    // TODO: Instead of transferring all data, only transfer the highest probable data for each class
    const boxes = result[this.DETECTION_BOXES].slice([0, 0, 0], [-1, num_detections, -1]).squeeze().arraySync();
    const scores = result[this.DETECTION_SCORES].slice([0, 0], [-1, num_detections]).squeeze().arraySync();
    const classes = result[this.DETECTION_CLASSES].slice([0, 0], [-1, num_detections]).squeeze().arraySync();

    for (let i = 0; i < num_detections; i++) {
      let score = scores[i];
      if (score >= this.scoreThreshold) {
        this.drawBox(...[...boxes[i], classes[i]])
      }
    }

    console.log(boxes, scores, classes);
    return [boxes, scores, classes];
  }

  // Pulled from https://github.com/tensorflow/tfjs-models/blob/ef65cb58076e17343797bdc4a8f6cccab58c15a9/coco-ssd/src/index.ts#L108
  async infer(img, maxNumBoxes) {
    const batched = tf.tidy(() => {
      if (!(img instanceof tf.Tensor)) {
        img = tf.browser.fromPixels(img);
      }
      // Reshape to a single-element batch so we can pass it to executeAsync.
      return img.expandDims(0);
    });
    const height = batched.shape[1];
    const width = batched.shape[2];

    // model returns two tensors:
    // 1. box classification score with shape of [1, 1917, 90]
    // 2. box location with shape of [1, 1917, 4]
    // where 1917 is the number of box detectors, 90 is the number of classes.
    // and 4 is the four coordinates of the box.
    const result = await this.model.executeAsync(batched);

    const numDetections = parseInt(result[this.NUM_DETECTIONS].arraySync());
    const predScores = result[this.DETECTION_SCORES].dataSync();
    const predBoxes = result[this.DETECTION_BOXES].dataSync();
    const predClasses = result[this.DETECTION_CLASSES].slice([0, 0], [-1, numDetections]).squeeze().arraySync();

    // clean the webgl tensors
    batched.dispose();
    tf.dispose(result);

    // const [maxScores, classes] = this.calculateMaxScores(predScores, numDetections, 2);
    // const [maxScores, classes] = this.calculateMaxScorePerClass(predScores, predClasses);

    const prevBackend = tf.getBackend();
    // run post process in cpu
    tf.setBackend('cpu');
    const indexTensor = tf.tidy(() => {
      const boxes2 = tf.tensor2d(predBoxes, [result[this.DETECTION_BOXES].shape[1], result[this.DETECTION_BOXES].shape[2]]);
      return tf.image.nonMaxSuppression(boxes2, predScores, maxNumBoxes, 0.5, 0.5);
    });

    const indexes = indexTensor.dataSync();
    indexTensor.dispose();

    // restore previous backend
    tf.setBackend(prevBackend);

    return this.buildDetectedObjects(width, height, predBoxes, predScores, indexes, predClasses);
  }

  // Pulled from https://github.com/tensorflow/tfjs-models/blob/ef65cb58076e17343797bdc4a8f6cccab58c15a9/coco-ssd/src/index.ts#L160
  buildDetectedObjects(width, height, boxes, scores, indexes, classes) {
    const count = indexes.length;
    const objects = [];
    for (let i = 0; i < count; i++) {
      const bbox = [];
      for (let j = 0; j < 4; j++) {
        bbox[j] = boxes[indexes[i] * 4 + j];
      }
      const minY = bbox[0] * height;
      const minX = bbox[1] * width;
      const maxY = bbox[2] * height;
      const maxX = bbox[3] * width;
      bbox[0] = minX;
      bbox[1] = minY;
      bbox[2] = maxX - minX;
      bbox[3] = maxY - minY;
      objects.push({
        bbox: bbox,
        // class: CLASSES[classes[indexes[i]] + 1].displayName,
        class: CLASSES[classes[indexes[i]]].displayName,
        score: scores[indexes[i]]
      });
    }
    return objects;
  }

  calculateMaxScores(scores, numBoxes, numClasses) {
    const maxes = [];
    const classes = [];
    for (let i = 0; i < numBoxes; i++) {
      let max = Number.MIN_VALUE;
      let index = -1;
      for (let j = 0; j < numClasses; j++) {
        if (scores[i * numClasses + j] > max) {
          max = scores[i * numClasses + j];
          index = j;
        }
      }
      maxes[i] = max;
      classes[i] = index;
    }
    return [maxes, classes];
  }

  /**
   * Identify the max score for each class
   * @param scores a list of probabilities for each object
   * @param classes corresponding list of class IDs for those scores
   */
  calculateMaxScorePerClass(scores, classes) {
    const maxScorePerClass = {};
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      const _class = classes[i];
      const currentMaxForClass = maxScorePerClass[_class] || Number.MIN_VALUE;
      if (score > currentMaxForClass) {
        maxScorePerClass[_class] = score;
      }
    }
    const [maxScores, maxClasses] = [[], []];
    for (let [c, s] of Object.entries(maxScorePerClass)) {
      maxScores.push(s);
      maxClasses.push(parseInt(c));
    }
    return [maxScores, maxClasses];
  }
}