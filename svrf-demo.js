(function () {
  const canvas = document.getElementById('jeeFaceFilterCanvas');
  let mesh, animate;

  function removeBackground() {
    const background = THREESCENE.children.find(c => c.type === 'Mesh');
    THREESCENE.remove(background);
    background.geometry.dispose();
    background.material.dispose();
  }

  function addPhotoBackground(url) {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const sphere = new THREE.SphereGeometry(10, 128, 128);
      const texture = new THREE.Texture(img);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
      mesh = new THREE.Mesh(sphere, material);
      texture.minFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      THREESCENE.add(mesh);
      animate();
    };
  }

  document.getElementById('go').addEventListener('click', function () {
    removeBackground();
    addPhotoBackground('https://www.svrf.com/storage/svrf-previews/76778/images/1080.jpg');
    //window.controls = new THREE.TrackballControls(new THREE.Object3D(), canvas);
    //window.controls.zoomSpeed = 100;

    let origin = null;
    let target = null;
    let phi = 0, theta = 0;
    canvas.addEventListener('mouseup', () => {
      //origin = target = null;
    });
    canvas.addEventListener('mouseout', () => {
      //origin = target = null;
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
        phi = (target.y - origin.y) / 128;
        theta = (target.x - origin.x) / 128;
      }
    });

    animate = () => {
      requestAnimationFrame( animate );
      mesh.setRotationFromEuler(new THREE.Euler(phi, theta, 0));
    }
  });
})();