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
// NORMAL SIZE
const NORM_SIZE = 0.1;

// VOLUME: define invisible volume cubes float around in
const BOUNDS = SIZE * 10;

///////////////////////////////////////////////////////////////////////
// COLORS: define random colors for the session
function defineColors() {
    var colors = []
    // for(var i = 0; i < 6; i++) {
    //     colors.push(new THREE.MeshLambertMaterial( {color: 'lightgrey'}));
    //     colors[i].color.setRGB(Math.random(), Math.random(), Math.random());
    // }

    colors.push(new THREE.MeshLambertMaterial( {color: 'yellow'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'green'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'red'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'blue'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'pink'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'black'}));

    return colors;
}
// all cubes use the same colors
const COLORS = defineColors();

class FlyingCube {
    #cube;
    #normals;
    constructor(scene, x, y, z) {
        /// add cube
        const geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE); 
        this.#cube = new THREE.Mesh(geometry, COLORS); 
        this.#cube.position.x = x;
        this.#cube.position.y = y;
        this.#cube.position.z = z;

        // getter function
        // TODO maybe we just need to provide position and flying cube translates its whole being
        this.getCube = function() {
            return this.#cube;
        }

        // define normals, one for each face
        this.#normals = []

        var normalGeo = new THREE.BoxGeometry(SIZE, NORM_SIZE, NORM_SIZE);  
        var normal = new THREE.Mesh(normalGeo, COLORS[0]); 
        normal.position.x = x + SIZE / 2;
        normal.position.y = y;
        normal.position.z = z;
        scene.add(normal)

        var normalGeo = new THREE.BoxGeometry(SIZE, NORM_SIZE, NORM_SIZE);  
        var normal = new THREE.Mesh(normalGeo, COLORS[1]); 
        normal.position.x = x - SIZE / 2;
        normal.position.y = y;
        normal.position.z = z;
        scene.add(normal)

        var normalGeo = new THREE.BoxGeometry(NORM_SIZE, SIZE, NORM_SIZE);  
        var normal = new THREE.Mesh(normalGeo, COLORS[2]); 
        normal.position.x = x;
        normal.position.y = y + SIZE / 2;
        normal.position.z = z;
        scene.add(normal)

        var normalGeo = new THREE.BoxGeometry(NORM_SIZE, SIZE, NORM_SIZE);  
        var normal = new THREE.Mesh(normalGeo, COLORS[3]); 
        normal.position.x = x;
        normal.position.y = y - SIZE / 2;
        normal.position.z = z;
        scene.add(normal)

        var normalGeo = new THREE.BoxGeometry(NORM_SIZE, NORM_SIZE, SIZE);  
        var normal = new THREE.Mesh(normalGeo, COLORS[4]); 
        normal.position.x = x;
        normal.position.y = y;
        normal.position.z = z + SIZE / 2;
        scene.add(normal)

        var normalGeo = new THREE.BoxGeometry(NORM_SIZE, NORM_SIZE, SIZE);  
        var normal = new THREE.Mesh(normalGeo, COLORS[5]); 
        normal.position.x = x;
        normal.position.y = y;
        normal.position.z = z - SIZE / 2;
        scene.add(normal)



        // for (var i = 0; i < colors.length) {
        //     #normals.push(new THREE.Mesh(normalGeo, colors[i]); 
        // }

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
    scene.add(cubes[i].getCube());
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