/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBB } from 'three/examples/jsm/math/OBB.js'

// NUMBER OF CUBES
let NUM_CUBES = 30;
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
// testing flag, use to test collisions between just two cubes
let TESTING = true;

///////////////////////////////////////////////////////////////////////
// COLORS: define random colors for the session
function defineColors() {
    let colors = []
    // UNCOMMENT TO USE RANDOM COLORS INSTEAD
    // for(let i = 0; i < NUM_SIDES; i++) {
    //     colors.push(new THREE.MeshLambertMaterial( {color: 'lightgrey'}));
    //     colors[i].color.setRGB(Math.random(), Math.random(), Math.random());
    // }

    // OFFICIAL COLORS
    colors.push(new THREE.MeshLambertMaterial( {color: 'yellow'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'green'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'red'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'blue'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'pink'}));
    colors.push(new THREE.MeshLambertMaterial( {color: 'purple'}));

    return colors;
}
// all cubes use the same colors
const COLORS = defineColors();

///////////////////////////////////////////////////////////////////////
// FACE AXES define the face axes in an array ordered with the colors
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


///////////////////////////////////////////////////////////////////////
// ATOM class definition, an atom is parented to a molecule
// it has a list of normals and a cube parented to its THREE.Object3D object attribute 
class Atom {
    #id;
    #object;
    #cube;
    #normals;
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
    constructor() {
        // unique id for atom
        this.#id = NEXT_ID;
        NEXT_ID++;

        // 3D model
        this.#object = new THREE.Object3D();

        /// add cube
        const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE); 
        this.#cube = new THREE.Mesh(geometry, COLORS); 

        // make the cube mesh a child of the object
        this.#object.add(this.#cube);

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

    /*
     * randomly return +1.0 or -1.0
    */
    static randPosNeg() {
        return Math.random() < 0.5 ? -1.0 : 1.0;
    }

    /*
     * construct a molecule with one atom at its origin.
    */
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

        this.#atoms = new Set();

        this.addAtom = function(atom) {
            this.#atoms.add(atom); // atoms set
            this.#object.add(atom.object); // scene graph
        }

        // parent an atom to the molecule
        this.addAtom(new Atom());

        // update the bounding box of this molecule for collision detection pre-processing
        this.updateBoundingBox = function() {
            this.#boundingBox = new THREE.Box3().setFromObject(this.#object);
        }
        this.updateBoundingBox();

        this.absorbMolecule = function(molecule, normalIndex, ourAtom, theirAtom) {

            // set to same orientation
            // molecule.object.setRotationFromQuaternion(new THREE.Quaternion().normalize());
            console.log(`our molecule: ${this.id}, their molecule: ${molecule.id}`);
            console.log(`our atom: ${ourAtom.id}, their atom: ${theirAtom.id}`);

            // translate molecule to make their atom centered at our atom
            let ourAtomPos = new THREE.Vector3();
            ourAtomPos = ourAtom.object.getWorldPosition(ourAtomPos);
            console.log(`ourAtom.position: ${ourAtomPos.x}, ${ourAtomPos.z}`);

            let theirAtomPos = new THREE.Vector3();
            theirAtomPos = theirAtom.object.getWorldPosition(theirAtomPos);
            console.log(`theirAtom.position: ${theirAtomPos.x}, ${theirAtomPos.z}`);

            let ourMolObjPos = new THREE.Vector3();
            ourMolObjPos = this.object.getWorldPosition(ourMolObjPos);
            console.log(`ourMolObjPos.position: ${ourMolObjPos.x}, ${ourMolObjPos.z}`);

            let theirMolObjPos = new THREE.Vector3();
            theirMolObjPos = molecule.object.getWorldPosition(theirMolObjPos);
            console.log(`theirMolObjPos.position: ${theirMolObjPos.x}, ${theirMolObjPos.z}`);

          


            // just add molecule as child for scene graph 
            // automatically makes molecule no longer parented to the scene
            this.#object.add(molecule.object);
            molecules.delete(molecule); // remove molecule from overall set

            // add atoms to list for collisions
            for (const atom of molecule.atoms) {
                this.#atoms.add(atom); //.union() wasn't working for me
            }



            // set molecule position
            // if (this.#atoms.size == 2) {
            // if (ourMolObjPos.x == ourAtomPos.x 
            //     && ourMolObjPos.y == ourAtomPos.y 
            //     && ourMolObjPos.z == ourAtomPos.z) {
            //     molecule.object.position.x = 0.0;
            //     molecule.object.position.y = 0.0;
            //     molecule.object.position.z = 0.0;
            // } else {
            //     molecule.object.translateOnAxis(translationVec, dist);
            // }
                molecule.object.position.x = 0.0;
                molecule.object.position.y = 0.0;
                molecule.object.position.z = 0.0;

            // }
            
            // molecule.object.position.x = ourAtom.object.position.x;
            // molecule.object.position.y = ourAtom.object.position.y;
            // molecule.object.position.z = ourAtom.object.position.z;

            // set to same orientation
            molecule.object.setRotationFromQuaternion(new THREE.Quaternion().normalize());
            // console.log(`our molecule: ${this.id}, their molecule: ${molecule.id}`);
            // console.log(`our atom: ${ourAtom.id}, their atom: ${theirAtom.id}`);
            console.log("SET MOLECULE ROTATION AND POSITION to 0,0");

            // translate molecule to make their atom centered at our atom
            ourAtomPos = new THREE.Vector3();
            ourAtomPos = ourAtom.object.getWorldPosition(ourAtomPos);
            console.log(`ourAtom.position: ${ourAtomPos.x}, ${ourAtomPos.z}`);

            theirAtomPos = new THREE.Vector3();
            theirAtomPos = theirAtom.object.getWorldPosition(theirAtomPos);
            console.log(`theirAtom.position: ${theirAtomPos.x}, ${theirAtomPos.z}`);

            ourMolObjPos = new THREE.Vector3();
            ourMolObjPos = this.object.getWorldPosition(ourMolObjPos);
            console.log(`ourMolObjPos.position: ${ourMolObjPos.x}, ${ourMolObjPos.z}`);

            theirMolObjPos = new THREE.Vector3();
            theirMolObjPos = molecule.object.getWorldPosition(theirMolObjPos);
            console.log(`theirMolObjPos.position: ${theirMolObjPos.x}, ${theirMolObjPos.z}`);

            let translationVec = new THREE.Vector3();
            translationVec.copy(ourAtomPos);
            // console.log(`ourAtom position ${ourAtom.object.position.x}`);
            translationVec.sub(theirAtomPos);
            // console.log(`theirAtom position ${theirAtom.object.position.x}`);
            // console.log(`translationVec ${translationVec.x}`);
            let dist = translationVec.length();
            translationVec = translationVec.normalize();
            console.log(`dist ${dist}`);
            console.log(`translationVec ${translationVec.x}, ${translationVec.z}`);

            theirMolObjPos = new THREE.Vector3();
            theirMolObjPos = molecule.object.getWorldPosition(theirMolObjPos);
            console.log(`BEFORE theirMolObjPos.position: ${theirMolObjPos.x}, ${theirMolObjPos.z}`);
            molecule.object.translateOnAxis(translationVec, dist);
            theirMolObjPos = new THREE.Vector3();
            theirMolObjPos = molecule.object.getWorldPosition(theirMolObjPos);
            console.log(`AFTER theirMolObjPos.position: ${theirMolObjPos.x}, ${theirMolObjPos.z}`);

            // let translationVec = new THREE.Vector3();
            // translationVec.copy(ourAtomPos);
            // // console.log(`ourAtom position ${ourAtom.object.position.x}`);
            // translationVec.sub(theirAtomPos);
            // // console.log(`theirAtom position ${theirAtom.object.position.x}`);
            // // console.log(`translationVec ${translationVec.x}`);
            // let dist = translationVec.length();
            // translationVec = translationVec.normalize();
            // console.log(`dist ${dist}`);
            // console.log(`translationVec ${translationVec.x}, ${translationVec.z}`);

            // // translate the molecule based on the atoms distance
            // molecule.object.translateOnAxis(translationVec, dist);

            // if (dist != 0)
            //     console.log("NOT ZERO");


            for (const a of this.#atoms) {
                let v = new THREE.Vector3();
                v = a.object.getWorldPosition(v);
                console.log(`now atom #${a.id} at ${v.x}, ${v.z}`)
            }



            // uncomment

            // local normal direction of the face we are attaching (ex. +x or -x)
            let direction = normalIndex % 2 == 0 ? 1.0 : -1.0;

            if (this.#atoms.size == 2) {
                // shift the new atom along locally along the normal
            let shiftPosition = FACE_AXES[normalIndex].multiplyScalar(direction).normalize();
            molecule.object.translateOnAxis(shiftPosition, CUBE_SIZE * 1.5);

            // rotate around a perpendicular axis to keep the faces facing each other locally
            if (shiftPosition.x != 0.0) {
                molecule.object.rotateY(Math.PI);
            } else {
                molecule.object.rotateX(Math.PI);
            }
            }
            
            
        }
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

// global molecules set to use for collision detection
var molecules = new Set();

function setupCubes() {
    let molecule;
    for (let i = 0; i < NUM_CUBES; i++) {
        // create molecule, one cube per molecule
        molecule = new Molecule();
        molecules.add(molecule);

        // add the 3d obj to the scene graph
        scene.add(molecule.object);
    }
}

/////////////////////////////////////////////////////////////////////////
///// Testing Helper Functions
let molTestList;
function testTwoCubeSetup() {
    
    molecules = new Set();
    NUM_CUBES = 3;
    let molecule;
    for (let i = 0; i < NUM_CUBES; i++) {
        molecule = new Molecule();
        molecules.add(molecule);

        molecule.object.position.y = 0.0;
        molecule.object.position.z = 0.0;

        // add the 3d obj to the scene graph
        scene.add(molecule.object);
    }

    // TEST COLLISIONS 
    molTestList = Array.from(molecules);
    molTestList[0].object.position.x = -3.0;
    molTestList[1].object.position.x = 3.0;
    molTestList[2].object.position.z = -4.0;
    molTestList[2].object.position.x = 5.0;
    molTestList[0].object.rotateZ(3.14159);
    molTestList[1].object.rotateX(.5);
    molTestList[1].object.rotateY(.2);

}

function addBoundingVolumeCornersForTesting() {
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
}

function testingSimpleAnimation() {
    if (molTestList.length < 2)
        throw Error("Trying testing animation without setting up test cubes.")

    if (!findCollisions() && positionInBounds(molTestList[0].object.position)) {
        molTestList[0].object.translateX(-0.01);
    }
}


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
 * return index of normal of intersection if two atoms collide and will need to merge
 * return -1 if there's no valid intersection
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
            return i; 
        }

        // A Normal -> B Cube
        if (aNormalBB.intersectsBox(bCubeBB)) {
            if (doesNormalHitCorrectCubeFace(atomA.normals[i], i, atomA, atomB)) {
                return i;
            } 
        } 

        // B Normal -> A Cube
        if (bNormalBB.intersectsBox(aCubeBB)) {
            if (doesNormalHitCorrectCubeFace(atomB.normals[i], i, atomB, atomA)) {
                return i;
            }
        }
    }
    return -1;
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
    let mergeMoleculeIndex = -1; // will be >= 0 if we want to merge two faces
    let atomACollided;
    let atomBCollided;

    for (const molA of molecules.values()) {
        for (const molB of molecules.values()) {
            // if we have already compared these two molecules or they are the same, skip
            if (comparisons.has(`${molA.id}_${molB.id}`) || molA.id == molB.id) {
                continue;
            }

            // add unordered pair to visited set
            comparisons.add(`${molA.id}_${molB.id}`);
            comparisons.add(`${molB.id}_${molA.id}`);

            // if bounding boxes do not intersect, skip
            if (!molA.boundingBox.intersectsBox(molB.boundingBox)) {
                continue;
            }

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

                    // if bounding boxes do not intersect, skip
                    if (!atomA.boundingBox.intersectsBox(atomB.boundingBox)) {
                        continue;
                    }

                    // mergeMoleculeIndex will be the index of the face of collision if we find one
                    mergeMoleculeIndex = analyzeAtomCollision(atomA, atomB);

                    // break loop since we want to merge molecules
                    if (mergeMoleculeIndex >= 0) {
                        atomACollided = atomA;
                        atomBCollided = atomB;
                        break;
                    }
                }

                // break loop since we want to merge molecules
                if (mergeMoleculeIndex >= 0) {
                    break;
                }
            }

            // merge molecules
            if (mergeMoleculeIndex >= 0) {
                // TODO have molecule merge knowing position of the two atom collision
                molA.absorbMolecule(molB, mergeMoleculeIndex, atomACollided, atomBCollided); 
            }
        }
    }
    return false;
}


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

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    TWEEN.update() // update animations
    controls.update() // update orbit controls
    renderer.render(scene, camera) // render the scene using the camera
    requestAnimationFrame(rendeLoop) //loop the render function

    if (TESTING)
        testingSimpleAnimation();
    else {
        findCollisions();
        for (const molecule of molecules) {
            animate(molecule);
        }   
    }
    
}

// setup cubes
if (!TESTING) {
    setupCubes();
} else {
    addBoundingVolumeCornersForTesting();
    testTwoCubeSetup();
}
rendeLoop() //start rendering