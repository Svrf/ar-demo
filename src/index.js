//require('./search');
const three = require('three');

const brf = {locateFile: (filename) => `dist/${filename}`};
initializeBRF(brf);

const manager = new brf.BRFManager();
setTimeout(() => manager.init(new brf.Rectangle(0, 0, 640, 480), new brf.Rectangle(0, 0, 640, 480), 'svrfdemo'), 4000);

function initTiger(video, context) {
  const scene = new three.Scene();
  const renderer = new three.WebGLRenderer({
    canvas: document.getElementById('mainCanvas'),
    context,
  });

  const faceObject = new three.Object3D();
  faceObject.frustumCulled = false;
  const pivotedFaceObject = new three.Object3D();
  pivotedFaceObject.frustumCulled = false;
  pivotedFaceObject.position.set(0, -0.2, -0.2);
  faceObject.add(pivotedFaceObject);

  //LOAD THE TIGGER MESH
  const tigerMaskLoader = new three.BufferGeometryLoader();
  tigerMaskLoader.load('TigerHead.json', function(tigerMaskGeometry) {
    const tigerFaceSkinMaterial = build_customMaskMaterial('headTexture2.png');
    const tigerEyesMaterial = build_customMaskMaterial('white.png');

    const whiskersMaterial = new three.MeshLambertMaterial({
      color: 0xffffff
    });
    const insideEarsMaterial = new three.MeshBasicMaterial({
      color: 0x331100
    });
    const tigerMaskMesh = new three.Mesh(tigerMaskGeometry, [
      whiskersMaterial, tigerEyesMaterial, tigerFaceSkinMaterial, insideEarsMaterial
    ]);
    tigerMaskMesh.scale.set(2, 3, 2);
    tigerMaskMesh.position.set(0., 0.2, -0.48);

      //small black quad to hide inside the mouth
      //(visible only if the user opens the mouth)
    const tigerMouthMesh = new three.Mesh(
        new three.PlaneBufferGeometry(0.5, 0.6),
        new three.MeshBasicMaterial({color: 0x000000})
    );
    tigerMouthMesh.position.set(0, -0.35, 0.5);
    pivotedFaceObject.add(tigerMaskMesh, tigerMouthMesh);
  });

  scene.add(faceObject);

  //AND THERE WAS LIGHT
  const ambientLight = new three.AmbientLight(0xffffff, 0.3);
  const directLight = new three.DirectionalLight(0xff8833, 2);
  directLight.position.set(0, 0.5, 1);

  scene.add(ambientLight, directLight);

  //init video texture with red
  const videoTexture = new three.DataTexture(new Uint8Array([255,0,0]), 1, 1, three.RGBFormat);
  videoTexture.needsUpdate = true;

  //CREATE THE VIDEO BACKGROUND
  const videoMaterial = new three.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      vertexShader: "attribute vec2 position;\n\
          varying vec2 vUV;\n\
          void main(void){\n\
              gl_Position=vec4(position, 0., 1.);\n\
              vUV=0.5+0.5*position;\n\
          }",
      fragmentShader: "precision lowp float;\n\
          uniform sampler2D samplerVideo;\n\
          varying vec2 vUV;\n\
          void main(void){\n\
              gl_FragColor=texture2D(samplerVideo, vUV);\n\
          }",
        uniforms:{
          samplerVideo: {value: videoTexture}
        }
  });
  const videoGeometry = new three.BufferGeometry()
  const videoScreenCorners = new Float32Array([-1,-1,   1,-1,   1,1,   -1,1]);
  videoGeometry.addAttribute('position', new three.BufferAttribute( videoScreenCorners, 2 ) );
  videoGeometry.setIndex(new three.BufferAttribute(new Uint16Array([0,1,2, 0,2,3]), 1));
  const videoMesh=new three.Mesh(videoGeometry, videoMaterial);
  videoMesh.onAfterRender = function() {
      //replace THREEVIDEOTEXTURE.__webglTexture by the real video texture
      renderer.properties.update(videoTexture, '__webglTexture', video);
      videoTexture.magFilter = three.LinearFilter;
      videoTexture.minFilter = three.LinearFilter;
      delete(videoMesh.onAfterRender);
  };
  videoMesh.renderOrder = -1000; //render first
  videoMesh.frustumCulled = false;
  scene.add(videoMesh);

  const aspectRatio = 640 / 480;
  const camera = new three.PerspectiveCamera(40, aspectRatio, 0.1, 100);
  const mouthOpeningMaterials = [];

  return {renderer, camera, scene, faceObject};

  function build_customMaskMaterial(textureURL) {
    let vertexShaderSource = three.ShaderLib.lambert.vertexShader;
    vertexShaderSource = vertexShaderSource.replace('void main() {', 'varying vec3 vPos; uniform float mouthOpening; void main(){ vPos=position;');
    let glslSource = [
        'float isLowerJaw=step(position.y+position.z*0.2, 0.0);//-0.13);',
        //'transformed+=vec3(0., -0.1, 0.)*isLowerJaw*mouthOpening;'
        'float theta=isLowerJaw*mouthOpening*3.14/12.0;',
        'transformed.yz=mat2(cos(theta), sin(theta),-sin(theta), cos(theta))*transformed.yz;'

    ].join('\n');
    vertexShaderSource = vertexShaderSource.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + glslSource);

    let fragmentShaderSource = three.ShaderLib.lambert.fragmentShader;
    glslSource = [
        'float alphaMask=1.0;', //initialize the opacity coefficient (1.0->fully opaque)
        'vec2 pointToEyeL=vPos.xy-vec2(0.25,0.15);', //position of left eye
        'vec2 pointToEyeR=vPos.xy-vec2(-0.25,0.15);', //position of right eye
        'alphaMask*=smoothstep(0.05, 0.2, length(vec2(0.6,1.)*pointToEyeL));', //left eye fading
        'alphaMask*=smoothstep(0.05, 0.2, length(vec2(0.6,1.)*pointToEyeR));', //left eye fading
        'alphaMask=max(alphaMask, smoothstep(0.65, 0.75, vPos.z));', //force the nose opaque
        'float isDark=step(dot(texelColor.rgb, vec3(1.,1.,1.)), 1.0);',
        'alphaMask=mix(alphaMask, 1., isDark);',//only make transparent light parts'
        'vec2 uvVp=gl_FragCoord.xy/resolution;', //2D position in the viewport (between 0 and 1)
        'float scale=0.03/vPos.z;', //scale of the distorsion in 2D
        'vec2 uvMove=vec2(-sign(vPos.x), -1.5)*scale;', //video distorsion. the sign() distinguish between left and right face side
        'vec4 videoColor=texture2D(samplerVideo, uvVp+uvMove);',
        'float videoColorGS=dot(vec3(0.299, 0.587, 0.114),videoColor.rgb);', //grayscale value of the video pixel
        'videoColor.rgb=videoColorGS*vec3(1.5,0.6,0.0);', //color video with orange
        'gl_FragColor=mix(videoColor, gl_FragColor, alphaMask);' //mix video background with mask color
    ].join('\n');
    fragmentShaderSource = fragmentShaderSource.replace('void main() {', 'varying vec3 vPos; uniform sampler2D samplerVideo; uniform vec2 resolution; void main(){');
    fragmentShaderSource = fragmentShaderSource.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + glslSource);

    const mat = new three.ShaderMaterial({
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: Object.assign({
            samplerVideo: {value: videoTexture},
            resolution: {value: new three.Vector2(renderer.getSize().width, renderer.getSize().height)},
            mouthOpening: {value: 0}
        }, three.ShaderLib.lambert.uniforms),
        lights: true,
        transparent: true
    });
    const texture = new three.TextureLoader().load(textureURL);
    mat.uniforms.map = {value: texture};
    mat.map = texture;

    mouthOpeningMaterials.push(mat);
    return mat;
  }
}



navigator.mediaDevices.getUserMedia({video: {facingMode: 'user', width: 512, height: 512}})
  .then(function(stream) {
    document.getElementById('webcam').srcObject = stream;
    document.getElementById('webcam').play();

    const brfCanvas = document.createElement('canvas');
    brfCanvas.width = 640;
    brfCanvas.height = 480;

    const gl = document.getElementById('mainCanvas').getContext('webgl');
    const video = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, video);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    const {camera, renderer, scene, faceObject} = initTiger(video, gl);

    function animate() {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('webcam'));
      const context = brfCanvas.getContext('2d');
      context.drawImage(document.getElementById('webcam'), 0, 0, 640, 480);
      manager.update(context.getImageData(0, 0, 640, 480).data);

      const face = manager.getFaces()[0];
      if (face) {
        const {bounds} = face;
        var tanFOV=Math.tan(camera.aspect*camera.fov*Math.PI/360); //tan(FOV/2), in radians
        var W=bounds.width / 640;  //relative width of the detection window (1-> whole width of the detection window)
        var D=1/(2*W*tanFOV); //distance between the front face of the cube and the camera

        //coords in 2D of the center of the detection window in the viewport :
        var xv=bounds.x;
        var yv=bounds.y;

        //coords in 3D of the center of the cube (in the view coordinates system)
        var z=-D-0.5;   // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
        var x=xv*D*tanFOV;
        var y=yv*D*tanFOV/camera.aspect;

        //move and rotate the cube
        faceObject.position.set(x,y+0.2,z+0.2);
        faceObject.rotation.set(bounds.rotationX, bounds.rotationY, bounds.rotationZ, 'XYZ');
      }
      //console.log(face.bounds);

      renderer.render(scene, camera);

      requestAnimationFrame(animate);
    }

    setTimeout(animate, 4000);
  });
