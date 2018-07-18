const {actualHeight, actualWidth} = require('./config');

const brf = {locateFile: (filename) => `dist/${filename}`};
initializeBRF(brf);

const manager = new brf.BRFManager();
const commonRectangle = new brf.Rectangle(0, 0, actualWidth, actualHeight);
// Region of interest. Scanning more pixels slows down performance exponentially, so making it a little bit smaller.
// const roiRectangle = new brf.Rectangle(actualWidth*0.2, actualHeight*0.2, actualWidth*0.8, actualHeight*0.8);
setTimeout(() => manager.init(commonRectangle, commonRectangle, 'svrf-ar-demo'), 4000);

const streamOptions = {
  video: {
    facingMode: 'user',
    width: actualWidth,
    height: actualHeight,
  }
};
navigator.mediaDevices.getUserMedia(streamOptions).then(handleStream);

const webcam = document.getElementById('webcam');

const brfCanvas = document.createElement('canvas');
brfCanvas.width = actualWidth;
brfCanvas.height = actualHeight;
const context = brfCanvas.getContext('2d');

module.exports = function () {
  if (!webcam.srcObject) {
    return null;
  }

  context.drawImage(webcam, 0, 0, actualWidth, actualHeight);
  manager.update(context.getImageData(0, 0, actualWidth, actualHeight).data);
  const face = manager.getFaces()[0];

  return face && {
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
};

function calculateMouthOpening(face) {
  const upMouthPoint = {x: face.vertices[62*2], y: face.vertices[62*2+1]};
  const downMouthPoint = {x: face.vertices[66*2], y: face.vertices[66*2+1]};
  return Math.min(Math.sqrt(
    (upMouthPoint.x - downMouthPoint.x) * (upMouthPoint.x - downMouthPoint.x) +
    (upMouthPoint.y - downMouthPoint.y) * (upMouthPoint.y - downMouthPoint.y)) / 20, 1);
}

function handleStream(stream) {
  webcam.srcObject = stream;
  webcam.play();
}
