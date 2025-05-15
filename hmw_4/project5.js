// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.

	//With respect to the previous project is replaced with the new GetModelViewMatrix function. This new one does not take the projection matrix as an argument,
	// and so returns the part of the transformation prior to projection.
	
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

	//So i start from the traslation and then multiply for the rotations
	//as in the previous project
	var mv = MatrixMult(trans,Rx);
	mv=MatrixMult(mv,Ry);
	return mv; 
	
}

function IdentityMatrix() {
    return [
        1, 0, 0, 0,  // colonna 0
        0, 1, 0, 0,  // colonna 1
        0, 0, 1, 0,  // colonna 2
        0, 0, 0, 1   // colonna 3
    ];
}

function transposeMatrix(matrix){
	let output = []; 
	for(let col = 0; col < 4; col++){
		for(let row = 0; row < 4; row++){
			output.push(matrix[col + (row * 4)])
		}
	}
	return output;
}



// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations

		//same as previous project
		// swap - in the vertex shader I want the option to apply a rotation matrix which swaps y-axis with z-axis so I use a boolean
		// pos - 3D position of the vertex
		//tc -texture coordinate of the vertex
		//vtc - this is varying because I use it to pass tc to the fragment shader
		//mvp - is the Model-View-Proj matrix used to transform pos
		const VertexShaderText=`
			

			// uniform matrices
			uniform mat4 mvp;
			uniform mat4 mv;
			uniform mat3 normalMV;
			uniform mat4 swap_yz;
			
			attribute vec3 pos;

			attribute vec2 tc;
			varying vec2 v_tc;

			attribute vec3 normal;
			varying vec3 v_normal;

			varying vec4 v_frag_pos;

			void main(){

				v_tc = tc;
				v_normal=normalMV*normal;
				v_frag_pos= mv* vec4(pos,0.0);

				gl_Position = mvp * swap_yz* vec4(pos, 1.0);
			
			}
			` ;
		//vtc- intrerpolated texture coodinates from the vertex shader
		const fragmentShaderText = `
			precision mediump float;

			uniform bool show;

			//sampler2D-> is a special type inGLSL to represent a 2D texture
			
			uniform sampler2D tex;
			uniform bool hasTexture;

			varying vec2 v_tc;
			varying vec3 v_normal;
			varying vec4 v_frag_pos;

			//light components

			uniform vec3 light_dir;
			uniform vec3 light_color;
			uniform vec3 specu_color;	
			uniform float light_int;
			uniform float phong_expo;	
			

			// I want a Blinn-Phong shading
			
			void main(){

			    
				vec4 diffuse_color=vec4(1.0); //total white
				if(hasTexture && show ){
					diffuse_color = texture2D(tex,v_tc);
				}	
				
				//geometry term
				float cos_theta = max(0.0, dot(normalize(v_normal), normalize(light_dir)));

				
				//"luce diretta"
				vec4 lightning_col=light_int*vec4(light_color,1.0);

				//"luce ambientale"---> we put vec4(0.1,0.1,0.1,1.0) which is a dark grey for darker areas not enlighted
				//vec4 ambient_col= light_int*vec4(0.1,0.1,0.1,1.0);

				// "luce diffusa totale" =" colore diffuso"+ "luce ambientale"
				vec4 diffuse_lighting=diffuse_color*((lightning_col*cos_theta));

				//----Phong part-----
				//camera direction
				vec3 viewDir= normalize(vec3(-v_frag_pos));
				vec3 h_angle=normalize(light_dir+viewDir);

				float cos_omega=max(0.0,dot(h_angle,normalize(v_normal)));
				vec4 specu_lighting=light_int*vec4(specu_color,1.0)*vec4(light_color,1.0)*pow(cos_omega,phong_expo);
					
				gl_FragColor=diffuse_lighting+ specu_lighting;


			
			}
			` ;	
		
		
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

		gl.useProgram( this.prog );

		//----- attribute locations getting

		this.posLoc= gl.getAttribLocation(this.prog, 'pos');
		this.tcLoc = gl.getAttribLocation(this.prog, 'tc');
		this.normalLoc= gl.getAttribLocation(this.prog, 'normal');

		//------ uniform locations getting---- vertex shader
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.normalMVLoc= gl.getUniformLocation(this.prog, 'normalMV');
		this.mvLoc= gl.getUniformLocation(this.prog, 'mv');
		this.swap_yzLoc= gl.getUniformLocation(this.prog, 'swap_yz');
		

		//-----fragment shader
		this.showLoc= gl.getUniformLocation(this.prog, 'show');
		this.light_dirLoc= gl.getUniformLocation(this.prog, 'light_dir');
		this.light_colorLoc= gl.getUniformLocation(this.prog, 'light_color');
		this.specu_colorLoc= gl.getUniformLocation(this.prog, 'specu_color');
		this.light_intLoc=gl.getUniformLocation(this.prog, 'light_int');
		this.phong_expoLoc = gl.getUniformLocation(this.prog, 'phong_expo');
		this.hasTexLoc = gl.getUniformLocation(this.prog, 'hasTexture');
		gl.uniform1i(this.hasTexLoc,  0);


		

		gl.uniform1i(this.showLoc, 1); // set 'show' a true
		//gl.uniform1i( this.show, 1 ); 
	
		const lightColorLoc = gl.getUniformLocation(this.prog, "light_color");
		gl.uniform3f(lightColorLoc, 1.0, 1.0, 1.0);

		const specuColorLoc = gl.getUniformLocation(this.prog, "specu_color");
		gl.uniform3f(specuColorLoc, 1.0, 1.0, 1.0);

		const lightIntensityLoc = gl.getUniformLocation(this.prog, "light_int");
		gl.uniform1f(lightIntensityLoc, 1.0);


		//gl.uniform1i( this.show, 1 );
				
		

		
		//creating array buffer
		this.TriangleBuf = gl.createBuffer();
		this.TextureBuf = gl.createBuffer();
		this.NormalBuf=gl.createBuffer();

		this.swap_yzMatrix = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		];

		this.numTriangles=0;

		






	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		

		//every vertex has 3 params
		this.numTriangles = vertPos.length / 3;
		
		gl.useProgram(this.prog);
		
		//loading vertex pos in every buffer
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW );

		//loading textcoord in every buffer 
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW );
	
		//loading vertex normals in the vertex shader
		gl.bindBuffer(gl.ARRAY_BUFFER,this.NormalBuf)
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW );

		
	
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		
		//as in the prevoius hmw
		gl.useProgram(this.prog);
		if (swap){
			this.swap_yzMatrix = MatrixMult(
				[
					1,0,0,0,
					0,-1,0,0,
					0,0,1,0,
					0,0,0,1
				],
				[
					1,0,0,0,
					0,Math.cos(Math.PI/2),Math.sin(Math.PI/2),0,
					0,-Math.sin(Math.PI/2),Math.cos(Math.PI/2),0,
					0,0,0,1,
				]
			);
		}else{
			this.swap_yzMatrix = [
				1,0,0,0,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1
			]
		}

		
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );


		//----------- setting uniform params

		//passing transformation matrix uMPV
		gl.uniformMatrix4fv( this.mvpLoc, false, matrixMVP );

		// Pass the 4x4 model-view matrix ,to transform the pos in camera space
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);


		// Pass the 3x3 normal matrix ,to transform normals in camera space
		gl.uniformMatrix3fv(this.normalMVLoc, false, matrixNormal);

		//setting swap matrix as identity
		gl.uniformMatrix4fv(this.swap_yzLoc, false, this.swap_yzMatrix);


		//----------------setting vertex attributes

		//positions part
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TriangleBuf );
		gl.vertexAttribPointer( this.posLoc, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.posLoc );

		//texcoord part
		gl.bindBuffer( gl.ARRAY_BUFFER, this.TextureBuf);
		gl.vertexAttribPointer( this.tcLoc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.tcLoc );

		//normals part
		gl.bindBuffer(gl.ARRAY_BUFFER, this.NormalBuf);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalLoc);
		



		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{

		// as in the previous work///
		// [TO-DO] Bind the texture
		gl.useProgram(this.prog);

		let hasTexture = img ? 1 : 0;
		gl.uniform1i(this.hasTexLoc, hasTexture);

		const texture = gl.createTexture(); 
		gl.bindTexture(gl.TEXTURE_2D, texture);


		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		//now we set the texture params
		gl.generateMipmap(gl.TEXTURE_2D); 

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		

		//I activate the texture slot
		gl.activeTexture(gl.TEXTURE0); 
		//Binding the texture in the tecture slot above
		gl.bindTexture(gl.TEXTURE_2D, texture); 
		//using slot 0 (beacuse I activate texture0)
		
		gl.useProgram(this.prog);

		//taking loaction of 'tex' in the program
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex'); 
		//specification about which slot is the one to use(0)
		gl.uniform1i(samplerLoc, 0);


		/* this.texture_exist = true;
		gl.uniform1i( this.show, this.checkbox_show && this.texture_exist ) */;
	
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// as in the prevoius work
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		
		gl.useProgram( this.prog );
		gl.uniform1i( this.showLoc, show);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.light_dirLoc,x,y,z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.phong_expoLoc, shininess);
	}
}
