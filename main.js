var doc=document,win=window,rnd=Math.random;
var obj,clr,vBuff,cBuff,vShdr,fShdr,prog,pLoc,cLoc,uniLoc,mat,res,me,projMat;
var CVS=doc.querySelector("canvas"),C=CVS.getContext("webgl");
var AB=C.ARRAY_BUFFER,SD=C.STATIC_DRAW,CAM_POS;
function doMouseDown(){ CVS.addEventListener("mousemove",doMouseMove) }
function doMouseMove(){
	me = event;
	requestAnimationFrame( rotate )
}
function mat4Create(){ return [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ] }
function rotateAxis(m,angle,axis){
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var cp = CAM_POS;
	var mv1=m[0],mv2=m[4],mv3=m[8];
	switch(axis){
	case 'x':
		m[0] = c*m[0]+s*m[2];
		m[4] = c*m[4]+s*m[6];
		m[8] = c*m[8]+s*m[10];
		m[2] = c*m[2]-s*mv1;
		m[6] = c*m[6]-s*mv2;
		m[10] = c*m[10]-s*mv3;
		break;
	case 'y':
		mv1=m[1],mv2=m[5],mv3=m[9];
		m[1] = m[1]*c-m[2]*s;
		m[5] = m[5]*c-m[6]*s;
		m[9] = m[9]*c-m[10]*s;
		m[2] = m[2]*c+mv1*s;
		m[6] = m[6]*c+mv2*s;
		m[10] = m[10]*c+mv3*s;
		break;
	case 'z':
		m[0] = c*m[0]-s*m[1];
		m[4] = c*m[4]-s*m[5];
		m[8] = c*m[8]-s*m[9];
		m[1] = c*m[1]+s*mv1;
		m[5] = c*m[5]+s*mv2;
		m[9] = c*m[9]+s*mv3;
		break;
	default:
		break;
	}
}
function rotate(){
	rotateAxis( mat, me.movementX/-100, 'x' );
	rotateAxis( mat, me.movementY/-100, 'y' );
	C.uniformMatrix4fv( uniLoc.matrix, false, mat );
	C.drawArrays(C.TRIANGLES,0,obj.verts.length/3);
}
function translate(mat,vec){
	for(var i=0;i<mat.length;i+=3){
		mat[i]+=vec[0];
		mat[i+1]+=vec[1];
		mat[i+2]+=vec[2];
	}
	return mat;
}
function addRandTo(a,n){
	if (!a) throw("addRandTo() needs arg `a` (arr)")
	if (!n) throw("addRandTo() needs 2nd arg `n` (int)");
	for(var i=0;i<n;i++) a.push(rnd());
	return a;
}
function flattenMat( mat ){
	if ( !(mat instanceof Array) ) throw( "mat must be a 2D Array" );
	var a = [],i;
	for(i=0;i<mat.length;i++){
		arrConcat( a, mat[i] );
	}
	return a;
}
function getColors(obj){
	var a=[],i;
	for (i=0;i<obj.verts.length/3;i++){ arrConcat(a, [rnd(),rnd(),rnd()]) }
	return a;
}
function arrMath(a,b,op){
	var c=[],v;
	if (!op) throw("operation must be provided");
	if (a.length !== b.length) throw("arrays must be of equal length");
	for( var i=0;i<a.length;i++){
		b.constructor === Number ? v=b : v=b[i] ;
		switch(op){
		case "multiply":
			c[i] = a[i] * v;
			break;
		case "divide":
			c[i] = a[i] / v;
			break;
		case "add":
			c[i] = a[i] + v;
			break;
		case "subtract":
			c[i] = a[i] - v;
			break;
		default:
			throw( "invalid operation" );
			break;
		}
	}
	return c;
}
function arrConcat(a,b){
	for (var i=0; i<b.length; i++){
		a.push(b[i]);
	}
}
function parseObj(obj){
	var vmat=[],nmat=[],a=[],v=obj.verts,f=obj.faces,n=obj.norms,i,j,idx;
	for(i=0;i<f.length;i++){ // triangulate faces
		if ( f[i].length > 4 ) throw( "Ngons not allowed" );
		if ( f[i].length < 3 ) throw( "Not enough points to make a face" );
		if ( f[i].length === 3 ){
			a.push( f[i] );
		} else if ( f[i].length === 4 ){
			a.push( f[i].slice(0,3) );
			a.push( [f[i][2],f[i][3],f[i][0]] );
		}
	}
	f=a;
	for(i=0;i<f.length;i++){ // triangulate verts
		for(j=0;j<f[i].length;j++){
			idx = f[i][j]-1;
			arrConcat( vmat, v.slice(idx*3, idx*3+3) );
		}
	}
	return {verts:vmat,faces:a,norms:n}
}
function scaleObj(obj,n){
	var o = {verts:obj.verts,faces:obj.faces,norms:obj.norms},i;
	for(i=0;i<obj.verts.length;i++){
		o.verts[i] = obj.verts[i]*n;
	}
	return o;
}
function loadModel(fname, callback){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (xhr.readyState === 4 && xhr.status === 200){
			obj = JSON.parse(xhr.response);
			callback();
		}
	}
	xhr.open( "GET", fname );
	xhr.send();
}
function ranslate(mat,vec){
	for(var i=0;i<mat.length;i+=3){
		mat[i]+=vec[0];
		mat[i+1]+=vec[1];
		mat[i+2]+=vec[2];
	}
	return mat;
}
function init(){
	CAM_POS = [0,0,-1];
	obj = parseObj(obj);
	obj = scaleObj( obj, 0.01);
	// obj.verts = translate( obj.verts, CAM_POS );
	clr = getColors(obj);

	vBuff = C.createBuffer();
	C.bindBuffer(AB, vBuff);
	C.bufferData(AB, new Float32Array(obj.verts), SD);
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

	C.uniformMatrix4fv( uniLoc.matrix, false, mat );
	C.drawArrays(C.TRIANGLES,0,obj.verts.length/3);

	CVS.addEventListener( "mousedown", doMouseDown );
	CVS.addEventListener( "mouseup", function(){
		CVS.removeEventListener( "mousemove", doMouseMove );
	});
}
function main(){
	loadModel("figure.json", init);
}
main();
