var gl;

var delay = 100;
var vBuffer;
var cBuffer;
var nBuffer;


var program;
var canvas; // accessing this globally
var camPos = [-1., 6., -5.]
var camLook = [0., 1.5, 0.]
var camUp = [-1., 9., -5.]

var projectionLoc;
var cameraLoc;

var height = 1.;
var width = 1.;
var near = 1.;
var far = 50.;
var teapot_geom;
var teapot_vertices;
var teapot_normals;



function projection(t, n, f, r){
	let m =[
    [n/r, 0.0, 0.0, 0.0],
    [0.0, n/t, 0.0, 0.0],
    [0.0, 0.0, -(f + n) / (f - n), -1.0],
    [0.0, 0.0, -2.0 * f * n / (f - n), 0.0]
	]
	m.matrix = true;
	return flatten(m);
}

function cameraCoordinates(pos, look, up){
	// just in case
	var _up = [0,0,0]; var _look = [0,0,0];
	for(i = 0; i < 3; i++){
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

window.onload = function init() {
  canvas = document.getElementById( "gl-canvas" );
	teapot_geom = createTeapotGeometry(5);
	teapot_vertices = teapot_geom[0];
	teapot_normals = teapot_geom[1];
	gl = initWebGL(canvas);

  if ( !gl ) { 
		alert( "WebGL isn't available" ); 
	}

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor( 0.07, 0.15, 0.1, 1.0 );
	gl.enable(gl.DEPTH_TEST);
  program = initShaders( gl, "vertex-shader", "fragment-shader" );

  gl.useProgram( program );

  vBuffer = gl.createBuffer();
  cBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(teapot_vertices), gl.STATIC_DRAW);

	projectionLoc = gl.getUniformLocation( program, "projection" );
	cameraLoc = gl.getUniformLocation( program, "camera" );


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

	gl.clear( gl.COLOR_BUFFER_BIT );

	gl.uniformMatrix4fv(cameraLoc, false, cameraCoordinates(camPos, camLook, camUp));
	gl.uniformMatrix4fv(projectionLoc, false, projection(height/2., near, far, width/2.));
	
	gl.drawArrays(gl.TRIANGLES, 0, teapot_vertices.length);

	setTimeout(
		function (){requestAnimFrame(render);}, delay
	);

}
