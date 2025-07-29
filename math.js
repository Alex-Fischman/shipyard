const Vector = {
	add: (x, y) => x.map((_, i) => x[i] + y[i]),
	sub: (x, y) => x.map((_, i) => x[i] - y[i]),
	mul: (x, y) => x.map((_, i) => x[i] * y[i]),
	max: (x, y) => x.map((_, i) => Math.max(x[i], y[i])),
	dot: (x, y) => Vector.mul(x, y).reduce((a, b) => a + b),
	scale: (s, x) => x.map(x => x * s),
	magnitude: x => Math.sqrt(Vector.dot(x, x)),
	normalize: x => Vector.setLength(x, 1),

	projectOntoPlane: (x, n) => Vector.sub(x, Vector.scale(Vector.dot(x, n), n)),
	setLength: (x, l) => {
		const m = Vector.magnitude(x);
		if (m === 0) return [0, 0, 0];
		return Vector.scale(l / m, x);
	},
};

const Matrix = {
	add: (x, y) => x.map((_, i) => x[i] + y[i]),
	sub: (x, y) => x.map((_, i) => x[i] - y[i]),

	mul: (x, y) => {
		const out = [];
		for (let i = 0; i < 16; i += 4) for (let j = 0; j < 4; j++) {
			out[i + j] = (y[i + 0] * x[j +  0])
			           + (y[i + 1] * x[j +  4])
			           + (y[i + 2] * x[j +  8])
			           + (y[i + 3] * x[j + 12]);
		}
		return out;
	},

	identity: () => [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	],
	translation: ([x, y, z]) => [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		x, y, z, 1,
	],
	rotation_x: theta => [
		1, 0, 0, 0,
		0, Math.cos(theta), Math.sin(theta), 0,
		0, -Math.sin(theta), Math.cos(theta), 0,
		0, 0, 0, 1,
	],
	rotation_y: theta => [
		Math.cos(theta), 0, -Math.sin(theta), 0,
		0, 1, 0, 0,
		Math.sin(theta), 0, Math.cos(theta), 0,
		0, 0, 0, 1,
	],
	rotation_z: theta => [
		Math.cos(theta), Math.sin(theta), 0, 0,
		-Math.sin(theta), Math.cos(theta), 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	],
	scale: ([x, y, z]) => [
		x, 0, 0, 0,
		0, y, 0, 0,
		0, 0, z, 0,
		0, 0, 0, 1,
	],
	perspective: aspect => [
		1 / Math.tan(FOV / 2) / aspect, 0, 0, 0,
		0, 1 / Math.tan(FOV / 2), 0, 0,
		0, 0, (NEAR + FAR) / (NEAR - FAR), -1,
		0, 0, NEAR * FAR * 2 / (NEAR - FAR), 0,
	],

	invert: a => {
		const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
		const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
		const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
		const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
		const b00 = a00 * a11 - a01 * a10;
		const b01 = a00 * a12 - a02 * a10;
		const b02 = a00 * a13 - a03 * a10;
		const b03 = a01 * a12 - a02 * a11;
		const b04 = a01 * a13 - a03 * a11;
		const b05 = a02 * a13 - a03 * a12;
		const b06 = a20 * a31 - a21 * a30;
		const b07 = a20 * a32 - a22 * a30;
		const b08 = a20 * a33 - a23 * a30;
		const b09 = a21 * a32 - a22 * a31;
		const b10 = a21 * a33 - a23 * a31;
		const b11 = a22 * a33 - a23 * a32;

		let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
		if (det === 0) return null;

		det = 1 / det;
		return [
			(a11 * b11 - a12 * b10 + a13 * b09) * det,
			(a02 * b10 - a01 * b11 - a03 * b09) * det,
			(a31 * b05 - a32 * b04 + a33 * b03) * det,
			(a22 * b04 - a21 * b05 - a23 * b03) * det,
			(a12 * b08 - a10 * b11 - a13 * b07) * det,
			(a00 * b11 - a02 * b08 + a03 * b07) * det,
			(a32 * b02 - a30 * b05 - a33 * b01) * det,
			(a20 * b05 - a22 * b02 + a23 * b01) * det,
			(a10 * b10 - a11 * b08 + a13 * b06) * det,
			(a01 * b08 - a00 * b10 - a03 * b06) * det,
			(a30 * b04 - a31 * b02 + a33 * b00) * det,
			(a21 * b02 - a20 * b04 - a23 * b00) * det,
			(a11 * b07 - a10 * b09 - a12 * b06) * det,
			(a00 * b09 - a01 * b07 + a02 * b06) * det,
			(a31 * b01 - a30 * b03 - a32 * b00) * det,
			(a20 * b03 - a21 * b01 + a22 * b00) * det,
		];
	},
	
	apply: (m, [x, y, z]) => {
		const w = (m[3] * x + m[7] * y + m[11] * z + m[15]) || 1;
		return [
			(m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
			(m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
			(m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
		];
	},
};
