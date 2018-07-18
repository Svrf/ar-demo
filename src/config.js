const fullHeight = document.documentElement.clientHeight;
const fullWidth = document.documentElement.clientWidth;

const canvas = document.getElementById('mainCanvas');
canvas.height = fullHeight;
canvas.width = fullWidth;

// We're gonna work with the small resolution for performance purposes.
let actualWidth = 640;
let actualHeight = actualWidth * fullHeight / fullWidth;
if (actualWidth > actualHeight) {
  actualWidth += actualHeight;
  actualHeight = actualWidth - actualHeight;
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
