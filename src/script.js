/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
// import FlyingCube from './cube.js'
// import { getSize } from './cube.js'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// CUBE SIZE
const SIZE = 2;

// VOLUME: define invisible volume cubes float around in
const BOUNDS = SIZE * 10;

///////////////////////////////////////////////////////////////////////
// COLORS: define random colors for the session
function defineColors() {
    var colors = []
    for(var i = 0; i < 6; i++) {
        colors.push(new THREE.MeshLambertMaterial( {color: 'lightgrey'}));
        colors[i].color.setRGB(Math.random(), Math.random(), Math.random());
    }
    return colors;
}
// all cubes use the same colors
const COLORS = defineColors();

class FlyingCube {
    #x;
    #y;
    #z;
    constructor(scene, x, y, z) {
        
        // TODO: delete all of this since position holds all three? just make cube private?
        this.#x = x;
        this.#y = y;
        this.#z = z;

        this.getX = function() {
            return this.#x ? this.#x : 0;
        };

        this.getY = function() {
            return this.#y ? this.#y : 0;
        };

        this.getZ = function() {
            return this.#z ? this.#z : 0;
        };

        /// add cube
        const geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE); 
        this.cube = new THREE.Mesh(geometry, COLORS); 
        this.cube.position.x = x;
        this.cube.position.y = y;
        this.cube.position.z = z;
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


/////////////////////////////////////////////////////////////////////////
///// Define Cubes
function randomCoord() {
    return Math.random() * BOUNDS - BOUNDS / 2;
}

var cubes = []
for (var i = 0; i < 5; i++) {
    cubes.push(new FlyingCube(scene, randomCoord(), randomCoord(), randomCoord()))
    scene.add(cubes[i].cube);
}


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