/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy automatic class creation using simple configuration objects.  Capable
 * of automatically creating ES6 classes with constructor, initializer, and getters/setters 
 * for all configured properties.
 */

/**
 * @signature ezobjects.instanceOf(obj, constructorName)
 * @param obj Object
 * @param constructorName string
 * @description A function for determining if an object instance's
 * prototype chain includes a constructor named `constructorName`.
 */
module.exports.instanceOf = (obj, constructorName) => {
  let found = false;
  
  const isInstance = (obj) => {
    if ( obj && obj.constructor && obj.constructor.name == constructorName )
      found = true;
    
    if ( obj && obj.__proto__ )
      isInstance(obj.__proto__);
  };
  
  isInstance(obj);
  
  return found;
};

/**
 * @signature ezobjects.createClass(obj)
 * @param obj Object Configuration object
 * @description A function for automatically generating a class object based on
 * the values in the provided configuration object.
 */
module.exports.createClass = (obj) => {
  /** Add properties array if one wasn't set */
  if ( !obj.properties )
    obj.properties = [];
    
  /** Create default transform function that doesn't change the input */
  const defaultTransform = x => x;
  
  let parent;
  
  /** Figure out proper global scope between node (global) and browser (window) */
  if ( typeof window !== `undefined` )
    parent = window;
  else
    parent = global;

  /** Create new class on global scope */
  parent[obj.className] = class extends (obj.extends || Object) {
    /** Create constructor */
    constructor(data = {}) {
      super(data);
      
      this.init(data);
    }
    
    /** Create initializer */
    init(data = {}) {
      /** If there is an 'init' function on super, call it */
      if ( typeof super.init === `function` )
        super.init(data);
    
      /** If data is a string, assume it's JSON encoded and parse */
      if ( typeof data == `string` )
        data = JSON.parse(data);

      /** Loop through each key/val pair in data */
      Object.keys(data).forEach((key) => {
        /** If key begins with '_' */
        if ( key.match(/^_/) ) {
          /** Create a new key with the '_' character stripped from the beginning */
          Object.defineProperty(data, key.replace(/^_/, ``), Object.getOwnPropertyDescriptor(data, key));
          
          /** Delete the old key that has '_' */
          delete data[key];
        }
      });
      
      const emptyFunction = function () {
      };
      
      /** Loop through each property in the obj */
      obj.properties.forEach((property) => {
        /** If there is no init transform, set to default */
        if ( typeof property.initTransform !== `function` )
          property.initTransform = defaultTransform;

        /** Initialize 'int' and 'double' types to zero */
        if ( property.type && ( property.type.split(`|`).includes(`int`) || property.type.split(`|`).includes(`double`) ) )
          this[property.name](property.initTransform(data[property.name]) || property.default || 0);

        /** Initialize 'boolean' types to false */
        else if ( property.type && property.type.split(`|`).includes(`boolean`) )
          this[property.name](property.initTransform(data[property.name]) || property.default || false);
        
        /** Initialize 'string' types to empty */
        else if ( property.type && property.type.split(`|`).includes(`string`) )
          this[property.name](property.initTransform(data[property.name]) || property.default || ``);

        /** Initialize 'function' types to empty function */
        else if ( property.type && property.type.split(`|`).includes(`function`) )
          this[property.name](property.initTransform(data[property.name]) || property.default || emptyFunction);
        
        /** Initialize 'Array' types to empty */
        else if ( property.type && property.type.split(`|`).includes(`Array`) )
          this[property.name](property.initTransform(data[property.name]) || property.default || []);

        /** Initialize all other types to null */
        else
          this[property.name](property.initTransform(data[property.name]) || property.default || null);
      });
    }
  };
  
  /** Loop through each property in the obj */
  obj.properties.forEach((property) => {    
    /** If there is no getter transform, set to default */
    if ( typeof property.getTransform !== `function` )
      property.getTransform = defaultTransform;
    
    /** If there is no setter transform, set to default */
    if ( typeof property.setTransform !== `function` )
      property.setTransform = defaultTransform;
    
    /** If there is no save transform, set to default */
    if ( typeof property.saveTransform !== `function` )
      property.saveTransform = defaultTransform;
    
    /** If there is no load transform, set to default */
    if ( typeof property.loadTransform !== `function` )
      property.loadTransform = defaultTransform;
    
    /** Create class method on prototype */
    parent[obj.className].prototype[property.name] = function (arg) { 
      /** Getter */
      if ( arg === undefined ) 
        return property.getTransform(this[`_${property.name}`]); 

      /** Setters */
      
      /** For `int` type properties */
      else if ( typeof arg == `number` && property.type && property.type.split(`|`).includes(`int`) )
        this[`_${property.name}`] = parseInt(property.setTransform(arg)); 
      
      /** For `double` type properties */
      else if ( typeof arg == `number` && property.type && property.type.split(`|`).includes(`double`) )
        this[`_${property.name}`] = parseFloat(property.setTransform(arg)); 
      
      /** For `boolean` type properties */
      else if ( typeof arg == `boolean` && property.type && property.type.split(`|`).includes(`boolean`) )
        this[`_${property.name}`] = property.setTransform(arg); 

      /** For `string` type properties */
      else if ( typeof arg == `string` && property.type && property.type.split(`|`).includes(`string`) )
        this[`_${property.name}`] = property.setTransform(arg).toString(); 
      
      /** For `function` type properties */
      else if ( typeof arg == `function` && property.type && property.type.split(`|`).includes(`function`) )
        this[`_${property.name}`] = property.setTransform(arg); 
      
      /** For `Array` type propeties */
      else if ( arg !== null && typeof arg == `object` && arg.constructor.name == `Array` && property.type && property.type.split(`|`).includes(`Array`) )
        this[`_${property.name}`] = property.setTransform(arg); 

      /** For all other property types */
      else if ( arg === null || ( typeof arg == `object` && property.type && property.type.split(`|`).includes(arg.constructor.name) ) || ( typeof property.instanceOf == `string` && property.instanceOf.split(`|`).some(x => module.exports.instanceOf(arg, x)) ) )
        this[`_${property.name}`] = property.setTransform(arg); 

      /** Handle type errors */
      else 
        throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

      /** Return this object for set call chaining */
      return this; 
    };
  });
  
  /** 
   * Because we`re creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(parent[obj.className], `name`, { value: obj.className });
};
