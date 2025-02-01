const Vector = {
	add: (x, y) => x.map((_, i) => x[i] + y[i]),
	sub: (x, y) => x.map((_, i) => x[i] - y[i]),
	mul: (x, y) => x.map((_, i) => x[i] * y[i]),
	neg: x => x.map(x => -x),
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
	perspective: aspect => [
		1 / Math.tan(FOV / 2) / aspect, 0, 0, 0,
		0, 1 / Math.tan(FOV / 2), 0, 0,
		0, 0, (NEAR + FAR) / (NEAR - FAR), -1,
		0, 0, NEAR * FAR * 2 / (NEAR - FAR), 0,
	],
};
