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
const NUM_CUBES = 10;
// CUBE SIZE
const CUBE_SIZE = 2;
// NORMAL SIZE
const NORM_SIZE = 0.1;
// VOLUME: define invisible volume cubes float around in
const BOUNDS = CUBE_SIZE * 10;
// TRANSLATION step distance
const STEP = 0.1;
// shows the next available id
let NEXT_ID = 0;
// sides of cube, don't change
let NUM_SIDES = 6;

///////////////////////////////////////////////////////////////////////
// COLORS: define random colors for the session
function defineColors() {
    let colors = []
    // for(let i = 0; i < NUM_SIDES; i++) {
    //     colors.push(new THREE.MeshLambertMaterial( {color: 'lightgrey'}));
    //     colors[i].color.setRGB(Math.random(), Math.random(), Math.random());
    // }

    // TEST COLORS, todo delete
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
    #id;
    #object;
    #cube;
    #normals; // TODO change to dictionary of normal ID <#id-x1, normal?>
    #boundingBox;

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
    constructor(uid) {
        // unique id for atoms
        this.#id = NEXT_ID;
        NEXT_ID++;

        // 3D model
        this.#object = new THREE.Object3D();

        /// add cube
        const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE); 
        this.#cube = new THREE.Mesh(geometry, COLORS); 

        // make the cube mesh a child of the object
        this.#object.add(this.#cube);
        // console.log(`created cube ${this.#id}, ${this.#cube}`)

        // define normals, one for each face
        this.#normals = []
        let direction;
        for (let i = 0; i < COLORS.length; i++) {
            // direction to shift the normal along the axis for the face
            direction = i % 2 == 0 ? 1.0 : -1.0;

            // build the normal
            this.#normals.push(Atom.buildNormal(FACE_AXES[i], direction, COLORS[i]));
            
            // make all the normals parented to the cube
            this.#object.add(this.#normals[i]);
        }
    }

    get id() {
        return this.#id;
    }

    get boundingBox() {
        return new THREE.Box3().setFromObject(this.#object);
    }

    get object() {
        return this.#object;
    }

    get cube() {
        return this.#cube;
    }

    get normals() {
        return this.#normals;
    }
}


class Molecule {
    #id;
    #object;
    #boundingBox;
    #direction;
    #atoms;
    #rotationDirs;

    static randPosNeg() {
        return Math.random() < 0.5 ? -1.0 : 1.0;
    }

    constructor() {
        // save molecule's unique id
        this.#id = NEXT_ID;
        NEXT_ID++;

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
        // console.log("rotation dirs");
        // console.log(this.#rotationDirs);

        this.#atoms = new Set();

        this.addAtom = function(atom) {
            this.#atoms.add(atom); // atoms set
            this.#object.add(atom.object); // scene graph
        }

        this.removeAtom = function(atom) {
            this.#atoms.remove(atom); // atoms set
            this.#object.remove(atom.object); // scene graph
        }

        // parent an atom to the molecule
        this.addAtom(new Atom());

        this.updateBoundingBox = function() {
            this.#boundingBox = new THREE.Box3().setFromObject(this.#object);
        }
        this.updateBoundingBox();
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

    get id() {
        return this.#id;
    }

    get boundingBox() {
        return this.#boundingBox;
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

    // TODO delete
    // molecule.object.position.y = 0.0;
    // molecule.object.position.z = 0.0;

    // add the 3d obj to the scene graph
    scene.add(molecule.object);
}


// TEST COLLISIONS 
// let mList = Array.from(molecules);
// mList[0].object.position.x = -3.0;
// mList[1].object.position.x = 3.0;
// mList[0].object.rotateX(3.14159);
// mList[1].object.rotateZ(3.14159);


// set up set of original molecule pairs
// TODO if useful later, for now do double for loop
// let visited = new Set();
// let pairs = new Set();
// for (const molA of molecules.values()) {
//     for (const molB of molecules.values()) {
//         if !(visited.has(molA.id)) {
//             pairs.add(`${molA.id}_${molB.id}`)
//             visited.add(molA);
//         }
//     }
// } 


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


// molecules could become dead, so i create the pairs once and if we visit dead molecules we remove them from the set
// TODO maybe make molecules and pairs extend interface since they have the same bounding box functionality? if time

// TO TEST: multiple atoms in one molecule

/*
 * return true if atoms' normals of the same color are intersecting
 */
function areMatchingNormalsColliding(atomA, atomB) {
    let aNormalBB;
    let bNormalBB;

    if (atomA.normals.length != NUM_SIDES || atomB.normals.length != NUM_SIDES)
        throw new Error("Normals length not equal to number of cube sides.");

    // are any normals of the same color intersecting?
    for (let i = 0; i < NUM_SIDES; i++) {
        // normals are in ordered list so the same color matches at each index
        aNormalBB = new THREE.Box3().setFromObject(atomA.normals[i]);
        bNormalBB = new THREE.Box3().setFromObject(atomB.normals[i]);

        // if two normals of the same color intersect, merge molecules
        if (aNormalBB.intersectsBox(bNormalBB)) {
            return true;
        }
    }
    return false;
}

/*
 * check if vectors are equal with epsilon +- 0.01
 */
function areVectorsEqual(v1, v2) {
    let epsilon = 0.01
    return ((Math.abs(v2.x - v1.x) < epsilon) 
        && (Math.abs(v2.y - v1.y) < epsilon) 
        && (Math.abs(v2.z - v1.z) < epsilon));
}

/*
 * return true if normal hits correct face of other atom
 */
function doesNormalHitCorrectCubeFace(normal, normalIndex, normalAtom, cubeAtom) {
    let normalAtomWorldPos = new THREE.Vector3();
    let normalPos = new THREE.Vector3();

    // shoot ray along normal from normalAtom center in world coord
    normalAtomWorldPos = normalAtom.object.getWorldPosition(normalAtomWorldPos);

    // transform the normal we are checking into the atom's transformation
    let posNegDir = normalIndex % 2 == 0 ? 1.0 : -1.0;
    let normalLocal = FACE_AXES[normalIndex].multiplyScalar(posNegDir);
    let normalWorld = new THREE.Vector3();
    normalWorld.copy(normalLocal);
    normalWorld.applyMatrix3(normalAtom.object.matrixWorld).normalize();

    // point along pointer of cubeA to check if there's a face intersection
    let raycaster = new THREE.Raycaster(normalAtomWorldPos, normalWorld, 0.1, CUBE_SIZE*2.0);
    let intersectedObjs = raycaster.intersectObjects([cubeAtom.cube]);
   
    for (let j = 0; j < intersectedObjs.length; j++) {
        // if the face we hit first's local normal matches our local normal
        // then our normal hit a face of the same color
        return areVectorsEqual(intersectedObjs[j].face.normal, normalLocal);
    }

    return false;
}

/*
 * return true if two atoms collide and will need to merge
 */
function analyzeAtomCollision(atomA, atomB) {

    if (atomA.normals.length != NUM_SIDES || atomB.normals.length != NUM_SIDES)
        throw new Error("Normals length not equal to number of cube sides.");

    // cube bounding boxes
    const aCubeBB = new THREE.Box3().setFromObject(atomA.cube, true);
    const bCubeBB = new THREE.Box3().setFromObject(atomB.cube, true);

    let aNormalBB;
    let bNormalBB;
    let intersectedObjs;

    for (let i = 0; i < NUM_SIDES; i++) {
        // bounding boxes for the normal objects
        aNormalBB = new THREE.Box3().setFromObject(atomA.normals[i], true);
        bNormalBB = new THREE.Box3().setFromObject(atomB.normals[i], true);

        // if two normals of the same color intersect, merge molecules
        if (aNormalBB.intersectsBox(bNormalBB)) {
            console.log(`normal intersection #${i}`);
            return true; 
        }

        // does either normal overlap with the Cube of the other ?
        if (aNormalBB.intersectsBox(bCubeBB)) {
            // 
            if (doesNormalHitCorrectCubeFace(atomA.normals[i], i, atomA, atomB)) {
                console.log(`A->B normal/face intersection #${i}`);
                return true;
            } 
        // TODO test!
        } 

        if (bNormalBB.intersectsBox(aCubeBB)) {
            if (doesNormalHitCorrectCubeFace(atomB.normals[i], i, atomB, atomA)) {
                console.log(`B->A normal/face intersection #${i}`);
                return true;
            }
        }
    }
    return false;
}


/*
 * return true if two atoms collide and will need to merge their molecules
 */
function findCollisions() {
    // preprocess: update the molecule bounding boxes first
    for (const mol of molecules.values()) {
        mol.updateBoundingBox();
    }

    let comparisons = new Set();

    for (const molA of molecules.values()) {
        for (const molB of molecules.values()) {
            // if we have already compared these two molecules or they are the same, skip
            if (comparisons.has(`${molA.id}_${molB.id}`) || molA.id == molB.id) {
                continue;
            }

            // add unordered pair to visited set
            comparisons.add(`${molA.id}_${molB.id}`);
            comparisons.add(`${molB.id}_${molA.id}`);

            // console.log(`comparing molecules ${molA.id}_${molB.id}`);

            // if bounding boxes do not intersect, skip
            if (!molA.boundingBox.intersectsBox(molB.boundingBox)) {
                continue;
            }

            // console.log(`${molA.id} intersects ${molB.id}`);

            // now compare the atoms in the colliding molecules to see which overlap
            for (const atomA of molA.atoms) {
                for (const atomB of molB.atoms) {
                    // if we have already compared these two atoms or they are the same, skip
                    if (comparisons.has(`${atomA.id}_${atomB.id}`) || atomA.id == atomB.id) {
                        continue;
                    }

                    // add unordered pair to visited set
                    comparisons.add(`${atomA.id}_${atomB.id}`);
                    comparisons.add(`${atomB.id}_${atomA.id}`);

                    // console.log(`comparing atoms ${atomA.id}_${atomB.id}`);

                    // if bounding boxes do not intersect, skip
                    if (!atomA.boundingBox.intersectsBox(atomB.boundingBox)) {
                        continue;
                    }

                    return analyzeAtomCollision(atomA, atomB);
                }
            }
        }
    }
    return false;
}

//loop through atoms of molecule w/ fewer children to check OOBs? if none intersect, reject overlap

/*
 * build the normal to reflect around when we hit the bounding volume
*/
function positionInBounds(position) {
    let negBounds = - BOUNDS / 2.0;
    let posBounds = BOUNDS / 2.0;
    return (position.x > negBounds && position.x < posBounds 
         && position.y > negBounds && position.y < posBounds 
         && position.z > negBounds && position.z < posBounds)
}

/*
 * build the normal to reflect around when we hit the bounding volume
*/
function getNormalOffBoundingVolume(position) {
    let negBounds = - BOUNDS / 2.0;
    let posBounds = BOUNDS / 2.0;
    let normal = new THREE.Vector3(0.0, 0.0, 0.0);
    if (position.x < negBounds)
        normal.add(new THREE.Vector3(1.0, 0.0, 0.0)); // reflect off +X normal
    if (position.x > posBounds)
        normal.add(new THREE.Vector3(-1.0, 0.0, 0.0)); // reflect off -X normal
    if (position.y < negBounds)
        normal.add(new THREE.Vector3(0.0, 1.0, 0.0)); // reflect off +Y normal
    if (position.y > posBounds)
        normal.add(new THREE.Vector3(0.0, -1.0, 0.0)); // reflect off -Y normal
    if (position.z < negBounds)
        normal.add(new THREE.Vector3(0.0, 0.0, 1.0)); // reflect off +Z normal
    if (position.z > posBounds)
        normal.add(new THREE.Vector3(0.0, 0.0, -1.0)); // reflect off -Z normal
    return normal; 
}


/*
 * animate the molecule on all three rotation axes, translate in random directions
 * if we hit the edge of the bounding volume, reflect off of its normal
 */
function animate(molecule) {
    // local rotation on all three axes
    molecule.object.rotateX(0.02 * Math.random() * molecule.rotationDirs.x);
    molecule.object.rotateY(0.02 * Math.random() * molecule.rotationDirs.y);
    molecule.object.rotateZ(0.02 * Math.random() * molecule.rotationDirs.z);

    let futurePosition = molecule.object.position.addScaledVector(molecule.direction, STEP);
    if (positionInBounds(futurePosition)) {
        // move molecule to the position
        molecule.object.translateOnAxis(molecule.direction, STEP);
    } else {
        // reflect the direction based on the normal from the bounding volume
        let normal = getNormalOffBoundingVolume(futurePosition);
        molecule.direction = molecule.direction.reflect(normal).normalize();
    }
}

let STOP_CALCULATING = false;

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    TWEEN.update() // update animations

    controls.update() // update orbit controls

    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function

    if (!STOP_CALCULATING) {
        if (!findCollisions()) {// && positionInBounds(mList[0].object.position)) {
            // mList[0].object.translateX(0.01);
            for (const molecule of molecules) {
                animate(molecule);
            }   
        } else {
            STOP_CALCULATING = true;
        }
    }
    
}
// findCollisions();
// const colors = defineColors()
rendeLoop() //start rendering