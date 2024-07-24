/**
 * Project: heatmap_d3
 * File: ha.js
 * Author: wanpeninsula
 * Author URI: https://www.pennycodes.dev
 * Created: 24/07/2024 at 12:09 am
 *
 * Copyright (c) 2024 heatmap_d3. All rights reserved.
 */

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';


window.THREE = THREE;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#218bbf");
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

camera.position.z = 3


const data = 'assets/africa_data_summarized.csv';
let processedData = [];
const regionSelect = document.getElementById('region');
const lenderSelect = document.getElementById('lender');
const sectorSelect = document.getElementById('sector');

// Parse the CSV data
Papa.parse(data, {
    header: true,
    download: true,
    complete: (results) => {
        processedData = results.data;

        const regions = new Set();
        results.data.forEach(d => {
            regions.add(d.region);
        });

        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.text = region;
            regionSelect.appendChild(option);
        });

    }
});

let selectedRegion = '';
let selectedLender = '';
let selectedSector = '';

function getOptions(region, option = "lender") {
    const options = new Set();
    processedData.forEach(d => {
        if (d.region === region) {
            options.add(d[option]);
        }
    });
    return options;
}

regionSelect.addEventListener('change', (e) => {
    lenderSelect.innerHTML = '<option value="">Select a lender</option>';
    sectorSelect.innerHTML = '<option value="">Select a sector</option>';
    lenderSelect.parentElement.classList.add('disabled');
    sectorSelect.parentElement.classList.add('disabled');
    const region = e.target.value;
    const lenders = getOptions(region, 'lender');
    lenders.forEach(lender => {
        const option = document.createElement('option');
        option.value = lender;
        option.text = lender;
        lenderSelect.appendChild(option);
    });
    lenderSelect.parentElement.classList.remove('disabled');

    const sectors = getOptions(region, 'sector');
    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.text = sector;
        sectorSelect.appendChild(option);
    });
    sectorSelect.parentElement.classList.remove('disabled');

    createChart(e.target.value);

});


lenderSelect.addEventListener('change', (e) => {
    selectedLender = e.target.value;
});

sectorSelect.addEventListener('change', (e) => {
    selectedSector = e.target.value;

});

const randomColor = () => Math.floor(Math.random() * 16777215).toString(16);

function createChart(selectedRegion) {

    if (processedData.length === 0) {
        return;
    }

    if (!selectedRegion) {
        alert('Please select a region');
        return;
    }
    let filteredData = processedData.filter(d => d.region === selectedRegion);


    // processedData.filter(d => d.region === selectedRegion).forEach((d, i) => {
    //     const amount = parseFloat(d.total_amount_usd);
    //     const transactions = parseInt(d.number_transactions);
    //     const x = (i % 5) * 5; // x-position based on index
    //     const y = amount / 10000000; // y-position based on total amount
    //     const z = Math.floor(i / 5) * 5; // z-position based on index
    //
    //     const geometry = new THREE.BoxGeometry(1, y, 1);
    //     const material = new THREE.MeshBasicMaterial({ color: "#" + randomColor() });
    //     const cube = new THREE.Mesh(geometry, material);
    //     cube.position.set(x, y / 2, z);
    //     scene.add(cube);
    // });

    // // Step 4: Animate the camera to fly over the data points


    // cube geometry
    const cubeGeometries = filteredData.map((d, i) => {
        const amount = parseFloat(d.total_amount_usd);
        const transactions = parseInt(d.number_transactions);


        return new THREE.BoxGeometry(1, transactions, 1);

    });

    const material =  new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load('https://threejsfundamentals.org/threejs/lessons/resources/images/compressed-but-large-wood-texture.jpg')
    });
    material.color.convertSRGBToLinear();

    cubeGeometries.forEach((geometry, i) => {
        const x = (i % 5) * 5; // x-position based on index
        // const y = amount / 10000000; // y-position based on total amount
        const z = Math.floor(i / 5) * 5; // z-position based on index
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, geometry.parameters.height / 2, z);
        scene.add(cube);
    });
    camera.position.set(0, 20, 30);

}

// ambient light
const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 3);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
mainLight.position.set(10, 10, 10);
scene.add(mainLight);


//
let t = 0;
const animate = function () {
    requestAnimationFrame(animate);

    // Flyover effect
    t += 0.01;
    camera.position.x = 20 * Math.sin(t);
    camera.position.z = 20 * Math.cos(t);
    camera.lookAt(new THREE.Vector3(10, 0, 10));

    renderer.render(scene, camera);
};

animate();
