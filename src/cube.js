// Declaration
// ( function () {

  class FlyingCube {
    constructor(scene, x, y) {
      this.size = 2;

      // this.getSize = function {
      //   return this.size;
      // };

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

      // const cube2 = new FlyingCube();
      // console.log(cube2.height);
      this.getX = function() {
        return this.size;
      };
    }

    // module.exports = { getSize };
  }


// } )();

// Create Customer class as follows:
// export default class Customer {
//    getName() {
//      return 'stackoverflow';
//    }
// }

// // Expression; the class is anonymous but assigned to a variable
// const Rectangle = class {
//   constructor(height, width) {
//     this.height = height;
//     this.width = width;
//   }
// };

// // Expression; the class has its own name
// const Rectangle = class Rectangle2 {
//   constructor(height, width) {
//     this.height = height;
//     this.width = width;
//   }
// };

