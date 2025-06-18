// Yüksek çözünürlüklü partikül animasyonu - Ferrari ve diğer rastgele şekiller

const container = document.getElementById('bg-webgl');
let scene, camera, renderer, particles, particlePositions, targetPositions, particleCount = 5000;
let state = "scatter";
let scatterTimeout, gatherTimeout;
let mouse = { x: 0, y: 0, z: 0 };

const shapes = ["circle", "square", "triangle", "star", "ferrari"];

function randomScatterPositions() {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 700;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 420;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 700;
    }
    return positions;
}

// Ferrari gövdesinin yaklaşık siluet koordinatları (2D olarak)
const ferrariOutline = [
    {x:-120, y:-30}, {x:-110, y:-38}, {x:-80, y:-42}, {x:-65, y:-40}, {x:-30, y:-35},
    {x:0, y:-34}, {x:35, y:-38}, {x:65, y:-43}, {x:100, y:-36}, {x:120, y:-24},
    {x:110, y:-10}, {x:100, y:0}, {x:80, y:18}, {x:60, y:25}, {x:25, y:30},
    {x:0, y:32}, {x:-25, y:30}, {x:-60, y:25}, {x:-80, y:18}, {x:-100, y:0}, {x:-110, y:-10},
    {x:-128, y:-8}, {x:-135, y:10}, {x:-133, y:35}, {x:-100, y:55}, {x:-50, y:60},
    {x:0, y:60}, {x:50, y:60}, {x:100, y:55}, {x:133, y:35}, {x:135, y:10}, {x:128, y:-8},
    {x:120, y:24}, {x:80, y:38}, {x:40, y:44}, {x:0, y:47}, {x:-40, y:44}, {x:-80, y:38}, {x:-120, y:24}
];

function ferrariShapePositions() {
    const positions = new Float32Array(particleCount * 3);
    const outlineCount = ferrariOutline.length;
    // Tekerlekler için ek daireler
    function tire(cx, cy, r, segStart, segEnd, segCount, offset) {
        for (let j = 0; j < segCount; j++) {
            const t = segStart + (segEnd - segStart) * (j / segCount);
            positions[(offset + j) * 3] = cx + Math.cos(t) * r;
            positions[(offset + j) * 3 + 1] = cy + Math.sin(t) * r;
            positions[(offset + j) * 3 + 2] = 0;
        }
    }
    let i;
    for (i = 0; i < Math.floor(particleCount * 0.7); i++) {
        const t = (i / Math.floor(particleCount * 0.7)) * (outlineCount - 1);
        const idx = Math.floor(t);
        const frac = t - idx;
        const x = ferrariOutline[idx].x + frac * (ferrariOutline[(idx+1)%outlineCount].x - ferrariOutline[idx].x);
        const y = ferrariOutline[idx].y + frac * (ferrariOutline[(idx+1)%outlineCount].y - ferrariOutline[idx].y);
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = 0;
    }
    // Ön tekerlek (solda)
    tire(-80, 48, 16, Math.PI, Math.PI*3, Math.floor(particleCount*0.15), i);
    i += Math.floor(particleCount*0.15);
    // Arka tekerlek (sağda)
    tire(80, 48, 16, Math.PI, Math.PI*3, Math.floor(particleCount*0.15), i);
    // Artan partiküller random gövdeye
    for(let j = i + Math.floor(particleCount*0.15); j < particleCount; j++) {
        positions[j*3] = (Math.random()-0.5)*260;
        positions[j*3+1] = (Math.random()-0.5)*60+30;
        positions[j*3+2] = 0;
    }
    return positions;
}

function shapePositions(type) {
    if (type === "ferrari") return ferrariShapePositions();
    const positions = new Float32Array(particleCount * 3);
    if (type === "circle") {
        const radius = 180;
        for (let i = 0; i < particleCount; i++) {
            const theta = (i / particleCount) * 2 * Math.PI;
            positions[i * 3] = Math.cos(theta) * radius;
            positions[i * 3 + 1] = Math.sin(theta) * radius;
            positions[i * 3 + 2] = 0;
        }
    } else if (type === "square") {
        const side = 320, perSide = Math.floor(particleCount / 4);
        for (let i = 0; i < particleCount; i++) {
            let idx = i % perSide, edge = Math.floor(i / perSide);
            if (edge === 0) {
                positions[i * 3] = -side/2 + (idx / perSide) * side;
                positions[i * 3 + 1] = -side/2;
            } else if (edge === 1) {
                positions[i * 3] = side/2;
                positions[i * 3 + 1] = -side/2 + (idx / perSide) * side;
            } else if (edge === 2) {
                positions[i * 3] = side/2 - (idx / perSide) * side;
                positions[i * 3 + 1] = side/2;
            } else {
                positions[i * 3] = -side/2;
                positions[i * 3 + 1] = side/2 - (idx / perSide) * side;
            }
            positions[i * 3 + 2] = 0;
        }
    } else if (type === "triangle") {
        const size = 340;
        const a = {x: 0, y: -size/2};
        const b = {x: -size/2, y: size/2};
        const c = {x: size/2, y: size/2};
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            let x, y;
            if (t < 1/3) {
                let f = t * 3;
                x = a.x + (b.x - a.x) * f;
                y = a.y + (b.y - a.y) * f;
            } else if (t < 2/3) {
                let f = (t - 1/3) * 3;
                x = b.x + (c.x - b.x) * f;
                y = b.y + (c.y - b.y) * f;
            } else {
                let f = (t - 2/3) * 3;
                x = c.x + (a.x - c.x) * f;
                y = c.y + (a.y - c.y) * f;
            }
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = 0;
        }
    } else if (type === "star") {
        const R = 170, r = 70;
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
        color: 0xff2d2d,
        size: 1.2,
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
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 70) {
                px += dx * 0.009;
                py += dy * 0.009;
            }
        }

        // Hedefe doğru hareket
        px += (tx - px) * 0.13;
        py += (ty - py) * 0.13;
        pz += (tz - pz) * 0.13;

        particlePositions[i * 3] = px;
        particlePositions[i * 3 + 1] = py;
        particlePositions[i * 3 + 2] = pz;
    }
    particles.geometry.attributes.position.needsUpdate = true;

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
