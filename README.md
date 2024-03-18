# cube-energy

![cover](https://raw.githubusercontent.com/montanafowler/cube-energy/main/cover.png)

To view: [https://gold-dorisa-1.tiiny.site](https://gold-dorisa-1.tiiny.site)

project code is in `src/script.js`

## Run Locally

(from boilerplate tutorial linked below)

Download and install Node.js on your computer (https://nodejs.org/en/download/).

Then, open VSCODE, drag the project folder to it. Open VSCODE terminal and install dependencies (you need to do this only in the first time)
```
npm install
```

[NOTE] At this point the terminal suggested an `audit fix` command, but don't run this command or else the server won't start.

Run this command in your terminal to open a local server at localhost:8080
```
npm run dev
```

## Testing

There is a TESTING flag you can change in script.js to get two simple cubes where one slowly translates towards the other in +X direction. I used this for testing the collision detection and merging.

![testing](https://raw.githubusercontent.com/montanafowler/cube-energy/main/testing-image.png)

## Resources

I set up the project using this boilerplate: https://github.com/ektogamat/threejs-andy-boilerplate/tree/main?tab=readme-ov-file
so that I could follow this tutorial to get it hosted a link as easily as possible: https://www.youtube.com/watch?v=rwUfKHLB7MY

## Design

I designed my Atoms to hold the normals and the cube parented to a 3DObject, but not each other so I could check collisions with the Cube geometry without it taking into accound the normals as children in the bounding box.

Molecules all have a set of atoms they can loop through for collision detection, and if moleculeA absorbs moleculeB, moleculeB is parented to the moleculeA's 3D object to keep the transformation of moleculeB's atoms.  Then the atoms of moleculeB are added to the moleculeA's, and moleculeB is removed from the global molecule set for collision detection.

The collision detection goes through several checks before deciding to merge molecules:
```
	1. preprocess bounding boxes on all molecules
	2. do two molecules' bounding boxes overlap (unordered when comparing so we don't compare A->B and B->A)
		3. If so, which of their atoms overlap?
			4. For each face of a cube (0...6)
				5. do the normals of that same face intersect on both atoms?
				6. does either normal intersect the same face on the other atom?
		7. If we did find a valid merge, have one molecule absorb the other
```

## Challenges

My biggest challenges were handling rotation in local/global coordinates. For example, I spent time trying to figure out how to rotate one cube to merge with the other in their own separate world spaces, until I realized that the rotation was way easier once one molecule had already been merged with the other, so it would be parented to the same orientation. Overall, I had so much fun on the project!
