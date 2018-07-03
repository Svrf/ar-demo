const {
  BackSide,
  DeviceOrientationControls,
  Euler,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereBufferGeometry,
  Texture,
} = require('three');

const {scene, start} = require('../dist/demo_tiger');

start();

const canvas = document.getElementById('jeeFaceFilterCanvas');
let mesh, animate;

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
    animate();
  };
}

document.getElementById('go').addEventListener('click', function () {
  removeBackground();
  addPhotoBackground('https://www.svrf.com/storage/svrf-previews/76778/images/1080.jpg');

  let origin = null;
  let target = null;
  let phi = 0, theta = 0;

  canvas.addEventListener('mouseup', () => {
    target = origin = null;
  });
  canvas.addEventListener('mouseout', () => {
    target = origin = null;
  });
  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1) {
      return;
    }

    if (!origin) {
      origin = {x: e.clientX, y: e.clientY};
    }

    target = {x: e.clientX, y: e.clientY};

    if (origin && target) {
      phi = (origin.y - target.y) / 128;
      theta = (origin.x - target.x) / 128;
    }
  });

  const obj = new Object3D();
  const controls = new DeviceOrientationControls(obj);

  let orientationOrigin;
  let previousOrientation;
  let commonPhi = 0;
  let commonTheta = 0;
  animate = () => {
    requestAnimationFrame(animate);

    if (phi || theta) {
      commonPhi += phi;
      commonTheta += theta;
      const pi2 = Math.PI / 2;
      commonPhi = Math.max(-pi2, Math.min(commonPhi, pi2));
      mesh.setRotationFromEuler(new Euler(commonPhi, commonTheta, 0));

      phi = theta = 0;
      origin && (origin.x = target.x);
      origin && (origin.y = target.y);
    }

    controls.update();
    if (!orientationOrigin) {
      orientationOrigin = mesh.quaternion.clone();
      previousOrientation = obj.quaternion.clone();
      return;
    }

    if (obj.quaternion.equals(previousOrientation)) {
      return;
    }

    mesh.quaternion.copy(obj.quaternion.clone().inverse());
    previousOrientation = obj.quaternion.clone();
  }
});
