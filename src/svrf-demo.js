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
const {scene, start} = require('../dist/demo_tiger');

start();

const canvas = document.getElementById('jeeFaceFilterCanvas');
let mesh, animate;
let controllers = [];

function removeBackground() {
  const background = scene.children.find(c => c.type === 'Mesh');
  scene.remove(background);
  background.geometry.dispose();
  background.material.dispose();
}

function addPhotoBackground(url) {
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = () => {
    const sphere = new SphereBufferGeometry(100, 128, 128);
    const texture = new Texture(img);
    const material = new MeshBasicMaterial({ map: texture, side: BackSide });
    mesh = new Mesh(sphere, material);
    texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    scene.add(mesh);
    controllers = [
      new MouseController(mesh, canvas),
      new OrientationController(mesh),
    ];
    animate();
  };
}

document.getElementById('go').addEventListener('click', function () {
  removeBackground();
  addPhotoBackground('https://www.svrf.com/storage/svrf-previews/76778/images/1080.jpg');

  animate = () => {
    requestAnimationFrame(animate);
    controllers.forEach((c) => c.tick());
  }
});
