/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy, automatic object creation from simple templates with strict typing
 */
module.exports = (obj) => {
  let parent;
  
  /** Figure out proper global scope between node (global) and browser (window) */
  if ( typeof window !== 'undefined' )
    parent = window;
  else
    parent = global;
  
  /** Create new class on global scope */
  parent[obj.name] = class extends (obj.extends || Object) {
    /** Constructor for new object. */
    constructor(data = {}) {
      super(data);

      this.init(data);
    }
    
    /** Initializer */
    init(data = {}) {
      if ( typeof super.init === 'function' )
        super.init(data);
    
      /** Loop through each property in the obj */
      obj.properties.forEach((col) => {
        /** Initialize 'int' and 'float' types to zero */
        if ( col.type == 'int' || col.type == 'float' )
          this[col.name](data[col.name] || col.default || 0);

        /** Initialize 'boolean' types to false */
        else if ( col.type == 'boolean' )
          this[col.name](data[col.name] || col.default || false);
        
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
  
  /** Loop through each property in the obj */
  obj.properties.forEach((col) => {
    /** For 'int' type properties */
    if ( col.type == 'int' ) {
      /** Create class method on prototype */
      parent[obj.name].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( typeof arg == 'number' ) 
          this[`_${col.name}`] = parseInt(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    } 

    /** For 'float' type properties */
    else if ( col.type == 'float' ) {
      /** Create class method on prototype */
      parent[obj.name].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( typeof arg == 'number' ) 
          this[`_${col.name}`] = parseFloat(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    } 

    /** For 'boolean' type properties */
    else if ( col.type == 'boolean' ) {
      /** Create class method on prototype */
      parent[obj.name].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( typeof arg == 'boolean' ) 
          this[`_${col.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
    
    /** For 'string' type properties */
    else if ( col.type == 'string' ) {
      /** Create class method on prototype */
      parent[obj.name].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( typeof arg == 'string' ) 
          this[`_${col.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    } 

    /** For 'Array' type properties */
    else if ( col.type == 'Array' ) {
      /** Create class method on prototype */
      parent[obj.name].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( typeof arg == 'object' && arg.constructor.name == col.type )
          this[`_${col.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }

    /** For all other property types */
    else {
      /** Create class method on prototype */
      parent[obj.name].prototype[col.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${col.name}`]; 

        /** Setter */
        else if ( arg === null || ( typeof arg == 'object' && arg.constructor.name == col.type ) ) 
          this[`_${col.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${col.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
  });
  
  /** 
   * Because we're creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(parent[obj.name], 'name', { value: obj.name });
}
