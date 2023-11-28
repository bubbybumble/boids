var gl;

var delay = 10;
var vBuffer;



var program;
var canvas; // accessing this globally
var camPos = [0., 0., -100.]
var camLook = [0., 0., 0.]
var camUp = [0., 1., -100.]

var projectionLoc;
var cameraLoc;
var colorLoc;
var modelLoc;

var height = 1.;
var width = 1.;
var near = 1.;
var far = 50.;

var boid_vertices;

var boids = []
var boidCount = 100
var time;
var flockRadiusSquared = 1000

function model(pos) {
	let m = [
		[1., 0., 0., pos[0]],
		[0., 1., 0., pos[1]],
		[0., 0., 1., pos[2]],
		[0., 0., 0., 1.]
	]
	m.matrix = true;
	return flatten(m);
}

function projection(t, n, f, r) {
	let m = [
		[n / r, 0.0, 0.0, 0.0],
		[0.0, n / t, 0.0, 0.0],
		[0.0, 0.0, -(f + n) / (f - n), -1.0],
		[0.0, 0.0, -2.0 * f * n / (f - n), 0.0]
	]
	m.matrix = true;
	return flatten(m);
}

function cameraCoordinates(pos, look, up) {
	// just in case
	var _up = [0, 0, 0]; var _look = [0, 0, 0];
	for (i = 0; i < 3; i++) {
		_look[i] = look[i] - pos[i];
		_up[i] = up[i] - pos[i];
	}

	let n_look = normalize(_look);
	let n_up = normalize(_up);

	let u = normalize(cross_product(n_look, n_up));
	let n = negate(_look);
	let v = normalize(cross_product(u, n_look));


	let m = [
		[u[0], u[1], u[2], dot_product(negate(u), pos)],
		[v[0], v[1], v[2], dot_product(negate(v), pos)],
		[n[0], n[1], n[2], dot_product(negate(n), pos)],
		[0, 0, 0, 1.]
	];
	m.matrix = true;
	return flatten(m);


}

class Boid {
	constructor(position, velocity) {
		this.position = position;
		this.velocity = velocity;
		this.neighbors = []
		this.color = [Math.random(), Math.random(), Math.random(), 1.];
	}

	update() {
		this.findNeighbors(boids);
		this.alignment();
		this.cohesion();
		this.seperation();

		this.position[0] += this.velocity[0]
		this.position[1] += this.velocity[1]
		this.position[2] += this.velocity[2]
	}

	cohesion() {
		let avgPosition = [0.0, 0.0, 0.0];

		this.neighbors.forEach(element => {
			avgPosition[0] += element.position[0]
			avgPosition[1] += element.position[1]
			avgPosition[2] += element.position[2]
		});

		avgPosition[0] /= this.neighbors.length
		avgPosition[1] /= this.neighbors.length
		avgPosition[2] /= this.neighbors.length

		this.velocity[0] += (avgPosition[0] - this.position[0]) * 0.001
		this.velocity[1] += (avgPosition[1] - this.position[1]) * 0.001
		this.velocity[2] += (avgPosition[2] - this.position[2]) * 0.001
	}

	alignment() {
		let avgVelocity = [0.0, 0.0, 0.0];

		this.neighbors.forEach(element => {
			distance(this.position, element.position) 
			avgVelocity[0] += element.velocity[0];
			avgVelocity[1] += element.velocity[1];
			avgVelocity[2] += element.velocity[2];
		});

		avgVelocity[0] /= this.neighbors.length
		avgVelocity[1] /= this.neighbors.length
		avgVelocity[2] /= this.neighbors.length

		this.velocity[0] += (avgVelocity[0] - this.velocity[0]) * 0.001
		this.velocity[1] += (avgVelocity[1] - this.velocity[1]) * 0.001
		this.velocity[2] += (avgVelocity[2] - this.velocity[2]) * 0.001

	}

	seperation() {
		let seperation = [0.0, 0.0, 0.0]
		this.neighbors.forEach(element => {
			let dist = Math.max(1, distance(this.position, element.position));
			if(dist < 4) {
				let dx = this.position[0] - element.position[0]
				let dy = this.position[1] - element.position[1]
				let dz = this.position[2] - element.position[2]
				
				seperation[0] += dx / dist
				seperation[1] += dy / dist
				seperation[2] += dz / dist
			}
		});

		seperation[0] /= this.neighbors.length
		seperation[1] /= this.neighbors.length
		seperation[2] /= this.neighbors.length

		this.velocity[0] += seperation[0] * 0.05
		this.velocity[1] += seperation[1] * 0.05
		this.velocity[2] += seperation[2] * 0.05
	}

	findNeighbors(boids) {
		this.neighbors = []
		boids.forEach(element => {
			if (element != this && distanceSquared(this.position, element.position) < flockRadiusSquared) {
				this.neighbors.push(element)
			}
		});
	}

	render() {
		gl.uniformMatrix4fv(modelLoc, false, model(this.position));
		gl.uniform4fv(colorLoc, this.color)
		gl.drawArrays(gl.TRIANGLES, 0, boid_vertices.length);
	}
}


window.onload = function init() {
	canvas = document.getElementById("gl-canvas");

	for (i = 0; i < boidCount; i++) {
		rand_pos = [Math.random() * 200. - 100., Math.random() * 200. - 100., Math.random() * 200. - 100., 1.]
		rand_vel = [Math.random() - 0.5, Math.random() - .5, Math.random() - 0.5, 1.]
		boids.push(new Boid(rand_pos, rand_vel));
	}

	boid_vertices = [
		[1., 0., 0., 1.],
		[0., 1., 0., 1.],
		[1., 1., 0., 1.]
	]

	gl = initWebGL(canvas);

	if (!gl) {
		alert("WebGL isn't available");
	}

	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.clearColor(0.07, 0.15, 0.1, 1.0);
	gl.enable(gl.DEPTH_TEST);
	program = initShaders(gl, "vertex-shader", "fragment-shader");

	gl.useProgram(program);

	vBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(boid_vertices), gl.STATIC_DRAW);

	projectionLoc = gl.getUniformLocation(program, "projection");
	cameraLoc = gl.getUniformLocation(program, "camera");
	colorLoc = gl.getUniformLocation(program, "color");
	modelLoc = gl.getUniformLocation(program, "model");

	gl.uniformMatrix4fv(cameraLoc, false, cameraCoordinates(camPos, camLook, camUp));
	gl.uniformMatrix4fv(projectionLoc, false, projection(height / 2., near, far, width / 2.));

	render();
}


function updateBuffers() {

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

}


function render() {

	updateBuffers();

	gl.clear(gl.COLOR_BUFFER_BIT);

	for (i = 0; i < boidCount; i++) {
		boids[i].update();
		boids[i].render();
	}

	setTimeout(
		function () { requestAnimFrame(render); }, delay
	);

}
