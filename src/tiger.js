const three = require('three');
window.THREE = three; // for three.js inspector

let camera, faceObject, mouthOpeningMaterials, renderer, tigerMouthMesh, videoTexture;
const scene = new three.Scene();
window.scene = scene; // for three.js inspector
exports.scene = scene;

exports.initTiger = function(video) {
  renderer = new three.WebGLRenderer({
    alpha: true,
    canvas: document.getElementById('tigerCanvas'),
  });

  faceObject = new three.Object3D();
  faceObject.frustumCulled = false;
  const pivotedFaceObject = new three.Object3D();
  pivotedFaceObject.frustumCulled = false;
  pivotedFaceObject.position.set(0, -0.2, -0.2);
  faceObject.add(pivotedFaceObject);

  //LOAD THE TIGGER MESH
  tigerMouthMesh = new three.Mesh(
    new three.PlaneBufferGeometry(0.5, 0.6),
    new three.MeshBasicMaterial({color: 0x000000})
  );
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
  videoTexture = new three.Texture(video);
  videoTexture.magFilter = three.LinearFilter;
  videoTexture.minFilter = three.LinearFilter;
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
  const videoMesh = new three.Mesh(videoGeometry, videoMaterial);
  videoMesh.renderOrder = -1000; //render first
  videoMesh.frustumCulled = false;
  scene.add(videoMesh);

  const aspectRatio = video.width / video.height;
  camera = new three.PerspectiveCamera(40, aspectRatio, 0.1, 100);
  mouthOpeningMaterials = [];

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

exports.renderTiger = function({position, rotation, mouth}) {
  faceObject.visible = true;
  tigerMouthMesh.visible = true;
  videoTexture.needsUpdate = true;

  faceObject.position.set(position.x, position.y, position.z);
  faceObject.rotation.set(rotation.x, -rotation.y, -rotation.z, 'XYZ');

  mouthOpeningMaterials.forEach((m) => {
    m.uniforms.mouthOpening.value = mouth;
  });
  tigerMouthMesh.scale.setY(0.9 + mouth*0.5);

  renderer.render(scene, camera);
}

exports.renderBackgroundOnly = function() {
  faceObject.visible = false;
  tigerMouthMesh.visible = false;
  videoTexture.needsUpdate = true;

  renderer.render(scene, camera);
}
