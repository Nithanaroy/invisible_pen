const videoStream = document.getElementById("wc");
const webcam = new Webcam(videoStream);
const imgDiv = document.getElementById("imgDiv");
const notes = document.getElementById("notes");
const video = document.getElementById("wc");
const predictBtn = document.getElementById("predictBtn");

let model = null;
let ready = false;

function drawBox(x, y, width, height, objectClass) {
    const div = document.createElement("div");
    const objInfo = document.createElement("p");
    objInfo.appendChild(document.createTextNode(objectClass));
    div.appendChild(objInfo);

    div.className = "box";
    div.style.width = width;
    div.style.height = height;
    div.style.left = x;
    div.style.top = y;
    imgDiv.appendChild(div);
}

// // Load the model.
// cocoSsd.load().then(model => {
//     // detect objects in the image.
//     const startTimestampMs = new Date().getTime()
//     model.detect(img).then(predictions => {
//         const durationMs = new Date().getTime() - startTimestampMs;
//         notes.innerHTML = `Took ${durationMs}ms to identify ${predictions.length} objects in the image`
//         console.log('Predictions: ', predictions);
//         for (const prediction of predictions) {
//             drawBox(...(prediction.bbox.concat(prediction.class)));
//         }
//     });
// });

async function init() {
    await webcam.setup();
    model = await cocoSsd.load();
    ready = true;
    notes.innerHTML = "Ready to predict";
    predictBtn.disabled = false;
}

async function predictCapture() {
    if(!model || !ready) {
        console.warn("Model is not loaded yet");
        notes.innerHTML = "Model is not loaded yet";
        return;
    }
    const predictions = await model.detect(videoStream);
    console.log('Predictions: ', predictions);
}

init();