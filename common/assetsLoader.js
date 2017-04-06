var assetsLoader = function(exports ){

    var xhr, bl, tl, queue, callback;
    exports.IMG = 0;
    exports.MOD = 1;
    exports.TXT = 2;
    exports.load = function( list, cb ){


        queue = list;
        callback = cb;

        bl = new THREE.BinaryLoader();
        tl = new THREE.TextureLoader();
        xhr = new XMLHttpRequest();
        xhr.onload = onLoad;

        loadNext();

    };

    function loadNext(){

        if( queue.length == 0 ){
            if( callback )callback();
            return;
        }

        if( queue[0].type == assetsLoader.IMG ){
            tl.load( queue[0].url, onLoad );
        }

        if( queue[0].type == assetsLoader.MOD ){
            bl.load( queue[0].url, onLoad );
        }

        if( queue[0].type == assetsLoader.TXT ){
            xhr.open( "GET", queue[0].url );
            xhr.send();
        }

    }

    function onLoad( e ){

        if( queue[0].type == assetsLoader.TXT ){
            exports[ queue[0].name ] = e.target.responseText;

        }else{
            exports[ queue[0].name ] = e;
        }

        if( queue[0].onLoad !== undefined ){
            queue[0].onLoad( exports[ queue[0].name ] );
        }

        queue.shift();
        loadNext();

    }

    return exports;

}({});