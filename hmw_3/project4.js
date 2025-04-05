// This function takes the projection matrix, the translation, and two rotation anthis.gles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	

	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	// new variables for rotation anthis.gles and corresponding sin/cos for each one
	var angleX=rotationX;
	var angleY=rotationY;
	var cosx=Math.cos(angleX);
	var sinx=Math.sin(angleX);
	var cosy=Math.cos(angleY);
	var siny=Math.sin(angleY);




	//rotation matrices
	var Rx=[
		1,0,0,0,
		0,cosx,sinx,0,
		0,-sinx,cosx,0,
		0,0,0,1
	];
	var Ry=[
		cosy,0,-siny,0,
		0,1,0,0,
		siny,0,cosy,0,
		0,0,0,1
	];

	var mvp=MatrixMult( projectionMatrix, trans );
	mvp = MatrixMult(mvp, Ry);
	mvp = MatrixMult(mvp, Rx);


	return mvp;
}
/*
var vertex_shader = `
	attribute vec3 pos;
	uniform mat4 mvp;
	void main()
	{
		this.gl_Position = mvp * vec4(pos,1);
	}
`;
// Fragment shader source code
var fragment_shader = `
	precision mediump float;
	void main()
	{
		this.gl_FragColor = vec4(1,1,1,1);
	}
`;
*/


class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		
		//GLSL code for shaders
		var VertexShaderText=`
			uniform bool swap;
			uniform mat4 mvp;
			attribute vec3 pos;
			attribute vec2 tc;
			varying vec2 vtc;
			void main(){
				if ( !swap ){
					gl_Position = mvp * vec4(pos, 1);
				}
				else {
					gl_Position = mvp * mat4(
								1.0, 0.0, 0.0, 0.0,
								0.0, 0.0, -1.0, 0.0,
								0.0, 1.0, 0.0, 0.0,
								0.0, 0.0, 0.0, 1.0) * vec4(pos, 1);
				}
				vtc = tc;
			}
			` 
		var fragmentShaderText = `
			precision mediump float;
			uniform bool show;
			uniform sampler2D st;
			varying vec2 vtc;
			void main(){
				if(show){
					gl_FragColor = texture2D(st,vtc);
				}
				else{
					gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);;
				}
			}
			` 			
		
		
		// creating buffers
		this.virtualS=gl.createShader(gl.VERTEX_SHADER);
		this.fragmentS=gl.createShader(gl.FRAGMENT_SHADER);

		gl.shaderSource(this.virtualS, VertexShaderText);
		gl.shaderSource(this.fragmentS, fragmentShaderText);
		
		gl.compileShader(this.virtualS);
		gl.compileShader(this.fragmentS);

		if(!gl.getShaderParameter(this.virtualS, gl.COMPILE_STATUS)){
			console.error('Error compiling shader', gl.getShaderInfoLog(this.virtualS));
			}
		if(!gl.getShaderParameter(this.fragmentS, gl.COMPILE_STATUS)){
			console.error('Error compiling shader', gl.getShaderInfoLog(this.fragmentS));
			}

		this.prog = gl.createProgram();
		gl.attachShader(this.prog, this.virtualS);
		gl.attachShader(this.prog, this.fragmentS);

		gl.linkProgram(this.prog);

		if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
			console.error('ERROR linking program!', gl.getProgramInfoLog(this.prog));
			return;
		}
		gl.validateProgram(this.prog);
		if (!gl.getProgramParameter(this.prog, gl.VALIDATE_STATUS)) {
			console.error('ERROR validating program!', gl.getProgramInfoLog(this.prog));
			return;
		}

		this.pos = gl.getAttribLocation(this.prog, 'pos');
		this.tc = gl.getAttribLocation(this.prog, 'tc');
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.swap = gl.getUniformLocation(this.prog, 'swap');
		this.show = gl.getUniformLocation(this.prog, 'show');
		gl.useProgram( this.prog );

		this.checkbox_show = true;
		this.texture_exist = false;
		gl.uniform1i( this.show, false );
		gl.uniform1i( this.swap, false );

		this.TriangleBuf = gl.createBuffer();
		
		this.TextureBuf = gl.createBuffer();
		this.objTex = gl.createTexture();
		this.sampler = gl.getUniformLocation(this.prog, 'st');

		

	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a trianthis.gle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.

		//every vertex has 3 params
		this.numTriangles = vertPos.length / 3;
		gl.useProgram(this.prog);
		//loading vertex pos in every buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW );


	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.prog);
		gl.uniform1i( this.swap, swap );
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the Webthis.GL initializations before drawing
		gl.useProgram( this.prog );
		//passing transformation matrix uMPV
		gl.uniformMatrix4fv( this.mvp, false, trans );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.vertexAttribPointer( this.pos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.pos );

		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf);
		gl.vertexAttribPointer( this.tc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.tc );

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );



	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.useProgram(this.prog);
		gl.bindTexture(gl.TEXTURE_2D, this.objTex);

		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		

		gl.uniform1i( this.sampler, 0 );
		this.texture_exist = true;
		gl.uniform1i( this.show, this.checkbox_show && this.texture_exist );
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.checkbox_show = show;
		gl.useProgram( this.prog );
		gl.uniform1i( this.show, this.checkbox_show && this.texture_exist);
	}
	
}
