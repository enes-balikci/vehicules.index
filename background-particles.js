// Three.js ile arka plana hareketli partikül animasyonu

const container = document.getElementById('bg-webgl');
let scene, camera, renderer, particles, particlePositions, particleSpeeds, particleCount = 300;

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 200;

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x111111, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Partiküller
    const geometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleCount * 3);
    particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        let x = (Math.random() - 0.5) * 400;
        let y = (Math.random() - 0.5) * 400;
        let z = (Math.random() - 0.5) * 400;
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
        // Her partikülün ayrı bir hızı var
        particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.4;
        particleSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
        particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 4,
        vertexColors: false,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    window.addEventListener('resize', onWindowResize, false);
}

function animate() {
    requestAnimationFrame(animate);

    // Partikülleri hareket ettir
    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] += particleSpeeds[i * 3];
        particlePositions[i * 3 + 1] += particleSpeeds[i * 3 + 1];
        particlePositions[i * 3 + 2] += particleSpeeds[i * 3 + 2];

        // Sınırdan çıkınca geri döndür
        for (let j = 0; j < 3; j++) {
            if (particlePositions[i * 3 + j] > 200) {
                particlePositions[i * 3 + j] = -200;
            } else if (particlePositions[i * 3 + j] < -200) {
                particlePositions[i * 3 + j] = 200;
            }
        }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Hafif döndürme efekti
    scene.rotation.y += 0.0015;
    scene.rotation.x += 0.0007;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
