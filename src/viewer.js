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
const getIOSVersion = require('ios-version');

const MouseController = require('./controllers/MouseController');
const OrientationController = require('./controllers/OrientationController');

const canvas = document.getElementById('mainCanvas');
let controllers = [];
let hlsInstance;

const iosVersion = getIOSVersion(navigator.userAgent);
// https://bugs.webkit.org/show_bug.cgi?id=179417
const hasWebglHlsBug = iosVersion && iosVersion.major === 11 && iosVersion.minor < 4;

// todo: remove window.scene reference

exports.removeBackground = () => {
  // Removing the only Mesh (either camera or panorama background).
  const background = window.scene.children.find(c => c.type === 'Mesh');
  if (background) {
    window.scene.remove(background);
    background.geometry.dispose();
    background.material.dispose();
  }
  controllers.forEach((c) => c.dispose());
  controllers = [];
  hlsInstance && hlsInstance.destroy();
  hlsInstance = null;
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

exports.addVideoBackground = ({hls, mp4}) => {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.setAttribute('playsinline', 'true');

  const addTexture = () => {
    video.oncanplay = null;
    video.onloadedmetadata = null;
      const texture = new VideoTexture(video);
      applyTexture(texture);
      video.play();
  };

  video.oncanplay = addTexture;
  video.onloadedmetadata = addTexture;

  if (HLS.isSupported()) {
    const { MEDIA_ATTACHED } = HLS.Events;
    hlsInstance = new HLS();
    hlsInstance.attachMedia(video);
    hlsInstance.on(MEDIA_ATTACHED, () => hlsInstance.loadSource(hls));
  } else {
    const canPlayHls = !hasWebglHlsBug && video.canPlayType('application/vnd.apple.mpegurl');
    video.src = canPlayHls ? hls : mp4;
  }
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
