
var scene, camera, renderer, resolution, controls, materials, startTime, colors;

function init3D(){

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 36, window.innerWidth / window.innerHeight, 1, 10000 );

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setClearColor( new THREE.Color( 0x101010 ));
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild( renderer.domElement );

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    materials = {};
    startTime = Date.now();

    colors = "264653-2a9d8f-e9c46a-f4a261-e76f51".split('-').map( function( v ){ return parseInt( "0x" + v ); } );
    colors = colors.concat( "114b5f-456990-028090-79b473-70a37f".split('-').map( function( v ){ return parseInt( "0x" + v ); } ) );
    resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

    window.addEventListener( 'resize', onResize );
    onResize();

}

function onResize() {

    var w = window.innerWidth;
    var h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize( w, h );
    resolution.set( w, h );

}