import './style.css'
import * as THREE from "three"
import { ARButton } from "three/addons/webxr/ARButton.js"

let container, camera, scene, renderer, reticle, controller;
let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

init();
animate();

function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    const flashLight = new THREE.PointLight(0xffffff, 2, 10);
    camera.add(flashLight);
    scene.add(camera);

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    addReticleToScene();

    const button = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"]
    });
    document.body.appendChild(button);

    window.addEventListener("resize", onWindowResize, false);
}

function addReticleToScene() {
    const geometry = new THREE.RingGeometry(0.025, 0.03, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    reticle = new THREE.Mesh(geometry, material);

    const axesHelper = new THREE.AxesHelper(0.05);
    reticle.add(axesHelper); 

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
}

function onSelect() {
    if (reticle.visible) {
        const geometry = new THREE.DodecahedronGeometry(0.02); 
        const colors = [0x00ffcc, 0xff0066, 0x3366ff, 0xff9900, 0xcc33ff];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const material = new THREE.MeshPhongMaterial({
            color: randomColor,
            specular: 0xffffff,
            shininess: 100,
            flatShading: true,
            transparent: true,
            opacity: 0.9,
            emissive: randomColor,
            emissiveIntensity: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.setFromMatrixPosition(reticle.matrix);
        mesh.quaternion.setFromRotationMatrix(reticle.matrix);
        
        scene.add(mesh);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function initializeHitTestSource() {
    const session = renderer.xr.getSession();
    
    session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSource = source;
        });
    });

    session.requestReferenceSpace('local').then((referenceSpace) => {
        localSpace = referenceSpace;
    });

    session.addEventListener('end', () => {
        hitTestSourceInitialized = false;
        hitTestSource = null;
    });

    hitTestSourceInitialized = true;
}

function render(timestamp, frame) {
    if (frame) {
        if (!hitTestSourceInitialized) {
            initializeHitTestSource();
        }

        if (hitTestSource && localSpace) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(localSpace);

                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
}