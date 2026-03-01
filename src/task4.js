import './style.css'
import * as THREE from "three"
import { ARButton } from "three/addons/webxr/ARButton.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, camera, scene, renderer, reticle, controller;
let model = null;
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

    renderer.domElement.style.display = 'none';

    // освітлення для мена
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 4, 2);
    scene.add(dirLight);

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
    const geometry = new THREE.RingGeometry(0.03, 0.04, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    reticle = new THREE.Mesh(geometry, material);

    const axesHelper = new THREE.AxesHelper(0.1);
    reticle.add(axesHelper);

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
}

function onSelect() {
    if (reticle.visible) {
        const modelUrl = 'https://raw.githubusercontent.com/viktoriasurych/ar-bed/main/nanami.glb';
        const loader = new GLTFLoader();

        if (model) {
            scene.remove(model);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (child.material.dispose) child.material.dispose();
                }
            });
        }

        console.log("Тап! Завантаження...");

        loader.load(modelUrl, function (gltf) {
            const loadedModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(loadedModel);
            
            loadedModel.position.y = -box.min.y; 

            const anchor = new THREE.Group();
            anchor.add(loadedModel);

            anchor.position.setFromMatrixPosition(reticle.matrix);
            anchor.quaternion.setFromRotationMatrix(reticle.matrix);
            
            anchor.scale.set(0.05, 0.05, 0.05); 
            
            model = anchor;
            scene.add(model);
        }, 
        (xhr) => {
            if (xhr.total > 0) console.log('Завантажено: ' + (xhr.loaded / xhr.total * 100).toFixed(0) + '%');
        });
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

async function initializeHitTestSource() {
    const session = renderer.xr.getSession();
    const viewerSpace = await session.requestReferenceSpace("viewer");
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    localSpace = await session.requestReferenceSpace("local");
    hitTestSourceInitialized = true;

    renderer.domElement.style.display = 'block';

    session.addEventListener("end", () => {
        hitTestSourceInitialized = false;
        hitTestSource = null;
        renderer.domElement.style.display = 'none';
        if (model) {
            scene.remove(model);
            model = null;
        }
        reticle.visible = false;
    });
}

function render(timestamp, frame) {
    if (frame) {
        if (!hitTestSourceInitialized) initializeHitTestSource();

        if (hitTestSourceInitialized && hitTestSource) {
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
        renderer.render(scene, camera);
    }
}