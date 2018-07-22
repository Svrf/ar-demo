require('three/examples/js/controls/DeviceOrientationControls');
const {DeviceOrientationControls, Object3D, Quaternion} = require('three');

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

    // Don't reset it every tick if the device wasn't moved.
    if (this.orientationObject.quaternion.equals(this.previousOrientation)) {
      return;
    }

    const newOrientation = this.getOrientation();
    // Background is mirrored in Y axis because we're inside the sphere, so we need to mirror
    // quaternion in this way as well..
    const mirrored = new Quaternion(-newOrientation.x, newOrientation.y, newOrientation.z, newOrientation.w)
    newOrientation.copy(mirrored);
    this.mesh.quaternion.copy(newOrientation);
    this.previousOrientation = this.getOrientation();
  }

  getOrientation() {
    return this.orientationObject.quaternion.clone();
  }

  dispose() {
    this.controls.dispose();
  }
}
