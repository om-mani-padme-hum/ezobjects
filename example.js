const ezobjects = require('ezobjects');
const util = require('util');

ezobjects({
  className: 'DatabaseRecord',
  fields: [
    { name: 'id', type: 'int' }
  ]
});

const test = new DatabaseRecord();

console.log(test);

/** Create our customized object complete with constructor/init/getters/setters! */
ezobjects({
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