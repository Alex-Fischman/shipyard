let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

window.addEventListener("resize", () => {
	let {width: w, height: h} = canvas.getBoundingClientRect();
	canvas.width = w;
	canvas.height = h;
	context.fillRect(0, 0, w, h);
	context.setTransform(new DOMMatrix(w > h? 
		[h / 2, 0, 0, -h / 2, h / 2 + (w - h) / 2, h / 2]: 
		[w / 2, 0, 0, -w / 2, w / 2, w / 2 + (h - w) / 2]
	));
});
window.dispatchEvent(new Event("resize"));
