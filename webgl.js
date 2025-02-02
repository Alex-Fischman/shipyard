const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");
if (gl == null) {
	throw "WebGL2 is unsupported";
}

gl.clearColor(1, 0, 1, 1);
gl.enable(gl.DEPTH_TEST);

const WebGL = {
	clear: () => {
		const { width, height } = canvas.getBoundingClientRect();
		canvas.width = width;
		canvas.height = height;
		gl.viewport(0, 0, width, height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		return { width, height };
	},
	shader: (source, type) => {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		} else {
			throw "Shader compile error:\n" + gl.getShaderInfoLog(shader);
		}
	},
	program: (vertex, fragment, attributes, uniforms) => {
		const program = gl.createProgram();
		gl.attachShader(program, WebGL.shader(vertex, gl.VERTEX_SHADER));
		gl.attachShader(program, WebGL.shader(fragment, gl.FRAGMENT_SHADER));
		gl.linkProgram(program);
		if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
			gl.useProgram(program);
			return {
				attributes: Object.fromEntries(
					attributes.map(x => [x, gl.getAttribLocation(program, x)])
				),
				uniforms: Object.fromEntries(
					uniforms.map(x => [x, gl.getUniformLocation(program, x)])
				),
			};
		} else {
			throw "Shader link error:\n" + gl.getProgramInfoLog(program);
		}
	},
	attribute_vec3: ({location, data, divisor}) => {
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(location);
		if (divisor) gl.vertexAttribDivisor(location, divisor);
	},
	attribute_mat4: ({location, data, divisor}) => {
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		for (let i = 0; i < 4; i++) {
			gl.vertexAttribPointer(location + i, 4, gl.FLOAT, false, 64, 16 * i);
			gl.enableVertexAttribArray(location + i);
			if (divisor) gl.vertexAttribDivisor(location + i, divisor);
		}
	},
	uniform_mat4: ({location, data}) => {
		gl.uniformMatrix4fv(location, false, data);
	},
	draw_elements: ({indices, models}) => {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, models.length);
	},
};
