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

const update = dt => {
	Input.update();

	const speed = 1;
	if (Input.held["KeyD"]) camera.pos[0] += dt * speed;
	if (Input.held["KeyA"]) camera.pos[0] -= dt * speed;
	if (Input.held["KeyW"]) camera.pos[1] += dt * speed;
	if (Input.held["KeyS"]) camera.pos[1] -= dt * speed;
};

const render = () => {
	const { width, height } = WebGL.clear();

	const view = Matrix.compose([
		Matrix.translation(Vector.scale(-1, camera.pos)),
		Matrix.rotation_y(-camera.yaw),
		Matrix.rotation_x(-camera.pitch),
	]);

	const projection = Matrix.perspective(width / height);

	const { vertices, normals, indices } = Mesh.box;

	const vertexColors = [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1];

	const lightDirection = Vector.normalize([0.25, 0.5, 1]);

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
