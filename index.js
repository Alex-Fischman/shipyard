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
	attribute vec4 vertexColor;
	uniform mat4 transform;
	varying lowp vec4 fragmentColor;
	void main() {
		gl_Position = transform * vertex;
		fragmentColor = vertexColor;
	}
`);
context.compileShader(vertexShader);
if (!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
	throw "Shader compile error:\n" + context.getShaderInfoLog(vertexShader);
}

const fragmentShader = context.createShader(context.FRAGMENT_SHADER);
context.shaderSource(fragmentShader, `
	varying lowp vec4 fragmentColor;
	void main() {
		gl_FragColor = fragmentColor;
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
	vertexColor: context.getAttribLocation(shaderProgram, "vertexColor"),
	transform: context.getUniformLocation(shaderProgram, "transform"),
};

const vertices = [
	-1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
	-1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
	-1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
	-1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
	 1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
	-1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
];
const vertexBuffer = context.createBuffer();
context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertices), context.STATIC_DRAW);
context.vertexAttribPointer(programLocations.vertex, 3, context.FLOAT, false, 0, 0);
context.enableVertexAttribArray(programLocations.vertex);

const indices = [
	 0,  1,  2,  0,  2,  3,
	 4,  5,  6,  4,  6,  7,
	 8,  9, 10,  8, 10, 11,
	12, 13, 14, 12, 14, 15,
	16, 17, 18, 16, 18, 19,
	20, 21, 22, 20, 22, 23,
];
const indexBuffer = context.createBuffer();
context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), context.STATIC_DRAW);

const vertexColors = vertices.map(x => Math.max(0, x));
const vertexColorBuffer = context.createBuffer();
context.bindBuffer(context.ARRAY_BUFFER, vertexColorBuffer);
context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexColors), context.STATIC_DRAW);
context.vertexAttribPointer(programLocations.vertexColor, 3, context.FLOAT, false, 0, 0);
context.enableVertexAttribArray(programLocations.vertexColor);

const load = performance.now();
let time = performance.now();
const frame = now => {
	const dt = now - time;
	time = now;
	update(dt / 1000);
	render();
	window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);

const camera = {
	pos: [0, 0, 5],
	pitch: 0,
	yaw: 0,
};

const update = (dt) => {
	camera.pos[0] = 2 * Math.sin(0.001 * (time - load));
	camera.pos[1] = 2 * Math.sin(0.001 * (time - load) + Math.PI / 2);
};

const render = () => {
	const {width: w, height: h} = canvas.getBoundingClientRect();
	canvas.width = w;
	canvas.height = h;
	context.viewport(0, 0, w, h);

	context.uniformMatrix4fv(programLocations.transform, false, Matrix.compose([
		Matrix.translation(Vector.neg(camera.pos)),
		Matrix.rotation_y(-camera.yaw),
		Matrix.rotation_x(-camera.pitch),
		Matrix.perspective(w / h),
	]));

	context.clearColor(0, 0, 0, 1);
	context.enable(context.DEPTH_TEST);
	context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

	context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
	context.drawElements(context.TRIANGLES, indices.length, context.UNSIGNED_SHORT, 0);
};
