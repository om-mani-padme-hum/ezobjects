/**
 * @module ezobjects
 * @copyright 2018 Rich Lowe
 * @license MIT
 * @description Easy automatic class creation using simple configuration objects.  Capable
 * of automatically creating a matching MySQL table and generating insert(), load(), and
 * update() methods in addition to the constructor, initializer, and getters/setters for
 * all configured properties.
 */

/**
 * @signature createTable(db, obj)
 * @module ezobjects
 * @param db MySQLConnection
 * @param obj Object
 * @descrtiption Create a MySQL table with the specifications outlined in `obj`, if it doesn't already exist.
 */
module.exports.createTable = async (db, obj) => {
  const mysqlTypesAllowed = [`BIT`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                             `DECIMAL`, `NUMERIC`, `DATE`, `TIME`, `TIMESTAMP`, `DATETIME`, `YEAR`, `CHAR`, `VARCHAR`, `BINARY`,
                             `VARBINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`,
                             `LONGTEXT`, `ENUM`, `SET`, `JSON`];

  const mysqlTypesWithLength = [`BIT`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                                `DECIMAL`, `NUMERIC`, `CHAR`, `VARCHAR`, `BINARY`, `VARBINARY`, `BLOB`, `TEXT`];

  const mysqlTypesWithDecimals = [`REAL`, `DOUBLE`, `FLOAT`, `DECIMAL`, `NUMERIC`];

  const mysqlTypesWithLengthRequiringDecimals = [`REAL`, `DOUBLE`, `FLOAT`];

  const mysqlTypesWithUnsigned = [`TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                                  `DECIMAL`, `NUMERIC`];

  const mysqlTypesWithZerofill = [`TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `INTEGER`, `BIGINT`, `REAL`, `DOUBLE`, `FLOAT`,
                                  `DECIMAL`, `NUMERIC`];

  const mysqlTypesWithCharacterSet = [`CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `ENUM`, `SET`];

  const mysqlTypesWithCollate = [`CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `ENUM`, `SET`];

  const addPropertiesToCreateQuery = (obj) => {
    if ( obj.extendsConfig )
      addPropertiesToCreateQuery(obj.extendsConfig);

    obj.properties.forEach((property) => {
      property.mysqlType = property.mysqlType.toUpperCase();

      createQuery += `${property.name} ${property.mysqlType}`;

      /** Types where length is required, throw error if missing */
      if ( property.mysqlType == 'VARCHAR' && isNaN(property.length) )
        throw new Error(`Property of type VARCHAR used without required length.`);
      else if ( property.mysqlType == 'VARBINARY' && isNaN(property.length) )
        throw new Error(`Property of type VARBINARY used without required length.`);
      else if ( mysqlTypesWithLengthRequiringDecimals.includes(property.type) && !isNaN(property.length) && isNaN(property.decimals) )
        throw new Error(`Property of type REAL, DOUBLE, or FLOAT used with length, but without decimals.`);

      /** Properties with length and/or decimals */
      if ( !isNaN(property.length) && mysqlTypesWithLength.includes(property.mysqlType) && ( !mysqlTypesWithDecimals.includes(property.mysqlType) || isNaN(property.decimals) ) )
        createQuery += `(${property.length})`;
      else if ( !isNaN(property.length) && !isNaN(property.decimals) && mysqlTypesWithLength.includes(property.mysqlType) && mysqlTypesWithDecimals.includes(property.mysqlType) )
        createQuery += `(${property.length}, ${property.decimals})`;

      /** Properties with UNSIGNED */
      if ( property.unsigned && mysqlTypesWithUnsigned.includes(property.mysqlType) )
        createQuery += ` UNSIGNED`;

      /** Properties with ZEROFILL */
      if ( property.zerofill && mysqlTypesWithZerofill.includes(property.mysqlType) )
        createQuery += ` ZEROFILL`;

      /** Properties with CHARACTER SET */
      if ( property.charsetName && mysqlTypesWithCharacterSet.includes(property.mysqlType) )
        createQuery += ` CHARACTER SET ${property.charsetName}`;

      /** Properties with propertyLATE */
      if ( property.collationName && mysqlTypesWithCollate.includes(property.mysqlType) )
        createQuery += ` COLLATE ${property.collationName}`;

      /** Properties with NULL */
      if ( property.null )
        createQuery += ` NULL`;
      else
        createQuery += ` NOT NULL`;

      /** Properties with DEFAULT */
      if ( property.default )
        createQuery += ` DEFAULT ${property.default}`;

      /** Properties with AUTO_INCREMENT */
      if ( property.autoIncrement )
        createQuery += ` AUTO_INCREMENT`;

      if ( property.unique )
        createQuery += ` UNIQUE`;

      if ( property.primary )
        createQuery += ` PRIMARY`;

      if ( property.unique || property.primary )
        createQuery += ` KEY`;

      if ( property.comment && typeof property.comment == 'string' )
        createQuery += ` COMMENT '${property.comment.replace(`'`, ``)}'`;

      createQuery += `, `;
    });
  };

  const addIndexesToCreateQuery = (obj) => {
    if ( obj.extendsConfig )
      addIndexesToCreateQuery(obj.extendsConfig);

    if ( obj.indexes ) {
      obj.indexes.forEach((index) => {
        if ( typeof index.type !== 'string' )
          index.type = 'BTREE';

        if ( index.type != 'BTREE' && index.type != 'HASH' )
          throw new Error(`Invalid index type '${index.type}'.`);
        else if ( index.visible && index.invisible )
          throw new Error(`Index cannot have both VISIBLE and INVISIBLE options set.`);

        createQuery += `INDEX ${index.name} USING ${index.type} (`;

        index.columns.forEach((column) => {
          createQuery += `${column}, `;
        });

        createQuery = createQuery.substr(0, createQuery.length - 2);

        createQuery += `)`;

        if ( typeof index.keyBlockSize === 'number' )
          createQuery += ` KEY_BLOCK_SIZE ${index.keyBlockSize}`;

        if ( typeof index.parserName === 'string' )
          createQuery += ` WITH PARSER ${index.parserName}`;

        if ( typeof index.comment === 'string' )
          createQuery += ` COMMENT '${index.comment.replace(`'`, ``)}'`;

        if ( typeof index.visible === 'boolean' && index.visible )
          createQuery += ` VISIBLE`;

        if ( typeof index.visible === 'boolean' && index.invisible )
          createQuery += ` INVISIBLE`;

        createQuery += `, `;
      });
    }
  };

  let createQuery = `CREATE TABLE IF NOT EXISTS ${obj.tableName} (`;

  addPropertiesToCreateQuery(obj);
  addIndexesToCreateQuery(obj);

  createQuery = createQuery.substr(0, createQuery.length - 2);

  createQuery += `)`;

  return await db.query(createQuery);
};

/**
 * @signature createObject(obj)
 * @module ezobjects
 * @param obj Object Configuration object
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
    
    if ( typeof obj.tableName == 'string' ) {
      /** Create MySQL insert method on prototype */
      parent[obj.className].prototype.insert = async function (db) { 
        /** Verify database is of valid type or throw error */
        if ( typeof db == 'object' && db.constructor.name == 'MySQLConnection' ) {
          /** Object parameters */
          const params = [];

          const pushProperties = (obj) => {
            if ( obj.extendsConfig )
              pushProperties(obj.extendsConfig);

            obj.properties.forEach((property) => {
              if ( property.name == 'id' )
                return;

              params.push(this[property.name]());
            });
          };

          pushProperties(obj);

          /** Create INSERT query */
          let query = `INSERT INTO ${obj.tableName} (`;

          const addProperties1 = (obj) => {
            if ( obj.extendsConfig )
              addProperties1(obj.extendsConfig);

            obj.properties.forEach((property) => {
              if ( property.name == 'id' )
                return;

            query += `${property.name}, `;
            });
          };

          addProperties1(obj);

          query = query.substr(0, query.length - 2);
          query += `) VALUES (`;

          const addProperties2 = (obj) => {
            if ( obj.extendsConfig )
              addProperties2(obj.extendsConfig);

            obj.properties.forEach((property) => {
              if ( property.name == 'id' )
                return;

              query += `?, `;
            });
          };

          addProperties2(obj);

          query = query.substr(0, query.length - 2);
          query += `)`;

          /** Execute INSERT query to add record */
          const result = await db.query(query, params);

          /** Be sure to capture new ID */
          this.id(result.insertId);
        } else {
          throw new TypeError(`${this.constructor.name}.insert(${typeof db}): Invalid signature.`);
        }

        /** Allow for call chaining */
        return this;
      };

      /** Create MySQL load method on prototype */
      parent[obj.className].prototype.load = async function (arg1, arg2) { 
        /** Verify database is of valid type or throw error */
        if ( typeof arg1 == 'object' && arg1.constructor.name == 'MySQLConnection' && typeof arg2 == 'number' ) {
          /** Create SELECT query */
          let query = `SELECT `;

          const addProperties = (obj) => {
            if ( obj.extendsConfig )
              addProperties(obj.extendsConfig);

            obj.properties.forEach((property) => {
              query += `${property.name}, `;
            });
          };

          addProperties(obj);

          query = query.substr(0, query.length - 2);
          query += ` FROM ${obj.tableName} `;
          query += `WHERE id = ?`;

          /** Execute SELECT query to grab data record */
          const result = await arg1.query(query, [arg2]);

          if ( !result[0] )
            throw new ReferenceError(`${this.constructor.name}.load(): Record ${arg2} in ${obj.tableName} does not exist.`);

          /** Store the data in this instance */
          const storeProperties = (obj) => {
            if ( obj.extendsConfig )
              storeProperties(obj.extendsConfig);

            obj.properties.forEach((property) => {
              this[property.name](result[0][property.name]);
            });
          };

          storeProperties(obj);
        } else if ( typeof arg1 == 'object' && ( arg1.constructor.name == 'RowDataPacket' || arg1.constructor.name == 'Array' ) ) {
          /** Store the data in this instance */
          obj.properties.forEach((property) => {
            this[property.name](arg1[property.name]);
          });
        } else {
          throw new TypeError(`${this.constructor.name}.load(${typeof arg1}, ${typeof arg2}): Invalid signature.`);
        }

        /** Allow for call chaining */
        return this;
      };

      /** Create MySQL update method on prototype */
      parent[obj.className].prototype.update = async function (db) { 
        /** Verify database is of valid type or throw error */
        if ( typeof db == 'object' && db.constructor.name == 'MySQLConnection' ) {
          /** Object parameters */
          const params = [];

          const pushProperties = (obj) => {
            if ( obj.extendsConfig )
              pushProperties(obj.extendsConfig);

            obj.properties.forEach((property) => {
              if ( property.name == 'id' )
                return;

              params.push(this[property.name]());
            });
          };

          pushProperties(obj);

          params.push(this.id());

          /** Create UPDATE query */
          let query = `UPDATE ${obj.tableName} SET `;

          const addProperties = (obj) => {
            if ( obj.extendsConfig )
              addProperties(obj.extendsConfig);

            obj.properties.forEach((property) => {
              if ( property.name == 'id' )
                return;

              query += `${property.name} = ?, `;
            });
          };

          addProperties(obj);

          query = query.substr(0, query.length - 2);

          query += ` WHERE id = ?`;

          /** Execute UPDATE query to save record */
          await db.query(query, params);
        } else {
          throw new TypeError(`${this.constructor.name}.update(${typeof db}): Invalid signature.`);
        }

        /** Allow for call chaining */
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

