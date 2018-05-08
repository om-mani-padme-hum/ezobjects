const table = {
  name: 'Person',
  fields: [
    {
      name: 'id',
      type: 'int',
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
      type: 'double'
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

function createObject(table) {
  let parent;
  
  if ( typeof window !== 'undefined' )
    parent = window;
  else
    parent = global;
  
  parent[table.name] = class {
    constructor(data = {}) {
      
      
      table.fields.forEach((col) => {
        if ( col.type == 'int' )
          this[col.name] = (arg) => { if ( arg === undefined ) return this[`_${col.name}`]; else if ( typeof arg == 'number' ) this[`_${col.name}`] = parseInt(arg); else throw new Error(`${table.name}.${col.name}(${typeof arg}): Invalid signature.`); return this; };
        else if ( col.type == 'float' )
          this[col.name] = (arg) => { if ( arg === undefined ) return this[`_${col.name}`]; else if ( typeof arg == 'number' ) this[`_${col.name}`] = parseFloat(arg); else throw new Error(`${table.name}.${col.name}(${typeof arg}): Invalid signature.`); return this; };
        else if ( col.type == 'string' )
          this[col.name] = (arg) => { if ( arg === undefined ) return this[`_${col.name}`]; else if ( typeof arg == 'string' ) this[`_${col.name}`] = arg.toString(); else throw new Error(`${table.name}.${col.name}(${typeof arg}): Invalid signature.`); return this; };
        else
          this[col.name] = (arg) => { if ( arg === undefined ) return this[`_${col.name}`]; else if ( arg === null || ( typeof arg == 'object' && arg.constructor.name == col.type ) ) this[`_${col.name}`] = arg; else throw new Error(`${table.name}.${col.name}(${typeof arg}): Invalid signature.`); return this; };
      });
      
      table.fields.forEach((col) => {
        if ( col.type == 'int' || col.type == 'float' )
          this[col.name](data[col.name] || col.default || 0);
        else if ( col.type == 'string' )
          this[col.name](data[col.name] || col.default || '');
        else if ( col.type == 'Array' )
          this[col.name](data[col.name] || col.default || []);
        else
          this[col.name](data[col.name] || col.default || null);
      });
    }
  }
  
  Object.defineProperty(parent[table.name], 'name', {value: table.name});
}

createObject(table);

const a = new Person({
  id: 1,
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.87,
  permissions: [1, 2, 3],
  favoriteDay: new Date('01-01-2018')
});

console.log(a);
