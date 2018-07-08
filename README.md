# EZ Objects v3.0.0

EZ Objects is a Node.js module (that can also be usefully browserify'd) that aims to save you lots of time 
writing class objects that are strictly typed in JavaScript.  All you have to do is create simple 
configurations for each of your objects and then create them using the createClass() function.

* [Installation](#installation)
* [Basic Example](#basic-example)
* [Extending the Basic Example](#extending-the-basic-example)
* [EZ Object Method Signatures](#ez-object-method-signatures)
* [Module Exports](#module-exports)
* [Configuration Specifications](#configuration-specifications)
* [Contributing](#contributing)
* [License](#license)

## Installation

`npm install --save ezobjects`

## Basic Example

```javascript
const ezobjects = require(`ezobjects`);

/** 
 * Create a customized object called DatabaseRecord on the 
 * global (node) or window (browser) namespace with a single
 * property called `id`.
 */
ezobjects.createClass({
  className: `DatabaseRecord`,
  properties: [
    { name: `id`, type: `number`, setTransform: x => parseInt(x) }
  ]
});
 
const record = new DatabaseRecord();

console.log(record);
```

### Expected Output

```
DatabaseRecord { _id: 0 }
```

## Extending the Basic Example

```javascript
ezobjects.createClass({
  className: `User`,
  extends: DatabaseRecord,
  properties: [
    { name: `username`, type: `string` },
    { name: `firstName`, type: `string` },
    { name: `lastName`, type: `string` },
    { name: `checkingBalance`, type: `number`, setTransform: x => parseFloat(x) },
    { name: `permissions`, type: `Array` },
    { name: `favoriteDay`, type: `Date` }
  ]
});

const user = new User();

console.log(user);
```

### Expected Output

```
User {
  _id: 0,
  _username: ``,
  _firstName: ``,
  _lastName: ``,
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
```

## EZ Object Method Signatures

These are the object method signatures even the most basic of EZ Objects will have:

### new MyObject([data])
 * **Parameter:** data - `PlainObject` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any provided key/value pairs in the plain object `data`.  Keys can either be equal to the name of a property, or they can be have an underscore before the name of a property, as would be the case if you were to JSON.stringify() and then JSON.parse() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.

### new MyObject([data])
 * **Parameter:** data - `string` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any provided key/value pairs in the JSON encoded string `data`.  Keys can either be equal to the name of a property, or they can be have an underscore before the name of a property, as would be the case if you were to JSON.stringify() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.

### MyObject.init([data])
 * **Parameter:** data - `PlainObject`
 * **Description:** Initialize this object using either defaults or any provided key/value pairs in the plain object `data`.  This is also the method used by the constructor.
 
In addition, each property you define will have a single method that is a getter and setter, and 
it will have the following signatures:

### MyObject.myProperty()
 * **Returns:** `mixed`
 * **Description:** Get the value of the property.
 
### MyObject.myProperty(value)
 * **Parameter:** value - `mixed`
 * **Throws:** `TypeError` if `value` is not of the correct javascript data type for myProperty
 * **Returns:** this
 * **Description:** Set the value of the property, throwing an error if the javascript data type does not match the configuration, this is how the strict typing is implemented.  This signature returns `this` to allow for set call chaining.

## Module Exports

The EZ Objects module exports a single function for creating new class objects:

### ezobjects.createClass(objectConfig)
A function that creates an ES6 class corresponding to the configuration outlined in `objectConfig`, with constructor, initializer, getters, setters, and also delete, insert, load, and update if `tableName` is configured

## Configuration Specifications

See the following for how to configure your EZ Objects:

### An object configuration can have the following:

* **className** - `string` - (required) Name of the class
* **properties** - `Array` - (required) An array of property configurations that the object (and MySQL table, if applicable) should have corresponding properties for
* **extends** - `mixed` - (optional) The object that the new object should be extended from \[required to extend object]

### A property configuration can have the following:

* **name** - `string` - (required) Name of the property, must conform to both JavaScript and MySQL rules
* **type** - `string` - (optional) JavaScript data type, or types if separated by the pipe `|` character, that the property must be equal to -- types can be `string`, `int`, `double`, `boolean`, `function`, `Array`, or any valid object constructor name \[either **type** and/or **instanceOf** is required]
* **instanceOf** - `string` - (optional) JavaScript class constructor name, or names if separated by the pipe `|` character, that the property must be an instance of \[either **type** and/or **instanceOf** is required]
* **default** - `mixed` - (optional) Sets the default value for the property in the class object
* **initTransform(x)** - `function` - (optional) Function that transforms and returns the property value prior to initializing (does not affect ezobjects defaults or custom defaults)
* **getTransform(x)** - `function` - (optional) Function that transforms and returns the property value prior to getting
* **setTransform(x)** - `function` - (optional) Function that transforms and returns the property value prior to setting

### Default intiailizations for different EZ Object types

* `int` - 0
* `double` - 0
* `string` - ``
* `boolean` - false
* `function` - function () { }
* `Array` - []
* Everything else - null

## Contributing

Please open an issue on the GitHub repository if you find any broken functionality or other bugs/errors.  Feature requests
will also be accepted, but are not guaranteed to be implemented.

## License

MIT Licensed
