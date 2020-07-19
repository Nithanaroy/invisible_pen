// Pulled from https://gist.github.com/Nithanaroy/3677cdde61893e3731b3f882ad7745d1#file-tfjs-blog-user-input-canvas-js

class FreeFormDrawingCanvas {
  constructor(canvasContainer, laterallyInvert = false, initX = null, initY = null) {
    this.c = canvasContainer;
    this.ctx = canvasContainer.getContext("2d");
    this.lastX = initX;
    this.lastY = initY;
    if (laterallyInvert) {
      this.ctx.translate(canvasContainer.width, 0);
      this.ctx.scale(-1, 1);
    }

    canvasContainer.addEventListener("mousedown", this.initPathCoords); // fires before mouse left btn is released
    canvasContainer.addEventListener("mousemove", this.freeForm);
    this.setStyles();
  }

  setStyles = () => {
    this.c.style.background = "black";
  };

  initPathCoords = (e) => {
    const {x, y} = this.c.getBoundingClientRect();
    this.lastX = e.clientX - x;
    this.lastY = e.clientY - y;
  };

  freeForm = (e) => {
    if (e.buttons !== 1) return; // left button is not pushed yet
    this.drawLineTo(e.clientX, e.clientY);
  };

  /**
   * Draws a line from the previous known X and Y to x and y
   * @param X: X coordinate
   * @param Y: Y coordinate
   * @param areAbsoluteCoords: Are X and Y absolute on screen or relative to canvas?
   */
  drawLineTo = (X, Y, areAbsoluteCoords = true) => {
    const {x, y} = areAbsoluteCoords ? this.c.getBoundingClientRect() : {x: 0, y: 0};
    const newX = X - x;
    const newY = Y - y;

    // Initialize at runtime if not set earlier
    if (this.lastX == null) {
      this.lastX = newX;
      this.lastY = newY;
    }

    this.ctx.beginPath();
    this.ctx.lineWidth = 5;
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(newX, newY);
    this.ctx.strokeStyle = 'white';
    this.ctx.stroke();
    this.ctx.closePath();

    this.lastX = newX;
    this.lastY = newY;
  };

  cleanCanvas() {
    this.ctx.clearRect(0, 0, this.c.width, this.c.height);
  }
}

export default FreeFormDrawingCanvas;