# EZ Objects

We're just getting started, check back later.

## Example

```javascript
/**
 * @copyright 2018 Rich Lowe
 * @license MIT
 */

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

function createObject(table) {
  let parent;
  
  /** Figure out proper global scope between node (global) and browser (window) */
  if ( typeof window !== 'undefined' )
    parent = window;
  else
    parent = global;
  
  /** Create new class on global scope */
  parent[table.className] = class {
    /**
     * Constructor for new object.
     */
    constructor(data = {}) {
      /** Loop through each field in the table */
      table.fields.forEach((col) => {
        /** For 'int' type fields */
        if ( col.type == 'int' ) {
          this[col.name] = (arg) => { 
            /** Getter */
            if ( arg === undefined ) 
              return this[`_${col.name}`]; 
            
            /** Setter */
            else if ( typeof arg == 'number' ) 
              this[`_${col.name}`] = parseInt(arg); 
            
            /** Handle type errors */
            else 
              throw new Error(`${table.className}.${col.name}(${typeof arg}): Invalid signature.`); 
            
            /** Return this object for set call chaining */
            return this; 
          };
        } 
        
        /** For 'float' type fields */
        else if ( col.type == 'float' ) {
          this[col.name] = (arg) => { 
            /** Getter */
            if ( arg === undefined ) 
              return this[`_${col.name}`]; 
            
            /** Setter */
            else if ( typeof arg == 'number' ) 
              this[`_${col.name}`] = parseFloat(arg); 
            
            /** Handle type errors */
            else 
              throw new Error(`${table.className}.${col.name}(${typeof arg}): Invalid signature.`); 
            
            /** Return this object for set call chaining */
            return this; 
          };
        } 
        
        /** For 'string' type fields */
        else if ( col.type == 'string' ) {
          this[col.name] = (arg) => { 
            /** Getter */
            if ( arg === undefined ) 
              return this[`_${col.name}`]; 
            
            /** Setter */
            else if ( typeof arg == 'string' ) 
              this[`_${col.name}`] = arg.toString(); 
            
            /** Handle type errors */
            else 
              throw new Error(`${table.className}.${col.name}(${typeof arg}): Invalid signature.`); 
            
            /** Return this object for set call chaining */
            return this; 
          };
        } 
        
        /** For 'Array' type fields */
        else if ( col.type == 'Array' ) {
          this[col.name] = (arg) => { 
            /** Getter */
            if ( arg === undefined ) 
              return this[`_${col.name}`]; 
            
            /** Setter */
            else if ( typeof arg == 'object' && arg.constructor.name == col.type )
              this[`_${col.name}`] = arg; 
            
            /** Handle type errors */
            else 
              throw new Error(`${table.className}.${col.name}(${typeof arg}): Invalid signature.`); 
            
            /** Return this object for set call chaining */
            return this; 
          };
        }
        
        /** For all other field types */
        else {
          this[col.name] = (arg) => { 
            /** Getter */
            if ( arg === undefined ) 
              return this[`_${col.name}`]; 
            
            /** Setter */
            else if ( arg === null || ( typeof arg == 'object' && arg.constructor.name == col.type ) ) 
              this[`_${col.name}`] = arg; 
            
            /** Handle type errors */
            else 
              throw new Error(`${table.className}.${col.name}(${typeof arg}): Invalid signature.`); 
            
            /** Return this object for set call chaining */
            return this; 
          };
        }
      });
      
      /** Loop through each field in the table again */
      table.fields.forEach((col) => {
        /** Initialize 'int' and 'float' types to zero */
        if ( col.type == 'int' || col.type == 'float' )
          this[col.name](data[col.name] || col.default || 0);
        
        /** Initialize 'string' types to empty */
        else if ( col.type == 'string' )
          this[col.name](data[col.name] || col.default || '');
        
        /** Initialize 'Array' types to empty */
        else if ( col.type == 'Array' )
          this[col.name](data[col.name] || col.default || []);
        
        /** Initialize all other types to null */
        else
          this[col.name](data[col.name] || col.default || null);
      });
    }
  }
  
  /** 
   * Because we're creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(parent[table.className], 'name', {value: table.name});
}

createObject(table);

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

## Output

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