/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
// import FlyingCube from './cube.js'
// import { getSize } from './cube.js'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


////// TODOS
// write tests
// remove unecessary files
// upload to link page
// move cubes along trajectories in the bounds
// rotation on all axis
// readme documentation
// remove commented code
// question about normals local/global coordinates will be answered when animating
// Whenever a normal or face of cube A touches a normal or face of cube B, 
// of the same color, those normals will become collinear and the cubes involved 
// will form a rigid "molecule", and continue to travel in the invisible volume 
// (on a linear trajectory, and rotating around the center of the molecule).
// As an additional challenge, one could insert new atoms in the scene, 
// either floating (when clicking in empty space) or merged into the molecule (when clicking on a compatible face).


// CUBE SIZE
const CUBE_SIZE = 2;
// NORMAL SIZE
const NORM_SIZE = 0.1;

// VOLUME: define invisible volume cubes float around in
const BOUNDS = CUBE_SIZE * 10;

///////////////////////////////////////////////////////////////////////
// COLORS: define random colors for the session
function defineColors() {
    var colors = []
    for(var i = 0; i < 6; i++) {
        colors.push(new THREE.MeshLambertMaterial( {color: 'lightgrey'}));
        colors[i].color.setRGB(Math.random(), Math.random(), Math.random());
    }

    // TEST COLORS, todo delete
    // colors.push(new THREE.MeshLambertMaterial( {color: 'yellow'}));
    // colors.push(new THREE.MeshLambertMaterial( {color: 'green'}));
    // colors.push(new THREE.MeshLambertMaterial( {color: 'red'}));
    // colors.push(new THREE.MeshLambertMaterial( {color: 'blue'}));
    // colors.push(new THREE.MeshLambertMaterial( {color: 'pink'}));
    // colors.push(new THREE.MeshLambertMaterial( {color: 'black'}));

    return colors;
}
// all cubes use the same colors
const COLORS = defineColors();

class FlyingCube {
    #cube;
    #normals;

    /*
     * build the normal for the face given the provided axis to change, and the direction
     *
     * axisToChange: a Vector3 with a 1.0 of which axis to change and a 0.0 for each unchanged axis
     * direction: -1.0 or 1.0 to shift the normal along the axis in the correct direction for the face
     * return: the normal mesh in the correct position for the cube
    */
    static buildNormal(cubePosition, axisToChange, direction, color) {

        // question: how does this work with animation if we are sizing with global coordinates?
        // is animating based off of tranlation/rotation matricies going to be enough or is there a
        // way to determine relative local coordinates based on the cube in three.js

        // size the normal based off of which axis it points out of
        let xSize = axisToChange.x > 0.0 ? CUBE_SIZE : NORM_SIZE;
        let ySize = axisToChange.y > 0.0 ? CUBE_SIZE : NORM_SIZE;
        let zSize = axisToChange.z > 0.0 ? CUBE_SIZE : NORM_SIZE;
        let normalGeo = new THREE.BoxGeometry(xSize, ySize, zSize);  
        
        let normal = new THREE.Mesh(normalGeo, color); 

        normal.position.x = cubePosition.x + CUBE_SIZE / 2.0 * axisToChange.x * direction;
        normal.position.y = cubePosition.y + CUBE_SIZE / 2.0 * axisToChange.y * direction;
        normal.position.z = cubePosition.z + CUBE_SIZE / 2.0 * axisToChange.z * direction;

        console.log(normal.geometry.boundingBox);
        return normal;
    }

    constructor(scene, x, y, z) {
        // group with normals

        /// add cube
        const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE); 
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

        // face 0, +X
        let normal = FlyingCube.buildNormal(new THREE.Vector3(x, y, z), new THREE.Vector3(1.0, 0.0, 0.0), 1.0, COLORS[0]);
        scene.add(normal)
        this.#normals.push(normal);

        // face 1, -X
        normal = FlyingCube.buildNormal(new THREE.Vector3(x, y, z), new THREE.Vector3(1.0, 0.0, 0.0), -1.0, COLORS[1]);
        scene.add(normal);
        this.#normals.push(normal);

        // face 2, +Y
        normal = FlyingCube.buildNormal(new THREE.Vector3(x, y, z), new THREE.Vector3(0.0, 1.0, 0.0), 1.0, COLORS[2]);
        scene.add(normal);
        this.#normals.push(normal);

        // face 3, -Y
        normal = FlyingCube.buildNormal(new THREE.Vector3(x, y, z), new THREE.Vector3(0.0, 1.0, 0.0), -1.0, COLORS[3]);
        scene.add(normal);
        this.#normals.push(normal);

        // face 4, +Z
        normal = FlyingCube.buildNormal(new THREE.Vector3(x, y, z), new THREE.Vector3(0.0, 0.0, 1.0), 1.0, COLORS[4]);
        scene.add(normal);
        this.#normals.push(normal);

        // face 5, -Z
        normal = FlyingCube.buildNormal(new THREE.Vector3(x, y, z), new THREE.Vector3(0.0, 0.0, 1.0), -1.0, COLORS[5]);
        scene.add(normal);
        this.#normals.push(normal);

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

/// molecule transformations test
// var molecule = new THREE.Object3D();
// const g = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE); 
// const cube1 = new THREE.Mesh(g, new THREE.MeshLambertMaterial( {color: 'blue'})); 
// const cube2 = new THREE.Mesh(g, new THREE.MeshLambertMaterial( {color: 'green'}))
// molecule.add(cube1);
// molecule.add(cube2);
// cube2.position.x = cube2.position.x + CUBE_SIZE;
// scene.add(molecule);




/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    TWEEN.update() // update animations

    controls.update() // update orbit controls

    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function
    molecule.translateX(0.1);
    
}

// const colors = defineColors()
rendeLoop() //start rendering