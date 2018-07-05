const {Euler} = require('three');
const BaseController = require('./BaseController');

const leftButtonCode = 1;
const halfPi = Math.PI / 2;

module.exports = class MouseController extends BaseController {
  mouseSensitivity = 128;

  phi = 0;
  theta = 0;

  deltaPhi = 0;
  deltaTheta = 0;

  originPosition = null;
  currentPosition = null;

  constructor(mesh, canvas) {
    super();

    this.mesh = mesh;
    this.canvas = canvas;

    canvas.addEventListener('mouseup', this.reset);
    canvas.addEventListener('mouseout', this.reset);
    canvas.addEventListener('mousemove', this.handleMouseMove);
  }

  reset = () => {
    this.originPosition = null;
    this.currentPosition = null;
    this.deltaPhi = 0;
    this.deltaTheta = 0;
  }

  handleMouseMove = (e) => {
    if (e.buttons !== leftButtonCode) {
      return;
    }

    if (!this.originPosition) {
      this.originPosition = {x: e.clientX, y: e.clientY};
    }

    this.currentPosition = {x: e.clientX, y: e.clientY};

    if (this.originPosition && this.currentPosition) {
      this.deltaPhi = (this.originPosition.y - this.currentPosition.y) / this.mouseSensitivity;
      this.deltaTheta = (this.currentPosition.x - this.originPosition.x) / this.mouseSensitivity;
    }
  }

  tick() {
    if (!this.deltaPhi && !this.deltaTheta) {
      return;
    }

    this.phi += this.deltaPhi;
    this.phi = Math.max(-halfPi, Math.min(this.phi, halfPi));

    this.theta += this.deltaTheta;

    this.mesh.setRotationFromEuler(new Euler(this.phi, this.theta, 0));

    this.reset();
  }

  dispose() {
    canvas.removeEventListener('mouseup', this.reset);
    canvas.removeEventListener('mouseout', this.reset);

    canvas.removeEventListener('mousemove', this.handleMouseMove);
  }
}
