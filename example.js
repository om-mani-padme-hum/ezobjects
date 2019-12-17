const ezobjects = require('./index');

/** Configure a basic EZ Object example */
const configBasicExample = {
  className: 'BasicExample',
  properties: [
    { name: 'name', type: 'string' }
  ]
};

/** Create the `BasicExample` class */
const BasicExample = ezobjects.createClass(configBasicExample);

/** Create a new instance of the `BasicExample` class */
const basicExample1 = new BasicExample();

/** Give it a name using the auto-generated setter */
basicExample1.name('Basic Example 1');

/** Output the instance to console */
console.log(basicExample1);

/** 
 * Create another instance of the `BasicExample` class, but this time
 * initialize it with a plain object passed to the constructor.
 */
const basicExample2 = new BasicExample({
  name: 'Basic Example 2'
});

/** 
 * Configure a full EZ Object example demonstrating all supported types,
 * including the ability to extend other objects.
 */
const configFullExample = {
  className: 'FullExample',
  extends: BasicExample,
  properties: [
    { name: 'exampleInt', type: 'int' },
    { name: 'exampleFloat', type: 'float' },
    { name: 'exampleString', type: 'string' },
    { name: 'exampleBoolean', type: 'boolean' },
    { name: 'exampleFunction', type: 'function' },
    { name: 'exampleDate', type: 'date' },
    { name: 'exampleBuffer', type: 'buffer' },
    { name: 'exampleSet', type: 'set' },
    { name: 'examplePlainObject', type: 'object' },
    { name: 'exampleOtherObj', type: 'BasicExample' },
    
    { name: 'exampleIntArray', type: 'array', arrayOf: { type: 'int' } },
    { name: 'exampleFloatArray', type: 'array', arrayOf: { type: 'float' } },
    { name: 'exampleStringArray', type: 'array', arrayOf: { type: 'string' } },
    { name: 'exampleBooleanArray', type: 'array', arrayOf: { type: 'boolean' } },
    { name: 'exampleFunctionArray', type: 'array', arrayOf: { type: 'function' } },
    { name: 'exampleDateArray', type: 'array', arrayOf: { type: 'date' } },
    { name: 'exampleBufferArray', type: 'array', arrayOf: { type: 'buffer' } },
    { name: 'exampleSetArray', type: 'array', arrayOf: { type: 'set' } },
    { name: 'examplePlainObjectArray', type: 'array', arrayOf: { type: 'object' } },
    { name: 'exampleOtherObjArray', type: 'array', arrayOf: { type: 'BasicExample' } } 
  ]
};

/** Create the `FullExample` class */
const FullExample = ezobjects.createClass(configFullExample);

/** Create a new instance of the `FullExample` class */
const fullExample = new FullExample({
  name: `Full Example`,
  exampleInt: 293,
  exampleFloat: 194.13489,
  exampleString: `What's up, doc?`,
  exampleBoolean: true,
  exampleFunction: arg => `Hello, ${arg}!`,
  exampleDate: new Date('1776-07-04'),
  exampleBuffer: Buffer.from([0x04, 0x7F, 0x93, 0x38]),
  exampleSet: new Set(['14', 3, false]),
  examplePlainObject: { a: 'I am A', 14: 'Plain Object' },
  exampleOtherObj: basicExample1,
  
  exampleIntArray: [293, -178, 492],
  exampleFloatArray: [194.13489, -2890.25, -0.04281],
  exampleStringArray: [`What's up, doc?`, `Shiver me timbers`],
  exampleBooleanArray: [true, false, true],
  exampleFunctionArray: [arg => `Hello, ${arg}!`, arg => `Farewell, ${arg}!`],
  exampleDateArray: [new Date('1776-07-04'), new Date('1941-12-07')],
  exampleBufferArray: [Buffer.from([0x04, 0x7F, 0x93, 0x38]), Buffer.from('A string instead')],
  exampleSetArray: [new Set(['14', 3, false]), new Set([-14, true, 'pool'])],
  examplePlainObjectArray: [{ a: 'I am A', 14: 'Plain Object' }, { and: 'So am I too a', 930: 'Plain Object' }],
  exampleOtherObjArray: [basicExample1, basicExample2]
});

/** Output the instance to console */
console.log(fullExample);

/** Output one of the function responses to console */
console.log(fullExample.exampleFunctionArray()[1]('Rich'));

/** Try to set a `float` property with a `string` */
try {
  /**
   * This throws a TypeError since string given, not float; the same behavior 
   * can be expected for all other types, including arrays of types.
   */
  fullExample.exampleFloat('test');
} catch ( err ) {
  /** Output error message to console */
  console.log(err.message);
}
  