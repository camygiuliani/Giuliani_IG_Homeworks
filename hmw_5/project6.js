var raytraceFS = /*glsl*/ `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	// diffuse coefficient
	vec3  k_d;	
	// specular coefficient
	vec3  k_s;	
	// specular exponent
	float n;	
};

struct Sphere {
	//center of the sphere
	vec3     center;
	//raggio della sfera
	float    radius;
	//material della sphere
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};



struct HitInfo {
	// Distance from the ray's origin to the intersection point
	float    t;
	//posizion of the hitting point
	vec3     position;
	//normal surface in the hitting point
	vec3     normal;
	//material of the hitting point
	Material mtl;
};

//array with all the spheres in the scene
uniform Sphere spheres[ NUM_SPHERES ];
//array with all the lights in the scene
uniform Light  lights [ NUM_LIGHTS  ];
//environment map for reflecions
uniform samplerCube envMap;

// Maximum number of bounces allowed for ray tracing
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );


// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		// TO-DO: If not shadowed, perform shading using the Blinn model
		color += mtl.k_d * lights[i].intensity;	// change this line
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	// wei nitialize the intersection distance to a veeeery large number,
	// this respresents the distance along the ray where the intersection is found.
	hit.t = 1e30;

	//bolean to understand if the intersection was found
	bool foundHit = false;


	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// TO-DO: Test for ray-sphere intersection
		// TO-DO: If intersection is found, update the given HitInfo

		// I take one sphere
		Sphere sphere=spheres[i];

		float discriminant= 1; //// TODO
		
		if(discriminant>=0.0){ // case in which I find the hit 

			// I want the closest ray-sphere intersection
			float t0=1;

			if(t0> 0.0 && t0 <=hit.t){
				foundHit=true;
				hit.t= t0;
				hit.position=ray.pos + (ray.dir * t0);
				hit.mtl=sphere.mtl;
				hit.normal= normalize((hit.position - sphere.center)/sphere.radius );

			}


		}

	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				// TO-DO: Update the loop variables for tracing the next reflection ray
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;