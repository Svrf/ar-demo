//require('./search');

const brf = {locateFile: (filename) => `dist/${filename}`};
initializeBRF(brf);
console.log(brf);

const manager = new brf.BRFManager();
manager.init(new brf.Rectangle(0, 0, 1280, 720), new brf.Rectangle(0, 0, 640, 480), 'svrfdemo');

navigator.mediaDevices.getUserMedia({video: {facingMode: 'user'}})
  .then(function(stream) {
    document.getElementById('webcam').srcObject = stream;
    document.getElementById('webcam').play();

    function animate() {
      document.getElementById('imageData').getContext('2d').drawImage(document.getElementById('webcam'), 0, 0, 1280, 720);
      manager.update(document.getElementById('imageData').getContext('2d').getImageData(0, 0, 1280, 720));
      requestAnimationFrame(animate);

      const face = manager.getFaces()[0];

      if(face.state === brfv4.BRFState.FACE_TRACKING_START ||
        face.state === brfv4.BRFState.FACE_TRACKING) {
  
        imageDataCtx.strokeStyle="#00a0ff";
  
        for(var k = 0; k < face.vertices.length; k += 2) {
          imageDataCtx.beginPath();
          imageDataCtx.arc(face.vertices[k], face.vertices[k + 1], 2, 0, 2 * Math.PI);
          imageDataCtx.stroke();
        }
      }
    }

    animate();
  });