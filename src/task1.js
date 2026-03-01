import './style.css';
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let torusMesh, sphereMesh, coneMesh, torusLight;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; 
    container.appendChild(renderer.domElement);
            
    // світло
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1)); 
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 4); 
    dirLight.position.set(1, 2, 1);
    scene.add(dirLight);

    // пончик
    const torusGeo = new THREE.TorusGeometry(0.03, 0.01, 16, 100);
    const neonMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        emissive: 0x00ffff, 
        emissiveIntensity: 0.8, 
        roughness: 0.1
    });
    torusMesh = new THREE.Mesh(torusGeo, neonMat);
    torusMesh.position.set(-0.12, 0, -0.6); 
    scene.add(torusMesh);

    //світло від пончика
    torusLight = new THREE.PointLight(0x00ffff, 5, 0.2); 
    torusLight.position.set(-0.06, 0, -0.55); 
    scene.add(torusLight);

    // куля
    const sphereGeo = new THREE.SphereGeometry(0.04, 32, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({ 
        color: 0x4682B4, 
        transmission: 1.0, 
        roughness: 0.02, 
        ior: 1.5,
        thickness: 0.1, 
        transparent: true, 
        clearcoat: 1.0, 
        emissive: 0x4682B4, 
        emissiveIntensity: 0.3
    });
    sphereMesh = new THREE.Mesh(sphereGeo, glassMat);
    sphereMesh.position.set(0, 0, -0.6); 
    scene.add(sphereMesh);

    // конус
    const coneGeo = new THREE.ConeGeometry(0.04, 0.08, 32);
    const metalMat = new THREE.MeshPhongMaterial({ 
        color: 0x222222, 
        specular: 0xffffff, 
        shininess: 100 
    });
    coneMesh = new THREE.Mesh(coneGeo, metalMat);
    coneMesh.position.set(0.12, 0, -0.6); 
    scene.add(coneMesh);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

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

function render() {
    const time = Date.now() * 0.002;
    controls.update(); 

    torusMesh.rotation.x += 0.02;
    torusMesh.rotation.y += 0.02;
    sphereMesh.rotation.y += 0.005;
    coneMesh.rotation.y += 0.03;

    const bounce = Math.sin(time) * 0.015;
    torusMesh.position.y = bounce;
    sphereMesh.position.y = Math.cos(time) * 0.015;
    coneMesh.position.y = bounce;
    torusLight.position.y = bounce;

    renderer.render(scene, camera);
}