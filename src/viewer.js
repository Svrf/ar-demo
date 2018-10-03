const {
  BackSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  SphereBufferGeometry,
  Texture,
  VideoTexture,
} = require('three');
const HLS = require('hls.js/dist/hls.light');

const MouseController = require('./controllers/MouseController');
const OrientationController = require('./controllers/OrientationController');

const canvas = document.getElementById('mainCanvas');
let controllers = [];
let hls;

// todo: remove window.scene reference

exports.removeBackground = () => {
  // Removing the only Mesh (either camera or panorama background).
  const background = window.scene.children.find(c => c.type === 'Mesh');
  controllers.forEach((c) => c.dispose());
  window.scene.remove(background);
  background.geometry.dispose();
  background.material.dispose();
  hls && hls.destroy();
  hls = null;
};

exports.addPhotoBackground = (url) => {
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = () => {
    const texture = new Texture(img);
    applyTexture(texture);
  };
};
// TODO: dispose hls; alternative way of loading
exports.addVideoBackground = (url) => {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.setAttribute('playsinline', '');

  const { MEDIA_ATTACHED } = HLS.Events;
  hls = new HLS();
  hls.attachMedia(video);
  hls.on(MEDIA_ATTACHED, () => hls.loadSource(url));
  video.oncanplay = () => {
    video.oncanplay = null;
    const texture = new VideoTexture(video);
    applyTexture(texture);
    video.play();
  };
};

exports.tick = function () {
  controllers.forEach((c) => c.tick());
};

function applyTexture(texture) {
  const sphere = new SphereBufferGeometry(100, 64, 64);
  const material = new MeshBasicMaterial({ map: texture, side: BackSide });
  const mesh = new Mesh(sphere, material);
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  window.scene.add(mesh);

  controllers = [
    new MouseController(mesh, canvas),
    new OrientationController(mesh),
  ];
}
