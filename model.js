

var mesh;
window.onload = function(){
	var queue = [

		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",			type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",			type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},
		{
			name: "matCap",
			url: "img/old_gold.png",type:assetsLoader.IMG
		},
        {
            name: "shellModel",
            url: "models/shell.js",type:assetsLoader.MOD
        }
	];
	assetsLoader.load(queue, init);
};

function init() {

    init3D();
	camera.position.set( 0,0, -250 );

	createLightsAndMaterials();

    computeMesh();

    render();

}

function createLightsAndMaterials(){

	var l = new THREE.PointLight();
	l.position.y = 250;
	scene.add( l );

    l = new THREE.PointLight();
    l.position.x = -125;
    l.position.y = -250;
    scene.add( l );

    l = new THREE.PointLight();
    l.position.x = 125;
    l.position.z = 125;
    scene.add( l );

    startTime = Date.now();

	materials.shell = new THREE.ShaderMaterial({
		uniforms:{
			tMatCap : {type:"t", value:assetsLoader.matCap },
			time:{type:"f", value:0 },
			alpha:{type:"f", value:1 }
		},
		vertexShader:assetsLoader.sem_vs,
		fragmentShader:assetsLoader.sem_fs,
		transparent: true
	});

	materials.environment = new THREE.ShaderMaterial({
		uniforms : {
			horizon:{type:"f", value: .45 },
			spread:{type:"f", value: .05 },
			topColor:{type:"v3", value:new THREE.Color( 0xBBBBBB )},
			bottomColor:{type:"v3", value:new THREE.Color( 0xEEEEEE )}
		},
		vertexShader:	assetsLoader.env_vs,
		fragmentShader:	assetsLoader.env_fs,
		side:THREE.BackSide,
		depthWrite:false
	});

}

function computeMesh() {

	var g = new THREE.BufferGeometry().fromGeometry( assetsLoader.shellModel );
	//shell modifer
	var sm = new THREE.ShellModifier();
	g = sm.modify( g, 5 );

	//subdivision modifier:
	//https://github.com/mrdoob/three.js/blob/dev/examples/js/modifiers/BufferSubdivisionModifier.js
	var smooth = new THREE.BufferSubdivisionModifier( 2 );
	g = smooth.modify(  new THREE.Geometry().fromBufferGeometry( g ) );

	mesh = new THREE.Mesh( g, materials.shell );
	scene.add( mesh );

	//adds environment
    var env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
    env.scale.multiplyScalar(500);
    scene.add( env );

}

function render() {

	requestAnimationFrame( render );
	controls.update();

	var time = ( Date.now() - startTime ) * 0.001;
	for( var k in materials ){
		if( materials[ k ].uniforms !== undefined && materials[ k ].uniforms.time !== undefined ){
			materials[ k ].uniforms.time.value = time;
		}
	}

	renderer.render( scene, camera );

}
