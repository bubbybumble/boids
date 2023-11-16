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

var diffuseLoc;
var specularLoc;
var ambientLoc;
var lightPosLoc;
var shininessLoc;

var height = 1.;
var width = 1.;
var near = 1.;
var far = 50.;
var teapot_geom;
var teapot_vertices;
var teapot_normals;

let lightPosition = [-58., -60.,  100.0, 1.0 ];

let lightAmbient = [0.2, 0.2, 0.2, 1.0 ];

let lightDiffuse = [ 0.7, 0.7, 0.7, 1.0 ];

let lightSpecular = [ 1., 1., 1., 1.0];

let materialAmbient = [ 1.0, 1.0, 1.0, 1.0 ];

let materialDiffuse = [ 0.5, 0.36, 0.2, 1.0];

let materialSpecular = [ 0.8, 0.77, 0.77, 1.0];

let materialShininess =  4.0

let ambientR;
let ambientG;
let ambientB;
let diffuseR;
let diffuseG;
let diffuseB;
let specularR;
let specularG;
let specularB
let shininess;



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

	ambientR = document.getElementById("ambientR");
	ambientG = document.getElementById("ambientG");
	ambientB = document.getElementById("ambientB");
	diffuseR = document.getElementById("diffuseR");
	diffuseG = document.getElementById("diffuseG");
	diffuseB = document.getElementById("diffuseB");
	specularR = document.getElementById("specularR");
	specularG = document.getElementById("specularG");
	specularB = document.getElementById("specularB");
	shininess = document.getElementById("shininess");

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
	nBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(teapot_vertices), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(teapot_normals), gl.STATIC_DRAW);

	projectionLoc = gl.getUniformLocation( program, "projection" );
	cameraLoc = gl.getUniformLocation( program, "camera" );

	diffuseLoc = gl.getUniformLocation( program, "diffuseProduct" );
	specularLoc = gl.getUniformLocation( program, "specularProduct" );
	ambientLoc = gl.getUniformLocation( program, "ambientProduct" );
	lightPosLoc = gl.getUniformLocation( program, "lightPos" );
	shininessLoc = gl.getUniformLocation( program, "shininess" );

  render();
}


function updateBuffers() {

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	var vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

}

function render() {


	materialSpecular = [specularR.value/100., specularG.value/100., specularB.value/100., 1.0];
	materialAmbient = [ambientR.value/100., ambientG.value/100., ambientB.value/100., 1.0];
	materialDiffuse = [diffuseR.value/100., diffuseG.value/100., diffuseB.value/100., 1.0];
	materialShininess = shininess.value;

	let specularProduct = vecMult(lightSpecular, materialSpecular);
	let diffuseProduct = vecMult(lightDiffuse, materialDiffuse);
	let ambientProduct = vecMult(lightAmbient, materialAmbient);

	updateBuffers();

	gl.clear( gl.COLOR_BUFFER_BIT );

	gl.uniformMatrix4fv(cameraLoc, false, cameraCoordinates(camPos, camLook, camUp));
	gl.uniformMatrix4fv(projectionLoc, false, projection(height/2., near, far, width/2.));
	
	gl.uniform4fv(specularLoc, specularProduct);
	gl.uniform4fv(diffuseLoc, diffuseProduct);
	gl.uniform4fv(ambientLoc, ambientProduct);
	gl.uniform4fv(lightPosLoc, lightPosition);
	gl.uniform1f(shininessLoc, materialShininess);

	gl.drawArrays(gl.TRIANGLES, 0, teapot_vertices.length);

	setTimeout(
		function (){requestAnimFrame(render);}, delay
	);

}
