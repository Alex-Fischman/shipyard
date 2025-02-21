const FOV = Math.PI / 2;
const NEAR = 0.1;
const FAR = 100;
const AMBIENT = 0.5;

const TICK_TIME = 1/120;
const MOVE_SPEED = 5;

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
for (let z = -60; z <= 60; z += 6) {
	for (let x = -60; x <= 60; x += 2) {
		boxes.push(Matrix.translation([x, 0, z]));
	}
}

const vertexColors = boxes.flatMap((_, i) => {
	let hash = 2166136261;
	for (let byte = 0xFF; byte != 0; byte <<= 8) {
		hash = hash * 16777619;
		hash = hash ^ (i & byte);
	}
	return PALETTE[Math.abs(hash) % PALETTE.length];
});

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

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, canvas.width, canvas.width, 0);

	WebGL.draw({
		vertex: `
			gl_Position = vec4(vertex, 0, 1);
			fragmentUV = vertexUV + (pixel / 2.);
		`,
		fragment: `
			vec2 o = vec2(0);
			vec2 x = vec2(pixel.x, 0.);
			vec2 y = vec2(0., pixel.y);
			vec4 s0 = texture2D(sampler, fragmentUV + o + o);
			vec4 s1 = texture2D(sampler, fragmentUV + o + y);
			vec4 s2 = texture2D(sampler, fragmentUV + o - y);
			vec4 s3 = texture2D(sampler, fragmentUV + x + o);
			vec4 s4 = texture2D(sampler, fragmentUV + x + y);
			vec4 s5 = texture2D(sampler, fragmentUV + x - y);
			vec4 s6 = texture2D(sampler, fragmentUV - x + o);
			vec4 s7 = texture2D(sampler, fragmentUV - x + y);
			vec4 s8 = texture2D(sampler, fragmentUV - x - y);
			gl_FragColor = (s0 + s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8) / 9.;
		`,
		attributes: {
			vertex:   { type: "vec2", data: [1, 1, -1, 1, -1, -1, 1, -1] },
			vertexUV: { type: "vec2", data: [1, 1,  0, 1,  0,  0, 1,  0] },
		},
		uniforms: {
			pixel: { type: "vec2", data: [1 / canvas.width, 1 / canvas.height] },
			sampler: { type: "sampler2D", data: texture },
		},
		varyings: {
			fragmentUV: { type: "vec2" },
		},
		instances: 1,
		indices: [0, 1, 2, 0, 2, 3],
	});
};

window.addEventListener("resize", () => {
	WebGL.resize();
	render();
});
window.dispatchEvent(new Event("resize"));
