// Declaration
class FlyingCube {
  constructor(x, y) {
    this.height = 2;
    this.width = 2;
    this.x = x;
    this.y = y;
  }
}

// Create Customer class as follows:
export default class Customer {
   getName() {
     return 'stackoverflow';
   }
}

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