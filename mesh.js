const Mesh = {
	empty: () => ({ vertices: [], normals: [], indices: [] }),

	face: (mesh, corners, normal) => {
		const start = mesh.vertices.length / 3;
		mesh.vertices.push(...corners.flat());
		mesh.normals.push(...Array(corners.length).fill(normal).flat());
		for (let i = 1; i + 1 < corners.length; i++) {
			mesh.indices.push(start, start + i, start + i + 1);
		}
	},
};

{
	const edge = 0.05;
	const s = 1, l = 3;

	Mesh.box = Mesh.empty();
	const corrugate = (o, x, y, z, w, h) => {
		const a = o;
		const b = Vector.add(a, Vector.scale(w, x));
		const c = Vector.add(b, Vector.scale(h, y));
		const d = Vector.add(a, Vector.scale(h, y));
		const a_ = Vector.add(a, Vector.scale(edge, y));
		const b_ = Vector.add(b, Vector.scale(edge, y));
		const c_ = Vector.sub(c, Vector.scale(edge, y));
		const d_ = Vector.sub(d, Vector.scale(edge, y));
		const a__ = Vector.add(a, Vector.scale(edge, x));
		const d__ = Vector.add(d, Vector.scale(edge, x));
		Mesh.face(Mesh.box, [a, b, b_, a_], z);
		Mesh.face(Mesh.box, [d_, c_, c, d], z);
		Mesh.face(Mesh.box, [a, a__, d__, d], z);

		const w_ = w - edge * 2, h_ = h - edge * 2;
		const o_ = Vector.add(a_, Vector.scale(edge, x));
		const ts = Math.floor((w_ / edge + 1) / 4), fs = ts * 4 - 1;
		const out = Vector.scale(edge, z);
		const face = Vector.scale(w_ / fs, x);
		const n01 = Vector.normalize(Vector.add(out, face));
		const n23 = Vector.normalize(Vector.sub(out, face));

		for (let i = 0; i < fs; i += 4) {
			const p = [0, 1, 2, 3, 4]
				.map(f => Vector.add(o_, Vector.scale(i + f, face)));

			p[1] = Vector.sub(p[1], out);
			p[2] = Vector.sub(p[2], out);

			const q = p.map(p => Vector.add(p, Vector.scale(h_, y)));

			Mesh.face(Mesh.box, [p[0], p[1], q[1], q[0]], n01);
			Mesh.face(Mesh.box, [p[1], p[2], q[2], q[1]], z);
			Mesh.face(Mesh.box, [p[2], p[3], q[3], q[2]], n23);
			Mesh.face(Mesh.box, [p[3], p[4], q[4], q[3]], z);

			Mesh.face(Mesh.box, [p[0], p[3], p[2], p[1]], y);
			Mesh.face(Mesh.box, [q[0], q[1], q[2], q[3]], Vector.scale(-1, y));
		}
	};
	corrugate([-s, -s, -l], [ 0, 0, 1], [ 0,  1, 0], [-1,  0,  0], l * 2, s * 2);
	corrugate([ s, -s, -l], [ 0, 0, 1], [-1,  0, 0], [ 0, -1,  0], l * 2, s * 2);
	corrugate([ s,  s, -l], [ 0, 0, 1], [ 0, -1, 0], [ 1,  0,  0], l * 2, s * 2);
	corrugate([-s,  s, -l], [ 0, 0, 1], [ 1,  0, 0], [ 0,  1,  0], l * 2, s * 2);
	corrugate([-s, -s,  l], [ 1, 0, 0], [ 0,  1, 0], [ 0,  0,  1], s * 2, s * 2);
	corrugate([ s, -s, -l], [-1, 0, 0], [ 0,  1, 0], [ 0,  0, -1], s * 2, s * 2);
}
