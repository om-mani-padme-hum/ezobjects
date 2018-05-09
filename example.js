/**
 * @copyright 2018 Rich Lowe
 * @license MIT
 */
const ezobjects = require('./index');

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
