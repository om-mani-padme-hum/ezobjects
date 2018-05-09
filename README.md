# EZ Objects

In development, but functional!

## Example

```javascript
const ezobjects = require('ezobjects');
const util = require('util');

ezobjects({
  tableName: 'records',
  className: 'DatabaseRecord',
  fields: [
    { name: 'id', type: 'int' }
  ]
});

const test = new DatabaseRecord();

console.log(test);

/** Create our customized object complete with constructor/init/getters/setters! */
ezobjects({
  tableName: 'people',
  className: 'Person',
  extends: DatabaseRecord,
  fields: [
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
    { name: 'checkingBalance', type: 'float' },
    { name: 'permissions', type: 'Array' },
    { name: 'favoriteDay', type: 'Date' }
  ]
});

/** Example new object initialized to defaults */
const a = new Person();

console.log(util.inspect(a, { depth: null}));

/** Example new object initialized using `data` object passed to constructor */
const b = new Person({
  id: 1,
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.87,
  permissions: [1, 2, 3],
  favoriteDay: new Date('01-01-2018')
});

console.log(util.inspect(b, { depth: null}));

/** Example new object initialized to defaults, then loaded with data using setter methods */
const c = new Person();

c.id(2);
c.firstName('Bert');
c.lastName('Reynolds');
c.checkingBalance(91425518.32);
c.permissions([1, 4]);
c.favoriteDay(new Date('06-01-2017'));

console.log(util.inspect(c, { depth: null}));

/** Example retrieving data from object using getter methods */
console.log(`ID: ${c.id()}`);
console.log(`First Name: ${c.firstName()}`);
console.log(`Last Name: ${c.lastName()}`);
console.log(`Checking Balance: $${c.checkingBalance()}`);
console.log(`Permissions: ${c.permissions().join(`, `)}`);
console.log(`Favorite Day: ${c.favoriteDay().toString()}`);
```

## Example Output

```
{ init: [Function], id: [Function], _id: 0 }
{ init: [Function],
  id: [Function],
  _id: 0,
  firstName: [Function],
  lastName: [Function],
  checkingBalance: [Function],
  permissions: [Function],
  favoriteDay: [Function],
  _firstName: '',
  _lastName: '',
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
{ init: [Function],
  id: [Function],
  _id: 1,
  firstName: [Function],
  lastName: [Function],
  checkingBalance: [Function],
  permissions: [Function],
  favoriteDay: [Function],
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.87,
  _permissions: [ 1, 2, 3 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
{ init: [Function],
  id: [Function],
  _id: 2,
  firstName: [Function],
  lastName: [Function],
  checkingBalance: [Function],
  permissions: [Function],
  favoriteDay: [Function],
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
```
