const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");
if (gl == null) {
	throw "WebGL2 is unsupported";
}

gl.clearColor(1, 0, 1, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

const WebGL = {
	resize: () => {
		const { width, height } = canvas.getBoundingClientRect();
		canvas.width = width;
		canvas.height = height;
		gl.viewport(0, 0, canvas.width, canvas.height);
	},

	draw: ({ vertex, fragment, attributes, uniforms, varyings, instances, indices }) => {
		const vertexSource = `
${Object.entries(attributes).map(
	([name, {type}]) => `attribute ${type} ${name};`
).join('\n')}

${Object.entries(uniforms).map(
	([name, {type}]) => `uniform ${type} ${name};`
).join('\n')}

${Object.entries(varyings).map(
	([name, {type}]) => `varying ${type} ${name};`
).join('\n')}

void main() {
	${vertex}
}
		`;
		const fragmentSource = `
precision highp float;

${Object.entries(uniforms).map(
	([name, {type}]) => `uniform ${type} ${name};`
).join('\n')}

${Object.entries(varyings).map(
	([name, {type}]) => `varying ${type} ${name};`
).join('\n')}

void main() {
	${fragment}
}
		`;

		const compile = (source, type) => {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw `
Shader compile error:
${gl.getShaderInfoLog(shader)}
${source}
			`;
			return shader;
		};

		const program = gl.createProgram();
		gl.attachShader(program, compile(vertexSource, gl.VERTEX_SHADER));
		gl.attachShader(program, compile(fragmentSource, gl.FRAGMENT_SHADER));
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw "Shader link error:\n" + gl.getProgramInfoLog(program);
		}

		gl.useProgram(program);

		for (const [name, {type, data, divisor}] of Object.entries(attributes)) {
			gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

			const bindAttribute = (location, size, stride, offset) => {
				gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
				gl.enableVertexAttribArray(location);
				gl.vertexAttribDivisor(location, divisor || 0);
			};

			const location = gl.getAttribLocation(program, name);
			if (type == "vec3") {
				bindAttribute(location, 3, 0, 0);
			} else if (type == "vec2") {
				bindAttribute(location, 2, 0, 0);
			} else if (type == "mat4") {
				for (let i = 0; i < 4; i++) bindAttribute(location + i, 4, 64, 16 * i);
			} else {
				throw `Unknown attribute type ${type} for ${name}`;
			}
		}

		let textureIndex = 0;
		for (const [name, {type, data}] of Object.entries(uniforms)) {
			const location = gl.getUniformLocation(program, name);
			if (type == "vec3") {
				gl.uniform3fv(location, data);
			} else if (type == "vec2") {
				gl.uniform2fv(location, data);
			} else if (type == "mat4") {
				gl.uniformMatrix4fv(location, false, data);
			} else if (type == "float") {
				gl.uniform1f(location, data);
			} else if (type == "sampler2D") {
				gl.activeTexture(gl.TEXTURE0 + textureIndex);
				gl.bindTexture(gl.TEXTURE_2D, data);
				gl.uniform1i(location, textureIndex);
				textureIndex++;
			} else {
				throw `Unknown uniform type ${type} for ${name}`;
			}
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, instances);
	},
};
