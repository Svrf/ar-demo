const trackFace = require('./tracking');
const webcamPromise = require('./webcam');
const {initTiger, renderBackgroundOnly, renderTiger} = require('./tiger');
const {tick: controllersTick} = require('./viewer');
require('./search');


const mainCanvas = document.getElementById('mainCanvas');
mainCanvas.height = document.documentElement.clientHeight;
mainCanvas.width = document.documentElement.clientWidth;

const webcam = document.getElementById('webcam');

const webcamCanvas = document.getElementById('webcamCanvas');
const webcamContext = webcamCanvas.getContext('2d');

const startButton = document.getElementById('startButton');

let webcamInfo;
webcamPromise.then((wc) => {
  webcamInfo = wc;
  webcamCanvas.height = webcamInfo.height;
  webcamCanvas.width = webcamInfo.width;
  initTiger(webcamCanvas);
});

startButton.addEventListener('click', onStartClick);
function onStartClick() {
  if (!webcam) {
    return;
  }

  webcam.play();
  startButton.style.display = 'none';
  startButton.removeEventListener('click', onStartClick);
  document.getElementById('exploreButton').style.display = null;
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  webcamContext.drawImage(webcam, 0, 0);
  controllersTick();

  const face = trackFace();
  if (!face) {
    renderBackgroundOnly();
    return;
  }

  const fov = 40;
  const tanFOV = Math.tan(webcamInfo.aspectRatio * fov * Math.PI/360); //tan(FOV/2), in radians
  const W = face.scale / webcamInfo.width;  //relative width of the detection window (1-> whole width of the detection window)
  const D = 1 / (2*W*tanFOV); //distance between the front face of the cube and the camera

  //coords in 2D of the center of the detection window in the viewport :
  const xv = (face.position.x / webcamInfo.width)*2 - 1;
  const yv = (-face.position.y / webcamInfo.height)*2 + 1;

  //coords in 3D of the center of the cube (in the view coordinates system)
  const position = {
    x: xv*D*tanFOV + 0.9,
    y: yv*D*tanFOV/webcamInfo.aspectRatio - 0.4,
    z: -D-0.5,  // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
  };

  renderTiger({position, rotation: face.rotation, mouth: face.mouth});
}
