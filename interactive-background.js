// Three.js ile partiküller, rastgele şekiller oluşturup tekrar dağılan animasyon

const container = document.getElementById('bg-webgl');
let scene, camera, renderer, particles, particlePositions, targetPositions, particleCount = 350;
let state = "scatter"; // "gather" veya "scatter"
let shapeIndex = 0;
let scatterTimeout, gatherTimeout;
let mouse = { x: 0, y: 0, z: 0 };

const shapes = ["circle", "square", "triangle", "star"];

function randomScatterPositions() {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 500;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    return positions;
}

function shapePositions(type) {
    const positions = new Float32Array(particleCount * 3);
    if (type === "circle") {
        const radius = 150;
        for (let i = 0; i < particleCount; i++) {
            const theta = (i / particleCount) * 2 * Math.PI;
            positions[i * 3] = Math.cos(theta) * radius;
            positions[i * 3 + 1] = Math.sin(theta) * radius;
            positions[i * 3 + 2] = 0;
        }
    } else if (type === "square") {
        // Square perimeter
        const side = 300, perSide = Math.floor(particleCount / 4);
        for (let i = 0; i < particleCount; i++) {
            let idx = i % perSide, edge = Math.floor(i / perSide);
            if (edge === 0) {
                // Top edge
                positions[i * 3] = -side/2 + (idx / perSide) * side;
                positions[i * 3 + 1] = -side/2;
            } else if (edge === 1) {
                // Right edge
                positions[i * 3] = side/2;
                positions[i * 3 + 1] = -side/2 + (idx / perSide) * side;
            } else if (edge === 2) {
                // Bottom edge
                positions[i * 3] = side/2 - (idx / perSide) * side;
                positions[i * 3 + 1] = side/2;
            } else {
                // Left edge
                positions[i * 3] = -side/2;
                positions[i * 3 + 1] = side/2 - (idx / perSide) * side;
            }
            positions[i * 3 + 2] = 0;
        }
    } else if (type === "triangle") {
        // Equilateral triangle
        const size = 300;
        const a = {x: 0, y: -size/2};
        const b = {x: -size/2, y: size/2};
        const c = {x: size/2, y: size/2};
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            let x, y;
            if (t < 1/3) {
                // From a to b
                let f = t * 3;
                x = a.x + (b.x - a.x) * f;
                y = a.y + (b.y - a.y) * f;
            } else if (t < 2/3) {
                // From b to c
                let f = (t - 1/3) * 3;
                x = b.x + (c.x - b.x) * f;
                y = b.y + (c.y - b.y) * f;
            } else {
                // From c to a
                let f = (t - 2/3) * 3;
                x = c.x + (a.x - c.x) * f;
                y = c.y + (a.y - c.y) * f;
            }
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = 0;
        }
    } else if (type === "star") {
        // 5-pointed star
        const R = 150, r = 60;
        for (let i = 0; i < particleCount; i++) {
            const theta = (i / particleCount) * Math.PI * 2;
            const isOuter = i % 2 === 0;
            const radius = isOuter ? R : r;
            positions[i * 3] = Math.cos(theta) * radius;
            positions[i * 3 + 1] = Math.sin(theta) * radius;
            positions[i * 3 + 2] = 0;
        }
    }
    return positions;
}

function setTargetShape() {
    const type = shapes[Math.floor(Math.random() * shapes.length)];
    targetPositions = shapePositions(type);
    state = "gather";
    clearTimeout(gatherTimeout);

    gatherTimeout = setTimeout(() => {
        targetPositions = randomScatterPositions();
        state = "scatter";
        scatterTimeout = setTimeout(setTargetShape, 3200 + Math.random()*1000);
    }, 3500 + Math.random()*1000);
}

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
    particlePositions = randomScatterPositions();
    targetPositions = randomScatterPositions();

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x66ccff,
        size: 3.2,
        vertexColors: false,
        transparent: true,
        opacity: 0.75,
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

    // Partikülleri hedefe doğru hareket ettir
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
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 70) {
                px += dx * 0.015;
                py += dy * 0.015;
            }
        }

        // Hedefe doğru hareket
        px += (tx - px) * 0.07;
        py += (ty - py) * 0.07;
        pz += (tz - pz) * 0.07;

        particlePositions[i * 3] = px;
        particlePositions[i * 3 + 1] = py;
        particlePositions[i * 3 + 2] = pz;
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
