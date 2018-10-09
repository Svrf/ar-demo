const getIOSVersion = require('ios-version');

const iosVersion = getIOSVersion(navigator.userAgent);
// https://bugs.webkit.org/show_bug.cgi?id=179417
const hasWebglHlsBug = iosVersion && iosVersion.major === 11 && iosVersion.minor < 4;

const isIOSSafari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent);
// Only Safari can access camera in iOS
const canAccessCamera = !iosVersion || isIOSSafari;

module.exports = {
  canAccessCamera,
  hasWebglHlsBug,
};
