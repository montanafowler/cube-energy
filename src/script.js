/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
// import Atom from './cube.js'
// import { getSize } from './cube.js'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBB } from 'three/examples/jsm/math/OBB.js'


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

// NUMBER OF CUBES
const NUM_CUBES = 2;
// CUBE SIZE
const CUBE_SIZE = 2;
// NORMAL SIZE
const NORM_SIZE = 0.1;
// VOLUME: define invisible volume cubes float around in
const BOUNDS = CUBE_SIZE * 10;
// TRANSLATION step distance
const STEP = 0.1;

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

// define the face axes in an array ordered with the colors
function defineFaceAxes() {
    let faces = [];
    faces.push(new THREE.Vector3(1.0, 0.0, 0.0));
    faces.push(new THREE.Vector3(1.0, 0.0, 0.0));
    faces.push(new THREE.Vector3(0.0, 1.0, 0.0));
    faces.push(new THREE.Vector3(0.0, 1.0, 0.0));
    faces.push(new THREE.Vector3(0.0, 0.0, 1.0));
    faces.push(new THREE.Vector3(0.0, 0.0, 1.0));
    return faces;
}

const FACE_AXES = defineFaceAxes();

class Atom {
    #cube;
    #normals;

    /*
     * build the normal for the face given the provided axis to change, and the direction
     *
     * axisToChange: a Vector3 with a 1.0 of which axis to change and a 0.0 for each unchanged axis
     * direction: -1.0 or 1.0 to shift the normal along the axis in the correct direction for the face
     * return: the normal mesh in the correct position for the cube
    */
    static buildNormal(axisToChange, direction, color) {

        // size the normal based off of which axis it points out of
        let xSize = axisToChange.x > 0.0 ? CUBE_SIZE : NORM_SIZE;
        let ySize = axisToChange.y > 0.0 ? CUBE_SIZE : NORM_SIZE;
        let zSize = axisToChange.z > 0.0 ? CUBE_SIZE : NORM_SIZE;
        let normalGeo = new THREE.BoxGeometry(xSize, ySize, zSize);  
        
        let normal = new THREE.Mesh(normalGeo, color); 

        normal.position.x = CUBE_SIZE / 2.0 * axisToChange.x * direction;
        normal.position.y = CUBE_SIZE / 2.0 * axisToChange.y * direction;
        normal.position.z = CUBE_SIZE / 2.0 * axisToChange.z * direction;

        return normal;
    }

    /**
     * construct the Atom with its normals at local coordinates 0,0,0
    */
    constructor() {

        /// add cube
        const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE); 
        this.#cube = new THREE.Mesh(geometry, COLORS); 

        // getter function for 3d cube object for scene graph
        this.getCube = function() {
            return this.#cube;
        }

        // define normals, one for each face
        this.#normals = []
        let direction;
        for (let i = 0; i < COLORS.length; i++) {
            // direction to shift the normal along the axis for the face
            direction = i % 2 == 0 ? 1.0 : -1.0;

            // build the normal
            this.#normals.push(Atom.buildNormal(FACE_AXES[i], direction,COLORS[i]));
            
            // make all the normals parented to the cube
            this.#cube.add(this.#normals[i]);
        }
    }
}


class Molecule {
    #object;
    #direction;
    #atoms;
    #rotationDirs;

    static randPosNeg() {
        return Math.random() < 0.5 ? -1.0 : 1.0;
    }

    constructor() {
        // 3D model
        this.#object = new THREE.Object3D();

        // random position
        this.#object.position.x = randomCoord();
        this.#object.position.y = randomCoord();
        this.#object.position.z = randomCoord();

        // set the direction, a normalized random vector
        this.#direction = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();

        // make each molecule randomly rotate + or - x, y, z
        this.#rotationDirs = new THREE.Vector3(Molecule.randPosNeg(), Molecule.randPosNeg(), Molecule.randPosNeg());
        console.log("rotation dirs");
        console.log(this.#rotationDirs);

        this.#atoms = new Set();

        this.addAtom = function(atom) {
            this.#atoms.add(atom); // atoms set
            this.#object.add(atom.getCube()); // scene graph
        }

        this.removeAtom = function(atom) {
            this.#atoms.remove(atom); // atoms set
            this.#object.remove(atom.getCube()); // scene graph
        }

        // parent an atom to the molecule
        this.addAtom(new Atom());
    }

    get atoms() {
        return this.#atoms;
    }

    get object() {
        return this.#object;
    }

    get direction() {
        return this.#direction;
    }

    set direction(dir) {
        this.#direction = dir;
    }

    get rotationDirs() {
        return this.#rotationDirs;
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
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 100);
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

var molecules = new Set();
let molecule;
for (let i = 0; i < NUM_CUBES; i++) {
    molecule = new Molecule();
    molecules.add(molecule);

    // add the 3d obj to the scene graph
    scene.add(molecule.object);
}

// show bounds debugging
const geometry = new THREE.BoxGeometry(.5, .5, .5); 
const corner1 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'green'})); 
const corner2 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'red'})); 
const corner3 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'blue'})); 
const corner4 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'yellow'})); 
corner1.translateOnAxis(new THREE.Vector3(1.0, 1.0, 1.0), BOUNDS / 2);
corner2.translateOnAxis(new THREE.Vector3(-1.0, 1.0, 1.0), BOUNDS / 2);
corner3.translateOnAxis(new THREE.Vector3(-1.0, 1.0, -1.0), BOUNDS / 2);
corner4.translateOnAxis(new THREE.Vector3(1.0, 1.0, -1.0), BOUNDS / 2);

const corner5 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'green'})); 
const corner6 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'red'})); 
const corner7 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'blue'})); 
const corner8 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'yellow'})); 
corner5.translateOnAxis(new THREE.Vector3(1.0, -1.0, 1.0), BOUNDS / 2);
corner6.translateOnAxis(new THREE.Vector3(-1.0, -1.0, 1.0), BOUNDS / 2);
corner7.translateOnAxis(new THREE.Vector3(-1.0, -1.0, -1.0), BOUNDS / 2);
corner8.translateOnAxis(new THREE.Vector3(1.0, -1.0, -1.0), BOUNDS / 2);
scene.add(corner1);
scene.add(corner2);
scene.add(corner3);
scene.add(corner4);
scene.add(corner5);
scene.add(corner6);
scene.add(corner7);
scene.add(corner8);

/// molecule transformations test
// var molecule = new THREE.Object3D();
// const g = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE); 
// const cube1 = new THREE.Mesh(g, new THREE.MeshLambertMaterial( {color: 'blue'})); 
// const cube2 = new THREE.Mesh(g, new THREE.MeshLambertMaterial( {color: 'green'}))
// molecule.add(cube1);
// molecule.add(cube2);
// cube2.position.x = cube2.position.x + CUBE_SIZE;
// scene.add(molecule);


// pseudocode
// each molecule has an OOB, this includes normals
// for every molecule, check all others (for now... could do some sorting to help? objs could have IDs)
//      if OBBs intersect
//              double loop through atoms of both to find which atoms intersect
    //              case 1: atom A and atom B don't intersect
    //                  loop through atoms of molecule w/ fewer children to check OOBs? if none intersect, reject overlap
    //              case 2: we did find an OOB intersection(s) with an atom 
    //                  which of our OOB's is intersecting with the intersections we found ?
    //                  Are we actually intersecting with one of its normals or cube?
    //                  double loop to find which normals/cubes interset
    //                  
    //                  case 3: actually one of our OOBs cubes/normals does not intersect, reject collision
    //                  case 4: we did find an intersection between a cube & normal
    //                      make the normal the parent molecule (easier to become collinear w/ normal)
    //                  case 5: we found intersection between 2 normals
    //                      make them collinear to one of them
    //                  case 6: we found an intersection between two

//          see what I hit for molecule A on this ray        
// loop through each face / normal to see if they intersect...
//                how do I do this?

function positionInBounds(position) {
    let negBounds = - BOUNDS / 2.0;
    let posBounds = BOUNDS / 2.0;
    return (position.x > negBounds && position.x < posBounds 
         && position.y > negBounds && position.y < posBounds 
         && position.z > negBounds && position.z < posBounds)
}

function reflectOffBoundingVolume(position) {
    let negBounds = - BOUNDS / 2.0;
    let posBounds = BOUNDS / 2.0;
    if (position.x < negBounds)
        return new THREE.Vector3(1.0, 0.0, 0.0); // reflect off +X normal
    if (position.x > posBounds)
        return new THREE.Vector3(-1.0, 0.0, 0.0); // reflect off -X normal
    if (position.y < negBounds)
        return new THREE.Vector3(0.0, 1.0, 0.0); // reflect off +Y normal
    if (position.y > posBounds)
        return new THREE.Vector3(0.0, -1.0, 0.0); // reflect off -Y normal
    if (position.z < negBounds)
        return new THREE.Vector3(0.0, 0.0, 1.0); // reflect off +Z normal
    if (position.z > posBounds)
        return new THREE.Vector3(0.0, 0.0, -1.0); // reflect off -Z normal
    throw new Error("Position not outside Bounding Volume"); 
}


function animate(molecule) {
    // local rotation on all three axes
    molecule.object.rotateX(0.02 * Math.random() * molecule.rotationDirs.x);
    molecule.object.rotateY(0.02 * Math.random() * molecule.rotationDirs.y);
    molecule.object.rotateZ(0.02 * Math.random() * molecule.rotationDirs.z);

    // translate in direction if in bounds, if not, reflect vector with a little randomness ?
    // if (positionInBounds(molecule.direction * 0.1 + molecule.object.position)) {
    let variedStep = STEP * Math.random();
    let futurePosition = molecule.object.position.addScaledVector(molecule.direction, variedStep);
    if (positionInBounds(futurePosition)) {
        // move molecule to the position
        molecule.object.translateOnAxis(molecule.direction, variedStep);
    } else {
        // TODO reflect has bug where they fly out of the volume
        // let normal = reflectOffBoundingVolume(futurePosition);
        // molecule.direction = molecule.direction.reflect(normal).normalize();
        molecule.direction = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
    }
}


/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    TWEEN.update() // update animations

    controls.update() // update orbit controls

    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function

    for (const molecule of molecules) {
        animate(molecule);
    }    
}

// const colors = defineColors()
rendeLoop() //start rendering