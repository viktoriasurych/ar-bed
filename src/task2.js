import './style.css'
import * as THREE from "three"
import { ARButton } from "three/addons/webxr/ARButton.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer;
let loader, model;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; 
    container.appendChild(renderer.domElement);

    // м'яке освітлення
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);
   
    const modelUrl = 'https://raw.githubusercontent.com/viktoriasurych/ar-bed/main/bed.glb';

    loader = new GLTFLoader();
    loader.load(
        modelUrl,
        function (gltf) {
            model = gltf.scene;
            
            model.position.set(0, -1.0, -1.5); 
            model.scale.set(0.15, 0.15, 0.15); 

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.roughness = 0.9; 
                    child.material.metalness = 0.0;
                    child.material.emissive.setHex(0x000000); 
                    child.material.needsUpdate = true;
                }
            });

            scene.add(model);
            console.log("Model added to scene successfully!");
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error("Error loading model:", error);
        }
    );

    document.body.appendChild(ARButton.createButton(renderer));
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

let degrees = 0; 

function render() {
    const time = Date.now() * 0.002;

    if (model !== undefined) {
        degrees = degrees + 0.15; 
        model.rotation.y = THREE.MathUtils.degToRad(degrees); 
        model.position.y = -1.0 + Math.sin(time) * 0.05;
    } 

    renderer.render(scene, camera);
}