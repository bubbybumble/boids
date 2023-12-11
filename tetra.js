class tetrahedron {
	constructor() {
		this.va =  vec4(0., 0., -1., 1);
		this.vb = vec4(0.0, 0.942809, 0.333333, 1);
		this.vc = vec4(-0.816497, -0.471405, 0.333333, 1);
		this.vd = vec4(0.816497, -0.471405, 0.333333,1);
		// scale up the tetrahedron, form the matrix
		let M_scale = matMult(translate3D(0., 0., -1.), 
						matMult(scale(4., 4., 4.), translate3D(0., 0., 1.)))
		this.va = matVecMult(M_scale, this.va);
		this.vb = matVecMult(M_scale, this.vb);
		this.vc = matVecMult(M_scale, this.vc);
		this.vd = matVecMult(M_scale, this.vd);
		
		this.vertices = [];
    this.normals  =  [];
	}

	getVerticesNormals() {
		this.triangle(this.va, this.vb, this.vc);
		this.triangle(this.vd, this.vc, this.vb);
		this.triangle(this.va, this.vd, this.vb);
		this.triangle(this.va, this.vc, this.vd);
	}

	triangle(a, b, c) {
		this.normals.push(vec3(a));
		this.normals.push(vec3(b));
		this.normals.push(vec3(c));
		
		this.vertices.push(a);
		this.vertices.push(b);      
		this.vertices.push(c);
	}
	getNumVertices() {
		return this.vertices.length;
	}
};


