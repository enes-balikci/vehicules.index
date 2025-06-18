// Interaktif WebGL partikül animasyonu (Three.js)

const container = document.getElementById('bg-webgl');
let scene, camera, renderer, particles, particlePositions, particleSpeeds, particleCount = 350;
let mouse = { x: 0, y: 0, z: 0 };

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 300;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x111111, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Partiküller
    const geometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleCount * 3);
    particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        let x = (Math.random() - 0.5) * 500;
        let y = (Math.random() - 0.5) * 500;
        let z = (Math.random() - 0.5) * 500;
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
        particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.5;
        particleSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x66ccff,
        size: 3.2,
        vertexColors: false,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('touchmove', onTouchMove, false);
}

function onMouseMove(event) {
    // Ekran koordinatlarını -1 ile 1 arasında normalize et
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // Kamera düzlemine projekte et
    let vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    mouse.z = 0; // 2D düzlemde tut
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

    // Partikülleri hareket ettir ve fareye tepkili yap
    for (let i = 0; i < particleCount; i++) {
        let px = particlePositions[i * 3];
        let py = particlePositions[i * 3 + 1];
        let pz = particlePositions[i * 3 + 2];

        // Fareye yaklaşınca hafif çekim uygulansın (fare alanına göre)
        let dx = (mouse._three ? mouse._three.x : 0) - px;
        let dy = (mouse._three ? mouse._three.y : 0) - py;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 70) {
            // Fareye hafif çekim
            particlePositions[i * 3] += dx * 0.015;
            particlePositions[i * 3 + 1] += dy * 0.015;
        } else {
            // Normal hızında hareket
            particlePositions[i * 3] += particleSpeeds[i * 3];
            particlePositions[i * 3 + 1] += particleSpeeds[i * 3 + 1];
            particlePositions[i * 3 + 2] += particleSpeeds[i * 3 + 2];
        }

        // Sınırdan çıkınca geri dön
        for (let j = 0; j < 3; j++) {
            if (particlePositions[i * 3 + j] > 250) {
                particlePositions[i * 3 + j] = -250;
            } else if (particlePositions[i * 3 + j] < -250) {
                particlePositions[i * 3 + j] = 250;
            }
        }
    }

    particles.geometry.attributes.position.needsUpdate = true;

    // Hafif döndürme efekti
    scene.rotation.y += 0.0012;
    scene.rotation.x += 0.0006;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
