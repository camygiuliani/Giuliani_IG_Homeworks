// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	//Camilla solution ------------------
	//new variables make it easier
	const s=scale;

	//conversion from degrees to radiants, required for Math.cos and Math.sin functions
	const theta=rotation*(Math.PI/180);
    const cost=Math.cos(theta);
	const sint=Math.sin(theta);

	// new variables for positions to make it easier to read
	const x=positionX;
	const y=positionY;

	// we retrun a matrix 3x3 which does scaling, rotation and translation in the right order.
	// homogeneous coordinates are used so this allows us to represent everything,
	// including translation, in a single matrix.

	// about the rotation: it's around the Z-axis because we apply the transformation in the XY plane
	// column-major order is used 

	return Array( s*cost,s*sint,0,
                -s*sint,s*cost,0,
                x,y,1 );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	//Camilla solution ------------------
	let result = new Array(9);

	// here we perform matrix multiplication 
	// and it's important that we take into account that the order of the multiplication matters:
	// we want to apply first trans1 and then trans2
	//  so we have to  multiply in the order
	// trans2 * trans1
	// Since trans1 is applied first, it should be on the right side of the multiplication

    //creating the output array with the column-major order
	// we do this with the nested loops to iterate through the rows and columns of the resulting matrix
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            result[row + col * 3] =
                trans2[row + 0 * 3] * trans1[0 + col * 3] +
                trans2[row + 1 * 3] * trans1[1 + col * 3] +
                trans2[row + 2 * 3] * trans1[2 + col * 3];
        }
    }

    return result;
}
