# EZ Objects v0.6.1

Under development, but completely useable.

## Principles of Operation

This module, when required, is a function that takes a single object argument.  At present, that object can have the
following keys:

* name - A string containing the name of the desired class object (required)
* extends - An object that you wish the class to extend from (optional, note this is the class itself, not the name)
* fields - An array of fields (properties) that the class will have getters/setters/initialization for (optional)

Each field in the array is an object that can have the following keys:

* name - The name of the field (required)
* type - The type of the field (required, can be string, int, float, boolean, Array, or any other object name)
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
`super`.  See examples below.

## Example

```javascript
const ezobjects = require('ezobjects');

/** 
 * Create a customized object on the global (node) or window (browser) namespace, complete with 
 * constructor/init/getters/setters with strict type checking, TypeError thrown if invalid type.
 */
ezobjects({
  name: 'DatabaseRecord',
  fields: [
    { name: 'id', type: 'int' }
  ]
});

/** Create another customized object that extends the first one */
ezobjects({
  name: 'Person',
  extends: DatabaseRecord,
  fields: [
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
    { name: 'checkingBalance', type: 'float' },
    { name: 'permissions', type: 'Array' },
    { name: 'favoriteDay', type: 'Date' }
  ]
});

/** Example of the extended object newly instansiated */
const a = new Person();

console.log(a);

/** Example of the extended object instansiated and initialized using object passed to constructor */
const b = new Person({
  id: 1,
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.87,
  permissions: [1, 2, 3],
  favoriteDay: new Date('01-01-2018')
});

console.log(b);

/** Example of the extended object instansiated, then loaded with data using setter methods */
const c = new Person();

c.id(2);
c.firstName('Bert');
c.lastName('Reynolds');
c.checkingBalance(91425518.32);
c.permissions([1, 4]);
c.favoriteDay(new Date('06-01-2017'));

console.log(c);

/** Example of the extended object's properties being accessed using getter methods */
console.log(`ID: ${c.id()}`);
console.log(`First Name: ${c.firstName()}`);
console.log(`Last Name: ${c.lastName()}`);
console.log(`Checking Balance: $${c.checkingBalance()}`);
console.log(`Permissions: ${c.permissions().join(`, `)}`);
console.log(`Favorite Day: ${c.favoriteDay().toString()}`);

/** Adding capability to the generated object's prototype */
DatabaseRecord.prototype.table = function (arg) {
  if ( arg === undefined )
    return this._table;
  
  this._table = arg;
};

/** Yuck, now I have to manually override the init() call */
DatabaseRecord.prototype.init = function (data = {}) {
  this.id(data.id || 0);
  this.table(data.table || '');
};

const d = new DatabaseRecord();

console.log(d);

/** These objects can be extended */
class DatabaseRecord2 extends DatabaseRecord {
  constructor(data = {}) {
    super(data);
  }

  init(data = {}) {
    super.init(data);
    this.test('Test');
  }

  test(arg) {
    if ( arg === undefined )
      return this._test;

    this._test = arg;
  }
}

const e = new DatabaseRecord2();

console.log(e);
```

## Example Output

```
Person {
  _id: 0,
  _firstName: '',
  _lastName: '',
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
Person {
  _id: 1,
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.87,
  _permissions: [ 1, 2, 3 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
Person {
  _id: 2,
  _firstName: 'Bert',
  _lastName: 'Reynolds',
  _checkingBalance: 91425518.32,
  _permissions: [ 1, 4 ],
  _favoriteDay: 2017-06-01T05:00:00.000Z }
ID: 2
First Name: Bert
Last Name: Reynolds
Checking Balance: $91425518.32
Permissions: 1, 4
Favorite Day: Thu Jun 01 2017 00:00:00 GMT-0500 (CDT)
DatabaseRecord { _id: 0, _table: '' }
DatabaseRecord2 { _id: 0, _table: '', _test: 'Test' }
```
