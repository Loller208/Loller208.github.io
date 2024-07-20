// final project

import * as THREE from 'three';

// webcam connection using WebRTC
window.onload = function(){
    const video = document.getElementById("myvideo");	
    video.onloadedmetadata = start_processing;
    const constraints = {audio: false, video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => video.srcObject = stream )
    .catch((err) => {
        alert(err.name + ": " + err.message);	
        video.src = "marker.webm";
    });
}

function start_processing(){
    // ...
}

