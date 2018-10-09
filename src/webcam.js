const {canAccessCamera} = require('./browsers');

const fullHeight = document.documentElement.clientHeight;
const fullWidth = document.documentElement.clientWidth;

const webcam = document.getElementById('webcam');

// We're gonna work with the small resolution for performance purposes.
// The longest side should be 640px.
let actualWidth = 640;
let actualHeight = actualWidth * fullHeight / fullWidth;
if (actualWidth < actualHeight) {
  actualWidth = 640 * 640 / actualHeight;
  actualHeight = 640;
}

const isPortrait = window.matchMedia('(orientation:portrait)').matches;
//const isSafari = !!navigator.userAgent && /safari/i.test(navigator.userAgent);
const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
const streamOptions = iOS ?
  { video: true } :
  {
    video: {
      facingMode: {ideal: 'user'},
      [isPortrait ? 'height': 'width']: {
        max: 1280,
        ideal: actualWidth,
      },
      [isPortrait ? 'width': 'height']: {
        max: 720,
        ideal: actualHeight,
      },
    },
  };

if (canAccessCamera) {
  module.exports = navigator.mediaDevices.getUserMedia(streamOptions)
    .then((stream) => {
      webcam.srcObject = stream;
  
      return new Promise((resolve) => {
        webcam.addEventListener('loadedmetadata', () => resolve({
          aspectRatio: webcam.videoWidth / webcam.videoHeight,
          height: webcam.videoHeight,
          width: webcam.videoWidth,
        }));
      });
    });
}
