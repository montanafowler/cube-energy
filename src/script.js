/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
// import FlyingCube from './cube.js'
// import { getSize } from './cube.js'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const SIZE = 5;

// define colors for the session
function defineColors() {
    var colors = []
    for(var i = 0; i < 6; i++) {
        console.log(i);
        colors.push(new THREE.MeshLambertMaterial( {color: 'lightgray'}));
        colors[i].color.setRGB(Math.random(), Math.random(), Math.random());
    }
    return colors;
}
const COLORS = defineColors();


class FlyingCube {
    #x;
    #y;
    constructor(scene, x, y) {
        this.#x = x;
        this.#y = y;

        this.getX = function() {
            return this.#x ? this.#x : 0;
        };

        this.getY = function() {
            return this.#y ? this.#y : 0;
        };

        /// add cube
        const geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE); 
        // const colors = [
        //     new THREE.MeshLambertMaterial( {color: 'lightgray'}),
        //     new THREE.MeshLambertMaterial( {color: 'lightgray'}),
        //     new THREE.MeshLambertMaterial( {color: 'lightgray'}),
        //     new THREE.MeshLambertMaterial( {color: 'lightgray'}),
        //     new THREE.MeshLambertMaterial( {color: 'lightgray'}),
        //     new THREE.MeshLambertMaterial( {color: 'lightgray'}),
        // ]

        this.cube = new THREE.Mesh(geometry, COLORS); 
        // scene.add(cube);
        // this.cube = cube

        // function to set random colors of cube sides
        // for( var i=0; i<6; i++ )
        //     this.cube.material[i].color.setRGB( Math.random(), Math.random(), Math.random() );
    }
}


/////////////////////////////////////////////////////////////////////////
///// DIV CONTAINER CREATION TO HOLD THREEJS EXPERIENCE
const container = document.createElement('div')
document.body.appendChild(container)

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION
const scene = new THREE.Scene()
scene.background = new THREE.Color('#c8f0f9')

/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG
const renderer = new THREE.WebGLRenderer({ antialias: true}) // turn on antialias
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //set pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen
renderer.outputEncoding = THREE.sRGBEncoding // set color encoding
container.appendChild(renderer.domElement) // add the renderer to html div

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 100)
camera.position.set(34,16,-20)
scene.add(camera)

/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN
window.addEventListener('resize', () => {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.setPixelRatio(2)
})

/////////////////////////////////////////////////////////////////////////
///// CREATE ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement)

/////////////////////////////////////////////////////////////////////////
///// SCENE LIGHTS
const ambient = new THREE.AmbientLight(0xa0a0fc, 0.82)
scene.add(ambient)

const sunLight = new THREE.DirectionalLight(0xe8c37b, 1.96)
sunLight.position.set(-69,44,14)
scene.add(sunLight)


// /// add cube
// const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
// // const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
// const colors = [
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//       ]

// const cube = new THREE.Mesh( geometry, colors ); 
// scene.add( cube );

// // function to set random colors of cube sides
// for( var i=0; i<6; i++ )
//     cube.material[i].color.setRGB( Math.random(), Math.random(), Math.random() );

const cube2 = new FlyingCube(scene, 5, 5);
scene.add(cube2.cube)
//var x = cube2.getX();
console.log(cube2.getX());

// var object = new THREE.Mesh(
//             new THREE.BoxGeometry( 2, 2, 2 ),
//       [
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//             new THREE.MeshLambertMaterial( {color: 'lightgray'}),
//       ]
//     );  
//         scene.add( object );


// trigger recoloring each second

// setInterval( recolor, 1000 );


// // function to set random colors of cube sides
// function recolor( )
// {
//     for( var i=0; i<6; i++ )
//         object.material[i].color.setHSL( Math.random(), 1, 0.5 );
// }


/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    TWEEN.update() // update animations

    controls.update() // update orbit controls

    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function
    
}

// const colors = defineColors()
rendeLoop() //start rendering