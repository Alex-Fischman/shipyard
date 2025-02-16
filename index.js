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
	pos: [0, 1.5, 10],
	pitch: -0.1,
	yaw: 0,
};

const boxes = [
	Matrix.translation([ 0,  0, 0]),
	Matrix.translation([ 2,  0, 0]),
	Matrix.translation([-2,  0, 0]),
	Matrix.translation([ 0,  2, 0]),
	Matrix.translation([ 0, -2, 0]),
];

const update = (dt) => {
	camera.yaw = 0.001 * (time - load);
};

const boxMesh = () => {
	const vertices = [];
	const normals = [];
	const indices = [];

	const face = (corners, normal) => {
		const start = vertices.length / 3;
		vertices.push(...corners.flat());
		normals.push(...Array(corners.length).fill(normal).flat());
		for (let i = 1; i + 1 < corners.length; i++) {
			indices.push(start, start + i, start + i + 1);
		}
	};

	let cube = [
		[-1, -1, -1], [-1, -1,  1], [-1,  1, -1], [-1,  1,  1],
		[ 1, -1, -1], [ 1, -1,  1], [ 1,  1, -1], [ 1,  1,  1],
	];

	face([cube[1], cube[5], cube[7], cube[3]], [ 0,  0,  1]);
	face([cube[0], cube[2], cube[6], cube[4]], [ 0,  0, -1]);
	face([cube[2], cube[3], cube[7], cube[6]], [ 0,  1,  0]);
	face([cube[0], cube[4], cube[5], cube[1]], [ 0, -1,  0]);
	face([cube[4], cube[6], cube[7], cube[5]], [ 1,  0,  0]);
	face([cube[0], cube[1], cube[3], cube[2]], [-1,  0,  0]);

	return { vertices, normals, indices };
};

const render = () => {
	const { width, height } = WebGL.clear();

	const view = Matrix.compose([
		// // fps camera
		// Matrix.translation(Vector.scale(-1, camera.pos)),
		// Matrix.rotation_y(-camera.yaw),
		// Matrix.rotation_x(-camera.pitch),

		// spin around model
		Matrix.rotation_y(-camera.yaw),
		Matrix.translation(Vector.scale(-1, camera.pos)),
		Matrix.rotation_x(-camera.pitch),
	]);

	const projection = Matrix.perspective(width / height);

	const { vertices, normals, indices } = boxMesh();

	const vertexColors = [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1];

	const lightDirection = Vector.normalize([1, 0.5, 0.25]);

	WebGL.draw({
		vertex: `
			gl_Position = projection * view * model * vec4(vertex, 1);
			fragmentColor = vertexColor;
			fragmentNormal = mat3(model) * vertexNormal;
		`,
		fragment: `
			float light = dot(normalize(fragmentNormal), lightDirection);
			gl_FragColor.rgb = fragmentColor * light;
			gl_FragColor.a = 1.0;
		`,
		attributes: {
			vertex:       { type: "vec3", data: vertices },
			vertexColor:  { type: "vec3", data: vertexColors, divisor: 1 },
			vertexNormal: { type: "vec3", data: normals },
			model:        { type: "mat4", data: boxes.flat(), divisor: 1 },
		},
		uniforms: {
			view:           { type: "mat4", data: view },
			projection:     { type: "mat4", data: projection },
			lightDirection: { type: "vec3", data: lightDirection },
		},
		varyings: {
			fragmentColor:  { type: "vec3" },
			fragmentNormal: { type: "vec3" },
		},
		instances: boxes.length,
		indices,
	});
};
