module.exports = class BaseController {
  tick() {
    throw new Error('tick method is not implemented');
  }

  dispose() { }
}
