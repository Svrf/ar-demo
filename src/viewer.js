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

const canvas = document.getElementById('jeeFaceFilterCanvas');
// Need to set it with attributes; otherwise jeelizFaceFilter wouldn't work properly
canvas.height = document.documentElement.clientHeight;
canvas.width = document.documentElement.clientWidth;

exports.removeBackground = () => {
  // Removing the only Mesh (either camera or panorama background).
  const background = scene.children.find(c => c.type === 'Mesh');
  scene.remove(background);
  background.geometry.dispose();
  background.material.dispose();
}

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
    scene.add(mesh);

    const controllers = [
      new MouseController(mesh, canvas),
      new OrientationController(mesh),
    ];

    function animate () {
      controllers.forEach((c) => c.tick());
      requestAnimationFrame(animate);
    };

    animate();
  };
}
