const ezobjects = require('./index');

/** Create a customized object on the global (node) or window (browser) namespace, complete with constructor/init/getters/setters */
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
