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
var boid_count = 100
var time;

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
		this.color = [Math.random(), Math.random(), Math.random(), 1.];
	}

	update(avgPosition, avgVelocity, seperation) {
		this.velocity[0] += (avgPosition[0] - this.position[0]) * 0.001
		this.velocity[1] += (avgPosition[1] - this.position[1]) * 0.001
		this.velocity[2] += (avgPosition[2] - this.position[2]) * 0.001

		this.velocity[0] += (avgVelocity[0] - this.velocity[0]) * 0.001
		this.velocity[1] += (avgVelocity[1] - this.velocity[1]) * 0.001
		this.velocity[2] += (avgVelocity[2] - this.velocity[2]) * 0.001

		this.position[0] += this.velocity[0]
		this.position[1] += this.velocity[1]
		this.position[2] += this.velocity[2]
	}

	render() {
		gl.uniformMatrix4fv(modelLoc, false, model(this.position));
		gl.uniform4fv(colorLoc, this.color)
		gl.drawArrays(gl.TRIANGLES, 0, boid_vertices.length);
	}
}


window.onload = function init() {
	canvas = document.getElementById("gl-canvas");

	for (i = 0; i < boid_count; i++) {
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

	avgPosition = [0.0, 0.0, 0.0]   
	avgVelocity = [0.0, 0.0, 0.0] 
	seperation = [0.0, 0.0, 0.0]

	for (i = 0; i < boid_count; i++) {
		// Cohesion (Move towards avg position of neighbors)
		avgPosition[0] += boids[i].position[0];
		avgPosition[1] += boids[i].position[1];
		avgPosition[2] += boids[i].position[2];

		// Alignment (Make neighbors move in same direction)
		avgVelocity[0] += boids[i].velocity[0];
		avgVelocity[1] += boids[i].velocity[1];
		avgVelocity[2] += boids[i].velocity[2];

		//TODO: Implement Separation
	}

	avgPosition[0] /= boid_count
	avgPosition[1] /= boid_count
	avgPosition[2] /= boid_count

	avgVelocity[0] /= boid_count
	avgVelocity[1] /= boid_count
	avgVelocity[2] /= boid_count

	boids.forEach((boid) => {
		boid.update(avgPosition, avgVelocity);
		boid.render();
	})


	setTimeout(
		function () { requestAnimFrame(render); }, delay
	);

}
