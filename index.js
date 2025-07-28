const FOV = Math.PI / 2;
const NEAR = 0.1;
const FAR = 100;
const AMBIENT = 0.5;

const PLAYER_RADIUS = 0.5;
const JUMP_HEIGHT = 2;
const JUMP_TIME = 1;
const JUMP_DIST = 5;
const SPEED = JUMP_DIST / JUMP_TIME;
const GRAVITY = 8 * JUMP_HEIGHT / JUMP_TIME / JUMP_TIME;
const JUMP_IMPULSE = 4 * JUMP_HEIGHT / JUMP_TIME;

const JUMP_PORTION_VERTICAL = 0.5; // for wall jumps
const JUMP_AMOUNT_VERTICAL = JUMP_IMPULSE * JUMP_PORTION_VERTICAL;
const JUMP_AMOUNT_NON_VERTICAL = JUMP_IMPULSE * (1 - JUMP_PORTION_VERTICAL);

const WALK_ACCEL_TIME = 0.05;
const WALK_ACCEL = SPEED / WALK_ACCEL_TIME;
const WALK_DRAG = 1 / WALK_ACCEL_TIME;

const FLY_ACCEL_TIME = 1;
const FLY_ACCEL = SPEED / FLY_ACCEL_TIME;
const FLY_DRAG = 1 / FLY_ACCEL_TIME;

const TICK_TIME = 1 / 200;
const EPSILON = 0.001;

const PALETTE = [
	[1, 0, 0], [0, 1, 0], [0, 0, 1],
	[1, 1, 0], [0, 1, 1],
	[0.4, 0, 0], [0, 0, 0.4],
	[0.5, 0.5, 0.5], [0.95, 0.95, 0.95],
];

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

const blocker = document.getElementById("blocker");
blocker.addEventListener("click", blocker.requestPointerLock);
document.addEventListener("pointerlockchange", () => {
	if (document.pointerLockElement) {
		time = undefined;
		window.requestAnimationFrame(frame);
	}
});

const player = {
	pos: [0, 2, 0],
	vel: [0, 0, 0],
	jumped: true,
};

const camera = {
	pos: [0, 2, 0],
	pitch: 0,
	yaw: 3,

	view: function () {
		return [
			Matrix.rotation_x(-this.pitch),
			Matrix.rotation_y(-this.yaw),
			Matrix.translation(Vector.scale(-1, this.pos)),
		].reduce(Matrix.mul);
	},
};

document.addEventListener("mousemove", event => {
	if (!document.pointerLockElement) return;
	camera.yaw -= event.movementX * 0.002;
	camera.pitch -= event.movementY * 0.002;
	camera.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.pitch));
});

const boxes = [];
for (let z = -30; z <= 30; z += 6) {
	for (let x = -30; x <= 30; x += 2) {
		boxes.push(Matrix.translation([x, 0, z]));
	}
}
boxes.push(Matrix.translation([3, 2, 3]));

const vertexColors = boxes.flatMap((_, i) => {
	let hash = 2166136261;
	for (let byte = 0xFF; byte != 0; byte <<= 8) {
		hash = hash * 16777619;
		hash = hash ^ (i & byte);
	}
	return PALETTE[Math.abs(hash) % PALETTE.length];
});

const distanceToWorld = point => Math.min(...boxes.map(box => {
	const vector = Vector.sub(
		Matrix.apply(Matrix.invert(box), point).map(Math.abs),
		[1, 1, 2.5],
	);
	const a = Math.min(0, Math.max(vector[0], vector[1], vector[2]));
	const b = Vector.magnitude(Vector.max(vector, [0, 0, 0]));
	return a + b;
}));

const normalToWorld = point => Vector.normalize([
	distanceToWorld(Vector.add([ EPSILON, 0, 0], point)) -
	distanceToWorld(Vector.add([-EPSILON, 0, 0], point)),
	distanceToWorld(Vector.add([0,  EPSILON, 0], point)) -
	distanceToWorld(Vector.add([0, -EPSILON, 0], point)),
	distanceToWorld(Vector.add([0, 0,  EPSILON], point)) -
	distanceToWorld(Vector.add([0, 0, -EPSILON], point)),
]);

const update = dt => {
	Input.update();

	const distance = distanceToWorld(player.pos) - PLAYER_RADIUS;
	const normal = normalToWorld(player.pos);
	const movement = Vector.magnitude(player.vel) * dt;
	const unobstructed = Math.min(movement, distance);
	const   obstructed = Math.max(movement - distance, 0);

	let dir = Vector.setLength(player.vel, obstructed);
	const grounded = Vector.dot(dir, normal) <= 0 && Vector.magnitude(dir) > 0;
	if (grounded) {
		dir = Vector.projectOntoPlane(dir, normal);
		player.vel = Vector.projectOntoPlane(player.vel, normal);
	}

	player.pos = [
		player.pos,
		Vector.setLength(player.vel, unobstructed),
		dir
	].reduce(Vector.add);

	const vy = player.vel[1];
	const accel = grounded? WALK_ACCEL: FLY_ACCEL;
	const drag = grounded? WALK_DRAG: FLY_DRAG;
	const keys = [
		(Input.held["KeyD"] || 0) - (Input.held["KeyA"] || 0),
		0,
		(Input.held["KeyS"] || 0) - (Input.held["KeyW"] || 0),
	];
	player.vel = [
		player.vel,
		Vector.setLength(
			Matrix.apply(Matrix.rotation_y(camera.yaw), keys),
			accel * dt,
		),
		Vector.scale(-drag * dt, player.vel),
	].reduce(Vector.add);
	player.vel[1] = vy;

	player.vel[1] -= GRAVITY * dt;
	if (!player.jumped && Input.held["Space"] && grounded) {
		player.vel = [
			player.vel,
			[0, JUMP_AMOUNT_VERTICAL, 0],
			Vector.scale(JUMP_AMOUNT_NON_VERTICAL, normal),
		].reduce(Vector.add);
		player.jumped = true;
	}
	if (player.jumped && !Input.held["Space"]) player.jumped = false;

	camera.pos = Vector.add(player.pos, [0, PLAYER_RADIUS, 0]);
};

const render = () => {
	const projection = Matrix.perspective(canvas.width / canvas.height);

	const { vertices, normals, indices } = Mesh.box;
	const lightDirection = Vector.normalize([0.25, 0.5, 1]);

	WebGL.draw({
		vertex: `
			gl_Position = projection * view * model * vec4(vertex, 1);
			fragmentColor = vertexColor;
			fragmentNormal = mat3(model) * vertexNormal;
		`,
		fragment: `
			float light = max(0., dot(lightDirection, normalize(fragmentNormal)));
			gl_FragColor.rgb = fragmentColor * mix(light, 1., ambient);
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
			ambient:        { type: "float", data: AMBIENT },
		},
		varyings: {
			fragmentColor:  { type: "vec3" },
			fragmentNormal: { type: "vec3" },
		},
		instances: boxes.length,
		indices,
	});
};

window.addEventListener("resize", () => {
	WebGL.resize();
	render();
});
window.dispatchEvent(new Event("resize"));
