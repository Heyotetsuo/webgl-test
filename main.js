var doc=document,verts,clr,vBuff,cBuff,vShdr,fShdr,prog,pLoc,cLoc,uniLoc,mat,res,rnd=Math.random;
var CVS=doc.querySelector("canvas");
var C=CVS.getContext("webgl");
var AB=C.ARRAY_BUFFER,SD=C.STATIC_DRAW;
function mat4Create(){ return [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ] }
function parseVerts(mat){
	var mat2=[],i,j,idx;
	for(i=0;i<mat.length;i+=3){ // step through each point (3 values)
		for(j=0;j<9;j++){ // step through each face (9 values)
			idx=(i+j)%mat.length;
			mat2.push(mat[idx]/2);
		}
	}
	return mat2;
}
function translate(mat,vec){
	for(var i=0;i<vec.length;i++) mat[i+12]+=vec[i];
}
function rotateZ(m,angle){
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv0=m[0], mv4=m[4], mv8=m[8]; 
	m[0] = c*m[0]-s*m[1];
	m[4] = c*m[4]-s*m[5];
	m[8] = c*m[8]-s*m[9];
	m[1] = c*m[1]+s*mv0;
	m[5] = c*m[5]+s*mv4;
	m[9] = c*m[9]+s*mv8;
}
function rotateX(m, angle){
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv1=m[1], mv5=m[5], mv9=m[9];
	m[1] = m[1]*c-m[2]*s;
	m[5] = m[5]*c-m[6]*s;
	m[9] = m[9]*c-m[10]*s;
	m[2] = m[2]*c+mv1*s;
	m[6] = m[6]*c+mv5*s;
	m[10] = m[10]*c+mv9*s;
}
function rotateY(m,angle){
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv0=m[0], mv4=m[4], mv8=m[8];
	m[0] = c*m[0]+s*m[2];
	m[4] = c*m[4]+s*m[6];
	m[8] = c*m[8]+s*m[10];
	m[2] = c*m[2]-s*mv0;
	m[6] = c*m[6]-s*mv4;
	m[10] = c*m[10]-s*mv8;
}
function addRandTo(a,n){
	if (!a) throw("addRandTo() requires argument `a` (array)")
	if (!n) throw("addRandTo() requires second argument `n` (integer)");
	for(var i=0;i<n;i++) a.push(rnd());
	return a;
}
function paintVerts(verts){
	var i,j,k,a=[],b=[],c=[];
	b=addRandTo(b,9);
	for(i=0;i<verts.length;i+=3){ // each point (3values)
		b=b.slice(3);
		b=addRandTo(b,3);
		for(j=0;j<9;j++){ // each color
			a.push(b[j]);
		}
	}
	return a;
}
function init(){
	verts = parseVerts([
		-1,-1,-1, -1,1,-1, -1,-1,1, -1,1,1,
		1,-1,1, 1,1,1, 1,-1,-1, 1,1,-1,
	]);
  
	clr = paintVerts(verts);

	vBuff = C.createBuffer();
	C.bindBuffer(AB, vBuff);
	C.bufferData(AB, new Float32Array(verts), SD);
	cBuff = C.createBuffer();
	C.bindBuffer(AB, cBuff);
	C.bufferData(AB, new Float32Array(clr), SD);

	vShdr = C.createShader(C.VERTEX_SHADER);
	C.shaderSource(vShdr, `
		precision mediump float;
		attribute vec3 position;
		attribute vec3 color;
		varying vec3 vColor;
		uniform mat4 matrix;
		void main(){
			vColor = color;
			gl_Position = matrix * vec4(position,1);
		}
	`);
	fShdr = C.createShader(C.FRAGMENT_SHADER);
	C.shaderSource(fShdr,`
		precision mediump float;
		varying vec3 vColor;
		void main(){
			gl_FragColor = vec4(vColor,1);
		}
	`);

	C.compileShader(vShdr);
	C.compileShader(fShdr);

	prog = C.createProgram();
	C.attachShader(prog, vShdr);
	C.attachShader(prog, fShdr);
	C.linkProgram(prog);
	
	pLoc = C.getAttribLocation(prog,`position`);
	C.enableVertexAttribArray(pLoc);
	C.bindBuffer(AB, vBuff);
	C.vertexAttribPointer(pLoc,3,C.FLOAT,false,0,0);

	cLoc = C.getAttribLocation(prog,`color`);
	C.enableVertexAttribArray(cLoc);
	C.bindBuffer(AB, cBuff);
	C.vertexAttribPointer(cLoc,3,C.FLOAT,false,0,0);

	C.useProgram(prog);
	C.enable(C.DEPTH_TEST);

	uniLoc = { matrix: C.getUniformLocation(prog,`matrix`) }
	mat = mat4Create();

	function animate(){
		requestAnimationFrame(animate);
		// translate( mat, [.001,.003,0] );
		rotateY(mat,.01);
		rotateX(mat,.02);
		C.uniformMatrix4fv( uniLoc.matrix, false, mat );
		C.drawArrays(C.TRIANGLES,0,verts.length/3);
	}

	animate();
}
function main(){
	init();
}
main();
