// Basit bir WebGL dönen üçgen animasyonu

const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

// Vertex shader programı
const vsSource = `
attribute vec2 aVertexPosition;
uniform float uAngle;
void main(void) {
    float cosA = cos(uAngle);
    float sinA = sin(uAngle);
    gl_Position = vec4(
        cosA * aVertexPosition.x - sinA * aVertexPosition.y,
        sinA * aVertexPosition.x + cosA * aVertexPosition.y,
        0.0, 1.0
    );
}
`;

// Fragment shader programı
const fsSource = `
precision mediump float;
uniform float uTime;
void main(void) {
    gl_FragColor = vec4(abs(sin(uTime)), abs(sin(uTime + 2.0)), abs(sin(uTime + 4.0)), 1);
}
`;

// Shader programlarını derle
function loadShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

// Üçgen köşe verileri
const vertices = new Float32Array([
     0.0,  0.8,
    -0.7, -0.6,
     0.7, -0.6
]);
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Attributeleri ayarla
const posAttrib = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
gl.enableVertexAttribArray(posAttrib);
gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

// Uniformları ayarla
const angleUniform = gl.getUniformLocation(shaderProgram, 'uAngle');
const timeUniform = gl.getUniformLocation(shaderProgram, 'uTime');

function render(time) {
    time *= 0.001; // ms -> saniye
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.07, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(angleUniform, time);
    gl.uniform1f(timeUniform, time);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
