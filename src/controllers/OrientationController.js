require('three/examples/js/controls/DeviceOrientationControls');
const {DeviceOrientationControls, Object3D} = require('three');

const BaseController = require('./BaseController');

module.exports = class OrientationController extends BaseController {
  orientationObject = new Object3D();
  controls = new DeviceOrientationControls(this.orientationObject);
  
  previousOrientation = null;

  constructor(mesh) {
    super();

    this.mesh = mesh;
  }

  tick() {
    this.controls.update();

    if (!this.previousOrientation) {
      this.previousOrientation = this.orientationObject.quaternion.clone();
      return;
    }

    if (this.orientationObject.quaternion.equals(this.previousOrientation)) {
      return;
    }

    this.mesh.quaternion.copy(this.getOrientation());
    this.previousOrientation = this.getOrientation();
  }

  getOrientation() {
    return this.orientationObject.quaternion.clone();
  }

  dispose() {
    this.controls.dispose();
  }
}
