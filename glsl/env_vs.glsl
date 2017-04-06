varying float vY;
void main() {

    vY = position.y + .5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );


}