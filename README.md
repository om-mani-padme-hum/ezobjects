# EZ Objects

We're just getting started, check back later.

## Example

```javascript
/**
 * @copyright 2018 Rich Lowe
 * @license MIT
 */
const ezobjects = require('ezobjects');

const table = {
  tableName: 'people',
  className: 'Person',
  fields: [
    {
      name: 'id',
      type: 'int',
      default: -1
    },
    {
      name: 'firstName',
      type: 'string'
    },
    {
      name: 'lastName',
      type: 'string'
    },
    {
      name: 'checkingBalance',
      type: 'float'
    },
    {
      name: 'permissions',
      type: 'Array'
    },
    {
      name: 'favoriteDay',
      type: 'Date'
    }
  ]
};

/** Create our table model! */
ezobjects(table);

/** Example uses of resulting class on global scope */
const a = new Person();

console.log(a);

const b = new Person({
  id: 1,
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.87,
  permissions: [1, 2, 3],
  favoriteDay: new Date('01-01-2018')
});

console.log(b);

const c = new Person();

c.id(2);
c.firstName('Bert');
c.lastName('Reynolds');
c.checkingBalance(91425518.32);
c.permissions([1, 4]);
c.favoriteDay(new Date('06-01-2017'));

console.log(c);

```

## Example Output

```

{ id: [Function],
  firstName: [Function],
  lastName: [Function],
  checkingBalance: [Function],
  permissions: [Function],
  favoriteDay: [Function],
  _id: -1,
  _firstName: '',
  _lastName: '',
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
{ id: [Function],
  firstName: [Function],
  lastName: [Function],
  checkingBalance: [Function],
  permissions: [Function],
  favoriteDay: [Function],
  _id: 1,
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.87,
  _permissions: [ 1, 2, 3 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
{ id: [Function],
  firstName: [Function],
  lastName: [Function],
  checkingBalance: [Function],
  permissions: [Function],
  favoriteDay: [Function],
  _id: 2,
  _firstName: 'Bert',
  _lastName: 'Reynolds',
  _checkingBalance: 91425518.32,
  _permissions: [ 1, 4 ],
  _favoriteDay: 2017-06-01T05:00:00.000Z }
```