const fullHeight = document.documentElement.clientHeight;
const fullWidth = document.documentElement.clientWidth;

const canvas = document.getElementById('mainCanvas');
canvas.height = fullHeight;
canvas.width = fullWidth;

// We're gonna work with the small resolution for performance purposes.
// The longest side should be 640px.
let actualWidth = 640;
let actualHeight = actualWidth * fullHeight / fullWidth;
if (actualWidth < actualHeight) {
  actualWidth = 640 * 640 / actualHeight;
  actualHeight = 640;
}

if(window.matchMedia('(orientation:portrait)').matches) {
  const temp = actualWidth;
  actualWidth = actualHeight;
  actualHeight = temp;
}

const aspectRatio = fullWidth / fullHeight;
const fov = 40;

module.exports = {
  actualHeight,
  actualWidth,
  aspectRatio,
  fov,
  fullHeight,
  fullWidth,
};
