/*
*   FBM method from shadertoy: https://www.shadertoy.com/view/XlXXz8
*/

float noise(vec3 p)
{
	return fract(sin(dot(p ,vec3(12.9898,78.233,126.7378))) * 43758.5453)*2.0-1.0;
}
float linear3D(vec3 p)
{
	vec3 p0 = floor(p);
	vec3 p1x = vec3(p0.x+1.0, p0.y, p0.z);
	vec3 p1y = vec3(p0.x, p0.y+1.0, p0.z);
	vec3 p1z = vec3(p0.x, p0.y, p0.z+1.0);
	vec3 p1xy = vec3(p0.x+1.0, p0.y+1.0, p0.z);
	vec3 p1xz = vec3(p0.x+1.0, p0.y, p0.z+1.0);
	vec3 p1yz = vec3(p0.x, p0.y+1.0, p0.z+1.0);
	vec3 p1xyz = p0+1.0;

	float r0 = noise(p0);
	float r1x = noise(p1x);
	float r1y = noise(p1y);
	float r1z = noise(p1z);
	float r1xy = noise(p1xy);
	float r1xz = noise(p1xz);
	float r1yz = noise(p1yz);
	float r1xyz = noise(p1xyz);

	float a = mix(r0, r1x, p.x-p0.x);
	float b = mix(r1y, r1xy, p.x-p0.x);
	float ab = mix(a, b, p.y-p0.y);
	float c = mix(r1z, r1xz, p.x-p0.x);
	float d = mix(r1yz, r1xyz, p.x-p0.x);
	float cd = mix(c, d, p.y-p0.y);

	float res = mix(ab, cd, p.z-p0.z);

	return res;
}

float fbm(vec3 p)
{
	float f = 0.5000*linear3D(p*1.0);
		  f+= 0.2500*linear3D(p*2.01);
		  f+= 0.1250*linear3D(p*4.02);
		  f+= 0.0625*linear3D(p*8.03);
		  f/= 0.9375;
	return f;
}

uniform float time;
varying vec3 e;
varying vec3 n;
void main() {


    float t = time * 0.1;

    vec3 nt = vec3(cos( time * .1 ), sin( time * .1 ), time * .1 );
    float d = fbm( position * .1 + nt * 2. );

    vec3 pos = position + d;

    e = normalize( vec3( modelViewMatrix * vec4( pos, 1.0 ) ) );
    n = normalize( normalMatrix * normal );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1. );

}