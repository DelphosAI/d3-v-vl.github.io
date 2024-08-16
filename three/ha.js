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
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import GUI from 'lil-gui'

// Debug
const gui = new GUI({
    title: 'Map GUI'
})

window.addEventListener('keypress', ev => {
    if (ev.key === "h") {
        if (gui._hidden) {
            gui.show()
        }
        else {
            gui.hide()
        }
    }
})


window.THREE = THREE;

// setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#131313");


// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: '#a9c388' })
)
floor.rotation.x = - Math.PI * 0.5
floor.position.y = 0
scene.add(floor)

gui.add(floor.position, 'y').min(-3).max(3).step(0.01).name('floor elevation')
gui.add(floor.position, 'z').min(-3).max(3).step(0.01).name('floor side')
gui.add(floor.position, 'x').min(-3).max(3).step(0.01).name('floor x')
gui.add(floor.rotation, 'x').min(-3).max(3).step(0.01).name('floor rotation')


const data = 'assets/africa_data_summarized.csv';
let processedData = [];
const regionSelect = document.getElementById('region');
const lenderSelect = document.getElementById('lender');
const sectorSelect = document.getElementById('sector');




/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.12)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001).name("ambient intensity")
scene.add(ambientLight)

// Directional light
const moonLight = new THREE.DirectionalLight(0xffffff, 0.12)
moonLight.position.set(4, 5, - 2)
gui.add(moonLight, 'intensity').min(0).max(1).step(0.001)
gui.add(moonLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(moonLight.position, 'z').min(- 5).max(5).step(0.001)
scene.add(moonLight)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    antialias: true
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(100, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 0.2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true


renderer.setSize(sizes.width, sizes.height)
document.body.appendChild(renderer.domElement);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#262837')


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

let selectedRegion = null;
let selectedLender = null;
let selectedSector = null;

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
    selectedRegion = region;
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
});

lenderSelect.addEventListener('change', (e) => {
    selectedLender = e.target.value;
    createChart();
});

// Chart geometry
const chartGeometry = new THREE.BoxGeometry(0.4, 1, 1);
const chartMaterial = new THREE.MeshStandardMaterial({ color: "#ff0000" });

const disposeArray = [];

function disposeArrayElements() {
    disposeArray.forEach((i) => {
        const object = scene.getObjectByProperty( 'uuid', i );
        if (object) {
            object.geometry.dispose();
            object.material.dispose();
            scene.remove(object);
        }
    });
    renderer.renderLists.dispose();
}

function createChart() {
    disposeArrayElements();

    if (processedData.length === 0) {
        return;
    }

    if (!selectedRegion) {
        alert('Please select a region');
        return;
    }
    if (!selectedLender) {
        alert('Please select a lender');
        return;
    }
    let filteredData = processedData.filter(d => d.region === selectedRegion && d.lender === selectedLender);
    console.log({filteredData});

    // group by year
    const groupedData = [];
    filteredData.forEach(d => {
        const year = d.year;
        const entity = {
            amount: parseFloat(d.total_amount_usd),
            transactions: parseInt(d.number_transactions)
        };
        if (!groupedData[year]) {
            groupedData[year] = entity;
        }
        else {
            groupedData[year].amount += entity.amount;
            groupedData[year].transactions += entity.transactions;
        }
    });

    // console.log({groupedData});

    const maxAmount = Math.max(...Object.values(groupedData).map(d => d.amount));
    const gap = 1;
    const indexes = [...Array(Object.keys(groupedData).length).keys()];
    console.log({indexes});
    let x = -9;
    for (let year in groupedData) {
        const entity = groupedData[year];
        // const x = parseInt(year) * 5;
        // const y = entity.amount / 10000000;
        // const z = 0;
        // const angle = Math.random() * Math.PI * 2;
        // const radius = 2 + Math.random() * 3;
        // const x = Math.sin(angle) * radius;
        // const z = 2;

        const z = 2;
        console.log({x, z});

        const y = (entity.amount / maxAmount) * 10;
        const cube = new THREE.Mesh(chartGeometry, chartMaterial);
        disposeArray.push(cube.uuid);
      cube.position.set(x, 0.3, z);
      x += 1;
        cube.scale.y = y;
        scene.add(cube);
    }

}



/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
