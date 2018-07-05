const {
  BackSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  SphereBufferGeometry,
  Texture,
} = require('three');
const debounce = require('debounce');
const SVRF = require('svrf-client');

const MouseController = require('./controllers/MouseController');
const OrientationController = require('./controllers/OrientationController');
const {scene, start} = require('../dist/demo_tiger');

const canvas = document.getElementById('jeeFaceFilterCanvas');
// Need to set it with attributes; otherwise jeelizFaceFilter wouldn't work properly
canvas.height = document.documentElement.clientHeight;
canvas.width = document.documentElement.clientWidth;

start();

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
    const mesh = new Mesh(sphere, material);
    texture.minFilter = LinearFilter;
    texture.needsUpdate = true;
    scene.add(mesh);

    const controllers = [
      new MouseController(mesh, canvas),
      new OrientationController(mesh),
    ];

    function animate () {
      requestAnimationFrame(animate);
      controllers.forEach((c) => c.tick());
    };

    animate();
  };
}

const authApi = new SVRF.AuthenticateApi();
const mediaApi = new SVRF.MediaApi();
authApi.authenticate(new SVRF.Body('key'))
  .then(({token}) => mediaApi.apiClient.authentications.XAppToken.apiKey = token);

const searchContainer = document.getElementById('searchContainer');
const searchResults = document.getElementById('searchResults');
const input = document.getElementById('searchBox');

function handleKeyUp() {
  if (input.value.length < 3) {
    return;
  }

  mediaApi.search(input.value, 'photo')
    .then(({media}) => {
      console.log(media);
      searchResults.innerHTML = '';
      media.forEach((m) => appendResultItem(m));
    });
}

function appendResultItem(media) {
  const preview = document.createElement('img');
  const src = media.files.images['540'];
  if (!src) {
    return;
  }

  preview.src = src;
  preview.addEventListener('click', () => {
    removeBackground();
    addPhotoBackground(media.files.images.max);
    searchContainer.style.display = 'none';
  });

  searchResults.appendChild(preview);
}

document.getElementById('explore').addEventListener('click', function () {
  //removeBackground();
  //addPhotoBackground('https://www.svrf.com/storage/svrf-previews/76778/images/1080.jpg');
  searchContainer.style.display = null;

  input.addEventListener('keyup', debounce(handleKeyUp, 500));
});
