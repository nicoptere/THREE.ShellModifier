
THREE.ShellModifier = function(){};
/**
 * creates a "shell" (surface extrusion) from a non manifold surface at a given distance
 * @param geometry the source mesh
 * @param offset the distance at which to create the shell
 * @returns {*|BufferGeometry} a new geometry
 */
THREE.ShellModifier.prototype.modify = function(geometry, offset ){

    //converts to BufferGeometry
    var g = geometry;
    if( geometry.type === "Geometry" ){
        g = new THREE.BufferGeometry().fromGeometry( geometry );
    }

    //make sure we have adjacency information
    g.toIndexed();

    //retireves the indices
    var indices = g.index.array;

    //retrieve the geometry data
    var positions = g.getAttribute('position').array;

    //we'll need the normals
    g.computeVertexNormals();
    var normals = g.getAttribute('normal').array;

    //eventually store the uvs
    var uvs;
    var hasUV = g.getAttribute('uv') !== undefined;
    if (hasUV) uvs = g.getAttribute('uv').array;

    //buffers for the output geometry
    var faceCount = indices.length;
    var vertexCount = positions.length / 3;

    var newIndices = [];
    var newPositions = [];
    var newNormals = [];

    var newUvs, i2;
    if (hasUV)newUvs = [];

    var vertices = [];
    var v = new THREE.Vector3();
    for( var i = 0; i < positions.length; i += 3 ){

        v.x = positions[i];
        v.y = positions[i+1];
        v.z = positions[i+2];

        //output vertices buffer
        newPositions.push(v.x, v.y, v.z);

        //work vertices pool
        vertices.push( v.clone() );

        //normals output buffer
        newNormals.push( normals[i],normals[i+1],normals[i+2] );

        if (hasUV) {
            i2 = parseInt(i / 3) * 2;
            newUvs.push(uvs[i2], uvs[i2 + 1]);
        }

    }
    //topological information
    var adjacent = [];
    var sides = [];
    for( i = 0; i < faceCount; i += 3) {

        var a = indices[ i ];
        var b = indices[ i + 1 ];
        var c = indices[ i + 2 ];

        //we can already build most of the new indices

        //flip the current face
        newIndices.push(a, c, b);

        //adds a new face that will use the new vertices
        newIndices.push(a + vertexCount, b + vertexCount, c + vertexCount);

        //finds the adjacency of this triangle
        adjacent = [];

        for (var j = 0; j < faceCount; j += 3) {

            if( i == j )continue;

            var oa = indices[ j ];
            var ob = indices[ j + 1 ];
            var oc = indices[ j + 2 ];

            //the current face & the other share an edge if:
            if (a == oa && b == oc)adjacent.push([a, b, c]);
            if (a == oc && b == ob)adjacent.push([a, b, c]);
            if (a == ob && b == oa)adjacent.push([a, b, c]);

            if (b == oa && c == oc)adjacent.push([b, c, a]);
            if (b == oc && c == ob)adjacent.push([b, c, a]);
            if (b == ob && c == oa)adjacent.push([b, c, a]);

            if (c == oa && a == oc)adjacent.push([c, a, b]);
            if (c == oc && a == ob)adjacent.push([c, a, b]);
            if (c == ob && a == oa)adjacent.push([c, a, b]);


        }

        // finds the open edge:
        // if the adjacency list is not equal to 3, the triangle has an open edge
        if( adjacent.length <= 2 ){

            var sol = [], res;

            //3 sides must be rebuilt
            if( adjacent.length == 0 ){

                sides.push( [a,b,c] );
                sides.push( [b,c,a] );
                sides.push( [c,a,b] );

            }
            //2 sides must be rebuilt
            else if( adjacent.length == 1 ){
                sides.push( [adjacent[0][2], adjacent[0][1], adjacent[0][0]] );
                sides.push( [adjacent[0][2], adjacent[0][0], adjacent[0][1]] );
            }
            //one side lmust be rebuilt:
            // finds and removes the common vertex from the 2 edges
            else if( adjacent.length == 2 )
            {
                res = [adjacent[0][0], adjacent[0][1], adjacent[1][0], adjacent[1][1]];
                res.forEach(function(v){
                    if( sol.indexOf(v) != -1 ){
                        sol.splice( sol.indexOf(v), 1 );
                        sol.push( v );
                        return;
                    }
                    sol.unshift(v);
                });

                // sol contains the indices of the open edge as 0 & 1
                // + the id of the third vertex of the triangle as 2
                sides.push( sol );
            }

        }
    }

    //computes the extruded location of the new vertices
    var n = new THREE.Vector3();
    for( i = 0; i < vertexCount; i++  ){

        //this the current position
        v.copy( vertices[i] );

        n.x = normals[i*3];
        n.y = normals[i*3+1];
        n.z = normals[i*3+2];
        n.normalize();

        //adds the raw normals coordinates
        newNormals.push(n.x, n.y, n.z);

        //this is the new, extruded vertex position
        n.multiplyScalar( offset ).add(v);

        //adds the raw coordinates
        newPositions.push(n.x, n.y, n.z);

        //creates a new vertex to compute the sides orientation
        vertices.push(n.clone());

        //stores the uvs if needed
        if (hasUV) {
            i2 = parseInt(i / 3) * 2;
            newUvs.push(uvs[i2], uvs[i2 + 1]);
        }
    }

    //builds the sides faces
    var va = new THREE.Vector3();
    var vb = new THREE.Vector3();
    var vc = new THREE.Vector3();
    sides.forEach(function (side) {

        var i0 = side[0];
        var i1 = side[1];
        var n0 = side[0] + vertexCount;
        var n1 = side[1] + vertexCount;

        //determines how to build the new faces:

        //compute the new face normal
        va.copy(vertices[i0]);
        vb.copy(vertices[i1]).sub(va);
        vc.copy(vertices[n0]).sub(va);
        var n = vb.cross(vc).normalize();

        //check if the 3rd point of the triangle is in front of or behind the new face
        va.sub(vertices[side[2]]).normalize();

        //and switch the indices
        if (n.dot(va) >= 0) {
            newIndices.push(
                i0, n1, n0,
                i0, i1, n1
            );
        } else {
            newIndices.push(
                i0, n0, n1,
                i0, n1, i1
            );
        }

    });

    g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
    g.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormals), 3));
    if (hasUV)g.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(newUvs), 2));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
    return g;

};

/**
 * method to re-index flat BufferGeometries (mostly to provide adjacency data)
 */
THREE.BufferGeometry.prototype.toIndexed = function(){

    var bufferGeometry = this;
    var raw_positions = bufferGeometry.getAttribute( 'position' ).array;

    var raw_uvs;
    var hasUV = bufferGeometry.getAttribute( 'uv' ) !== undefined;
    if( hasUV ) raw_uvs = bufferGeometry.getAttribute( 'uv' ).array;

    var raw_normals;
    var hasNormal = bufferGeometry.getAttribute( 'normal' ) !== undefined;
    if( hasNormal ) raw_normals = bufferGeometry.getAttribute( 'normal' ).array;

    // stores a merged index
    var indices = [];
    var vertices = [];
    var normals = [];
    var uvs = [];

    //tmp vars
    var face, face_normalss, face_uvs, tmp_indices;

    var v0 = new THREE.Vector3();
    var v1 = new THREE.Vector3();
    var v2 = new THREE.Vector3();

    var n0 = new THREE.Vector3();
    var n1 = new THREE.Vector3();
    var n2 = new THREE.Vector3();

    var uv0 = new THREE.Vector2();
    var uv1 = new THREE.Vector2();
    var uv2 = new THREE.Vector2();

    //make vertices unique and get add their uid to the indices array
    for( var i = 0; i < raw_positions.length; i += 9 ){

        v0.x = raw_positions[i];
        v0.y = raw_positions[i+1];
        v0.z = raw_positions[i+2];

        v1.x = raw_positions[i+3];
        v1.y = raw_positions[i+4];
        v1.z = raw_positions[i+5];

        v2.x = raw_positions[i+6];
        v2.y = raw_positions[i+7];
        v2.z = raw_positions[i+8];

        face = [v0,v1,v2];

        if( hasNormal ){

            n0.x = raw_normals[i];
            n0.y = raw_normals[i+1];
            n0.z = raw_normals[i+2];

            n1.x = raw_normals[i+3];
            n1.y = raw_normals[i+4];
            n1.z = raw_normals[i+5];

            n2.x = raw_normals[i+6];
            n2.y = raw_normals[i+7];
            n2.z = raw_normals[i+8];

            face_normalss = [n0,n1,n2];

        }

        if( hasUV ){

            uv0.x = raw_uvs[i];
            uv0.y = raw_uvs[i+1];

            uv1.x = raw_uvs[i+2];
            uv1.y = raw_uvs[i+3];

            uv2.x = raw_uvs[i+4];
            uv2.y = raw_uvs[i+5];

            face_uvs = [uv0,uv1,uv2];

        }

        tmp_indices = [];

        face.forEach( function( v, i ){

            var id = exists( v, vertices );
            if( id == -1 ){

                id = vertices.length;
                vertices.push( v.clone() );

                if( hasNormal )normals.push( face_normalss[ i ].clone() );
                if( hasUV )uvs.push( face_uvs[ i ].clone() );

            }
            tmp_indices.push( id );

        });

        indices.push( tmp_indices[0], tmp_indices[1], tmp_indices[2] );

    }

    //convert arrays to buffers:
    var positionBuffer = new Float32Array( vertices.length * 3 );
    if( hasNormal ) var normalBuffer = new Float32Array( vertices.length * 3 );
    if( hasUV ) var uvBuffer = new Float32Array( vertices.length * 2 );

    //feed the data
    var i2 = 0;
    var i3 = 0;
    for( i = 0; i < vertices.length; i++ ){

        i3 = i * 3;

        positionBuffer[i3] = vertices[ i ].x;
        positionBuffer[i3+1] = vertices[ i ].y;
        positionBuffer[i3+2] = vertices[ i ].z;

        if( hasNormal ){

            normalBuffer[i3]    = normals[ i ].x;
            normalBuffer[i3+1]  = normals[ i ].y;
            normalBuffer[i3+2]  = normals[ i ].z;

        }

        if( hasUV ){

            i2 = i * 2;
            uvBuffer[i2]    = uvs[ i ].x;
            uvBuffer[i2+1]  = uvs[ i ].y;

        }

    }

    // rebuild an IndexedBufferGeometry
    bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positionBuffer, 3 ) );
    if( hasNormal ) bufferGeometry.addAttribute( 'normal', new THREE.BufferAttribute( normalBuffer, 3 ) );
    if( hasUV ) bufferGeometry.addAttribute( 'uv', new THREE.BufferAttribute( uvBuffer, 2 ) );
    bufferGeometry.setIndex(new THREE.BufferAttribute( new Uint32Array(indices), 1 ) );
    return bufferGeometry;

    /**
     * checks if a vertex exists in an array
     * @param v vertex to chack
     * @param vertices list of existing vertices
     * @returns {number} the id of the vertex in the array or -1
     */
    function exists( v, vertices ){
        for( var i = 0; i < vertices.length; i++ ){
            if( v.equals( vertices[i] ) )return i;
        }
        return -1;
    }
};