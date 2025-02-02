const FOV = Math.PI / 2;
const NEAR = 0.001;
const FAR = 1000;

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
	const { width, height } = WebGL.clear();

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

	const projection = Matrix.perspective(width / height);

	const vertices = [
		-1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
		-1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
		-1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
		-1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
		 1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
		-1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1,
	];

	const vertexColors = [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1];

	WebGL.draw({
		vertex: `
			gl_Position = projection * view * model * vec4(vertex, 1);
			fragmentColor = vec4(vertexColor, 1);
		`,
		fragment: `
			gl_FragColor = fragmentColor;
		`,
		attributes: {
			vertex:      { type: "vec3", data: vertices },
			vertexColor: { type: "vec3", data: vertexColors, divisor: 1 },
			model:       { type: "mat4", data: models.flat(), divisor: 1 },
		},
		uniforms: {
			view:       { type: "mat4", data: view },
			projection: { type: "mat4", data: projection },
		},
		varyings: {
			fragmentColor: { type: "lowp vec4" },
		},
		instances: models.length,
		indices: [
			 0,  1,  2,  0,  2,  3,
			 4,  5,  6,  4,  6,  7,
			 8,  9, 10,  8, 10, 11,
			12, 13, 14, 12, 14, 15,
			16, 17, 18, 16, 18, 19,
			20, 21, 22, 20, 22, 23,
		],
	});
};
