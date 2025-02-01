const FOV = Math.PI / 2;
const NEAR = 0.001;
const FAR = 1000;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("webgl2");
if (context == null) {
	throw "WebGL2 is unsupported";
}

const vertexShader = context.createShader(context.VERTEX_SHADER);
context.shaderSource(vertexShader, `
	attribute vec4 vertex;
	uniform mat4 transform;
	void main() {
		gl_Position = transform * vertex;
	}
`);
context.compileShader(vertexShader);
if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
	throw "Shader compile error:\n" + context.getShaderInfoLog(vertexShader);
}

const fragmentShader = context.createShader(context.FRAGMENT_SHADER);
context.shaderSource(fragmentShader, `
	void main() {
		gl_FragColor = vec4(1, 0, 1, 1);
	}
`);
context.compileShader(fragmentShader);
if (!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS)) {
	throw "Shader compile error:\n" + context.getShaderInfoLog(fragmentShader);
}

const shaderProgram = context.createProgram();
context.attachShader(shaderProgram, vertexShader);
context.attachShader(shaderProgram, fragmentShader);
context.linkProgram(shaderProgram);
if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
	throw "Shader link error:\n" + gl.getProgramInfoLog(shaderProgram);
}

context.useProgram(shaderProgram);
const programLocations = {
	vertex: context.getAttribLocation(shaderProgram, "vertex"),
	transform: context.getUniformLocation(shaderProgram, "transform"),
};

const vertices = [1, 1, 0, 1, 1, 0, 0, 0];
const vertexBuffer = context.createBuffer();
context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertices), context.STATIC_DRAW);

const load = performance.now();
let time = performance.now();
const frame = now => {
	const dt = now - time;
	time = now;
	update(dt);
	render();
	window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);

const camera = {
	pos: [1, 0, 5],
};

const update = (dt) => {
	camera.pos[0] = 2 * Math.sin(0.001 * (time - load));
};

const render = () => {
	const {width: w, height: h} = canvas.getBoundingClientRect();
	canvas.width = w;
	canvas.height = h;
	context.viewport(0, 0, w, h);

	context.uniformMatrix4fv(programLocations.transform, false, Matrix.mul(
		Matrix.perspective(w / h),
		Matrix.mul(
			Matrix.translation(Vector.neg(camera.pos)),
			Matrix.identity(),
		),
	));

	context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
	context.vertexAttribPointer(programLocations.vertex, 2, context.FLOAT, false, 0, 0);
	context.enableVertexAttribArray(programLocations.vertex);

	context.clearColor(0, 0, 0, 1);
	context.enable(context.DEPTH_TEST);
	context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
	context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
};
