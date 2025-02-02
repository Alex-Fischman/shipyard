const FOV = Math.PI / 2;
const NEAR = 0.001;
const FAR = 1000;

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");
if (gl == null) {
	throw "WebGL2 is unsupported";
}

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
	attribute vec4 vertex;
	attribute vec4 vertexColor;
	attribute mat4 model;

	uniform mat4 view;
	uniform mat4 projection;

	varying lowp vec4 fragmentColor;

	void main() {
		gl_Position = projection * view * model * vertex;
		fragmentColor = vertexColor;
	}
`);
gl.compileShader(vertexShader);
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	throw "Shader compile error:\n" + gl.getShaderInfoLog(vertexShader);
}

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
	varying lowp vec4 fragmentColor;
	void main() {
		gl_FragColor = fragmentColor;
	}
`);
gl.compileShader(fragmentShader);
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	throw "Shader compile error:\n" + gl.getShaderInfoLog(fragmentShader);
}

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	throw "Shader link error:\n" + gl.getProgramInfoLog(shaderProgram);
}

gl.useProgram(shaderProgram);
const attributes = {
	vertex: gl.getAttribLocation(shaderProgram, "vertex"),
	vertexColor: gl.getAttribLocation(shaderProgram, "vertexColor"),
	model: gl.getAttribLocation(shaderProgram, "model"),
};
const uniforms = {
	view: gl.getUniformLocation(shaderProgram, "view"),
	projection: gl.getUniformLocation(shaderProgram, "projection"),
};

const vertices = [
	-1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
	-1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
	-1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
	-1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
	 1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
	-1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
];
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.vertexAttribPointer(attributes.vertex, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(attributes.vertex);

const indices = [
	 0,  1,  2,  0,  2,  3,
	 4,  5,  6,  4,  6,  7,
	 8,  9, 10,  8, 10, 11,
	12, 13, 14, 12, 14, 15,
	16, 17, 18, 16, 18, 19,
	20, 21, 22, 20, 22, 23,
];
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

const vertexColors = [
	1, 0, 0,
	0, 1, 0,
	0, 0, 1,
	1, 1, 0,
	0, 1, 1,
];
const vertexColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
gl.vertexAttribPointer(attributes.vertexColor, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(attributes.vertexColor);
gl.vertexAttribDivisor(attributes.vertexColor, 1);

const models = [
	Matrix.translation([ 0,  0, 0]),
	Matrix.translation([ 2,  0, 0]),
	Matrix.translation([-2,  0, 0]),
	Matrix.translation([ 0,  2, 0]),
	Matrix.translation([ 0, -2, 0]),
].flat();
const modelBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(models), gl.STATIC_DRAW);
for (let i = 0; i < 4; i++) {
	const location = attributes.model + i;
	gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 64, 16 * i);
	gl.enableVertexAttribArray(location);
	gl.vertexAttribDivisor(location, 1);
}

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
	gl.viewport(0, 0, w, h);

	gl.uniformMatrix4fv(uniforms.view, false, Matrix.compose([
		Matrix.translation(Vector.neg(camera.pos)),
		Matrix.rotation_y(-camera.yaw),
		Matrix.rotation_x(-camera.pitch),
	]));

	gl.uniformMatrix4fv(uniforms.projection, false, Matrix.perspective(w / h));

	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, models.length);
};
