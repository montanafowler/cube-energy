# cube-energy

![cover](https://raw.githubusercontent.com/montanafowler/cube-energy/main/cover.png)

To view: [https://gold-dorisa-1.tiiny.site](https://gold-dorisa-1.tiiny.site)

project code is in `src/script.js`

## Run Locally

(from boilerplate tutorial linked below)

Download and install Node.js on your computer (https://nodejs.org/en/download/).

Download a zip of my repo.

Install dependencies in your terminal in `cube-energy`
```
npm install
```

[NOTE] At this point the terminal suggested an `audit fix` command, but don't run this command or else the server won't start.

Run this command in your terminal to open a local server
```
npm run dev
```

## Testing

There is a TESTING flag you can change in script.js to get two simple cubes at different orientations where one slowly translates towards the other in +X direction. I used this for testing the collision detection and merging.

![testing](https://raw.githubusercontent.com/montanafowler/cube-energy/main/testing-image.png)

## Resources

I set up the project using this [boilerplate](https://github.com/ektogamat/threejs-andy-boilerplate/tree/main?tab=readme-ov-file)
so that I could follow [this tutorial](https://www.youtube.com/watch?v=rwUfKHLB7MY) to get it easily hosted on a link.

## Design

I designed my Atom class to hold the meshes for the cube and its normals. The all the meshes are parented to a 3DObject for each Atom. The normal meshes are not parented to the cube mesh in order to be able to check collisions on the Cube geometry without the normals being included (ex: when a normal intersects with a cube face).

Molecules all have a set of atoms as children parented to a 3DObject. They all begin by having just one Atom, but will absorb sub-molecules when the normals/faces of the same color collide with each other. If moleculeA absorbs moleculeB, moleculeB is parented to moleculeA's 3D object to keep the transformation of moleculeB's atoms.  Then the atoms of moleculeB are added to the moleculeA's, and moleculeB is removed from the global molecule set for collision detection.

The collision detection goes through several checks before deciding to merge molecules:
```
	1. preprocess bounding boxes on all molecules
	2. do two molecules' bounding boxes overlap (unordered when comparing so we don't compare A->B and B->A)
		3. If so, which of their atoms intersect?
			4. For each face of a cube (0...6)
				5. do the normals of that same face intersect on both atoms?
				6. does either normal intersect the same face on the other atom?
		7. If we did find a valid merge, have one molecule absorb the other
```

## Challenges

My biggest challenges were handling rotation in local/global coordinates. For example, I first worked in world space to try to rotate one cube to absorb it, until I realized that the rotation was easier if the molecule was merged to the other molecule's world space first. Overall, I had so much fun on the project!
