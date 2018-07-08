/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy automatic class creation using simple configuration objects.  Capable
 * of automatically creating ES6 classes with constructor, initializer, and getters/setters 
 * for all configured properties.
 */

/** Require external modules */
const util = require(`util`);

/** Figure out proper parent scope between node (global) and browser (window) */
let parent;

if ( typeof window !== `undefined` )
  parent = window;
else
  parent = global;

/** Define the EZ Object types, their associated JavaScript and MySQL types, defaults, quirks, transforms, etc... */
const ezobjectTypes = [
  { type: `int`, javascriptType: 'number', default: 0, setTransform: x => parseInt(x) },
  { type: `float`, javascriptType: 'number', default: 0, setTransform: x => parseFloat(x) },
  { type: `string`, javascriptType: 'string', default: '' },
  { type: `boolean`, javascriptType: 'boolean', default: false, setTransform: x => x ? true : false },
  { type: `function`, javascriptType: 'function', default: () => {} },
  { type: `date`, javascriptType: 'Date', default: new Date(0) },
  { type: `buffer`, javascriptType: 'Buffer', default: Buffer.from([]) },
  { type: `other`, javascriptType: 'object', default: null },
  
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `int`, 
    setTransform: (x, property) => {
      if ( x.some(y => isNaN(y)) )
        throw new Error(`${property.name}.setTransform(): Non-numeric value passed to Array[int] setter.`);
      return x.map(y => parseInt(y));
    } 
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `float`, 
    setTransform: (x, property) => {
      if ( x.some(y => isNaN(y)) )
        throw new Error(`${property.name}.setTransform(): Non-numeric value passed to Array[float] setter.`);
      return x.map(y => parseFloat(y));
    }
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `string`, 
    setTransform: (x, property) => {
      if ( x.some(y => typeof y !== 'string') )
        throw new Error(`${property.name}.setTransform(): Non-string value passed to Array[string] setter.`);
      return x;
    }
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `boolean`, 
    setTransform: (x, property) => {
      if ( x.some(y => typeof y !== 'boolean') )
        throw new Error(`${property.name}.setTransform(): Non-boolean value passed to Array[boolean] setter.`);
      return x; 
    }
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `function`, 
    setTransform: (x, property) => {
      if ( x.some(y => typeof y !== 'function') )
        throw new Error(`${property.name}.setTransform(): Non-function value passed to Array[function] setter.`);
      return x; 
    }
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `date`, 
    setTransform: (x, property) => {
      if ( x.some(y => typeof y !== 'object' || y.constructor.name != 'Date' ) )
        throw new Error(`${property.name}.setTransform(): Non-Date value passed to Array[Date] setter.`);
      return x;
    }
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `buffer`, 
    setTransform: (x, property) => {
      if ( x.some(y => typeof y !== 'object' || y.constructor.name != 'Buffer' ) )
        throw new Error(`${property.name}.setTransform(): Non-Buffer value passed to Array[Buffer] setter.`);
      return x; 
    }
  },
  { type: `array`, javascriptType: `Array`, default: [], arrayOfType: `other`, 
    setTransform: (x, property) => { 
      if ( x.some(y => typeof y !== 'object' || ( typeof property.type == 'string' && y.constructor.name != property.originalType ) || ( typeof property.instanceOf === 'string' && y.constructor.name != property.instanceOf )) )
        throw new Error(`${property.name}.setTransform(): Invalid value passed to Array[${typeof property.type === 'string' ? property.originalType : property.instanceOf}] setter.`);
      return x;
    }
  },
];

/** Validate configuration for a single property */
function validatePropertyConfig(property) {  
  /** If name is missing or not a string, throw error */
  if ( typeof property.name !== 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property configured with missing or invalid 'name'.`);

  /** If name is not a valid MySQL column name, throw error */
  if ( !property.name.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) )
    throw new Error(`ezobjects.validatePropertyConfig(): Property 'name' not valid MySQL column name, must start with 'a-zA-Z_' and contain only 'a-zA-Z0-9_'.`);
    
  /** If type is missing or not a string, throw error */
  if ( typeof property.type !== 'string' && typeof property.instanceOf !== 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property ${property.name} configured with missing or invalid 'type' and/or 'instanceOf', one of them is required.`);
  
  /** If type is invalid, throw error */
  if ( property.type && typeof property.type !== 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property ${property.name} configured with invalid 'type'.`);
  
  /** If instanceOf is invalid, throw error */
  if ( property.instanceOf && typeof property.instanceOf !== 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property ${property.name} configured with invalid 'instanceOf'.`);

  /** If the original type has not yet been recorded */
  if ( property.type && typeof property.originalType !== 'string' ) {
    /** Store original type with preserved case */
    property.originalType = property.type;
    
    /** Convert type to lower-case for comparison to ezobjectsTypes */
    property.type = property.type.toLowerCase();
  }
  
  /** If type is 'ARRAY' with no 'arrayOf', throw error */
  if ( property.type == 'array' && ( typeof property.arrayOf !== 'object' || property.arrayOf.constructor.name != 'Object' ) )
    throw new Error(`ezobjects.validatePropertyConfig(): Property '${property.name}' of type ${property.type} with missing or invalid 'arrayOf'.`);
  
  /** If type is 'ARRAY' with 'arrayOf' containing bad or missing type, throw error */
  if ( property.type == 'array' && typeof property.arrayOf.type != 'string' && typeof property.arrayOf.instanceOf != 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property '${property.name}' of type ${property.type} with missing or invalid 'arrayOf.type' and/or 'arrayOf.instanceOf', one of them is required.`);
  
  /** Attach arrayOf 'ezobjectType' if property type is 'array' */
  if ( property.type == 'array' ) {
    /** If it's a standard EZ Object type, attach 'ezobjectType' to property for later use */
    property.ezobjectType = ezobjectTypes.find(x => x.type == property.type && x.arrayOfType == property.arrayOf.type );

    /** If no standard type was found, use 'other' type for other objects */
    if ( !property.ezobjectType )
      property.ezobjectType = ezobjectTypes.find(x => x.type == 'array' && x.arrayOfType == 'other' );
    
    /** If it's a standard EZ Object type, attach 'ezobjectType' to property arrayOf type for later use */
    property.arrayOf.ezobjectType = ezobjectTypes.find(x => x.type == property.arrayOf.type);

    /** If no standard type was found, use 'other' type for other objects */
    if ( !property.arrayOf.ezobjectType )
      property.arrayOf.ezobjectType = ezobjectTypes.find(x => x.type == 'other');
  } else {
    /** If it's a standard EZ Object type, attach 'ezobjectType' to property for later use */
    property.ezobjectType = ezobjectTypes.find(x => x.type == property.type);

    /** If no standard type was found, use 'other' type for other objects */
    if ( !property.ezobjectType )
      property.ezobjectType = ezobjectTypes.find(x => x.type == 'other');
  }
  
  /** Create default transform function that doesn't change the input */
  const defaultTransform = x => x;
  
  /** If there is no init transform, set to default */
  if ( typeof property.initTransform !== `function` )
    property.initTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.initTransform == 'function' ? property.ezobjectType.initTransform : defaultTransform;

  /** If there is no getter transform, set to default */
  if ( typeof property.getTransform !== `function` )
    property.getTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.getTransform == 'function' ? property.ezobjectType.getTransform : defaultTransform;

  /** If there is no setter transform, set to default */
  if ( typeof property.setTransform !== `function` )
    property.setTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.setTransform == 'function' ? property.ezobjectType.setTransform : defaultTransform;

  /** If there is no save transform, set to default */
  if ( typeof property.saveTransform !== `function` )
    property.saveTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.saveTransform == 'function' ? property.ezobjectType.saveTransform : defaultTransform;

  /** If there is no load transform, set to default */
  if ( typeof property.loadTransform !== `function` )
    property.loadTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.loadTransform == 'function' ? property.ezobjectType.loadTransform : defaultTransform;
      
  /** Fully determine whether to allow nulls for this property */
  if ( typeof property.allowNull !== `boolean` && property.ezobjectType.type != 'other' )
    property.allowNull = false;
  else if ( typeof property.allowNull !== `boolean` )
    property.allowNull = true;
}

/** Validate configuration for a class */
function validateClassConfig(obj) {
  /** If configuration is not plain object, throw error */
  if ( typeof obj != `object` || obj.constructor.name != `Object` )
    throw new Error(`ezobjects.validateClassConfig(): Invalid table configuration argument, must be plain object.`);
    
  /** If configuration has missing or invalid 'className' configuration, throw error */
  if ( typeof obj.className !== 'string' || !obj.className.match(/[A-Za-z_0-9$]+/) )
    throw new Error(`ezobjects.validateClassConfig(): Configuration has missing or invalid 'className', must be string containing characters 'A-Za-z_0-9$'.`);

  /** Add properties array if one wasn't set */
  if ( !obj.properties )
    obj.properties = [];

  /** Make sure properties is array */
  if ( obj.properties && ( typeof obj.properties != 'object' || obj.properties.constructor.name != 'Array' ) )
    throw new Error(`ezobjects.validateClassConfig(): Invalid properties configuration, properties not array.`);
  
  /** Loop through any properties and validate them */
  obj.properties.forEach((property) => {
    validatePropertyConfig(property);
  });
}

/**
 * @signature ezobjects.instanceOf(obj, constructorName)
 * @param obj Object
 * @param constructorName string
 * @description A function for determining if an object instance's
 * prototype chain includes a constructor named `constructorName`.
 */
module.exports.instanceOf = (obj, constructorName) => {
  let found = false;
  
  /** Recursive function for determining if ancestral prototype is an instance of the given `constructorName` */
  const isInstance = (obj) => {
    /** If it is an instance of `constructorName`, set found to true */
    if ( obj && obj.constructor && obj.constructor.name == constructorName )
      found = true;
    
    /** If this is an extension of a more fundamental prototype, recursively check it too */
    if ( obj && obj.__proto__ )
      isInstance(obj.__proto__);
  };
  
  /** See if `obj` is an instance of `constructorName` */
  isInstance(obj);
  
  /** Return the result */
  return found;
};

/**
 * @signature ezobjects.createClass(obj)
 * @param obj Object Configuration object
 * @description A function for automatically generating a class object based on
 * the values in the provided configuration object.
 */
module.exports.createClass = (obj) => {
  /** Validate class configuration */
  validateClassConfig(obj);

  /** Create new class on global scope */
  parent[obj.className] = class extends (obj.extends || Object) {
    /** Create constructor */
    constructor(data = {}) {
      /** Initialize super */
      super(data);
      
      /** Initialize object to values in `data` or defaults */
      this.init(data);
    }
    
    /** Create initializer */
    init(data = {}) {
      /** If there is an 'init' function on super, call it */
      if ( typeof super.init === `function` )
        super.init(data);
    
      /** If data is a string, assume it's JSON encoded and try and parse */
      if ( typeof data == `string` ) {
        try {
          data = JSON.parse(data);
        } catch ( err ) {
          throw new Error(`${this.constructor.name}.init(${typeof data}): Initialization string is not valid JSON.`);
        }
      }

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

      /** Loop through each property in the obj */
      obj.properties.forEach((property) => {
        /** Initialize types to defaults */
        this[property.name](property.initTransform(data[property.name]) || property.default || property.ezobjectType.default);
      });
    }
  };
  
  /** Loop through each property in the obj */
  obj.properties.forEach((property) => {  
    /** Create class method on prototype */
    parent[obj.className].prototype[property.name] = function (arg) {
      /** Getter */
      if ( arg === undefined ) 
        return property.getTransform(this[`_${property.name}`]); 
            
      /** Setter for non-nullable standard property types */
      else if ( !property.allowNull && ![`object`, `Buffer`, `Array`, `Date`].includes(property.ezobjectType.javascriptType) && typeof arg == property.ezobjectType.javascriptType )
        this[`_${property.name}`] = property.setTransform(arg, property.instanceOf ? property.instanceOf : property.originalType); 
      
      /** Setter for nullable standard property types */
      else if ( property.allowNull && ![`object`, `Buffer`, `Array`, `Date`].includes(property.ezobjectType.javascriptType) )
        this[`_${property.name}`] = property.setTransform(arg, property.instanceOf ? property.instanceOf : property.originalType); 
      
      /** Setter for non-nullable Array property types */
      else if ( !property.allowNull && typeof arg == `object` && arg && property.ezobjectType.javascriptType == `Array` && ( arg.constructor.name == property.ezobjectType.javascriptType || module.exports.instanceOf(arg, property.ezobjectType.javascriptType) ) )
        this[`_${property.name}`] = property.setTransform(arg, property.arrayOf.instanceOf ? property.arrayOf.instanceOf : property.arrayOf.type); 
      
      /** Setter for nullable Array property types */
      else if ( property.allowNull && property.ezobjectType.javascriptType == `Array` && typeof arg == `object` && arg === null )
        this[`_${property.name}`] = property.setTransform(arg, property.arrayOf.instanceOf ? property.arrayOf.instanceOf : property.arrayOf.type); 
      
      /** Setter for non-nullable Buffer and Date types */
      else if ( !property.allowNull && typeof arg == `object` && arg && [`Buffer`, `Date`].includes(property.ezobjectType.javascriptType) && ( arg.constructor.name == property.ezobjectType.javascriptType || module.exports.instanceOf(arg, property.ezobjectType.javascriptType) ) )
        this[`_${property.name}`] = property.setTransform(arg, property.instanceOf ? property.instanceOf : property.originalType); 
    
      /** Setter for nullable or custom property types */
      else if ( arg === null || typeof arg === `object` && ( property.originalType && property.originalType == arg.constructor.name ) || ( typeof arg == `object` && typeof property.instanceOf == `string` && module.exports.instanceOf(arg, property.instanceOf) ) )
        this[`_${property.name}`] = property.setTransform(arg, property.instanceOf ? property.instanceOf : property.originalType); 
      
      /** Handle type errors */
      else 
        throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature, requires '${typeof property.type === 'string' ? property.originalType : property.instanceOf}'.`); 
      
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
