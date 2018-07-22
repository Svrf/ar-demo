const trackFace = require('./tracking');
const config = require('./config');
const {initTiger, renderBackgroundOnly, renderTiger} = require('./tiger');
const {tick: controllersTick} = require('./viewer');
require('./search');

const webcam = document.getElementById('webcam');
const gl = document.getElementById('mainCanvas').getContext('webgl');
const video = gl.createTexture();

const play = document.getElementById('playButton');
play.addEventListener('click', onClick);

function onClick() {
  if (webcam) {
    webcam.play();
    play.style.display = "none";
    play.removeEventListener('click', onClick);
  }
}

const isSafari = !!navigator.userAgent && /safari/i.test(navigator.userAgent);
const streamOptions = isSafari ?
  { video: true } :
  { video: {
    facingMode: {ideal: 'user'},
    width: {
      max: 1280,
      ideal: config.actualWidth,
    },
    height: {
      max: 720,
      ideal: config.actualHeight,
    },
  }};

navigator.mediaDevices.getUserMedia(streamOptions)
  .then((stream) => {
    console.log(stream);
    webcam.srcObject = stream;

    initTiger(video, gl);
  })
  .catch((err) => {
    console.error(err);
  });

  webcam.addEventListener('loadeddata', () => {
    gl.bindTexture(gl.TEXTURE_2D, video);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    animate();
  });

function animate() {
  requestAnimationFrame(animate);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, webcam);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  controllersTick();

  const face = trackFace();
  if (!face) {
    renderBackgroundOnly();
    return;
  }

  const tanFOV = Math.tan(config.aspectRatio * config.fov * Math.PI/360); //tan(FOV/2), in radians
  const W = face.scale / config.actualWidth;  //relative width of the detection window (1-> whole width of the detection window)
  const D = 1 / (2*W*tanFOV); //distance between the front face of the cube and the camera

  //coords in 2D of the center of the detection window in the viewport :
  const xv = (face.position.x / config.actualWidth)*2 - 1;
  const yv = (-face.position.y / config.actualHeight)*2 + 1;

  //coords in 3D of the center of the cube (in the view coordinates system)
  const position = {
    x: xv*D*tanFOV + 0.9,
    y: yv*D*tanFOV/config.aspectRatio - 0.4,
    z: -D-0.5,  // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
  };

  renderTiger({position, rotation: face.rotation, mouth: face.mouth});
}
