
uniform vec3 bottomColor;
uniform vec3 topColor;
uniform float horizon;
uniform float spread;
varying float vY;
void main()
{

    float val = smoothstep( horizon-spread, horizon+spread, vY );
    gl_FragColor = vec4( mix( bottomColor, topColor, val ), 1. );


}