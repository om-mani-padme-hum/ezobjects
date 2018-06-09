const ezobjects = require(`./index`);

/** Create a customized object on the global (node) or window (browser) namespace */
ezobjects.createObject({
  className: `DatabaseRecord`,
  properties: [
    { name: `id`, type: `number`, setTransform: x => parseInt(x) }
  ]
});

/** Example of the object newly instansiated */
const a = new DatabaseRecord();

console.log(a);

/** Create another customized object that extends the first one */
ezobjects.createObject({
  className: `Person`,
  extends: DatabaseRecord,
  properties: [
    { name: `firstName`, type: `string` },
    { name: `lastName`, type: `string` },
    { name: `checkingBalance`, type: `number`, setTransform: x => parseFloat(x) },
    { name: `permissions`, type: `Array` },
    { name: `favoriteDay`, type: `Date` }
  ]
});

/** Example of the extended object newly instansiated */
const b = new Person();

console.log(b);

/** Example of the extended object instansiated and initialized using object passed to constructor */
const c = new Person({
  id: 1,
  firstName: `Rich`,
  lastName: `Lowe`,
  checkingBalance: 4.87,
  permissions: [1, 2, 3],
  favoriteDay: new Date(`01-01-2018`)
});

console.log(c);

/** Example of the extended object instansiated, then loaded with data using setter methods */
const d = new Person();

d.id(2);
d.firstName(`Bert`);
d.lastName(`Reynolds`);
d.checkingBalance(91425518.32);
d.permissions([1, 4]);
d.favoriteDay(new Date(`06-01-2017`));

console.log(d);

/** Example of the extended object`s properties being accessed using getter methods */
console.log(`ID: ${d.id()}`);
console.log(`First Name: ${d.firstName()}`);
console.log(`Last Name: ${d.lastName()}`);
console.log(`Checking Balance: $${d.checkingBalance()}`);
console.log(`Permissions: ${d.permissions().join(`, `)}`);
console.log(`Favorite Day: ${d.favoriteDay().toString()}`);

/** Adding property to the generated object`s prototype */
DatabaseRecord.prototype.table = function (arg) {
  /** Getter */
  if ( arg === undefined )
    return this._table;
  
  /** Setter */
  else if ( typeof arg == `string` )
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
  this.table(data.table || ``);
};

const e = new DatabaseRecord();

console.log(e);

/** Adding arbitrary capability other than property to the generated object`s prototype */
DatabaseRecord.prototype.hello = function () {
  return `Hello, World!`;
};

const f = new DatabaseRecord();

console.log(f.hello());

/** These objects can be extended instead to accomplish the same things if preferred */
class DatabaseRecord2 extends DatabaseRecord {
  constructor(data = {}) {
    super(data);
  }

  init(data = {}) {
    super.init(data);
    this.test(`Test`);
  }

  test(arg) {
    /** Getter */
    if ( arg === undefined )
      return this._test;

    /** Setter */
    else if ( typeof arg == `string` )
      this._test = arg;

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
