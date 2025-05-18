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
	//we initialize the color with Black
	vec3 color = vec3(0,0,0);

	//ambient lighting component--- we set it as 5% of teh diffuse color of the material
	vec3 ambient_col=mtl.k_d * 0.05;

	// to prevent floating-point inaccuracies
	float eps=3e-4;

	//we loop thorough all the lights in the scene
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TODO: Check for shadows

		// we create a ray and we cast it from the surface point to the current light
		Ray surface_to_light_ray;
		surface_to_light_ray.dir=normalize(lights[i].pos-position);

		//lights[i].pos-position is a vector starting from intersection point to the light 
		// then we normalize it to make it a 1-lenght vector

		// Offset the starting point slightly to prevent self-shadowing
        surface_to_light_ray.pos = position + (surface_to_light_ray.dir) * epsilon;

		//now we want to check if the shadow raw hits something , in that case the point is in shadow

		HitInfo hit={0.0,vec3(0.0),vec3(0.0),{vec3(0.0),vec3(0.0),0}};
		if(IntersectRay(hit,surface_to_light_ray)){
			//the point is in shadow so we displey the ambient color
			color+=ambient_col;
		}
		else{ 
			// TODO: If not shadowed, perform shading using the Blinn model

			 /** *********************
			 *! Blinnnn Phong 
			 **********************/

            // Direction from the surface to the light source
            vec3 lightDir = normalize(lights[i].position - position);

            // Calculate the cosine of the angle between the surface normal and the light direction
            float cosTheta = dot(normal, lightDir);

            // -------------------------
            // 1. Diffuse Component
            // -------------------------
            // Lambertian reflection model: k_d * I * max(0, cos(theta))
            vec3 diffuseComponent = mtl.k_d * lights[i].intensity * max(0.0, cosTheta);

            // -------------------------
            // 2. Specular Component
            // -------------------------
            // Blinn-Phong reflection model:
            // First, compute the half-angle vector (between view and light direction)
            vec3 halfAngle = normalize(view + lightDir);

            // Compute the cosine of the angle between the normal and the half-angle
            float cosAlpha = max(0.0, dot(normal, halfAngle));

            // Blinn-Phong specular reflection: k_s * I * (cos(α))^n
            vec3 specularComponent = mtl.k_s * lights[i].intensity * pow(cosAlpha, mtl.n);

            // -------------------------
            // 3. Accumulate the Light
            // -------------------------
            // Add ambient, diffuse, and specular components to the final color
            color += ambientComponent + diffuseComponent + specularComponent;


		}




		
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
		// TODO: Test for ray-sphere intersection
		// TODO: If intersection is found, update the given HitInfo

		// I take current sphere
		Sphere sphere=spheres[i];

		// Here I use the ray-sphere intersection formula for the discriminant
		float discriminant= pow((2*ray.dir*(ray.pos-sphere.center)),2) -
							4*pow(ray.dir,2)*(((ray.pos-sphere.center)*(ray.pos-sphere.center))-sphere.radius);
		
		// If the discriminant is non-negative, case in which I find the hit 
		if(discriminant>=0.0){ 

			// I want the closest ray-sphere intersection
			float t0=1.0;

			// If the intersection 
			// is in front of the ray's origin and is closer than previous hits, update HitInfo.
			if(t0> 0.0 && t0 <=hit.t){
				foundHit=true;

				// Update the closest intersection distance.
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