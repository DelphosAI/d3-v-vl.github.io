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

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camControls = new OrbitControls(camera, renderer.domElement);
camControls.enableDamping = true

camera.position.z = 3


const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 100;

// create a plane group
const planeGroup = new THREE.Group();

scene.add(planeGroup);

// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: '#a9c388' })
)
floor.rotation.x = - Math.PI * 0.5
floor.position.y = 0
scene.add(floor)

// draw test box
const geometry = new THREE.BoxGeometry(0.1, 2, 0.1);

const material = new THREE.MeshBasicMaterial({ color: "#9D8189", wireframe: false });
const cube = new THREE.Mesh(geometry, material);
cube.position.y = -0.1;
cube.position.x = -1.2;
cube.position.z = 1;
// barGroup.add(cube);

// create geo group
const geoGroup = new THREE.Group();
//geoGroup.scale.set(5, 5, 3);
geoGroup.position.y = 3;
geoGroup.position.z = 1;
geoGroup.position.x = -1;
geoGroup.rotation.x = 1;
scene.add(geoGroup);


// Convert latitude and longitude to plane coordinates
const latLonToVector3 = (lat, lon) => {
    const x = (lon + 180) * (3 / 360) - 1.5; // Normalize longitude to plane width
    const y = -(lat - 90) * (3 / 180) -1;  // Normalize latitude to plane height
    return new THREE.Vector3(x, 0, y);
};

const createCountryBorders = (coordinates) => {
    const shapeVertices = coordinates[0].map(([lon, lat]) =>
        latLonToVector3(lat, lon)
    );

    return new THREE.BufferGeometry().setFromPoints(shapeVertices);
};

const createBordersLineString = (coordinates) => {
    const shapeVertices = coordinates.map(([lon, lat]) =>
        latLonToVector3(lat, lon)
    );

    return new THREE.BufferGeometry().setFromPoints(shapeVertices);

}

fetch("./assets/africa.geojson")
    .then((response) => response.json())
    .then((data) => {
        data.features.flatMap((feature) => {
            const { type, coordinates } = feature.geometry;
            const countryName = feature.properties.name;

            let color = "#ac1e44"; // Default color
           if (countryName === "Eastern Africa") {
                color = "#ef4444";
           }
           else if (countryName === "Northern Africa") {
                color = "#f59e0b";
           }
              else if (countryName === "Southern Africa") {
                color = "#10b981";
           }
                else if (countryName === "Western Africa") {
                color = "#3b82f6";
           }
                else if (countryName === "Central Africa") {
                color = "#00acc1";
           }

            if (type === "Polygon") {
                const geometry = createCountryBorders(coordinates);
                const material = new THREE.LineBasicMaterial({ color });
                const line = new THREE.Line(geometry, material);

                geoGroup.add(line);
            } else if (type === "MultiPolygon") {
                coordinates.forEach((polygon) => {
                    const geometry = createCountryBorders(polygon);
                    const material = new THREE.LineBasicMaterial({ color });
                    const line = new THREE.Line(geometry, material);
                    geoGroup.add(line);
                });
            }
            else if (type === "LineString") {
                const geometry = createBordersLineString(coordinates);
                const material = new THREE.LineBasicMaterial({ color });
                const line = new THREE.Line(geometry, material);

                // add country name
                const earthDiv = document.createElement('div');
                earthDiv.className = 'label';
                earthDiv.textContent = countryName;
                //earthDiv.style.marginTop = '-1em';
                const earthLabel = new CSS2DObject(earthDiv);

                if (countryName === "Northern Africa") {
                    earthLabel.position.set(0.04, 0, 0.02);
                }
                else if (countryName === "Eastern Africa") {
                    earthLabel.position.set(0.32, 0, 0.45);
                }
                else if (countryName === "Southern Africa") {
                    earthLabel.position.set(0.19, 0, 0.92);
                }
                else if (countryName === "Western Africa") {
                    earthLabel.position.set(0.01, 0, 0.26);
                }
                else if (countryName === "Central Africa") {
                    earthLabel.position.set(0.17, 0, 0.5);
                }
                line.add(earthLabel);
                earthLabel.layers.set(0);

                geoGroup.add(line);


            }
            else {
                console.warn("Unsupported geometry type:", type);
            }


        });
    });


// Set camera position and render the scene
camera.position.set(0, 3, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0));

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



const randomColor = () => Math.floor(Math.random() * 16777215).toString(16);

function createChart(selectedAfrica) {

    if (processedData.length === 0) {
        return;
    }

    if (!selectedAfrica) {
        alert('Please select a region');
        return;
    }
    let filteredData = processedData.filter(d => d.region === selectedAfrica);


    // processedData.filter(d => d.region === selectedAfrica).forEach((d, i) => {
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
        planeGroup.add(cube);
    });
   // camera.position.set(0, 20, 30);

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
    //camera.position.x = 20 * Math.sin(t);
    //camera.position.z = 20 * Math.cos(t);
   // camera.lookAt(new THREE.Vector3(10, 0, 10));

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

};

animate();

function handleWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);

}
window.addEventListener('resize', handleWindowResize, false);
