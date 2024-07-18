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
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import getStarField from "./components/stars.js";
// import countries from "./assets/countries.geo.json"; // use fetch below



var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var WIDTH = 1000;
var HEIGHT = 600;

window.THREE = THREE;
const width = window.innerWidth;
const height = window.innerHeight;

// Create the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
camera.lookAt(new THREE.Vector3(0,0,0));
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
// const geometry = new THREE.IcosahedronGeometry(1, 12);
const geometry = new THREE.SphereGeometry(1,50,50);

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


// mouse
const mouse = new THREE.Vector2(-1, -1);
const 	raycaster = new THREE.Raycaster();

// Plot geojson countries
const radius = 1; // Radius of the globe
const elevation = 0.001; // Elevation above the globe surface


const latLonToVector3 = (lat, lon, radius, elevation = 0) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius + elevation) * Math.sin(phi) * Math.cos(theta);
    const y = (radius + elevation) * Math.cos(phi);
    const z = (radius + elevation) * Math.sin(phi) * Math.sin(theta);
    //
    return new THREE.Vector3(x, y, z);
};

const createCountryBorders = (coordinates) => {
    const shapeVertices = coordinates[0].map(([lon, lat]) =>
        latLonToVector3(lat, lon, radius, elevation)
    );

    return new THREE.BufferGeometry().setFromPoints(shapeVertices);
};

fetch("./assets/countries.geo.json")
    .then((response) => response.json())
    .then((data) => {
        data.features.flatMap((feature) => {
            const { type, coordinates } = feature.geometry;
            const countryName = feature.properties.name;
            let color = "#e4e4e7"; // Default color

            if (countryName === "Poland") {
                color = "#ef4444";
            } else if (countryName === "Germany") {
                color = "#ef4444";
            } else if (countryName === "Belarus") {
                color = "#ef4444";
            } else if (countryName === "France") {
                color = "#ef4444";
            } else if (countryName === "Italy") {
                color = "#ef4444";
            } else if (countryName === "Spain") {
                color = "#ef4444";
            } else if (countryName === "Portugal") {
                color = "#ef4444";
            } else if (countryName === "Netherlands") {
                color = "#ef4444";
            } else if (countryName === "Belgium") {
                color = "#ef4444";
            }


            if (type === "Polygon") {
                const geometry = createCountryBorders(coordinates);
                const material = new THREE.LineBasicMaterial({ color });
                const line = new THREE.Line(geometry, material);
                earthGroup.add(line);
            } else if (type === "MultiPolygon") {
                coordinates.forEach((polygon) => {
                    const geometry = createCountryBorders(polygon);
                    const material = new THREE.LineBasicMaterial({ color });
                    const line = new THREE.Line(geometry, material);
                    earthGroup.add(line);
                });
            } else {
                console.warn("Unsupported geometry type:", type);
            }


        });
    });


// Render loop
function animate() {
    requestAnimationFrame(animate);

    // Apply rotations
    //earthMesh.rotation.y += 0.002;
  //  lightsMesh.rotation.y += 0.002;
    earthGroup.rotation.y += 0.002;


    renderer.render(scene, camera);
}

animate();

function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);
    console.log(intersects[0]);

    if (intersects.length > 0) {

          intersects[0].object.material.color.set(0xff0000);

    } else {

          material.color.set(0xbbbbbb);

    }

}

function handleWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
document.addEventListener('mousemove', onMouseMove, false);
