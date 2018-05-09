/**
 * @copyright 2018 Rich Lowe
 * @license MIT
 */
module.exports = (table) => {
  let parent;
  
  /** Figure out proper global scope between node (global) and browser (window) */
  if ( typeof window !== 'undefined' )
    parent = window;
  else
    parent = global;
  
  /** Create new class on global scope */
  parent[table.className] = class extends (table.extends || Object) {
    /** Constructor for new object. */
    constructor(data = {}) {
      super(data);

      this.init(data);
    }
    
    init(data = {}) {
      if ( typeof super.init === 'function' )
        super.init(data);
    
      /** Loop through each field in the table */
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
  
  /** Loop through each field in the table */
  table.fields.forEach((col) => {
    /** For 'int' type fields */
    if ( col.type == 'int' ) {
      parent[table.className].prototype[col.name] = function (arg) { 
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
      parent[table.className].prototype[col.name] = function (arg) { 
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

    /** For 'boolean' type fields */
    if ( col.type == 'boolean' ) {
      parent[table.className].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( typeof arg == 'boolean' ) 
          this[`_${col.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new Error(`${table.className}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
    
    /** For 'string' type fields */
    else if ( col.type == 'string' ) {
      parent[table.className].prototype[col.name] = function (arg) { 
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
      parent[table.className].prototype[col.name] = function (arg) { 
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
      parent[table.className].prototype[col.name] = function (arg) { 
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
  
  /** 
   * Because we're creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(parent[table.className], 'name', { value: table.className });
}
