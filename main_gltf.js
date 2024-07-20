// final project

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// webcam connection using WebRTC
window.onload = function(){
    const video = document.getElementById("myvideo");	
    video.onloadedmetadata = start_processing;
    const constraints = { audio: false, video: facingMode: "user" };
    navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => video.srcObject = stream )
    .catch((err) => {
        alert(err.name + ": " + err.message);	
        video.src = "marker.webm";
    });
}

function start_processing(){
    // canvas & video
    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("mycanvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.width = video.height = 0;

    // three.js
    const renderer = new THREE.WebGLRenderer( { canvas: canvas } );
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(camera);

    // background
    const bgtexture = new THREE.VideoTexture( video );
    bgtexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgtexture;

    // container + object
    const container = new THREE.Object3D();
    container.matrixAutoUpdate = false;
    scene.add(container);
    const loader = new GLTFLoader();
    loader.load('retro_cartoon_car.glb', model => {
        container.add(model.scene);
    });
    const light = new THREE.AmbientLight(0xffffff,10);
    container.add(light);

    // jsartoolkit
    let arLoaded = false;
    let lastdetectiontime = 0;
    const arController = new ARController(video, 'camera_para.dat');
    arController.onload = () => {
        camera.projectionMatrix.fromArray( arController.getCameraMatrix() );
        arController.setPatternDetectionMode(artoolkit.AR_MATRIX_CODE_DETECTION);
        arController.addEventListener('getMarker', ev => {
            if(ev.data.marker.idMatrix != -1){
                // container.matrix.fromArray( ev.data.matrixGL_RH );
                fixMatrix(container.matrix, ev.data.matrixGL_RH );
                lastdetectiontime = performance.now();
            }
        });
        arLoaded = true;
    }

    // render loop
    function renderloop() {
        requestAnimationFrame( renderloop );
        if(arLoaded)
            arController.process(video);
        if(performance.now()-lastdetectiontime < 100)
            container.visible = true;
        else
            container.visible = false;
        renderer.render( scene, camera );
    }
    renderloop();
}

// fix the marker matrix to compensate Y-up models
function fixMatrix(three_mat, m){
    three_mat.set(
        m[0], m[8], -m[4], m[12],
        m[1], m[9], -m[5], m[13],
        m[2], m[10], -m[6], m[14],
        m[3], m[11], -m[7], m[15]
    );
}
