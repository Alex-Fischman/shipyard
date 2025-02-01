let canvas = document.getElementById("canvas");

let then = performance.now();
let frame = now => {
	let dt = now - then;
	then = now;
	update(dt);
	render();
	window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);

let update = (dt) => {};

let context = canvas.getContext("webgl2");

let render = () => {
	let {width: w, height: h} = canvas.getBoundingClientRect();
	canvas.width = w;
	canvas.height = h;
};
