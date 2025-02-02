const FOV = Math.PI / 2;
const NEAR = 0.001;
const FAR = 1000;

const drawContainers = (models, view, projection) => {
	const vertexShader = `
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
	`;
	const fragmentShader = `
		varying lowp vec4 fragmentColor;
		void main() {
			gl_FragColor = fragmentColor;
		}
	`;
	const {attributes, uniforms} = WebGL.program(
		vertexShader,
		fragmentShader,
		["vertex", "vertexColor", "model"],
		["view", "projection"]
	);

	WebGL.attribute_vec3({
		location: attributes.vertex,
		data: [
			-1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
			-1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
			-1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
			-1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
			 1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
			-1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
		],
	});

	WebGL.attribute_vec3({
		location: attributes.vertexColor,
		divisor: 1,
		data: [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
			1, 1, 0,
			0, 1, 1,
		],
	});

	WebGL.attribute_mat4({
		location: attributes.model,
		divisor: 1,
		data: models.flat(),
	});

	gl.uniformMatrix4fv(uniforms.view, false, view);
	gl.uniformMatrix4fv(uniforms.projection, false, projection);

	const indices = [
		 0,  1,  2,  0,  2,  3,
		 4,  5,  6,  4,  6,  7,
		 8,  9, 10,  8, 10, 11,
		12, 13, 14, 12, 14, 15,
		16, 17, 18, 16, 18, 19,
		20, 21, 22, 20, 22, 23,
	];
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, models.length);
};

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
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const models = [
		Matrix.translation([ 0,  0, 0]),
		Matrix.translation([ 2,  0, 0]),
		Matrix.translation([-2,  0, 0]),
		Matrix.translation([ 0,  2, 0]),
		Matrix.translation([ 0, -2, 0]),
	];

	const view = Matrix.compose([
		Matrix.translation(Vector.neg(camera.pos)),
		Matrix.rotation_y(-camera.yaw),
		Matrix.rotation_x(-camera.pitch),
	]);

	const projection = Matrix.perspective(w / h);

	drawContainers(models, view, projection);
};
