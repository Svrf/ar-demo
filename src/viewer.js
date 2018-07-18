const {
  BackSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  SphereBufferGeometry,
  Texture,
} = require('three');

const MouseController = require('./controllers/MouseController');
const OrientationController = require('./controllers/OrientationController');

const canvas = document.getElementById('mainCanvas');
let controllers = [];

// todo: remove window.scene reference

exports.removeBackground = () => {
  // Removing the only Mesh (either camera or panorama background).
  const background = window.scene.children.find(c => c.type === 'Mesh');
  controllers.forEach((c) => c.dispose());
  window.scene.remove(background);
  background.geometry.dispose();
  background.material.dispose();
};

exports.addPhotoBackground = (media) => {
  const url = media.files.images['4096'] || media.files.images.max;
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = () => {
    const sphere = new SphereBufferGeometry(100, 64, 64);
    const texture = new Texture(img);
    const material = new MeshBasicMaterial({ map: texture, side: BackSide });
    const mesh = new Mesh(sphere, material);
    texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    window.scene.add(mesh);

    controllers = [
      new MouseController(mesh, canvas),
      new OrientationController(mesh),
    ];
  };
};

exports.tick = function () {
  controllers.forEach((c) => c.tick());
};
