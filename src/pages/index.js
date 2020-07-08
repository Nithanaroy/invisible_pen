import Head from 'next/head'
import BoardAndPenDetector from "../helpers/static_wb_detection";

class Home extends React.Component {
  constructor() {
    super()
    this.state = { imgSrc: "/whiteboard-pen.jpeg" }
  }

  predictBtnClick = async () => {
    this.clearMarkedObjects();
    console.log("1")
    await this.bpCoco.load();
    console.log("2")
    const startTimestampMs = new Date().getTime();
    console.log("3")
    const objects = await this.bpCoco.infer(this.img, 2);
    console.log("4")
    const durationMs = new Date().getTime() - startTimestampMs;
    console.log("5")
    for (let object of objects) {
      console.log("6")
      this.bpCoco.drawBox(...[...object['bbox'], object['class']]);
    }
    console.log(`Found ${Object.keys(objects).length} objects in ${durationMs}ms`);
    console.log(objects);
  }

  clearMarkedObjects = () => {
    this.imgDiv.querySelectorAll(".box").forEach(b => b.remove());
  }

  clearBtnClick = () => {
    this.clearMarkedObjects();
  }

  fileSelected = (e) => {
    this.clearMarkedObjects();
    this.displaySelectedImage(e.target);
  }

  // Pulled from https://stackoverflow.com/a/12369027/1585523
  displaySelectedImage = (input) => {
    const self = this;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function () {
        self.setState({ imgSrc: reader.result });
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  componentDidMount() {
    this.img = document.getElementById("img");
    this.imgDiv = document.getElementById("imgDiv");
    this.bpCoco = new BoardAndPenDetector("/tfjs_wbp_coco_ssd_model/model.json", imgDiv);
  }

  render() {
    return (
      <div className="container">
        <Head>
          <title>Invisible Pen</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <button type="button" onClick={this.predictBtnClick}>Predict</button>
          <button type="button" onClick={this.clearBtnClick}>Clear</button>
          <input type="file" onChange={this.fileSelected} />
          <div style={{ position: "relative", margin: 0, padding: 0 }} id="imgDiv">
            <img id="img" src={this.state.imgSrc} style={{ "maxWidth": "800px" }} />
            <p id="notes"></p>
          </div>
        </main>

        <style jsx global>{``}</style>
      </div>
    )
  }
}

export default Home;
