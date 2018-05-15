# EZ Objects v2.0.0

EZ Objects is a Node.js module (that can also be usefully browserify'd) that aims to save you lots of time 
writing class objects.  All you have to do is create simple configurations for each of your objects and then call
the library function(s).  Let's start by showing a basic example:

## Basic Example

```javascript
const ezobjects = require('ezobjects');

/** Create a customized object on the global (node) or window (browser) namespace */
ezobjects.createObject({
  className: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'number', setTransform: x => parseInt(x) }
  ]
});

const record = new DatabaseRecord();
```

In this short snippet, we have effectively created a new class named `DatabaseRecord`.  The class
has a constructor, an initializer, and a getter/setter method for `id`.  The constructor calls the
initializer (named `init`), which sets the value of `id` to the default for type **number**, being
zero in this case.  You could also explicitly pass a default by adding a `default` key to the property,
should you so desire.  We've also added a transform function that will take any value passed to the `id`
setter and apply parseInt() to it.

## MySQL Example w/ Extended Object

```javascript
const ezobjects = require('ezobjects');
const fs = require('fs');
const moment = require('moment');


/** Load external MySQL configuration */
const config = JSON.parse(fs.readFileSync('mysql-config.json'));

/** Connect to the MySQL database using our MySQL module async/await wrapper */
const db = new ezobjects.MySQLConnection(config);

/** Configure a new EZ Object called DatabaseRecord with one 'id' property that contains extended MySQL configuration settings */
const configDatabaseRecord = {
  className: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'number', mysqlType: 'int', autoIncrement: true, primary: true, setTransform: x => parseInt(x) }
  ]
};

/** Create the DatabaseRecord object */
ezobjects.createObject(configDatabaseRecord);

/** Configure a new EZ Object called Person that extends from the DatabaseRecord object and adds several additional properties and a MySQL index */
const configPerson = {
  tableName: 'people',
  className: 'Person',
  extends: DatabaseRecord,
  extendsConfig: configDatabaseRecord,
  properties: [
    { name: 'firstName', type: 'string', mysqlType: 'varchar', length: 20 },
    { name: 'lastName', type: 'string', mysqlType: 'varchar', length: 20 },
    { name: 'checkingBalance', type: 'number', mysqlType: 'double', setTransform: x => parseFloat(x) },
    { name: 'permissions', type: 'Array', mysqlType: 'text', saveTransform: x => x.join(','), loadTransform: x => x.split(',') },
    { name: 'favoriteDay', type: 'Date', mysqlType: 'datetime', saveTransform: x => moment(x).format('Y-MM-DD HH:mm:ss'), loadTransform: x => new Date(x) }
  ],
  indexes: [
    { name: 'lastName', type: 'BTREE', columns: [ 'lastName' ] }
  ]
};

/** Create the Person object */
ezobjects.createObject(configPerson);

/** Create new person, initializing with object passed to constructor */
const person = new Person({
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.32,
  permissions: [1, 3, 5],
  favoriteDay: new Date('01-01-2018')
});

/** Self-executing async wrapper so we can await results */
(async () => {
  /** Create table if it doesn't already exist */
  await ezobjects.createTable(db, configPerson);
  
  /** Insert person into the database */
  await person.insert(db);
  
  /** Log person (should have automatically incremented ID now) */
  console.log(person);
  
  /** Close database connection */
  db.close();
})();
```

### Expected Output

```
Person {
  _id: 8,
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.32,
  _permissions: [ 1, 3, 5 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
```

In this snippet, we've created two classes, DatabaseRecord and Person.  Person extends DatabaseRecord and is also associated with
a MySQL table called `people`.  Each property is given a JavaScript `type` and a MySQL `mysqlType`.  Additional MySQL property
configuration options can be provided, which are outlined in more detail below.  A BTREE index is also added on the lastName column
for faster searching.  While not required, the moment library is used to help translate date formats between MySQL and JavaScript.

Since the Person class configuration provided a `tableName` property, it will automatically have additional methods created that are
not present in a basic EZ Object.  The additional methods are insert(db), load(db, id), and update(db).  These methods can be used to
insert the object properties as a new MySQL record, load a MySQL record into the object properties, or update an existing MySQL record 
with the object properties.  Transforms can be used to adjust the values properties when they are get or set in the object, or when they
are saved or loaded from the database.

## Module Specification

### The module has three exports:

**ezobjects.createTable(db, obj)**
* Creates a MySQL table corresponding to the configuration outlined in `obj`, if it doesn't already exist

**ezobjects.createObject(obj)**
* Creates an ES6 class corresponding to the configuration outlined in `obj`, with constructor/init/getters/setters, and insert/load/update if `tableName` is configured

**ezobjects.MySQLConnection(config)**
* A MySQL database connection wrapper that uses the standard mysql package and wraps it with async/await and transaction helpers

### An object configuration can have the following:

* tableName - string - (optional) Provide if object should be linked with MySQL database table
* classname - string - (required) Name of the class
* extends - object - (optional) The object that the new object should be extended from [required to extend object]
* extendsConfig - object - (optional) The EZ Object configuration for the object that is being extended from [required to extend object]
* properties - Array - (required) An array of properties that the object (and MySQL table, if applicable) should contain
* indexes - Array - (optional) An array of indexes that should be created in the MySQL table, if applicable

### A property configuration can have the following:

* name - string - (required) Name of the property, must conform to both JavaScript and MySQL rules
* type - string - (required) JavaScript data type for the property
* mysqlType - string - (optional) MySQL data type for the property [required for MySQL table association]
* length - number - (optional) MySQL data length for the property [required for MySQL table association on some data types like VARCHAR]
* decimals - number - (optional) Number of decimals that should be provided for certain data types when SELECT'ed from the MySQL table
* primary - boolean - (optional) Indicates the property is a PRIMARY KEY in the MySQL table [required for MySQL table association on at least one property in the table]
* unique - boolean - (optional) Indicates the property is a UNIQUE KEY in the MySQL table
* null - boolean - (optional) Indicates the property can be NULL [default is properties must be NOT NULL]
* default - mixed - (optional) Sets the default value for the property in the MySQL table, assuming its of the correct type
* unsigned - boolean - (optional) Indicates the property should be unsigned in the MySQL table
* zerofill - boolean - (optional) Indicates the property should be zero-filled in the MySQL table
* comment - string - (optional) Indicates the property should note the provided comment in the MySQL table
* charsetName - string - (optional) Indicates the property should use the provided charset in the MySQL table
* collationName - string - (optional) Indicates the property should use the provided collation in the MySQL table
* autoIncrement - boolean - (optional) Indicates the property should be auto-incremented in the MySQL table
* getTransform - function - (optional) Function that transforms and returns the property value prior to getting
* setTransform - function - (optional) Function that transforms and returns the property value prior to setting
* saveTransform - function - (optional) Function that transforms and returns the property value prior to saving in the database
* loadTransform - function - (optional) Function that transforms and returns the property value after loading from the database

#### An index configuration can have the following (for MySQL table association only):

* name - string - (required) Name of the index, can be arbitrary, but must be unique and not PRIMARY
* type - string - (optional) Index type, can be BTREE or HASH, defaults to BTREE
* keyBlockSize - number - (optional) Indicates the index should use the provided key block size
* withParser - string - (optional) Indicates the index should use the provided parser
* visible - boolean - (optional) Indicates the index should be visible
* invisible - boolean - (optional) Indicates the index should be invisible
