var doc=document,win=window,obj,clr,vBuff,cBuff,vShdr,fShdr,prog,pLoc,cLoc,uniLoc,mat,res,me,projMat;
var rnd=Math.random;
var CVS=doc.querySelector("canvas");
var C=CVS.getContext("webgl");
var AB=C.ARRAY_BUFFER,SD=C.STATIC_DRAW;
function mat4Create(){ return [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ] }
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
	if (!a) throw("addRandTo() needs arg `a` (arr)")
	if (!n) throw("addRandTo() needs 2nd arg `n` (int)");
	for(var i=0;i<n;i++) a.push(rnd());
	return a;
}
function getFaceNorm(vnorms){
	var fnorm=[0,0,0];
	for( var i=0;i<vnorms.length;i++){
		fnorm = arrSum(fnorm,vnorms[i]);
	}

}
function getColors(obj){
	var i,j,k,f=[],c=[],res=[],cc,norm,norms,idx;
	var f=obj.faces,norms=obj.norms;
	for (i=0;i<f.length;i++){ // faces
		idx=f[i][0];
		res[idx] = [0,0,0];
		for(j=0;j<f[i].length;j++){ // normal indicies
			idx=f[i][j];
			res[idx*3] += norms[idx*3]
			res[idx*3+1] += norms[idx*3+1]
			res[idx*3+2] += norms[idx*3+2]
		}
		res[idx*3] /= f[i].length;
		res[idx*3+1] /= f[i].length;
		res[idx*3+2] /= f[i].length;
	}
	return res;
}
function tri(a){ // triangulation
	if ( a.length === 3 ){
		return a;
	}
	var b=[],idx,i,j;
	for(i=0;i<a.length;i+=2){
		for(j=0;j<3;j++){
			idx=(i+j)%a.length;
			b.push(a[idx]);
		}
	}
	return b;
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
	var vmat=[],nmat=[],v=obj.verts,f=obj.faces,n=obj.norms,a,i,j;
	for(i=0;i<f.length;i++){ // each face/normal
		f[i] = tri(f[i]);
		for(j=0;j<f[i].length;j++){ // each point index
			arrConcat(
				vmat,
				v.slice( (f[i][j]-1)*3, (f[i][j]-1)*3+3 )
			);
			arrConcat(
				nmat, 
				n.slice( i, i+3 )
			)
		}
	}
	return {faces: obj.faces, verts: vmat, norms: nmat}
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
			console.log(obj);
			callback();
		}
	}
	xhr.open( "GET", fname );
	xhr.send();
}
function translate(mat,vec){
	for(var i=0;i<mat.length;i+=3){
		mat[i]+=vec[0];
		mat[i+1]+=vec[1];
		mat[i+2]+=vec[2];
	}
	return mat;
}
function rotate(){
	rotateY( mat, me.movementX/-100 );
	rotateX( mat, me.movementY/-100 );

	C.uniformMatrix4fv( uniLoc.matrix, false, mat );
	C.drawArrays(C.TRIANGLES,0,obj.verts.length/3);
}
function doMouseMove(){
	me = event;
	requestAnimationFrame( rotate )
}
function doMouseDown(){
	CVS.addEventListener( "mousemove", doMouseMove );
}
function init(){
	obj = parseObj( obj );
	obj = scaleObj( obj, 0.02 );
	obj.verts = translate( obj.verts, [0,-2,0] );
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
	loadModel("cube.json", init);
}
main();
