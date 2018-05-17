# EZ Objects v2.4.3

EZ Objects is a Node.js module (that can also be usefully browserify'd) that aims to save you lots of time 
writing class objects.  All you have to do is create simple configurations for each of your objects and then call
the library function(s).  Let's start by showing a basic example:

## Basic Example

```javascript
const ezobjects = require('ezobjects');

/** 
 * Create a customized object on the global (node) or window (browser) 
 * namespace.
 */
ezobjects.createObject({
  className: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'number', setTransform: x => parseInt(x) }
  ]
});

/** 
 * There now exists a class called DatabaseRecord which has the 
 * following signatures:
 * 
 * @signature new DatabaseRecord([data])
 * @param data PlainObject 
 * @description Create a new DatabaseRecord object and initialize it
 * using either defaults or any provided key/value pairs in the plain 
 * object `data`.  Keys can either be equal to the name of a property, 
 * or they can be have an underscore before the name of a property, as 
 * would be the case if you were to JSON.stringify() and then 
 * JSON.parse() an EZ Object.  This allows for easy transferability in 
 * cases where JSON is used as the transfer medium.
 *
 * @signature new DatabaseRecord([data])
 * @param data string 
 * @description Create a new DatabaseRecord object and initialize it 
 * using either defaults or any provided key/value pairs in the JSON 
 * encoded string `data`.  Keys can either be equal to the name of a 
 * property, or they can be have an underscore before the name of a 
 * property, as would be the case if you were to JSON.stringify() an 
 * EZ Object.  This allows for easy transferability in cases where 
 * JSON is used as the transfer medium.
 *
 * @signature init([data])
 * @param data PlainObject 
 * @description Initialize this object using either defaults or any 
 * provided key/value pairs in the plain object `data`.  This is also 
 * the method used by the constructor.
 *
 * In addition, each property you define will have a single method 
 * that is a getter and setter, and it will have the following 
 * signatures:
 *
 * @signature myProperty()
 * @returns mixed
 * @description Get the value of the property.
 *
 * @signature myProperty(value)
 * @param value mixed
 * @throws TypeError if `value` is not of the correct javascript data 
 * type for myProperty
 * @returns this
 * @description Set the value of the property, throwing an error if the 
 * javascript data type does not match the configuration, this is how
 * the strict typing is implemented.  This signature returns `this` to 
 * allow for set call chaining.
 */
 
const record = new DatabaseRecord();
```

In this short snippet, we have effectively created a new class named `DatabaseRecord`.  The class
has a constructor, an initializer, and a getter/setter method for `id`.  The constructor calls the
initializer (named `init`), which sets the value of `id` to the default for type **number**, being
zero in this case.  You could also explicitly pass a default by adding a `default` key to the property,
should you so desire.  We've also added a transform function that will take any value passed to the `id`
setter and apply parseInt() to it.

## MySQL Example w/ Extended Object

**Importing Note:** You must have a unique integer property named `id` to be able to use the MySQL
functionality of EZ Objects.

```javascript
const ezobjects = require('./index');
const fs = require('fs');
const moment = require('moment');

/** 
 * Load external MySQL configuration which uses the following JSON 
 * format:
 * {
 *   "host"          : "localhost",
 *   "user"          : "ezobjects",
 *   "password"      : "myPassword",
 *   "database"      : "ezobjects"
 * }
 */
const configMySQL = JSON.parse(fs.readFileSync('mysql-config.json'));

/** 
 * Create a connection object for the MySQL database using our MySQL 
 * module async/await wrapper.  Currently, using the ezobjects MySQL 
 * database is the only option, but future versions may seek to expand 
 * the option to other databases, or at least allow the standard mysql 
 * module to work.
 */
const db = new ezobjects.MySQLConnection(configMySQL);

/** 
 * Configure a new EZ Object called DatabaseRecord with one 'id' 
 * property that contains additional MySQL configuration settings.
 */
const configDatabaseRecord = {
  className: 'DatabaseRecord',
  properties: [
    { 
      name: 'id', 
      type: 'number', 
      mysqlType: 'int', 
      autoIncrement: true, 
      primary: true, 
      setTransform: x => parseInt(x) 
    }
  ]
};

/** 
 * Create the DatabaseRecord object -- Note: This object is not 
 * linked to a MySQL table directory, and therefore has no tableName
 * property, but it has the MySQL configuration properties on `id` 
 * because it will be extended by a class that is linked to a MySQL 
 * table and therefore it will need the MySQL configuration of the 
 * `id` property.
 */
ezobjects.createObject(configDatabaseRecord);

/** 
 * Configure a new EZ Object called User that extends from the 
 * DatabaseRecord object and adds several additional properties and 
 * a MySQL index.
 */
const configUser = {
  tableName: 'users',
  className: 'User',
  extends: DatabaseRecord,
  extendsConfig: configDatabaseRecord,
  stringSearchField: 'username',
  properties: [
    {
      name: 'username',
      type: 'string',
      mysqlType: 'varchar',
      length: 20
    },
    { 
      name: 'firstName', 
      type: 'string', 
      mysqlType: 'varchar', 
      length: 20 
    },
    { 
      name: 'lastName', 
      type: 'string', 
      mysqlType: 'varchar', 
      length: 20 
    },
    { 
      name: 'checkingBalance', 
      type: 'number', 
      mysqlType: 'double', 
      setTransform: x => parseFloat(x) 
    },
    { 
      name: 'permissions', 
      type: 'Array', 
      mysqlType: 'text', 
      saveTransform: x => x.join(','), 
      loadTransform: x => x.split(',').map(x => parseInt(x))
    },
    { 
      name: 'favoriteDay', 
      type: 'Date', 
      mysqlType: 'datetime', 
      saveTransform: x => moment(x).format('Y-MM-DD HH:mm:ss'), 
      loadTransform: x => new Date(x) 
    }
  ],
  indexes: [
    { name: 'lastName', type: 'BTREE', columns: [ 'lastName' ] }
  ]
};

/** Create the User object */
ezobjects.createObject(configUser);

/**
 * The User object has all of the signatures listed in the comments 
 * for the Basic Example above, but also has the following signatures 
 * added 
 * since it has a tableName defined:
 *
 * @signature delete(db)
 * @param db MySQLConnection
 * @description Delete the record in database `db`, table `tableName`, 
 * that has its `id` field equal to the `id` property of this object.
 *
 * @signature insert(db)
 * @param db MySQLConnection
 * @description Insert this object's property values into the database 
 * `db`, table `tableName`, and store the resulting insertId in the 
 * `id` property of this object.
 *
 * @signature load(db, id)
 * @param db MySQLConnection
 * @param id number The value of the `id` property of the record you 
 * wish to load
 * @description Load the record in database `db`, table `tableName`, 
 * that has its `id` field equal to provided `id` parameter.
 *
 * @signature load(db, fieldValue)
 * @param db MySQLConnection
 * @param fieldValue mixed The value of the `stringSearchField` 
 * property of the record you wish to load
 * @description Load the record in database `db`, table `tableName`, 
 * that has its `stringSearchField` field equal to provided `id` 
 * parameter.  Here, the actual field name of `stringSearchField` is 
 * provided in the object configuration, see the more detailed 
 * specifications below.
 *
 * @signature load(url)
 * @param url The URL of a back-end that provides JSON data compatible 
 * with this object's initializer
 * @description Load the JSON-encoded data obtained from `url` using 
 * this object's initializer.  This signature is useful only when your 
 * classes are standalone browserify'd and requires you to implement a 
 * backend at `url` that will output the JSON.  This signature requires 
 * you have jQuery loaded prior to use.
 *
 * @signature update(db)
 * @param db MySQLConnection
 * @description Update the record in database `db`, table `tableName`, 
 * with its `id` field equal to the `id` property of this object, using 
 * this object's property values.
 */

/** Create new user, initializing with object passed to constructor */
const user = new User({
  username: 'richlowe',
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.32,
  permissions: [1, 3, 5],
  favoriteDay: new Date('01-01-2018')
});

/** Self-executing async wrapper so we can await results */
(async () => {
  /** Create table if it doesn't already exist */
  await ezobjects.createTable(db, configUser);
  
  /** Insert user into the database */
  await user.insert(db);
              
  /** Log user (should have automatically incremented ID now) */
  console.log(user);

  /** Close database connection */
  db.close();
})();
```

### Expected Output

```
User {
  _id: 1,
  _username: 'richlowe',
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.32,
  _permissions: [ 1, 3, 5 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
```

In this snippet, we've created two classes, DatabaseRecord and User.  User extends DatabaseRecord and is also associated with
a MySQL table called `users`.  Each property is given a JavaScript `type` and a MySQL `mysqlType`.  Additional MySQL property
configuration options can be provided, which are outlined in more detail below.  A BTREE index is also added on the lastName column
for faster searching by lastName.  While not required, the moment library is used to help translate date formats between MySQL 
and JavaScript.

Since the User class configuration provided a `tableName` property, it will automatically have additional methods created that are
not present in a basic EZ Object.  The additional methods are delete(db), insert(db), load(db, id), and update(db).  These methods can 
be used to delete the MySQL record corresponding to the object, insert the object properties as a new MySQL record, load a MySQL record 
into the object properties, or update an existing MySQL record using the object properties.  Transforms can be used to validate or
manipulate the property values when they are get or set in the object, or when they are saved or loaded from the database.

## Various Uses of EZ Objects

### Constructor Default

```javascript
const a = new User();

console.log(a);
```

### Expected Output

```
User {
  _id: 0,
  _firstName: '',
  _lastName: '',
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
```

### Using Initializer Object

```javascript
const b = new User({
  id: 1,
  firstName: 'Rich',
  lastName: 'Lowe',
  checkingBalance: 4.32,
  permissions: [1, 3, 5],
  favoriteDay: new Date('01-01-2018')
});

console.log(b);
```

### Expected Output

```
User {
  _id: 1,
  _firstName: 'Rich',
  _lastName: 'Lowe',
  _checkingBalance: 4.32,
  _permissions: [ 1, 3, 5 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
```

### Using Auto-generated Setters

```javascript
const c = new User();

c.id(2);
c.firstName('Bert');
c.lastName('Reynolds');
c.checkingBalance(91425518.32);
c.permissions([1, 4]);
c.favoriteDay(new Date('06-01-2017'));

console.log(c);
```

### Expected Output

```
User {
  _id: 2,
  _firstName: 'Bert',
  _lastName: 'Reynolds',
  _checkingBalance: 91425518.32,
  _permissions: [ 1, 4 ],
  _favoriteDay: 2017-06-01T05:00:00.000Z }
```

### Using Auto-generated Getters

```javascript
console.log(`ID: ${c.id()}`);
console.log(`First Name: ${c.firstName()}`);
console.log(`Last Name: ${c.lastName()}`);
console.log(`Checking Balance: $${c.checkingBalance()}`);
console.log(`Permissions: ${c.permissions().join(`, `)}`);
console.log(`Favorite Day: ${c.favoriteDay().toString()}`);
```

### Expected Output

``` 
ID: 2
First Name: Bert
Last Name: Reynolds
Checking Balance: $91425518.32
Permissions: 1, 4
Favorite Day: Thu Jun 01 2017 00:00:00 GMT-0500 (CDT)
```

#### See example.js and example-mysql.js for more!

## Module Specification

### The module has three exports:

**ezobjects.createTable(db, obj)**
* Creates a MySQL table corresponding to the configuration outlined in `obj`, if it doesn't already exist

**ezobjects.createObject(obj)**
* Creates an ES6 class corresponding to the configuration outlined in `obj`, with constructor, initializer, getters, setters, and also delete, insert, load, and update if `tableName` is configured

**ezobjects.MySQLConnection(config)**
* A MySQL database connection wrapper that uses the standard mysql package and wraps it with async/await and transaction helpers

### An object configuration can have the following:

* tableName - string - (optional) Provide if object should be linked with MySQL database table
* className - string - (required) Name of the class
* extends - object - (optional) The object that the new object should be extended from [required to extend object]
* extendsConfig - object - (optional) The EZ Object configuration for the object that is being extended from [required to extend object]
* stringSearchField - string (optional) The name of a unique property of type `string` that you want to be able to load with as an alternative to `id`
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
* default - mixed - (optional) Sets the default value for the property in the class object
* mysqlDefault - mixed - (optional) Sets the default value for the property in the MySQL table, assuming its of the correct type
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

### An index configuration can have the following (for MySQL table association only):

* name - string - (required) Name of the index, can be arbitrary, but must be unique and not PRIMARY
* type - string - (optional) Index type, can be BTREE or HASH, defaults to BTREE
* keyBlockSize - number - (optional) Indicates the index should use the provided key block size
* withParser - string - (optional) Indicates the index should use the provided parser
* visible - boolean - (optional) Indicates the index should be visible
* invisible - boolean - (optional) Indicates the index should be invisible

### Default intiailizations for different JavaScript types

* number - 0
* string - ''
* boolean - false
* Array - []
* anything else - null
