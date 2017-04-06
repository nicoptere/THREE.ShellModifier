

var mesh, ref;
var SPHERE = 0;
var TORUS  = 1;
var KNOT   = 2;
var params;

window.onload = function(){
	var queue = [

		{name: "sem_vs", 		url: "./glsl/sem_vs.glsl",			type:assetsLoader.TXT	},
		{name: "sem_fs", 		url: "./glsl/sem_fs.glsl",			type:assetsLoader.TXT	},
        {name: "env_vs", 		url: "./glsl/env_vs.glsl",			type:assetsLoader.TXT	},
        {name: "env_fs", 		url: "./glsl/env_fs.glsl",			type:assetsLoader.TXT	},
		{
			name: "matCap",
			url: "img/droplet_01.png",type:assetsLoader.IMG
		}
	];
	assetsLoader.load(queue, init);
};

function init() {

    init3D();
	camera.position.set( 0,0, -200 );

	createLightsAndMaterials();

	var env = new THREE.Mesh(new THREE.CylinderBufferGeometry(.5, .5, 1, 64), materials.environment);
	env.scale.multiplyScalar(500);
	scene.add( env );

    //settings

	params = {
		type: 0,
		lastType: -1,
		thickness : 3,
        lastThickness:-1,
        subdivisions : 2,
        lastSubdivisions:-1,
		seed: 0.8,
        noiseScale: 0.025,
        source: false,
		reset: function( check ){
		    if( Boolean( check )){

                if( params.type == params.lastType
                &&  params.thickness == params.lastThickness
                &&  params.subdivisions == params.lastSubdivisions )return;

            }
		    console.log('reset');
            params.lastType = params.type;
            params.lastThickness = params.thickness;
            params.lastSubdivisions = params.subdivisions;

            if( Boolean(check) )params.seed = Math.random();

			computeMesh( params.type, params.thickness, params.subdivisions );
		}
	};
	var gui = new dat.GUI();
	gui.add(params, 'type', 0, 2, 1 ).name( 'primitive' ).onChange(function(){params.reset(true);});
	gui.add(params, 'thickness', 0,16, .5 ).onChange(function(){params.reset(true);});
	gui.add(params, 'subdivisions', 0,4, 1 ).onChange(function(){params.reset(true);});
	gui.add(params, 'noiseScale', 0.001, .1, 0.001).onChange(function(){params.reset();});
	gui.add(params, 'source').name('view base mesh').onChange(function(){ref.visible = params.source;});

    params.reset();
    // computeMesh();

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

	materials.wire = new THREE.MeshPhongMaterial({
		color:0xFFFFFF,
		transparent:true,
		opacity:1,
		wireframe:true
	});

	materials.blue = new THREE.MeshPhongMaterial({
		color:0x0066CC,
		side:THREE.DoubleSide,
		transparent:true,
		opacity:1
	} );

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

function computeMesh(geomId, thickness, smoothSubdivisions ) {

	geomId = geomId || 0;
	thickness = thickness || 3;
	smoothSubdivisions = smoothSubdivisions || 1;

	if( mesh != null ){
		scene.remove( mesh );
		mesh.geometry.dispose();
	}
    if( ref != null ){
        scene.remove( ref );
        ref.geometry.dispose();
    }

	var sphereRadius = 35;
	var g;
	if( geomId == SPHERE ) g = new THREE.IcosahedronBufferGeometry( sphereRadius, 3 );
	if( geomId == TORUS  ) g = new THREE.TorusBufferGeometry( sphereRadius, 12, 64,12, Math.PI * 1.5 );
	if( geomId == KNOT   ) g = new THREE.TorusKnotBufferGeometry( sphereRadius, 6, 48, 12, 2, 3 );

    ref = new THREE.Mesh( g, materials.wire );
    ref.visible = params.source;
    scene.add( ref );

	if( g.index == null )g.toIndexed();
	var pos = g.getAttribute('position').array;

	var v0 = new THREE.Vector3();
	var v1 = new THREE.Vector3();
	var v2 = new THREE.Vector3();

	var positions = [];
	var indices = [];
	var i0, i1, i2, id = 0;

	var simplex = new SimplexNoise();//{random:function(){return params.seed;}});
	var scale = params.noiseScale;
	//remove faces from the geometry
	for( i = 0; i < g.index.array.length; i+=3 ){

		//points indices
		i0 = g.index.array[i] * 3;
		i1 = g.index.array[i+1] * 3;
		i2 = g.index.array[i+2] * 3;

		//triangle points
		v0.set( pos[i0],  pos[i0+1],  pos[i0+2] );
		v1.set( pos[i1],  pos[i1+1],  pos[i1+2] );
		v2.set( pos[i2],  pos[i2+1],  pos[i2+2] );

        //noise
		var inside = ( simplex.noise3D( v0.x * scale, v1.y * scale, v2.z * scale, Date.now() ) ) < 0.;
		if( inside ){
			positions.push(  v0.x, v0.y, v0.z );
			positions.push(  v1.x, v1.y, v1.z );
			positions.push(  v2.x, v2.y, v2.z );
			indices.push(  id++, id++, id++ );
		}
	}
	g.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
	g.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

	//shell modifer
	var sm = new THREE.ShellModifier();
	g = sm.modify( g, thickness );

	//subdivision modifier:
	//https://github.com/mrdoob/three.js/blob/dev/examples/js/modifiers/BufferSubdivisionModifier.js
    if( params.subdivisions != 0 ){

        var smooth = new THREE.BufferSubdivisionModifier( smoothSubdivisions );
        g = smooth.modify(  new THREE.Geometry().fromBufferGeometry( g ) );

        mesh = new THREE.Mesh( g, materials.shell );
        scene.add( mesh );
    }else{
        mesh = new THREE.Mesh( g, materials.blue );
        scene.add( mesh );
    }


}

function reset(){

	computeMesh( 2, 5, 2 );

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
