/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy automatic class creation using simple configuration objects.  Capable
 * of automatically creating ES6 classes with constructor, initializer, and getters/setters 
 * for all configured properties.
 */

/** Create object to hold our created EZ objects */
module.exports.objects = {};

/** Define default set transform for non-array types */
const setTransform = (x, property) => {
  if ( x === null && !property.allowNull )
    throw new TypeError(`${property.className}.${property.name}(): Null value passed to '${property.type}' setter that doesn't allow nulls.`);
  else if ( x !== null && property.ezobjectType.jsType == 'number' && isNaN(x) )
    throw new TypeError(`${property.className}.${property.name}(): Non-numeric value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'string' && typeof x !== 'string' && typeof x !== 'number' )
    throw new TypeError(`${property.className}.${property.name}(): Non-string/Non-number value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'boolean' && typeof x !== 'boolean' )
    throw new TypeError(`${property.className}.${property.name}(): Non-boolean value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'function' && typeof x !== 'function' )
    throw new TypeError(`${property.className}.${property.name}(): Non-function value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'Date' && ( typeof x !== 'object' || x.constructor.name != 'Date' ) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Date value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'Buffer' && ( typeof x !== 'object' || x.constructor.name != 'Buffer' ) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Buffer value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'Set' && ( typeof x !== 'object' || x.constructor.name != 'Set' ) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Set value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'Object' && ( typeof x !== 'object' || x.constructor.name != 'Object' ) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Object value passed to '${property.type}' setter.`);
  else if ( x !== null && property.ezobjectType.jsType == 'object' && ( typeof x !== 'object' || ( typeof property.type == 'string' && x.constructor.name != property.originalType ) || ( typeof property.instanceOf === 'string' && !module.exports.instanceOf(x, property.instanceOf) ) ) )
    throw new TypeError(`${property.className}.${property.name}(): Invalid value passed to '${typeof property.type === 'string' ? property.originalType : property.instanceOf}' setter.`);
  
  if ( property.ezobjectType.hasDecimals )
    return x === null ? null : parseFloat(x);
  else if ( property.ezobjectType.jsType == 'number' )
    return x === null ? null : parseInt(x);
  else if ( property.ezobjectType.jsType == 'boolean' )
    return x === null ? null : (x ? true : false);
  else if ( property.ezobjectType.jsType == 'string' )
    return x === null ? null : x.toString();
  else
    return x === null ? null : x;
};

/** Define default set transform for array types */
const setArrayTransform = (x, property) => {
  if ( x === null && !property.allowNull )
    throw new TypeError(`${property.className}.${property.name}(): Null value passed to 'Array' setter that doesn't allow nulls.`);
  else if ( !(x instanceof Array) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Array value passed to 'Array' setter.`);
  else if ( x && x.some(y => y === null && !property.arrayOf.allowNull) )
    throw new TypeError(`${property.className}.${property.name}(): Null value passed as element of 'Array[${property.arrayOf.type}]' setter that doesn't allow null elements.`);
  
  let arr = [];
  
  if ( property.ezobjectType.jsType == 'number' && x && x.some(y => isNaN(y) && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-numeric value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'string' && x && x.some(y => typeof y !== `string` && y !== `number` && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-string value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'boolean' && x && x.some(y => typeof y !== 'boolean' && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-boolean value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'function' && x && x.some(y => typeof y !== 'function' && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-function value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'Date' && x && x.some(y => ( typeof y !== 'object' || y.constructor.name != 'Date' ) && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Date value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'Buffer' && x && x.some(y => ( typeof y !== 'object' || y.constructor.name != 'Buffer' ) && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Buffer value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'Set' && x && x.some(y => ( typeof y !== 'object' || y.constructor.name != 'Set' ) && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Set value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'Object' && x && x.some(y => ( typeof y !== 'object' || y.constructor.name != 'Object' ) && y !== null) )
    throw new TypeError(`${property.className}.${property.name}(): Non-Object value passed as element of Array[${property.arrayOf.type}] setter.`);
  else if ( property.ezobjectType.jsType == 'object' && x && x.some(y => y !== null && (typeof y !== 'object' || ( typeof property.arrayOf.type == 'string' && y.constructor.name != property.arrayOf.type ) || ( typeof property.arrayOf.instanceOf === 'string' && !module.exports.instanceOf(y, property.arrayOf.instanceOf) ))) )
    throw new TypeError(`${property.className}.${property.name}(): Invalid value passed as element of Array[${typeof property.arrayOf.type === 'string' ? property.arrayOf.type : property.arrayOf.instanceOf}] setter.`);
  
  if ( property.arrayOf.ezobjectType.hasDecimals )
    arr = x.map(y => y === null ? null : parseFloat(y));
  else if ( property.arrayOf.ezobjectType.jsType == 'number' )
    arr = x.map(y => y === null ? null : parseInt(y));
  else if ( property.arrayOf.ezobjectType.jsType == 'boolean' )
    arr = x.map(y => y === null ? null : (y ? true : false));
  else if ( property.arrayOf.ezobjectType.jsType == `string` )
    arr = x.map(y => y === null ? null : y.toString());
  else
    arr = x.map(y => y === null ? null : y);

  Object.defineProperty(arr, 'origPush', { enumerable: false, value: arr.push });
  Object.defineProperty(arr, 'origUnshift', { enumerable: false, value: arr.unshift });
  Object.defineProperty(arr, 'origFill', { enumerable: false, value: arr.fill });
  
  Object.defineProperty(arr, 'push', {
    enumerable: false,
    value: function () { for ( let i = 0, i_max = arguments.length; i < i_max; i++ ) this.origPush(setTransform(arguments[i], property)); return this.length; }
  });
  
  Object.defineProperty(arr, 'unshift', {
    enumerable: false,
    value: function () { for ( let i = 0, i_max = arguments.length; i < i_max; i++ ) this.origUnshift(setTransform(arguments[i], property)); return this.length; }
  });
  
  Object.defineProperty(arr, 'fill', {
    enumerable: false,
    value: function (value, start, end) { return this.origFill(setTransform(value, property), start, end); }
  });
    
  return x === null ? null : arr;
};

/** Define the EZ Object types, their associated JavaScript and MySQL types, defaults, quirks, transforms, etc... */
const ezobjectTypes = [
  { type: `int`, jsType: 'number', default: 0, setTransform: setTransform },
  { type: `float`, jsType: 'number', default: 0, setTransform: setTransform },
  { type: `string`, jsType: 'string', default: '', setTransform: setTransform },
  { type: `boolean`, jsType: 'boolean', default: false, setTransform: setTransform },
  { type: `function`, jsType: 'function', default: () => {}, setTransform: setTransform },
  { type: `date`, jsType: 'Date', default: new Date(0), setTransform: setTransform },
  { type: `buffer`, jsType: 'Buffer', default: Buffer.from([]), setTransform: setTransform },
  { type: `set`, jsType: 'Set', default: new Set(), setTransform: setTransform },
  { type: `object`, jsType: `Object`, default: {}, setTransform: setTransform },
  { type: `other`, jsType: 'object', default: null, setTransform: setTransform },
  
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `int`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `float`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `string`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `boolean`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `function`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `date`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `buffer`, setTransform: setArrayTransform },
  { type: `array`, jsType: 'Array', default: [], arrayOfType: `set`, setTransform: setArrayTransform },
  { type: `array`, jsType: 'Array', default: [], arrayOfType: `object`, setTransform: setArrayTransform },
  { type: `array`, jsType: `Array`, default: [], arrayOfType: `other`, setTransform: setArrayTransform }
];

/** Validate configuration for a single property */
function validatePropertyConfig(property) {  
  /** If name is missing or not a string, throw error */
  if ( typeof property.name !== 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property configured with missing or invalid 'name'.`);

  /** If type is missing or not a string, throw error */
  if ( typeof property.type !== 'string' && typeof property.instanceOf !== 'string' )
    throw new Error(`ezobjects.validatePropertyConfig(): Property '${property.name}' configured with missing or invalid 'type' and/or 'instanceOf', one of them is required.`);
  
  /** If the original type has not yet been recorded */
  if ( property.type && typeof property.originalType !== 'string' ) {
    /** Store original type with preserved case */
    property.originalType = property.type;
    
    /** Convert type to lower-case for comparison to ezobjectsTypes */
    property.type = property.type.toLowerCase();
  }
  
  /** Attach arrayOf 'ezobjectType' if property type is 'array' */
  if ( property.type == 'array' ) {
    /** If type is 'ARRAY' with no 'arrayOf', throw error */
    if ( typeof property.arrayOf !== 'object' || property.arrayOf.constructor.name != 'Object' )
      throw new Error(`ezobjects.validatePropertyConfig(): Property '${property.name}' of type ${property.type} with missing or invalid 'arrayOf'.`);

    /** If type is 'ARRAY' with 'arrayOf' containing bad or missing type, throw error */
    if ( typeof property.arrayOf.type != 'string' && typeof property.arrayOf.instanceOf != 'string' )
      throw new Error(`ezobjects.validatePropertyConfig(): Property '${property.name}' of type ${property.type} with missing or invalid 'arrayOf.type' and/or 'arrayOf.instanceOf', one of them is required.`);

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
    
    /** Fully determine whether to allow nulls for this property */
    if ( typeof property.arrayOf.allowNull !== `boolean` && property.arrayOf.ezobjectType.type != 'other' )
      property.arrayOf.allowNull = false;
    else if ( typeof property.arrayOf.allowNull !== `boolean` )
      property.arrayOf.allowNull = true;
  } else {
    /** If it's a standard EZ Object type, attach 'ezobjectType' to property for later use */
    property.ezobjectType = ezobjectTypes.find(x => x.type == property.type);

    /** If no standard type was found, use 'other' type for other objects */
    if ( !property.ezobjectType )
      property.ezobjectType = ezobjectTypes.find(x => x.type == 'other');
  }
  
  /** Create default transform function that doesn't change the input */
  const defaultTransform = x => x;
  
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
  if ( typeof obj.className !== 'string' || !obj.className.match(/^[A-Za-z_0-9$]+$/) )
    throw new Error(`ezobjects.validateClassConfig(): Configuration has missing or invalid 'className', must be string containing characters 'A-Za-z_0-9$'.`);

  /** Add properties array if one wasn't set */
  if ( !obj.properties )
    obj.properties = [];

  /** Make sure properties is array */
  if ( obj.properties && ( typeof obj.properties != 'object' || obj.properties.constructor.name != 'Array' ) )
    throw new Error(`ezobjects.validateClassConfig(): Invalid properties configuration, properties not array.`);
  
  /** Loop through any properties and validate them */
  obj.properties.forEach((property) => {
    property.className = obj.className;
    
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
  module.exports.objects[obj.className] = class extends (obj.extends || Object) {
    /** Create constructor */
    constructor(data = {}) {
      /** Initialize super */
      super(data);
      
      /** If this is the top level class, initialize object to values in `data` or defaults */
      if ( this.constructor.name == obj.className )
        this.init(data);
    }
    
    /** Create initializer */
    init(data = {}) {
      /** If data is a string, assume it's JSON and parse */
      if ( typeof data == `string` )
        data = JSON.parse(data);
      
      /** If there is an 'init' function on super, call it */
      if ( typeof super.init === `function` )
        super.init(data);

      /** Loop through each property in the obj */
      obj.properties.forEach((property) => {
        /** Initialize types to defaults */
        if ( typeof data[property.name] == `function` )
          this[property.name](data[property.name]());
        else if ( typeof data[property.name] != `undefined` )
          this[property.name](data[property.name]);
        else if ( typeof data[`_${property.name}`] == `function` )
          this[property.name](data[`_${property.name}`]());
        else if ( typeof data[`_${property.name}`] != `undefined` )
          this[property.name](data[`_${property.name}`]);
        else
          this[property.name](property.default || property.ezobjectType.default);
      });
    }
  };
  
  /** Loop through each property in the obj */
  obj.properties.forEach((property) => {  
    /** Create class method on prototype */
    module.exports.objects[obj.className].prototype[property.name] = function (arg) {
      /** Getter */
      if ( arg === undefined ) 
        return this[`_${property.name}`]; 
            
      /** Setter */
      this[`_${property.name}`] = property.setTransform(arg, property); 

      /** Return this object for set call chaining */
      return this; 
    };
  });
  
  /** 
   * Because we`re creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(module.exports.objects[obj.className], `name`, { value: obj.className });
  
  return module.exports.objects[obj.className];
};
