// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	const s=scale;
	//conversion from degrees to radiants
	const theta=rotation*(Math.PI/180);
	const cost=Math.cos(theta);
	const sint=Math.sin(theta);
	const x=positionX;
	const y=positionY;
	return Array( s*cost,s*sint,0,-s*sint,s*cost,0,x,y,1 );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	let result = new Array(9);

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
