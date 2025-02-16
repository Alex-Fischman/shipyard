const Input = {
	held: {},
	pressed: {},
	released: {},

	update: function() {
		this.pressed = {};
		this.released = {};
	},
};

document.addEventListener("keydown", event => {
	Input.held[event.code] = true;
	Input.pressed[event.code] = true;
});
document.addEventListener("keyup", event => {
	Input.held[event.code] = false;
	Input.released[event.code] = true;
});
document.addEventListener("mousedown", () => {
	Input.held["Mouse" + event.button] = true;
	Input.pressed["Mouse" + event.button] = true;
});
document.addEventListener("mouseup", () => {
	Input.held["Mouse" + event.button] = false;
	Input.released["Mouse" + event.button] = true;
});
