const BaseController = require('./BaseController');

const leftButtonCode = 1;
const halfPi = Math.PI / 2;

module.exports = class MouseController extends BaseController {
  mouseSensitive = 128;

  phi = 0;
  theta = 0;

  deltaPhi = 0;
  deltaTheta = 0;

  originPosition = null;
  currentPosition = null;

  constructor(mesh, canvas) {
    this.mesh = mesh;
    this.canvas = canvas;

    canvas.addEventListener('mouseup', () => this.reset());
    canvas.addEventListener('mouseout', () => this.reset());

    canvas.addEventListener('mousemove', (e) => {
      if (e.buttons !== leftButtonCode) {
        return;
      }
  
      if (!this.originPosition) {
        this.originPosition = {x: e.clientX, y: e.clientY};
      }
  
      this.currentPosition = {x: e.clientX, y: e.clientY};
  
      if (this.originPosition && this.currentPosition) {
        this.deltaPhi = (this.originPosition.y - this.currentPosition.y) / this.mouseSensitive;
        this.deltaTheta = (this.originPosition.x - this.currentPosition.x) / this.mouseSensitive;
      }
    });
  }

  reset() {
    this.originPosition = null;
    this.currentPosition = null;
    this.deltaPhi = 0;
    this.deltaTheta = 0;
  }

  tick() {
    if (!this.deltaPhi && !this.deltaTheta) {
      return;
    }

    this.phi += this.deltaPhi;
    this.phi = Math.max(-halfPi, Math.min(commonPhi, halfPi));

    this.deltaTheta += this.deltaTheta;

    this.mesh.setRotationFromEuler(new Euler(this.phi, this.theta, 0));

    this.reset();
  }

  dispose() {
    
  }
}
