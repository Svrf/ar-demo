const {
  BackSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereBufferGeometry,
  Texture,
  VideoTexture,
  WebGLRenderer,
} = require('three');
const HLS = require('hls.js/dist/hls.light');

const MouseController = require('./controllers/MouseController');
const OrientationController = require('./controllers/OrientationController');
const {hasWebglHlsBug} = require('./browsers');

const canvas = document.getElementById('backgroundCanvas');
let controllers = [];
let hlsInstance;
let video;

// todo: remove window.scene reference

const scene = new Scene();
let camera, renderer;

exports.init = (webcam) => {
  camera = new PerspectiveCamera(60, webcam.width/webcam.height, 0.1, 100);
  renderer = new WebGLRenderer({canvas});
}

function removeMesh(scene) {
  const mesh = scene.children.find(c => c.type === 'Mesh');
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
}

exports.removeBackground = () => {
  // Removing the only Mesh (either camera or panorama background).
  removeMesh(window.scene); // Removing camera background
  removeMesh(scene); // Removing old 360 background

  controllers.forEach((c) => c.dispose());
  controllers = [];
  hlsInstance && hlsInstance.destroy();
  hlsInstance = null;
  video && video.pause();
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
  video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.loop = true;
  video.setAttribute('playsinline', '');
  video.autoplay = true;

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
    const {MEDIA_ATTACHED} = HLS.Events;
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
  renderer.render(scene, camera);
};

function applyTexture(texture) {
  const sphere = new SphereBufferGeometry(100, 64, 64);
  const material = new MeshBasicMaterial({ map: texture, side: BackSide });
  const mesh = new Mesh(sphere, material);
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  scene.add(mesh);

  controllers = [
    new MouseController(mesh, canvas),
    new OrientationController(mesh),
  ];
}

exports.changeFov = function (fov) {
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

exports.changeCameraZ = function (z) {
  camera.position.z = z;
}
