const FOV = Math.PI / 2;
const NEAR = 0.001;
const FAR = 1000;

const TICK_TIME = 1/120;
const MOVE_SPEED = 5;

let time;
const frame = now => {
	let extra = ((now - time) / 1000) || TICK_TIME;
	while (extra >= TICK_TIME) {
		update(TICK_TIME);
		extra -= TICK_TIME;
	}
	time = now - extra;

	render();

	if (document.pointerLockElement) window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);

const blocker = document.getElementById("blocker");
blocker.addEventListener("click", blocker.requestPointerLock);
document.addEventListener("pointerlockchange", () => {
	if (document.pointerLockElement) {
		blocker.style.visibility = "hidden";
		time = undefined;
		requestAnimationFrame(frame);
	} else {
		blocker.style.visibility = "visible";
	}
});

const camera = {
	pos: [0, 1.5, 10],
	pitch: -0.1,
	yaw: 0,

	view: function () {
		return [
			Matrix.rotation_x(-this.pitch),
			Matrix.rotation_y(-this.yaw),
			Matrix.translation(Vector.scale(-1, this.pos)),
		].reduce(Matrix.mul);
	},
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

	let move = [0, 0, 0];
	if (Input.held["KeyW"]) move[2] -= 1;
	if (Input.held["KeyA"]) move[0] -= 1;
	if (Input.held["KeyS"]) move[2] += 1;
	if (Input.held["KeyD"]) move[0] += 1;
	if (Input.held["Space"]) move[1] += 1;
	if (Input.held["ShiftLeft"]) move[1] -= 1;
	if (move[0] || move[1] || move[2]) move = Vector.normalize(move);

	const vm = camera.view();
	camera.pos = [
		camera.pos,
		Vector.scale(MOVE_SPEED * move[0] * dt, [vm[0], vm[4], vm[8]]),
		Vector.scale(MOVE_SPEED * move[1] * dt, [vm[1], vm[5], vm[9]]),
		Vector.scale(MOVE_SPEED * move[2] * dt, [vm[2], vm[6], vm[10]]),
	].reduce(Vector.add);
};

document.addEventListener("mousemove", event => {
	if (!document.pointerLockElement) return;
	camera.yaw -= event.movementX * 0.002;
	camera.pitch -= event.movementY * 0.002;
	camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.pitch));
});

const render = () => {
	const { width, height } = WebGL.clear();
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
			view:           { type: "mat4", data: camera.view() },
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
window.addEventListener("resize", render);
