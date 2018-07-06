/** Require external modules */
const url = require(`url`);
const moment = require(`moment`);

/** Require local modules */
const mysqlConnection = require(`./mysql-connection`);

const ezobjectTypes = [
  { name: `BIT`, type: 'number', default: 0, hasLength: true, setTransform: x => parseInt(x) },
  { name: `TINYINT`, type: 'number', default: 0, hasLength: true, hasUnsignedAndZeroFill: true, setTransform: x => parseInt(x) },
  { name: `SMALLINT`, type: 'number', default: 0, hasLength: true, hasUnsignedAndZeroFill: true, setTransform: x => parseInt(x) },
  { name: `MEDIUMINT`, type: 'number', default: 0, hasLength: true, hasUnsignedAndZeroFill: true, setTransform: x => parseInt(x) },
  { name: `INT`, type: 'number', default: 0, hasLength: true, hasUnsignedAndZeroFill: true, setTransform: x => parseInt(x) },
  { name: `INTEGER`, type: 'number', default: 0, hasLength: true, hasUnsignedAndZeroFill: true, setTransform: x => parseInt(x) },
  { name: `BIGINT`, type: 'string', default: 0, hasLength: true, hasUnsignedAndZeroFill: true, setTransform: x => parseInt(x) },
  { name: `REAL`, type: 'number', default: 0, hasLength: true, hasDecimals: true, hasUnsignedAndZeroFill: true, lengthRequiresDecimals: true, setTransform: x => parseFloat(x) },
  { name: `DOUBLE`, type: 'number', default: 0, hasLength: true, hasDecimals: true, hasUnsignedAndZeroFill: true, lengthRequiresDecimals: true, setTransform: x => parseFloat(x) },
  { name: `FLOAT`, type: 'number', default: 0, hasLength: true, hasDecimals: true, hasUnsignedAndZeroFill: true, lengthRequiresDecimals: true, setTransform: x => parseFloat(x) },
  { name: `DECIMAL`, type: 'number', default: 0, hasLength: true, hasDecimals: true, hasUnsignedAndZeroFill: true, setTransform: x => parseFloat(x) },
  { name: `NUMERIC`, type: 'number', default: 0, hasLength: true, hasDecimals: true, hasUnsignedAndZeroFill: true, setTransform: x => parseFloat(x) },
  { name: `DATE`, type: 'Date', default: new Date(0), saveTransform: x => moment(x).format(`YYYY-MM-DD`), loadTransform: x => new Date(x) },
  { name: `TIME`, type: `string`, default: '00:00:00' },
  { name: `TIMESTAMP`, type: 'Date', default: new Date(0), saveTransform: x => moment(x).format(`YYYY-MM-DD HH:mm:ss.SSSSSS`), loadTransform: x => new Date(x) },
  { name: `DATETIME`, type: 'Date', default: new Date(0), saveTransform: x => moment(x).format(`YYYY-MM-DD HH:mm:ss.SSSSSS`), loadTransform: x => new Date(x) },
  { name: `YEAR`, type: `number`, default: 1970, setTransform: x => parseInt(x) },
  { name: `CHAR`, type: `string`, default: '', hasLength: true, hasCharacterSetAndCollate: true },
  { name: `VARCHAR`, type: `string`, default: '', hasLength: true, lengthRequired: true, hasCharacterSetAndCollate: true },
  { name: `BINARY`, type: `Buffer`, default: Buffer.from([]), hasLength: true },
  { name: `VARBINARY`, type: `Buffer`, default: Buffer.from([]), lengthRequired: true, hasLength: true },
  { name: `TINYBLOB`, type: `Buffer`, default: Buffer.from([]) },
  { name: `BLOB`, type: `Buffer`, default: Buffer.from([]), hasLength: true },
  { name: `MEDIUMBLOB`, type: `Buffer`, default: Buffer.from([]) },
  { name: `LONGBLOB`, type: `Buffer`, default: Buffer.from([]) },
  { name: `TINYTEXT`, type: `string`, default: '', hasCharacterSetAndCollate: true },
  { name: `TEXT`, type: `string`, default: '', hasLength: true, hasCharacterSetAndCollate: true },
  { name: `MEDIUMTEXT`, type: `string`, default: '', hasCharacterSetAndCollate: true },
  { name: `LONGTEXT`, type: `string`, default: '', hasCharacterSetAndCollate: true },
  { name: `ENUM`, type: `string`, default: '', hasCharacterSetAndCollate: true },
  { name: `SET`, type: `string`, default: '', hasCharacterSetAndCollate: true },
  { name: `BOOLEAN`, type: `boolean`, default: false },
  { name: `FUNCTION`, type: `function`, default: function () {} },
  { name: `ARRAY`, type: `function`, default: [] }  
];

function validateConfig(obj) {
  if ( typeof obj != `object` || obj.constructor.name != `Object` )
    throw new Error(`ezobjects.validateConfig(): Invalid table configuration argument, must be plain object.`);
    
  if ( obj.properties ) {
    obj.properties.forEach((property) => {
      property.type = property.type.toUpperCase();
      
      /** Make sure the numbers we're given are integers if they're supposed to be integers */
      if ( !isNaN(property.length) )
        property.length = parseInt(property.length);
      if ( !isNaN(property.decimals) )
        property.decimals = parseInt(property.decimals);

      /** Make sure properties is array */
      if ( typeof obj.properties != 'object' || obj.
          properties.constructor.name != 'Array' )
        throw new Error(`ezobjects.validateConfig(): Invalid properties configuration, properties not array.`);

      /** Properties with bad or missing name */
      else if ( typeof property.name != 'string' || !property.name.match(/a-zA-Z_0-9/) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' has invalid name, either not a string or has characters other than 'a-zA-Z_0-9'.`);

      /** Types where length is required, throw error if missing */
      else if ( typeof property.ezobjectType.lengthRequired == `boolean` && property.ezobjectType.lengthRequired && isNaN(property.length) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} missing required length configuration.`);

      /** Types where decimals are provided, but length is missing */
      else if ( typeof property.ezobjectType.hasDecimals == `boolean` && property.ezobjectType.hasDecimals && !isNaN(property.decimals) && isNaN(property.length) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} provided decimals without length configuration.`);

      /* If type is VARCHAR or VARBINARY, both of which require length, throw error if length out of bounds */
      else if ( ( property.type == `VARCHAR` || property.type == `VARBINARY` ) && ( property.length <= 0 || property.length > 65535 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 65535.`);

      /* If type is BIT and length is provided, throw error if length out of bounds */
      else if ( property.type == `BIT` && !isNaN(property.length) && ( property.length <= 0 || property.length > 64 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 64.`);

      /* If type is TINYINT and length is provided, throw error if length out of bounds */
      else if ( property.type == `TINYINT` && !isNaN(property.length) && ( property.length <= 0 || property.length > 4 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 4.`);

      /* If type is SMALLINT and length is provided, throw error if length out of bounds */
      else if ( property.type == `SMALLINT` && !isNaN(property.length) && ( property.length <= 0 || property.length > 6 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 6.`);

      /* If type is MEDIUMINT and length is provided, throw error if length out of bounds */
      else if ( property.type == `MEDIUMINT` && !isNaN(property.length) && ( property.length <= 0 || property.length > 8 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 8.`);

      /* If type is INT or INTEGER and length is provided, throw error if length out of bounds */
      else if ( ( property.type == `INT` || property.type == `INTEGER` ) && !isNaN(property.length) && ( property.length <= 0 || property.length > 11 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 11.`);

      /* If type is BIGINT and length is provided, throw error if length out of bounds */
      else if ( property.type == `BIGINT` && !isNaN(property.length) && ( property.length <= 0 || property.length > 20 ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has length out of bounds, must be between 1 and 20.`);

      /* If type can use decimals and decimals are provided, throw error if decimals out of bounds */
      else if ( typeof property.ezobjectType.hasDecimals == `boolean` && property.ezobjectType.hasDecimals && !isNaN(property.decimals) && ( property.decimals < 0 || property.decimals > property.length ) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} has decimals out of bounds, must be between 0 and the configured 'length'.`);

      /** Types where length is provided and so decimals are required, throw error if missing */
      else if ( typeof property.ezobjectType.lengthRequiresDecimals == `boolean` && property.ezobjectType.lengthRequiresDecimals && !isNaN(property.length) && isNaN(property.decimals) )
        throw new Error(`ezobjects.createTable(): Property '${property.name}' of type ${property.type} used with length, but without decimals.`);

      const ezobjectType = ezobjectTypes.find(x => x.name == property.type);
      
      if ( !ezobjectType )
        throw new Error(`ezobjects.validateConfig(): Invalid property type '${typeof property.type == 'string' ? property.type : 'not string'}'.`);
    
      property.ezobjectType = ezobjectType;
    });
  }
}

/**
 * @module ezobjects-mysql
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy automatic class creation using simple configuration objects.  Capable
 * of automatically creating a matching MySQL table and generating delete(), insert(), load(), 
 * and update() methods in addition to the constructor, initializer, and getters/setters for
 * all configured properties.
 *
 * @signature ezobjects.createTable(obj, db)
 * @param obj Object Configuration object
 * @param db MySQLConnection
 * @description A function for automatically generating a MySQL table, if it doesn't already
 * exist, based on the values in the provided configuration object.
 */
module.exports.createTable = async (obj, db) => {
  if ( typeof db != `object` || db.constructor.name != `MySQLConnection` )
    throw new Error(`ezobjects.createTable(): Invalid database argument.`);
  else if ( !validateConfig(obj) )
    return;
  
  /** Helper method that can be recursively called to add all properties to the create query */
  const addPropertiesToCreateQuery = (obj) => {
    /** If this object extends another, recursively add properties from the extended object */
    if ( obj.extendsConfig )
      addPropertiesToCreateQuery(obj.extendsConfig);

    /** Loop through each property */
    obj.properties.forEach((property) => {
      /** Ignore properties that don`t have MySQL types */
      if ( property.type != 'FUNCTION' && typeof property.store == `boolean` && !property.store )
        return;
      else if ( property.type == 'FUNCTION' && ( typeof property.store != `boolean` || !property.store ) )
        return;
      
      /** Add property name and type to query */
      if ( property.type == `BOOLEAN` )
        createQuery += `${property.name} TINYINT`;
      else if ( property.type == `FUNCTION` )
        createQuery += `${property.name} TEXT`;
      else
        createQuery += `${property.name} ${property.type}`;

      /** Properties with length and/or decimals */
      if ( !isNaN(property.length) && !isNaN(property.decimals) && typeof property.ezobjectType.hasLength == 'boolean' && property.ezobjectType.hasLength && typeof property.ezobjectType.hasDecimals == 'boolean' && property.ezobjectType.hasDecimals )
        createQuery += `(${property.length}, ${property.decimals})`;
      else if ( !isNaN(property.length) && typeof property.ezobjectType.hasLength == 'boolean' && property.ezobjectType.hasLength )
        createQuery += `(${property.length})`;
      
      /** Properties with UNSIGNED */
      if ( typeof property.ezobjectType.hasUnsignedAndZeroFill == `boolean` && property.ezobjectType.hasUnsignedAndZeroFill && typeof property.unsigned == 'boolean' && property.unsigned )
        createQuery += ` UNSIGNED`;

      /** Properties with ZEROFILL */
      if ( typeof property.ezobjectType.hasUnsignedAndZeroFill == `boolean` && property.ezobjectType.hasUnsignedAndZeroFill && typeof property.zerofill == 'boolean' && property.zerofill )
        createQuery += ` ZEROFILL`;

      /** Properties with CHARACTER SET */
      if ( typeof property.ezobjectType.hasCharacterSetAndCollate == `boolean` && property.ezobjectType.hasCharacterSetAndCollate && typeof property.characterSet == 'string' )
        createQuery += ` CHARACTER SET ${property.characterSet}`;

      /** Properties with COLLATE */
      if ( typeof property.ezobjectType.hasCharacterSetAndCollate == `boolean` && property.ezobjectType.hasCharacterSetAndCollate && typeof property.collate == 'string' )
        createQuery += ` COLLATE ${property.collate}`;

      /** Properties with NULL */
      if ( typeof property.allowNull == `boolean` && property.allowNull )
        createQuery += ` NULL`;
      else
        createQuery += ` NOT NULL`;

      /** Properties with AUTO_INCREMENT */
      if ( property.autoIncrement || property.name == 'id' )
        createQuery += ` AUTO_INCREMENT`;

      /** Properties with UNIQUE KEY */
      if ( property.unique )
        createQuery += ` UNIQUE`;

      /** Properties with PRIMARY KEY */
      if ( property.name == 'id' )
        createQuery += ` PRIMARY`;

      if ( property.unique || property.primary )
        createQuery += ` KEY`;

      /** Properties with COMMENT */
      if ( property.comment && typeof property.comment == `string` )
        createQuery += ` COMMENT '${property.comment.replace(`'`, `''`)}'`;

      createQuery += `, `;
    });
  };

  /** Helper method that can be recursively called to add all indexes to the create query */
  const addIndexesToCreateQuery = (obj) => {
    /** If this object extends another, recursively add indexes from the extended object */
    if ( obj.extendsConfig )
      addIndexesToCreateQuery(obj.extendsConfig);

    /** If there are any indexes defined */
    if ( obj.indexes ) {
      /** Loop through each index */
      obj.indexes.forEach((index) => {
        /** Convert the type to upper case for reliable string comparison */
        index.type = index.type.toUpperCase();
        
        /** If type is not defined, default to BTREE */
        if ( typeof index.type !== `string` )
          index.type = `BTREE`;

        /** Validate index settings */
        if ( index.type != `BTREE` && index.type != `HASH` )
          throw new Error(`Invalid index type '${index.type}'.`);
        else if ( index.visible && index.invisible )
          throw new Error(`Index cannot have both VISIBLE and INVISIBLE options set.`);

        /** Add index name and type to query */
        createQuery += `INDEX ${index.name} USING ${index.type} (`;

        /** Loop through each indexed column and append to query */
        index.columns.forEach((column) => {
          createQuery += `${column}, `;
        });

        /** Trim off extra ', ' from columns */
        createQuery = createQuery.substr(0, createQuery.length - 2);

        /** Close column list */
        createQuery += `)`;

        /** Indexes with KEY_BLOCK_SIZE */
        if ( typeof index.keyBlockSize === `number` )
          createQuery += ` KEY_BLOCK_SIZE ${index.keyBlockSize}`;

        /** Indexes with WITH PARSER */
        if ( typeof index.parserName === `string` )
          createQuery += ` WITH PARSER ${index.parserName}`;

        /** Indexes with COMMENT */
        if ( typeof index.comment === `string` )
          createQuery += ` COMMENT '${index.comment.replace(`'`, ``)}'`;

        /** Indexes with VISIBLE */
        if ( typeof index.visible === `boolean` && index.visible )
          createQuery += ` VISIBLE`;

        /** Indexes with INVISIBLE */
        if ( typeof index.visible === `boolean` && index.invisible )
          createQuery += ` INVISIBLE`;

        createQuery += `, `;
      });
    }
  };

  /** Begin create table query */
  let createQuery = `CREATE TABLE IF NOT EXISTS ${obj.tableName} (`;

  /** Call recursive methods to add properties and indexes to query */
  addPropertiesToCreateQuery(obj);
  addIndexesToCreateQuery(obj);

  /** Trim extra ', ' from property and/or index list */
  createQuery = createQuery.substr(0, createQuery.length - 2);

  /** Close property and/or index list */
  createQuery += `)`;

  /** Await query execution and return result */
  return await db.query(createQuery);
};

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
 * @signature ezobjects.createObject(obj)
 * @param obj Object Configuration object
 * @description A function for automatically generating a class object based on
 * the values in the provided configuration object.
 */
module.exports.createObject = (obj) => {
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
          property.initTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.initTransform == 'function' ? typeof property.ezobjectType.initTransform : defaultTransform;

        /** Initialize types to defaults */
        if ( typeof property.ezobjectType != 'undefined' )
          this[property.name](property.initTransform(data[property.name]) || property.default || property.ezobjectType.default);

        /** Initialize all other types to null */
        else
          this[property.name](property.initTransform(data[property.name]) || property.default || null);
      });
    }
  };
  
  /** Loop through each property in the obj */
  obj.properties.forEach((property) => {  
    /** Convert the type to upper case for reliable string comparison */
    property.type = property.type.toUpperCase();
    
    /** If there is no getter transform, set to default */
    if ( typeof property.getTransform !== `function` )
      property.getTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.getTransform == 'function' ? typeof property.ezobjectType.getTransform : defaultTransform;
    
    /** If there is no setter transform, set to default */
    if ( typeof property.setTransform !== `function` )
      property.setTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.setTransform == 'function' ? typeof property.ezobjectType.setTransform : defaultTransform;
    
    /** If there is no save transform, set to default */
    if ( typeof property.saveTransform !== `function` )
      property.saveTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.saveTransform == 'function' ? typeof property.ezobjectType.saveTransform : defaultTransform;
    
    /** If there is no load transform, set to default */
    if ( typeof property.loadTransform !== `function` )
      property.getTransform = typeof property.ezobjectType == 'object' && typeof property.ezobjectType.loadTransform == 'function' ? typeof property.ezobjectType.loadTransform : defaultTransform;
    
    /** Create class method on prototype */
    parent[obj.className].prototype[property.name] = function (arg) { 
      /** Getter */
      if ( arg === undefined ) 
        return property.getTransform(this[`_${property.name}`]); 

      /** Setters */
      
      /** For `int` type properties */
      else if ( typeof property.ezobjectType == 'object' && typeof arg == property.ezobjectType.type )
        this[`_${property.name}`] = property.setTransform(arg); 
      
      /** For all other property types */
      else if ( arg === null || ( typeof arg == `object` && property.type && property.type == arg.constructor.name ) || ( typeof property.instanceOf == `string` && module.exports.instanceOf(arg, property.instanceOf) ) )
        this[`_${property.name}`] = property.setTransform(arg); 

      /** Handle type errors */
      else 
        throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

      /** Return this object for set call chaining */
      return this; 
    };
    
    if ( typeof obj.tableName == `string` ) {
      /** Create MySQL delete method on prototype */
      parent[obj.className].prototype.delete = async function (db) { 
        /** If the argument is a valid database, delete the record */
        if ( typeof db == `object` && db.constructor.name == `MySQLConnection` ) {
          /** Execute query to delete record from database */
          await db.query(`DELETE FROM ${obj.tableName} WHERE id = ?`, [this.id()]);
        } 
        
        /** Otherwise throw TypeError */
        else {
          throw new TypeError(`${this.constructor.name}.delete(${typeof db}): Invalid signature.`);
        }

        /** Allow for call chaining */
        return this;
      };
      
      /** Create MySQL insert method on prototype */
      parent[obj.className].prototype.insert = async function (arg1) { 
        /** Provide option for inserting record from browser if developer implements ajax backend */
        if ( typeof window !== `undefined` && typeof arg1 == `string` ) {
          const url = new URL(arg1);

          const result = await $.get({
            url: url.href,
            data: JSON.stringify(this),
            dataType: `json`
          });

          if ( result && result.insertId )
            this.id(result.insertId);
          else
            throw new Error(`${obj.className}.insert(): Unable to insert record, invalid response from remote host.`);
        }
        
        /** If the argument is a valid database, insert record into database and capture ID */
        else if ( typeof arg1 == `object` && arg1.constructor.name == `MySQLConnection` ) {
          /** Create array for storing values to insert */
          const params = [];

          /** Create helper method for recursively adding properties to params array */
          const propertyValues = (obj) => {
            /** If this object extends another, recursively add properties from the extended object */
            if ( obj.extendsConfig )
              propertyValues(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore ID since we`ll get that from the insert */
              if ( property.name == `id` )
                return;

              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;
              
              /** Add property to params array after performing the save transform */
              params.push(property.saveTransform(this[property.name]()));
            });
          };

          /** Recursively add properties to params array */
          propertyValues(obj);

          /** Begin INSERT query */
          let query = `INSERT INTO ${obj.tableName} (`;

          /** Create helper method for recursively adding property names to query */
          const propertyNames = (obj) => {
            /** If this object extends another, recursively add property names from the extended object */
            if ( obj.extendsConfig )
              propertyNames(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore ID since we`ll get that from the insert */
              if ( property.name == `id` )
                return;
              
              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;
              
              /** Append property name to query */
              query += `${property.name}, `;
            });
          };

          /** Add property names to query */
          propertyNames(obj);

          /** Trim extra `, ` from property list */
          query = query.substr(0, query.length - 2);
          
          /** Continue query */
          query += `) VALUES (`;

          /** Create helper method for recursively adding property value placeholders to query */
          const propertyPlaceholders = (obj) => {
            /** If this object extends another, recursively add property placeholders from the extended object */
            if ( obj.extendsConfig )
              propertyPlaceholders(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore ID since we`ll get that from the insert */
              if ( property.name == `id` )
                return;

              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;
              
              /** Append placeholder to query */
              query += `?, `;
            });
          };

          /** Add property placeholders to query */
          propertyPlaceholders(obj);

          /** Trim extra `, ` from placeholder list */
          query = query.substr(0, query.length - 2);
          
          /** Finish query */
          query += `)`;

          /** Execute query to add record to database */
          const result = await arg1.query(query, params);

          /** Store the resulting insert ID */
          this.id(result.insertId);
        } 
        
        /** Otherwise throw TypeError */
        else {
          throw new TypeError(`${this.constructor.name}.insert(${typeof arg1}): Invalid signature.`);
        }

        /** Allow for call chaining */
        return this;
      };

      /** Create MySQL load method on prototype */
      parent[obj.className].prototype.load = async function (arg1, db) {        
        /** Provide option for loading record from browser if developer implements ajax backend */
        if ( typeof window !== `undefined` && typeof arg1 == `string` && arg1.match(/^http/i) ) {
          const url = new URL(arg1);

          const result = await $.get({
            url: url.href,
            dataType: `json`
          });

          if ( !result )
            throw new Error(`${obj.className}.load(): Unable to load record, invalid response from remote host.`);
          
          /** Create helper method for recursively loading property values into object */
          const loadProperties = (obj) => {
            /** If this object extends another, recursively add extended property values into objecct */
            if ( obj.extendsConfig )
              loadProperties(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Append property in object */
              if ( typeof arg1[property.name] !== `undefined` ) {
                if ( typeof db == 'object' && db.constructor.name == 'MySQLConnection' )
                  this[property.name](property.loadTransform(result[property.name], db));
                else
                  this[property.name](property.loadTransform(result[property.name]));
              }
            });
          };

          /** Store loaded record properties into object */
          loadProperties(obj);
        }

        /** If the first argument is a valid database and the second is a number, load record from database by ID */
        else if ( ( typeof arg1 == `number` || typeof arg1 == `string` ) && typeof db == `object` && db.constructor.name == `MySQLConnection` ) {
          if ( typeof arg1 == `string` && typeof obj.stringSearchField != `string` )
            throw new Error(`${obj.className}.load(): String argument is not a URL so loading from database, but no 'stringSearchField' configured.`);
          
          /** Begin SELECT query */
          let query = `SELECT `;

          /** Create helper method for recursively adding property names to query */
          const propertyNames = (obj) => {
            /** If this object extends another, recursively add property names from the extended object */
            if ( obj.extendsConfig )
              propertyNames(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;
              
              /** Append property name to query */
              query += `${property.name}, `;
            });
          };

          /** Add property names to query */
          propertyNames(obj);

          /** Trim extra `, ` from property list */
          query = query.substr(0, query.length - 2);
          
          /** Finish query */
          query += ` FROM ${obj.tableName} `;
          
          if ( typeof arg1 === `string` && typeof obj.stringSearchField === `string` )
            query += `WHERE ${obj.stringSearchField} = ?`;
          else
            query += `WHERE id = ?`;

          /** Execute query to load record properties from the database */
          const result = await db.query(query, [arg1]);

          /** If a record with that ID doesn`t exist, throw error */
          if ( !result[0] )
            throw new ReferenceError(`${this.constructor.name}.load(): Record ${arg1} in ${obj.tableName} does not exist.`);

          /** Create helper method for recursively loading property values into object */
          const loadProperties = (obj) => {
            /** If this object extends another, recursively add extended property values into objecct */
            if ( obj.extendsConfig )
              loadProperties(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;
              
              /** Append property in object */
              this[property.name](property.loadTransform(result[0][property.name], db));
            });
          };

          /** Store loaded record properties into object */
          loadProperties(obj);
        } 
        
        /** If the first argument is a MySQL RowDataPacket, load from row data */
        else if ( typeof arg1 == `object` && ( arg1.constructor.name == `RowDataPacket` || arg1.constructor.name == `Object` ) ) {
          /** Create helper method for recursively loading property values into object */
          const loadProperties = (obj) => {
            /** If this object extends another, recursively add extended property values into objecct */
            if ( obj.extendsConfig )
              loadProperties(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Append property in object */
              if ( typeof arg1[property.name] !== `undefined` ) {
                if ( typeof db == 'object' && db.constructor.name == 'MySQLConnection' )
                  this[property.name](property.loadTransform(arg1[property.name], db));
                else
                  this[property.name](property.loadTransform(arg1[property.name]));
              }
            });
          };

          /** Store loaded record properties into object */
          loadProperties(obj);
        } 
        
        /** Otherwise throw TypeError */
        else {
          throw new TypeError(`${this.constructor.name}.load(${typeof arg1}, ${typeof db}): Invalid signature.`);
        }

        /** Allow for call chaining */
        return this;
      };

      /** Create MySQL update method on prototype */
      parent[obj.className].prototype.update = async function (arg1) { 
        /** Provide option for inserting record from browser if developer implements ajax backend */
        if ( typeof window !== `undefined` && typeof arg1 == `string` ) {
          const url = new URL(arg1);

          const result = await $.get({
            url: url.href,
            data: JSON.stringify(this),
            dataType: `json`
          });

          if ( !result )
            throw new Error(`${obj.className}.update(): Unable to update record, invalid response from remote host.`);
        }
        
        /** If the argument is a valid database, update database record */
        else if ( typeof arg1 == `object` && arg1.constructor.name == `MySQLConnection` ) {
          /** Create array for storing values to update */
          const params = [];

          /** Create helper method for recursively adding properties to params array */
          const propertyValues = (obj) => {
            /** If this object extends another, recursively add properties from the extended object */
            if ( obj.extendsConfig )
              propertyValues(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore ID since we will use that to locate the record, and will never update it */
              if ( property.name == `id` )
                return;
              
              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;

              /** Add property to params array after performing the save transform */
              params.push(property.saveTransform(this[property.name]()));
            });
          };

          /** Recursively add properties to params array */
          propertyValues(obj);

          /** Add ID to params array at the end so we can locate the record to update */
          params.push(this.id());

          /** Begin UPDATE query */
          let query = `UPDATE ${obj.tableName} SET `;

          /** Create helper method for recursively adding property updates to query */
          const propertyUpdates = (obj) => {
            /** If this object extends another, recursively add properties from the extended object */
            if ( obj.extendsConfig )
              propertyUpdates(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore ID since we will use that to locate the record, and will never update it */
              if ( property.name == `id` )
                return;

              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.type == `undefined` )
                return;
              
              /** Append property update to query */
              query += `${property.name} = ?, `;
            });
          };

          /** Add property updates to query */
          propertyUpdates(obj);

          /** Trim extra `, ` from property list */
          query = query.substr(0, query.length - 2);

          /** Finish query */
          query += ` WHERE id = ?`;

          /** Execute query to update record in database */
          await arg1.query(query, params);
        } 
        
        /** Otherwise throw TypeError */
        else {
          throw new TypeError(`${this.constructor.name}.update(${typeof arg1}): Invalid signature.`);
        }

        /** Allow for call chaining */
        return this;
      };
    }
  });
  
  /** 
   * Because we`re creating this object dynamically, we need to manually give it a name 
   * attribute so we can identify it by its type when we want to.
   */
  Object.defineProperty(parent[obj.className], `name`, { value: obj.className });
};

/** Re-export MySQLConnection */
module.exports.MySQLConnection = mysqlConnection.MySQLConnection;
