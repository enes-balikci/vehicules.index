// WebGPU ile kompleks arka plan animasyonu (plazma efektli)

const container = document.getElementById('bg-webgl');

// WebGPU destekleniyor mu kontrol
if (!navigator.gpu) {
    container.innerHTML = "<div style='color:white;font-size:2em;text-align:center;position:absolute;width:100vw;top:40vh;'>WebGPU desteklenmiyor.<br>Chrome Canary veya Edge ile açın.</div>";
    throw new Error("WebGPU not supported");
}

async function main() {
    // Canvas oluştur
    const canvas = document.createElement("canvas");
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "0";
    container.appendChild(canvas);

    // WebGPU ayarları
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: "premultiplied"
    });

    // Shadertoy tarzı plazma animasyonu (WGSL)
    const shaderCode = `
        @group(0) @binding(0) var<uniform> uTime : f32;
        @group(0) @binding(1) var<uniform> uRes : vec2<f32>;

        @vertex
        fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
            var pos = array<vec2<f32>, 6>(
                vec2<f32>(-1.0, -1.0),
                vec2<f32>(1.0, -1.0),
                vec2<f32>(-1.0, 1.0),
                vec2<f32>(-1.0, 1.0),
                vec2<f32>(1.0, -1.0),
                vec2<f32>(1.0, 1.0)
            );
            return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
        }

        @fragment
        fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
            let uv = fragCoord.xy / uRes;
            let color = 0.5 + 0.5 * cos(uTime + uv.xyx + vec3<f32>(0,2,4));
            // Plazma
            let plasma = sin(uv.x*10.0+uTime)+sin(uv.y*10.0+uTime)+
                         sin((uv.x+uv.y)*10.0+uTime)+sin(length(uv-0.5)*20.0-uTime);
            let c = vec3<f32>(0.5+0.5*cos(uTime+plasma+vec3<f32>(0,2,4)));
            return vec4<f32>(c, 1.0);
        }
    `;

    // Uniform buffer (time, resolution)
    const uniformBuffer = device.createBuffer({
        size: 4 + 8,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Pipeline
    const shaderModule = device.createShaderModule({code: shaderCode});
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: shaderModule, entryPoint: "vs_main" },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [{ format }]
        },
        primitive: { topology: "triangle-list" }
    });

    // Bind group
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer, offset: 0, size: 4 } },       // time
            { binding: 1, resource: { buffer: uniformBuffer, offset: 4, size: 8 } },       // resolution
        ],
    });

    function draw(time) {
        // time: ms -> saniye
        const sec = time * 0.001;
        // Uniformları güncelle
        const resolution = new Float32Array([canvas.width, canvas.height]);
        device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([sec]));
        device.queue.writeBuffer(uniformBuffer, 4, resolution);

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                clearValue: {r:0,g:0,b:0,a:1},
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, 1, 0, 0);
        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(draw);
    }

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    requestAnimationFrame(draw);
}

main();
