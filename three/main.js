/**
 * Project: heatmap_d3
 * File: main
 * Author: wanpeninsula
 * Author URI: https://www.pennycodes.dev
 * Created: 11/07/2024 at 7:43 am
 *
 * Copyright (c) 2024 heatmap_d3. All rights reserved.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import getStarField from "./components/stars.js";


window.THREE = THREE;
const width = window.innerWidth;
const height = window.innerHeight;

// Create the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

// Position the camera
camera.position.z = 5;


const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);
new OrbitControls(camera, renderer.domElement);

// Create an earth mesh
const geometry = new THREE.IcosahedronGeometry(1, 12);

const loader = new THREE.TextureLoader();
const material = new THREE.MeshStandardMaterial({
   map: loader.load('shades/earthmap2.jpg')
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load("shades/earthlights2.jpg"),
    blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const stars = getStarField({ numStars : 2000});
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);
// Render loop
function animate() {
    requestAnimationFrame(animate);

    // Apply rotations
    earthMesh.rotation.y += 0.002;
    lightsMesh.rotation.y += 0.002;

    renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
