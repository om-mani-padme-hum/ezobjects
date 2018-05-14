/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy, automatic object creation from simple templates with strict typing
 */
module.exports.createObject = (obj) => {
  let parent;
  
  /** Figure out proper global scope between node (global) and browser (window) */
  if ( typeof window !== 'undefined' )
    parent = window;
  else
    parent = global;
  
  /** Create new class on global scope */
  parent[obj.className] = class extends (obj.extends || Object) {
    /** Constructor for new object. */
    constructor(data = {}) {
      super(data);

      this.init(data);
    }
    
    /** Initializer */
    init(data = {}) {
      if ( typeof super.init === 'function' )
        super.init(data);
    
      if ( typeof data == 'string' )
        data = JSON.parse(data);

      Object.keys(data).forEach((key) => {
        if ( key.match(/^_/) ) {
          Object.defineProperty(data, key.replace(/^_/, ''), Object.getOwnPropertyDescriptor(data, key));
          delete data[key];
        }
      });
            
      /** Loop through each property in the obj */
      obj.properties.forEach((property) => {
        /** Initialize 'number' types to zero */
        if ( property.type == 'number' )
          this[property.name](data[property.name] || property.default || 0);

        /** Initialize 'boolean' types to false */
        else if ( property.type == 'boolean' )
          this[property.name](data[property.name] || property.default || false);
        
        /** Initialize 'string' types to empty */
        else if ( property.type == 'string' )
          this[property.name](data[property.name] || property.default || '');

        /** Initialize 'Array' types to empty */
        else if ( property.type == 'Array' )
          this[property.name](data[property.name] || property.default || []);

        /** Initialize all other types to null */
        else
          this[property.name](data[property.name] || property.default || null);
      });
    }
  }
  
  /** Loop through each property in the obj */
  obj.properties.forEach((property) => {
    /** For 'number' type properties */
    if ( property.type == 'number' ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${property.name}`]; 

        /** Setter */
        else if ( typeof arg == 'number' ) 
          this[`_${property.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }

    /** For 'boolean' type properties */
    else if ( property.type == 'boolean' ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${property.name}`]; 

        /** Setter */
        else if ( typeof arg == 'boolean' ) 
          this[`_${property.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
    
    /** For 'string' type properties */
    else if ( property.type == 'string' ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${property.name}`]; 

        /** Setter */
        else if ( typeof arg == 'string' ) 
          this[`_${property.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    } 

    /** For 'Array' type properties */
    else if ( property.type == 'Array' ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${property.name}`]; 

        /** Setter */
        else if ( typeof arg == 'object' && arg.constructor.name == property.type )
          this[`_${property.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }

    /** For all other property types */
    else {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return this[`_${property.name}`]; 

        /** Setter */
        else if ( arg === null || ( typeof arg == 'object' && arg.constructor.name == property.type ) ) 
          this[`_${property.name}`] = arg; 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
  });
  
  /** 
   * Because we're creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(parent[obj.className], 'name', { value: obj.className });
}
