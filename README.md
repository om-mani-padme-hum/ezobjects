# EZ Objects v1.1.3

EZ Objects is a Node.js module, the purpose of which is to save you lots of time writing the initializer, property getters, 
and property setters for your data model objects.  The library takes the form of a single function.  This function can be 
passed a generic object containing a few configuration keys, defined below, that will allow it to automatically generate a 
new ES6 class object with the following features:

Auto-initializes all properties (including parent object properties, if extended)
* Default default values for different data types are listed further below
* You can specify the default value for a property in the config when you create the EZ Object
* You can pass a value that the property should have when instansiating the EZ Object
* If the object has been JSON encoded and parsed, the properties will have the internal property 
underscores `_`, fortunately the module will strip the `_` from the object if you wish to initialize 
a new object using a JSON decoded version of the same object

Automatically creates methods that perform getter/setter functionality with strict data typing
* Methods use myMethod() for getter and myMethod(val) for setter
* Methods throw TypeError if type does not match that specified
* Methods return 'this' when setting so set calls can be chained

See the examples below to witness them used in a variety of situations.

## Status

Fully operational!  Please open an issue for any bug reports or feature requests.

## Principles of Operation

This module, when required, is a function that takes a single object argument.  At present, that object can have the
following keys:

* name - A string containing the name of the desired class object (required)
* extends - An object that you wish the class to extend from (optional, note this is the class itself, not the name)
* properties - An array of properties for which the class will have getters/setters/initialization implemented (optional)

Each property in the properties array is an object that can have the following keys:

* name - The name of the property (required)
* type - The type of the property (required, can be string, int, float, boolean, Array, or any other object name)
* default - The default initialized value (optional)

Default defaults are:

* string - ''
* int - 0
* float - 0
* boolean - false
* Array - []
* Any others - null

Note that the created objects are added to the global space, being `global` (node) or `window` (browser), though you'll
have to browserify or equivalent to use in browser.  Like normal classes, they can have other properties/methods added 
externally using the prototype, though note that if you want external prototype-added properties to be initialized, you'll 
have to rewrite the init() function manually.  Alternatively, you can just extend the class and init the parent with 
`super`, see examples below.

## Examples

#### Creating a class
```javascript
const ezobjects = require('ezobjects');

/** Create a customized object on the global (node) or window (browser) namespace */
ezobjects({
  name: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'int' }
  ]
});

/** Example of the object newly instansiated */
const a = new DatabaseRecord();

console.log(a);
```

#### Output

```
DatabaseRecord { _id: 0 }
```

#### Creating a class that's extended from another class

```javascript
/** Create another customized object that extends the first one */
ezobjects({
  name: 'Person',
  extends: DatabaseRecord,
  properties: [
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
    { name: 'checkingBalance', type: 'float' },
    { name: 'permissions', type: 'Array' },
    { name: 'favoriteDay', type: 'Date' }
  ]
});

/** Example of the extended object newly instansiated */
const b = new Person();

console.log(b);
```

#### Output

```
Person {
  _id: 0,
  _firstName: '',
  _lastName: '',
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
```

#### Using an intializer object passed to constructor

```javascript
/** Example of the extended object instansiated and initialized using object passed to constructor */
const c = new Person({
  id: 1,
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.87,
  permissions: [1, 2, 3],
  favoriteDay: new Date('01-01-2018')
});

console.log(c);
```

#### Output

```
Person {
  _id: 1,
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.87,
  _permissions: [ 1, 2, 3 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
```

#### Using the auto-created setters

```javascript
/** Example of the extended object instansiated, then loaded with data using setter methods */
const d = new Person();

d.id(2);
d.firstName('Bert');
d.lastName('Reynolds');
d.checkingBalance(91425518.32);
d.permissions([1, 4]);
d.favoriteDay(new Date('06-01-2017'));

console.log(d);
```

#### Output

```
Person {
  _id: 2,
  _firstName: 'Bert',
  _lastName: 'Reynolds',
  _checkingBalance: 91425518.32,
  _permissions: [ 1, 4 ],
  _favoriteDay: 2017-06-01T05:00:00.000Z }
```

#### Using the auto-created getters

```javascript
/** Example of the extended object's properties being accessed using getter methods */
console.log(`ID: ${d.id()}`);
console.log(`First Name: ${d.firstName()}`);
console.log(`Last Name: ${d.lastName()}`);
console.log(`Checking Balance: $${d.checkingBalance()}`);
console.log(`Permissions: ${d.permissions().join(`, `)}`);
console.log(`Favorite Day: ${d.favoriteDay().toString()}`);
```

#### Output

```
ID: 2
First Name: Bert
Last Name: Reynolds
Checking Balance: $91425518.32
Permissions: 1, 4
Favorite Day: Thu Jun 01 2017 00:00:00 GMT-0500 (CDT)
```

#### Adding properties by using the class prototype

```javascript
/** Adding property to the generated object's prototype */
DatabaseRecord.prototype.table = function (arg) {
  /** Getter */
  if ( arg === undefined )
    return this._table;
  
  /** Setter */
  else if ( typeof arg == 'string' )
    this._table = arg;
  
  /** Handle type errors */
  else
    throw new TypeError(`${this.constructor.name}.table(${typeof arg}): Invalid signature.`);
  
  /** Return this object for set call chaining */
  return this;
};

/** Yuck, now I have to manually override the init() call if I want it initialized */
DatabaseRecord.prototype.init = function (data = {}) {
  this.id(data.id || 0);
  this.table(data.table || '');
};

const e = new DatabaseRecord();

console.log(e);
```

#### Output

```
DatabaseRecord { _id: 0, _table: '' }
```

#### Adding capability other than properties by using the class prototype

```javascript
/** Adding arbitrary capability other than property to the generated object's prototype */
DatabaseRecord.prototype.hello = function () {
  return "Hello, World!";
};

const f = new DatabaseRecord();

console.log(f.hello());
```

#### Output

```
Hello, World!
```

#### Adding properties and/or capability by extending the class

```javascript
/** These objects can be extended instead to accomplish the same things if preferred */
class DatabaseRecord2 extends DatabaseRecord {
  constructor(data = {}) {
    super(data);
  }

  init(data = {}) {
    super.init(data);
    this.test('Test');
  }

  test(arg) {
    /** Getter */
    if ( arg === undefined )
      return this._test;

    /** Setter */
    else if ( typeof arg == 'string' )
      this._test = arg.toString();

    /** Handle type errors */
    else
      throw new TypeError(`${this.constructor.name}.test(${typeof arg}): Invalid signature.`);

    /** Return this object for set call chaining */
    return this;
  }
}

const g = new DatabaseRecord2();

console.log(g);
console.log(g.hello());
```

#### Output

```
DatabaseRecord2 { _id: 0, _table: '', _test: 'Test' }
Hello, World!
```
