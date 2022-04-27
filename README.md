# EZ Objects v6.1.1

EZ Objects is a Node.js module (that can also be usefully browserify'd) that aims to save you lots of time 
writing class objects that are strictly typed in JavaScript.  All you have to do is create simple 
configurations for each of your objects and then create them using the createClass() function.

* [Installation](#installation)
* [Examples](#examples)
* [EZ Object Method Signatures](#ez-object-method-signatures)
* [Module Exports](#module-exports)
* [Configuration Specifications](#configuration-specifications)
* [Contributing](#contributing)
* [License](#license)

### Looking for MySQL linked EZ Objects?

EZ Object's MySQL capability has been shifted to a separate package called `ezobjects-mysql` which you can
find on [npm](https://www.npmjs.com/package/ezobjects-mysql) or [GitHub](https://github.com/om-mani-padme-hum/ezobjects-mysql.git).

## Installation

`npm install --save ezobjects`

## Examples

```javascript
const ezobjects = require(`ezobjects`);

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
```

### Expected Output

```
BasicExample { _name: 'Basic Example 1' }
FullExample {
  _name: 'Full Example',
  _exampleInt: 293,
  _exampleFloat: 194,
  _exampleString: 'What\'s up, doc?',
  _exampleBoolean: true,
  _exampleFunction: [Function: exampleFunction],
  _exampleDate: 1776-07-04T00:00:00.000Z,
  _exampleBuffer: <Buffer 04 7f 93 38>,
  _exampleSet: Set { '14', 3, false },
  _examplePlainObject: { '14': 'Plain Object', a: 'I am A' },
  _exampleOtherObj: BasicExample { _name: 'Basic Example 1' },
  _exampleIntArray: [ 293, -178, 492 ],
  _exampleFloatArray: [ 194, -2890, 0 ],
  _exampleStringArray: [ 'What\'s up, doc?', 'Shiver me timbers' ],
  _exampleBooleanArray: [ true, false, true ],
  _exampleFunctionArray: [ [Function], [Function] ],
  _exampleDateArray: [ 1776-07-04T00:00:00.000Z, 1941-12-07T00:00:00.000Z ],
  _exampleBufferArray: 
   [ <Buffer 04 7f 93 38>,
     <Buffer 41 20 73 74 72 69 6e 67 20 69 6e 73 74 65 61 64> ],
  _exampleSetArray: [ Set { '14', 3, false }, Set { -14, true, 'pool' } ],
  _examplePlainObjectArray: 
   [ { '14': 'Plain Object', a: 'I am A' },
     { '930': 'Plain Object', and: 'So am I too a' } ],
  _exampleOtherObjArray: 
   [ BasicExample { _name: 'Basic Example 1' },
     BasicExample { _name: 'Basic Example 2' } ] }
Farewell, Rich!
FullExample.exampleFloat(): Non-numeric value passed to 'float' setter.
```

## EZ Object Method Signatures

These are the object method signatures that all of your EZ Objects will have, though note that you can always add other functionality by adding to the object prototype:

### new MyObject([data])
 * **Parameter:** data - `PlainObject` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any provided key/value pairs in the plain object `data`.  Keys can either be equal to the name of a property, or they can have an underscore before the name of a property, as would be the case if you were to JSON.stringify() and then JSON.parse() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.

### new MyObject([data])
 * **Parameter:** data - `string` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any provided key/value pairs in the JSON encoded string `data`.  Keys can either be equal to the name of a property, or they can have an underscore before the name of a property, as would be the case if you were to JSON.stringify() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.

### new MyObject([data])
 * **Parameter:** data - `MyObject` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any getter functions in the EZ Object `data`.

### MyObject.init([data])
 * **Parameter:** data - `Object`
 * **Description:** Initialize this object using either defaults or any provided key/value pairs in the plain object `data`.  Keys can either be equal to the name of a property, or they can have an underscore before the name of a property, as would be the case if you were to JSON.stringify() and then JSON.parse() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.  This is also the method used by the constructor.  

### MyObject.init([data])
 * **Parameter:** data - `Object`
 * **Description:** Initialize this object using either defaults or any provided key/value pairs in the JSON0-encoded string `data`.  Keys can either be equal to the name of a property, or they can have an underscore before the name of a property, as would be the case if you were to JSON.stringify() and then JSON.parse() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.  This is also the method used by the constructor.  

### MyObject.init([data])
 * **Parameter:** data - `MyObject`
 * **Description:** Initialize this object using either defaults or any provided getter functions in the EZ Object `data`.  This is also the method used by the constructor.
 
In addition, each property you define will have a single method that is a getter and setter, and 
it will have the following signatures:

### MyObject.myProperty()
 * **Returns:** `mixed`
 * **Description:** Get the value of the property.
 
### MyObject.myProperty(value)
 * **Parameter:** value - `mixed`
 * **Throws:** `TypeError` if `value` is not of the correct javascript data type for myProperty
 * **Returns:** this
 * **Description:** Set the value of the property, throwing a `TypeError` if the javascript data type does not match the configuration, this is how the strict typing is implemented.  This signature returns `this` to allow for set call chaining.

## Module Exports

The EZ Objects module exports two functions:

### ezobjects.createClass(objectConfig)
 * **Description:** A function that creates an ES6 class corresponding to the configuration outlined in `objectConfig`, with constructor, initializer, getters, and setters.

### ezobjects.instanceOf(obj, constructorName)
 * **Description:** A helper function for testing whether `obj` is an descendant of a constructor `constructorName`.
 
## Configuration Specifications

See the following for how to configure your EZ Objects:

### An object configuration can have the following:

* **className** - `string` - (required) Name of the class
* **properties** - `Array` - (required) An array of property configurations that the object should have corresponding properties for
* **extends** - `mixed` - (optional) The object that the new object should be extended from \[required to extend object]

### A property configuration can have the following:

* **name** - `string` - (required) Name of the property, must conform to JavaScript rules
* **type** - `string` - (optional) EZ Object type that the property must be equal to -- types can be `int`, `float`, `string`, `boolean`, `date`, `buffer`, `set`, `function`, `object`, any other valid object constructor name, or `array` where `arrayOf` is provided with information about the array element types. \[either **type** or **instanceOf** is required]
* **instanceOf** - `string` - (optional) JavaScript class constructor name, that the property must be an instance of \[either **type** or **instanceOf** is required]
* **default** - `mixed` - (optional) Sets the default value for the property in the class object
* **allowNull** - `boolean` - (optional) Indicates the property can be null, default is that only plain objects and custom object types are nullable
* **arrayOf** - `object` - (required for type `array`) A plain object containing he EZ Object `type` or `instanceOf` of the elements of the array -- types can be `int`, `float`, `string`, `boolean`, `date`, `buffer`, `set`, `function`, `plainobject`, or any other valid object constructor name (which can alternatively be used with `instanceOf` instead).  \[either **type** or **instanceOf** is required]
* **setTransform(x, propertyConfig)** - `function` - (optional) Function that transforms and returns the property value prior to setting

### Default intiailizations for different EZ Object types

* `int` - `0`
* `double` - `0`
* `string` - ``
* `boolean` - `false`
* `function` - `function () { }`
* `date` - `new Date(0)`
* `buffer` - `Buffer.from([])`
* `set` - `new Set()`
* `plainobject` - `{}`
* `array` - `[]`
* others - `null`

## Contributing

Please open an issue on the GitHub repository if you find any broken functionality or other bugs/errors.  Feature requests
will also be accepted, but are not guaranteed to be implemented.

## License

MIT Licensed
