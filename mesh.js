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
	let cube = [
		[-1, -1, -1], [-1, -1,  1], [-1,  1, -1], [-1,  1,  1],
		[ 1, -1, -1], [ 1, -1,  1], [ 1,  1, -1], [ 1,  1,  1],
	];

	const box = Mesh.empty();
	Mesh.face(box, [cube[1], cube[5], cube[7], cube[3]], [ 0,  0,  1]);
	Mesh.face(box, [cube[0], cube[2], cube[6], cube[4]], [ 0,  0, -1]);
	Mesh.face(box, [cube[2], cube[3], cube[7], cube[6]], [ 0,  1,  0]);
	Mesh.face(box, [cube[0], cube[4], cube[5], cube[1]], [ 0, -1,  0]);
	Mesh.face(box, [cube[4], cube[6], cube[7], cube[5]], [ 1,  0,  0]);
	Mesh.face(box, [cube[0], cube[1], cube[3], cube[2]], [-1,  0,  0]);
	Mesh.box = box;
}
