import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Updated path for GLTFLoader
import { ARController } from 'ar-js'; // Make sure you have AR.js available and correctly imported

window.onload = async function() {
    const video = document.getElementById("myvideo");

    // Set up webcam connection using WebRTC
    try {
        const constraints = { audio: false, video: { facingMode: "environment" } }; // Use back camera if available
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await new Promise(resolve => video.onloadedmetadata = resolve); // Ensure metadata is loaded before starting processing
        start_processing();
    } catch (err) {
        alert(err.name + ": " + err.message);
        video.src = "marker.webm"; // Fallback if webcam is not available
    }
}

async function start_processing() {
    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("mycanvas");

    // Update canvas size based on video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.width = video.height = 0;

    // three.js setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(); // Use PerspectiveCamera instead of Camera
    scene.add(camera);

    // Set up background with video texture
    const bgtexture = new THREE.VideoTexture(video);
    bgtexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgtexture;

    // Container and object setup
    const container = new THREE.Object3D();
    container.matrixAutoUpdate = false;
    scene.add(container);

    const loader = new GLTFLoader();
    loader.load('player0.glb', model => {
        container.add(model.scene);
    });

    const light = new THREE.AmbientLight(0xffffff, 10);
    container.add(light);

    // ARController setup
    let arLoaded = false;
    let lastDetectionTime = 0;
    let kanjiID;

    const arController = new ARController(video, 'camera_para.dat');
    arController.onload = () => {
        camera.projectionMatrix.fromArray(arController.getCameraMatrix());
        arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_COLOR);
        arController.loadMarker('kanji.patt', id => kanjiID = id);
        arController.addEventListener('getMarker', ev => {
            if (ev.data.marker.idPatt === kanjiID) {
                fixMatrix(container.matrix, ev.data.matrixGL_RH);
                lastDetectionTime = performance.now();
            }
        });
        arLoaded = true;
    }

    // Render loop
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        if (arLoaded) {
            arController.process(video);
        }
        container.visible = performance.now() - lastDetectionTime < 100;
        renderer.render(scene, camera);
    }
    renderLoop();
}

// Fix the marker matrix to compensate for Y-up models
function fixMatrix(threeMat, m) {
    threeMat.set(
        m[0], m[8], -m[4], m[12],
        m[1], m[9], -m[5], m[13],
        m[2], m[10], -m[6], m[14],
        m[3], m[11], -m[7], m[15]
    );
}
