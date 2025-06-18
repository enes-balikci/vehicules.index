// Yüksek çözünürlüklü 3D otomobil partikül animasyonu (Ferrari, Audi, Mercedes)

const container = document.getElementById('bg-webgl');
let scene, camera, renderer, particles, particlePositions, targetPositions, particleCount = 5000;
let state = "scatter";
let scatterTimeout, gatherTimeout;
let mouse = { x: 0, y: 0, z: 0 };

const shapes = ["ferrari", "audi", "mercedes"];

// Ferrari: sportif coupe (gövde ve spoiler ile)
function ferrariShapePositions() {
    const positions = new Float32Array(particleCount * 3);
    // 3D coupe silueti (basit)
    const base = [
        // Alt gövde (x, y, z)
        [-130, -30, -30], [-110, -33, -27], [-70, -35, -15], [-30, -36, 0], [0, -35, 5],
        [30, -36, 0], [70, -35, -15], [110, -33, -27], [130, -30, -30],
        // Arka (spoiler)
        [140, -25, -15], [145, 0, 10], [140, 25, -15],
        // Üst gövde ve tavan
        [110, 35, 35], [70, 38, 45], [30, 40, 52], [0, 41, 55],
        [-30, 40, 52], [-70, 38, 45], [-110, 35, 35],
        // Ön cam ve kaput
        [-140, 25, -15], [-145, 0, 10], [-140, -25, -15],
    ];
    // Tekerler ve gövde arasında partikülleri dağıt
    const outlineCount = base.length;
    let i = 0;
    for (; i < Math.floor(particleCount * 0.75); i++) {
        const t = (i / Math.floor(particleCount * 0.75)) * (outlineCount - 1);
        const idx = Math.floor(t);
        const frac = t - idx;
        const x = base[idx][0] + frac * (base[(idx+1)%outlineCount][0] - base[idx][0]);
        const y = base[idx][1] + frac * (base[(idx+1)%outlineCount][1] - base[idx][1]);
        const z = base[idx][2] + frac * (base[(idx+1)%outlineCount][2] - base[idx][2]);
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
    }
    // Ön ve arka tekerlek (küçük toruslar)
    function wheel(cx, cy, cz, r, segCount, offset) {
        for (let j = 0; j < segCount; j++) {
            const theta = (j / segCount) * 2 * Math.PI;
            positions[(offset + j) * 3] = cx + Math.cos(theta) * r;
            positions[(offset + j) * 3 + 1] = cy + Math.sin(theta) * r;
            positions[(offset + j) * 3 + 2] = cz - 15 + Math.sin(theta) * 7;
        }
    }
    wheel(-80, -36, -30, 17, Math.floor(particleCount*0.07), i); i += Math.floor(particleCount*0.07);
    wheel(80, -36, -30, 17, Math.floor(particleCount*0.07), i); i += Math.floor(particleCount*0.07);
    // Artan partiküller tavan ve cam bölgesine random
    for(let j = i; j < particleCount; j++) {
        positions[j*3] = (Math.random()-0.5)*100;
        positions[j*3+1] = 25 + Math.random()*18;
        positions[j*3+2] = 32 + Math.random()*18;
    }
    return positions;
}

// Audi: sedan/coupe karışımı, belirgin tavan ve alçak gövde
function audiShapePositions() {
    const positions = new Float32Array(particleCount * 3);
    const base = [
        // Alt gövde
        [-120, -35, -28], [-80, -38, -24], [-35, -39, -14], [0, -40, -8], [35, -39, -14], [80, -38, -24], [120, -35, -28],
        // Arka tampon
        [135, -28, -16], [140, 0, 5], [135, 28, -16],
        // Tavan ve camlar
        [110, 34, 25], [80, 38, 32], [35, 41, 38], [0, 42, 40], [-35, 41, 38], [-80, 38, 32], [-110, 34, 25],
        // Ön tampon
        [-135, 28, -16], [-140, 0, 5], [-135, -28, -16],
    ];
    const outlineCount = base.length;
    let i = 0;
    for (; i < Math.floor(particleCount * 0.75); i++) {
        const t = (i / Math.floor(particleCount * 0.75)) * (outlineCount - 1);
        const idx = Math.floor(t);
        const frac = t - idx;
        const x = base[idx][0] + frac * (base[(idx+1)%outlineCount][0] - base[idx][0]);
        const y = base[idx][1] + frac * (base[(idx+1)%outlineCount][1] - base[idx][1]);
        const z = base[idx][2] + frac * (base[(idx+1)%outlineCount][2] - base[idx][2]);
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
    }
    // Tekerlekler
    function wheel(cx, cy, cz, r, segCount, offset) {
        for (let j = 0; j < segCount; j++) {
            const theta = (j / segCount) * 2 * Math.PI;
            positions[(offset + j) * 3] = cx + Math.cos(theta) * r;
            positions[(offset + j) * 3 + 1] = cy + Math.sin(theta) * r;
            positions[(offset + j) * 3 + 2] = cz - 10 + Math.sin(theta) * 6;
        }
    }
    wheel(-75, -37, -28, 15, Math.floor(particleCount*0.07), i); i += Math.floor(particleCount*0.07);
    wheel(75, -37, -28, 15, Math.floor(particleCount*0.07), i); i += Math.floor(particleCount*0.07);
    // Artan partiküller iç tavan ve camlar
    for(let j = i; j < particleCount; j++) {
        positions[j*3] = (Math.random()-0.5)*80;
        positions[j*3+1] = 25 + Math.random()*12;
        positions[j*3+2] = 18 + Math.random()*18;
    }
    return positions;
}

// Mercedes: belirgin S coupe profili, daha yuvarlak tavan, büyük tekerlekler
function mercedesShapePositions() {
    const positions = new Float32Array(particleCount * 3);
    const base = [
        // Alt gövde
        [-125, -33, -27], [-90, -37, -20], [-40, -39, -8], [0, -40, -3], [40, -39, -8], [90, -37, -20], [125, -33, -27],
        // Arka
        [137, -28, -11], [142, 0, 7], [137, 28, -11],
        // Tavan ve camlar
        [115, 36, 32], [90, 39, 40], [50, 42, 46], [0, 43, 49], [-50, 42, 46], [-90, 39, 40], [-115, 36, 32],
        // Ön
        [-137, 28, -11], [-142, 0, 7], [-137, -28, -11],
    ];
    const outlineCount = base.length;
    let i = 0;
    for (; i < Math.floor(particleCount * 0.75); i++) {
        const t = (i / Math.floor(particleCount * 0.75)) * (outlineCount - 1);
        const idx = Math.floor(t);
        const frac = t - idx;
        const x = base[idx][0] + frac * (base[(idx+1)%outlineCount][0] - base[idx][0]);
        const y = base[idx][1] + frac * (base[(idx+1)%outlineCount][1] - base[idx][1]);
        const z = base[idx][2] + frac * (base[(idx+1)%outlineCount][2] - base[idx][2]);
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
    }
    // Tekerlekler
    function wheel(cx, cy, cz, r, segCount, offset) {
        for (let j = 0; j < segCount; j++) {
            const theta = (j / segCount) * 2 * Math.PI;
            positions[(offset + j) * 3] = cx + Math.cos(theta) * r;
            positions[(offset + j) * 3 + 1] = cy + Math.sin(theta) * r;
            positions[(offset + j) * 3 + 2] = cz - 13 + Math.sin(theta) * 8;
        }
    }
    wheel(-85, -38, -27, 18, Math.floor(particleCount*0.07), i); i += Math.floor(particleCount*0.07);
    wheel(85, -38, -27, 18, Math.floor(particleCount*0.07), i); i += Math.floor(particleCount*0.07);
    // Artan partiküller tavan ve camlar
    for(let j = i; j < particleCount; j++) {
        positions[j*3] = (Math.random()-0.5)*90;
        positions[j*3+1] = 27 + Math.random()*14;
        positions[j*3+2] = 22 + Math.random()*22;
    }
    return positions;
}

function shapePositions(type) {
    if (type === "ferrari") return ferrariShapePositions();
    if (type === "audi") return audiShapePositions();
    if (type === "mercedes") return mercedesShapePositions();
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
    camera.position.z = 450;

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
        color: 0xffc300,
        size: 1.2,
        vertexColors: false,
        transparent: true,
        opacity: 0.85,
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

    // Döndürme efekti
    scene.rotation.y += 0.0013;
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
