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
      const sphere = new THREE.SphereBufferGeometry(100, 128, 128);
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

    const obj = new THREE.Object3D();
    const controls = new THREE.DeviceOrientationControls(obj);

    let orientationOrigin;
    let previousOrientation;
    let commonPhi = 0;
    let commonTheta = 0;
    animate = () => {
      window.mesh = mesh;
      requestAnimationFrame(animate);
      commonPhi += phi;
      commonTheta += theta;
      const pi2 = Math.PI / 2;
      commonPhi = Math.max(-pi2, Math.min(commonPhi, pi2));
      mesh.setRotationFromEuler(new THREE.Euler(commonPhi, commonTheta, 0));
      // const mouseQuaternion = new THREE.Quaternion();
      // mesh.rotateX(phi);
      // mesh.rotateY(theta);
      // mouseQuaternion.setFromEuler(new THREE.Euler(phi, theta, 0));
      //mouseQuaternion.inverse();
      phi = theta = 0;
      origin && (origin.x = target.x);
      origin && (origin.y = target.y);
      //mesh.quaternion.multiply(mouseQuaternion);

      controls.update();
      if (!orientationOrigin) {
        orientationOrigin = mesh.quaternion.clone();
        previousOrientation = obj.quaternion.clone();
        return;
      }

      if (obj.quaternion.equals(previousOrientation)) {
        return;
      }
      previousOrientation = obj.quaternion.clone();

      const delta = orientationOrigin.clone().multiply(obj.quaternion);
      delta.inverse();
      mesh.quaternion.multiply(delta);
    }
  });
})();