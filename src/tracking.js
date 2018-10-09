const webcamPromise = require('./webcam');
const {canAccessCamera} = require('./browsers');

const brf = {locateFile: (filename) => `dist/${filename}`};
initializeBRF(brf);

const manager = new brf.BRFManager();

let rectangle;
function checkSdk() {
  if (!brf.sdkReady) {
    setTimeout(checkSdk, 250);
    return;
  }

  webcamPromise.then((webcamInfo) => {
    rectangle = new brf.Rectangle(0, 0, webcamInfo.width, webcamInfo.height);
    manager.init(rectangle, rectangle, 'svrf-ar-demo');
  });
}

if (canAccessCamera) {
  checkSdk();
}

const webcamContext = document.getElementById('webcamCanvas').getContext('2d');

let faceState;
module.exports = function () {
  if (!brf.sdkInitialized) {
    return null;
  }

  manager.update(webcamContext.getImageData(0, 0, rectangle.width, rectangle.height).data);
  const face = manager.getFaces()[0];

  const isRecognized = face && face.state === brf.BRFState.FACE_TRACKING_START || face.state === brf.BRFState.FACE_TRACKING;
  if (isRecognized) {
    faceState = {
      mouth: calculateMouthOpening(face),
      position: {
        x: face.bounds.x,
        y: face.bounds.y,
      },
      rotation: {
        x: face.rotationX,
        y: face.rotationY,
        z: face.rotationZ,
      },
      scale: face.scale,
    };
  }
  
  return faceState;
};

function calculateMouthOpening(face) {
  const upMouthPoint = {x: face.vertices[62*2], y: face.vertices[62*2+1]};
  const downMouthPoint = {x: face.vertices[66*2], y: face.vertices[66*2+1]};
  return Math.min(Math.sqrt(
    (upMouthPoint.x - downMouthPoint.x) * (upMouthPoint.x - downMouthPoint.x) +
    (upMouthPoint.y - downMouthPoint.y) * (upMouthPoint.y - downMouthPoint.y)) / 20, 1);
}
