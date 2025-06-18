import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const container = document.getElementById('bg-webgl');
let scene, camera, renderer, particles, particlePositions, targetPositions, particleCount = 5000;
let state = "scatter";
let scatterTimeout, gatherTimeout;
let mouse = { x: 0, y: 0, z: 0 };
let modelTargets = {}; // { ferrari: Float32Array, audi: Float32Array, mercedes: Float32Array }
const modelFiles = {
  ferrari: 'models/ferrari.glb',
  audi: 'models/audi.glb',
  mercedes: 'models/mercedes.glb',
};
const shapes = Object.keys(modelFiles);

function randomScatterPositions() {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 700;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 420;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 700;
    }
    return positions;
}

// 3D modelden rastgele yüzey noktası örnekle (point cloud)
function samplePointsFromGeometry(geometry, numPoints) {
    geometry.computeBoundingBox();
    const position = geometry.attributes.position;
    const sampled = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const idx = Math.floor(Math.random() * position.count);
        sampled[i * 3] = position.getX(idx);
        sampled[i * 3 + 1] = position.getY(idx);
        sampled[i * 3 + 2] = position.getZ(idx);
    }
    return sampled;
}

function loadModelTargets(callback) {
    const loader = new GLTFLoader();
    let loaded = 0;
    for (const [brand, url] of Object.entries(modelFiles)) {
        loader.load(url, gltf => {
            // Tüm meshleri birleştir
            let geometries = [];
            gltf.scene.traverse(child => {
                if (child.isMesh) {
                    let g = child.geometry.clone();
                    g.applyMatrix4(child.matrixWorld);
                    geometries.push(g);
                }
            });
            let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
            modelTargets[brand] = samplePointsFromGeometry(mergedGeometry, particleCount);
            loaded++;
            if (loaded === shapes.length) callback();
        });
    }
}

function shapePositions(type) {
    if (modelTargets[type]) return modelTargets[type];
    return randomScatterPositions();
}

function setTargetShape() {
    const type = shapes[Math.floor(Math.random() * shapes.length)];
    targetPositions = shapePositions(type);
    state = "gather";
    clearTimeout(gatherTimeout);

    gatherTimeout = setTimeout(() => {
        targetPositions = randomScatterPositions();
        state = "scatter";
        scatterTimeout = setTimeout(setTargetShape, 3300 + Math.random()*1000);
    }, 3500 + Math.random()*1200);
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1200
    );
    camera.position.z = 350;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x111111, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Partiküller
    const geometry = new THREE.BufferGeometry();
    particlePositions = randomScatterPositions();
    targetPositions = randomScatterPositions();

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.1,
        vertexColors: false,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('touchmove', onTouchMove, false);

    setTargetShape();
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    let vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    mouse.z = 0;
    mouse._three = vector;
}

function onTouchMove(event) {
    if (event.touches && event.touches.length > 0) {
        onMouseMove({
            clientX: event.touches[0].clientX,
            clientY: event.touches[0].clientY
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    for (let i = 0; i < particleCount; i++) {
        let px = particlePositions[i * 3];
        let py = particlePositions[i * 3 + 1];
        let pz = particlePositions[i * 3 + 2];

        let tx = targetPositions[i * 3];
        let ty = targetPositions[i * 3 + 1];
        let tz = targetPositions[i * 3 + 2];

        // Fareye yakınsa hafif çekim
        if (mouse._three) {
            let dx = mouse._three.x - px;
            let dy = mouse._three.y - py;
            let dz = mouse._three.z - pz;
            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 70) {
                px += dx * 0.011;
                py += dy * 0.011;
                pz += dz * 0.011;
            }
        }

        // Hedefe doğru hareket
        px += (tx - px) * 0.12;
        py += (ty - py) * 0.12;
        pz += (tz - pz) * 0.12;

        particlePositions[i * 3] = px;
        particlePositions[i * 3 + 1] = py;
        particlePositions[i * 3 + 2] = pz;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    scene.rotation.y += 0.0013;
    scene.rotation.x += 0.0007;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---- Uygulama başlangıcı ----
loadModelTargets(() => {
    init();
    animate();
});
