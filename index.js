/** Require external modules */
const url = require(`url`);

/** Require local modules */
const mysqlConnection = require(`./mysql-connection`);

/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy automatic class creation using simple configuration objects.  Capable
 * of automatically creating a matching MySQL table and generating delete(), insert(), load(), 
 * and update() methods in addition to the constructor, initializer, and getters/setters for
 * all configured properties.
 *
 * @signature ezobjects.createTable(db, obj)
 * @param db MySQLConnection
 * @param obj Object Configuration object
 * @description A function for automatically generating a MySQL table, if it doesn't already
 * exist, based on the values in the provided configuration object.
 */
module.exports.createTable = async (db, obj) => {
  if ( typeof db != `object` || db.constructor.name != `MySQLConnection` )
    throw new Error(`ezobjects.createTable(): Invalid database argument.`);
  else if ( typeof obj != `object` )
    throw new Error(`ezobjects.createTable(): Invalid table configuration argument.`);
    
  /** Create some helpful arrays for identifying MySQL types that have certain features */
  const mysqlTypesAllowed = [`BIT`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                             `DECIMAL`, `NUMERIC`, `DATE`, `TIME`, `TIMESTAMP`, `DATETIME`, `YEAR`, `CHAR`, `VARCHAR`, `BINARY`,
                             `VARBINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`,
                             `LONGTEXT`, `ENUM`, `SET`, `JSON`];

  const mysqlTypesWithLength = [`BIT`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                                `DECIMAL`, `NUMERIC`, `CHAR`, `VARCHAR`, `BINARY`, `VARBINARY`, `BLOB`, `TEXT`];

  const mysqlTypesWithDecimals = [`REAL`, `DOUBLE`, `FLOAT`, `DECIMAL`, `NUMERIC`];

  const mysqlTypesWithLengthRequiringDecimals = [`REAL`, `DOUBLE`, `FLOAT`];

  const mysqlTypesWithUnsignedAndZerofill = [`TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                                  `DECIMAL`, `NUMERIC`];

  const mysqlTypesWithCharacterSetAndCollate = [`CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `ENUM`, `SET`];
  
  /** Helper method that can be recursively called to add all properties to the create query */
  const addPropertiesToCreateQuery = (obj) => {
    /** If this object extends another, recursively add properties from the extended object */
    if ( obj.extendsConfig )
      addPropertiesToCreateQuery(obj.extendsConfig);

    /** Loop through each property */
    obj.properties.forEach((property) => {
      /** Ignore properties that don`t have MySQL types */
      if ( typeof property.mysqlType == `undefined` )
        return;

      /** Convert the type to upper case for reliable string comparison */
      property.mysqlType = property.mysqlType.toUpperCase();

      /** Add property name and type to query */
      createQuery += `${property.name} ${property.mysqlType}`;

      /** Types where length is required, throw error if missing */
      if ( property.mysqlType == `VARCHAR` && isNaN(property.length) )
        throw new Error(`Property of type VARCHAR used without required length.`);
      else if ( property.mysqlType == `VARBINARY` && isNaN(property.length) )
        throw new Error(`Property of type VARBINARY used without required length.`);
      else if ( mysqlTypesWithLengthRequiringDecimals.includes(property.type) && !isNaN(property.length) && isNaN(property.decimals) )
        throw new Error(`Property of type REAL, DOUBLE, or FLOAT used with length, but without decimals.`);

      /** Properties with length and/or decimals */
      if ( !isNaN(property.length) && mysqlTypesWithLength.includes(property.mysqlType) && ( !mysqlTypesWithDecimals.includes(property.mysqlType) || isNaN(property.decimals) ) )
        createQuery += `(${property.length})`;
      else if ( !isNaN(property.length) && !isNaN(property.decimals) && mysqlTypesWithLength.includes(property.mysqlType) && mysqlTypesWithDecimals.includes(property.mysqlType) )
        createQuery += `(${property.length}, ${property.decimals})`;

      /** Properties with UNSIGNED */
      if ( property.unsigned && mysqlTypesWithUnsignedAndZerofill.includes(property.mysqlType) )
        createQuery += ` UNSIGNED`;

      /** Properties with ZEROFILL */
      if ( property.zerofill && mysqlTypesWithUnsignedAndZerofill.includes(property.mysqlType) )
        createQuery += ` ZEROFILL`;

      /** Properties with CHARACTER SET */
      if ( property.charsetName && mysqlTypesWithCharacterSetAndCollate.includes(property.mysqlType) )
        createQuery += ` CHARACTER SET ${property.charsetName}`;

      /** Properties with COLLATE */
      if ( property.collationName && mysqlTypesWithCharacterSetAndCollate.includes(property.mysqlType) )
        createQuery += ` COLLATE ${property.collationName}`;

      /** Properties with NULL */
      if ( property.null )
        createQuery += ` NULL`;
      else
        createQuery += ` NOT NULL`;

      /** Properties with DEFAULT */
      if ( property.mysqlDefault )
        createQuery += ` DEFAULT ${property.mysqlDefault}`;

      /** Properties with AUTO_INCREMENT */
      if ( property.autoIncrement )
        createQuery += ` AUTO_INCREMENT`;

      /** Properties with UNIQUE KEY */
      if ( property.unique )
        createQuery += ` UNIQUE`;

      /** Properties with PRIMARY KEY */
      if ( property.primary )
        createQuery += ` PRIMARY`;

      if ( property.unique || property.primary )
        createQuery += ` KEY`;

      /** Properties with COMMENT */
      if ( property.comment && typeof property.comment == `string` )
        createQuery += ` COMMENT '${property.comment.replace(`'`, ``)}'`;

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
 * @signature ezobjects.instanceof(obj, constructorName)
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
  if ( typeof obj.properties != 'Array' )
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

        /** Initialize 'number' types to zero */
        if ( property.type == `number` )
          this[property.name](property.initTransform(data[property.name]) || property.default || 0);

        /** Initialize 'boolean' types to false */
        else if ( property.type == `boolean` )
          this[property.name](property.initTransform(data[property.name]) || property.default || false);
        
        /** Initialize 'string' types to empty */
        else if ( property.type == `string` )
          this[property.name](property.initTransform(data[property.name]) || property.default || ``);

        /** Initialize 'function' types to empty function */
        else if ( property.type == `function` )
          this[property.name](property.initTransform(data[property.name]) || property.default || emptyFunction);
        
        /** Initialize 'Array' types to empty */
        else if ( property.type == `Array` )
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
    
    /** For `number` type properties */
    if ( property.type == `number` ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return property.getTransform(this[`_${property.name}`]); 

        /** Setter */
        else if ( typeof arg == `number` ) 
          this[`_${property.name}`] = property.setTransform(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }

    /** For `boolean` type properties */
    else if ( property.type == `boolean` ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return property.getTransform(this[`_${property.name}`]); 

        /** Setter */
        else if ( typeof arg == `boolean` ) 
          this[`_${property.name}`] = property.setTransform(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
    
    /** For `string` type properties */
    else if ( property.type == `string` ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return property.getTransform(this[`_${property.name}`]); 

        /** Setter */
        else if ( typeof arg == `string` ) 
          this[`_${property.name}`] = property.setTransform(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    } 
    
    /** For `function` type properties */
    else if ( property.type == `function` ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return property.getTransform(this[`_${property.name}`]); 

        /** Setter */
        else if ( typeof arg == `function` ) 
          this[`_${property.name}`] = property.setTransform(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    } 

    /** For `Array` type properties */
    else if ( property.type == `Array` ) {
      /** Create class method on prototype */
      parent[obj.className].prototype[property.name] = function (arg) { 
        /** Getter */
        if ( arg === undefined ) 
          return property.getTransform(this[`_${property.name}`]); 

        /** Setter */
        else if ( typeof arg == `object` && arg.constructor.name == property.type )
          this[`_${property.name}`] = property.setTransform(arg); 

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
          return property.getTransform(this[`_${property.name}`]); 

        /** Setter */
        else if ( arg === null || ( typeof arg == `object` && arg.constructor.name == property.type ) || ( typeof property.instanceOf == `string` && module.exports.instanceOf(arg, property.instanceOf) ) ) 
          this[`_${property.name}`] = property.setTransform(arg); 

        /** Handle type errors */
        else 
          throw new TypeError(`${this.constructor.name}.${property.name}(${typeof arg}): Invalid signature.`); 

        /** Return this object for set call chaining */
        return this; 
      };
    }
    
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
              if ( typeof property.mysqlType == `undefined` )
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
              if ( typeof property.mysqlType == `undefined` )
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
              if ( typeof property.mysqlType == `undefined` )
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
      parent[obj.className].prototype.load = async function (arg1, arg2) {
        /** Provide option for loading record from browser if developer implements ajax backend */
        if ( typeof window !== `undefined` && typeof arg1 == `string` ) {
          const url = new URL(arg1);

          const result = await $.get({
            url: url.href,
            dataType: `json`
          });

          if ( result )
            this.init(result);
          else
            throw new Error(`${obj.className}.load(): Unable to load record, invalid response from remote host.`);
        }

        /** If the first argument is a valid database and the second is a number, load record from database by ID */
        else if ( typeof arg1 == `object` && arg1.constructor.name == `MySQLConnection` && ( typeof arg2 == `number` || ( typeof arg2 == `string` && typeof obj.stringSearchField == `string` ) ) ) {
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
              if ( typeof property.mysqlType == `undefined` )
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
          
          if ( typeof arg2 === `string` && typeof obj.stringSearchField === `string` )
            query += `WHERE ${obj.stringSearchField} = ?`;
          else
            query += `WHERE id = ?`;

          /** Execute query to load record properties from the database */
          const result = await arg1.query(query, [arg2]);

          /** If a record with that ID doesn`t exist, throw error */
          if ( !result[0] )
            throw new ReferenceError(`${this.constructor.name}.load(): Record ${arg2} in ${obj.tableName} does not exist.`);

          /** Create helper method for recursively loading property values into object */
          const loadProperties = (obj) => {
            /** If this object extends another, recursively add extended property values into objecct */
            if ( obj.extendsConfig )
              loadProperties(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Ignore properties that don`t have MySQL types */
              if ( typeof property.mysqlType == `undefined` )
                return;
              
              /** Append property in object */
              this[property.name](property.loadTransform(result[0][property.name]));
            });
          };

          /** Store loaded record properties into object */
          loadProperties(obj);
        } 
        
        /** If the first argument is a MySQL RowDataPacket, load from row data */
        else if ( typeof arg1 == `object` && ( arg1.constructor.name == `RowDataPacket` || arg1.constructor.name == `Array` ) ) {
          /** Create helper method for recursively loading property values into object */
          const loadProperties = (obj) => {
            /** If this object extends another, recursively add extended property values into objecct */
            if ( obj.extendsConfig )
              loadProperties(obj.extendsConfig);

            /** Loop through each property */
            obj.properties.forEach((property) => {
              /** Append property in object */
              if ( typeof arg1[property.name] !== `undefined` )
                this[property.name](property.loadTransform(arg1[property.name]));
            });
          };

          /** Store loaded record properties into object */
          loadProperties(obj);
        } 
        
        /** Otherwise throw TypeError */
        else {
          throw new TypeError(`${this.constructor.name}.load(${typeof arg1}, ${typeof arg2}): Invalid signature.`);
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
              if ( typeof property.mysqlType == `undefined` )
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
              if ( typeof property.mysqlType == `undefined` )
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
