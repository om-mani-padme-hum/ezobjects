# EZ Objects v2.11.0

EZ Objects is a Node.js module (that can also be usefully browserify'd) that aims to save you lots of time 
writing class objects that are strictly typed in JavaScript, and can be tied directly to MySQL database tables
by way of a mix of insert/update/load/delete class method signatures.  All you have to do is create simple 
configurations for each of your objects and then create them using the createObject() function.  Let's start 
by showing a basic example:

## Basic Example

```javascript
const ezobjects = require(`ezobjects`);

/** 
 * Create a customized object called DatabaseRecord on the 
 * global (node) or window (browser) namespace with a single
 * property called `id`.
 */
ezobjects.createObject({
  className: `DatabaseRecord`,
  properties: [
    { name: `id`, type: `number`, setTransform: x => parseInt(x) }
  ]
});
 
const record = new DatabaseRecord();

console.log(record);
```

### Expected Output

```
DatabaseRecord { _id: 0 }
```

## Extending the Basic Example

```javascript
ezobjects.createObject({
  className: `User`,
  extends: DatabaseRecord,
  properties: [
    { name: `username`, type: `string` },
    { name: `firstName`, type: `string` },
    { name: `lastName`, type: `string` },
    { name: `checkingBalance`, type: `number`, setTransform: x => parseFloat(x) },
    { name: `permissions`, type: `Array` },
    { name: `favoriteDay`, type: `Date` }
  ]
});

const user = new User();

console.log(user);
```

### Expected Output

```
User {
  _id: 0,
  _username: ``,
  _firstName: ``,
  _lastName: ``,
  _checkingBalance: 0,
  _permissions: [],
  _favoriteDay: null }
```

## MySQL Example w/ Extended Object

**Important Notes:** Your object must have a unique integer property named `id` to be able to use the MySQL 
functionality of EZ Objects.  You must also use EZ Object's MySQLConnection class for your database connection.

```javascript
const ezobjects = require(`ezobjects`);
const fs = require(`fs`);
const moment = require(`moment`);

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
const configMySQL = JSON.parse(fs.readFileSync(`mysql-config.json`));

/** 
 * Create a connection object for the MySQL database using our MySQL 
 * module async/await wrapper.
 */
const db = new ezobjects.MySQLConnection(configMySQL);

/** 
 * Configure a new EZ Object called DatabaseRecord with one `id` 
 * property that contains additional MySQL configuration settings.
 */
const configDatabaseRecord = {
  className: `DatabaseRecord`,
  properties: [
    { 
      name: `id`, 
      type: `number`, 
      mysqlType: `int`, 
      autoIncrement: true, 
      primary: true, 
      setTransform: x => parseInt(x) 
    }
  ]
};

/** 
 * Create the DatabaseRecord object -- Note: This object is not 
 * linked to a MySQL table directory, as therefore has no `tableName`
 * property, but it has the MySQL configuration properties on `id` 
 * because it will be extended by another object that is linked to 
 * a MySQL table and therefore it will need the MySQL configuration 
 * of the `id` property.
 */
ezobjects.createObject(configDatabaseRecord);

/** 
 * Configure a new EZ Object called User that extends from the 
 * DatabaseRecord object and adds several additional properties and 
 * a MySQL index.
 */
const configUser = {
  tableName: `users`,
  className: `User`,
  extends: DatabaseRecord,
  extendsConfig: configDatabaseRecord,
  properties: [
    {
      name: `username`,
      type: `string`,
      mysqlType: `varchar`,
      length: 20
    },
    { 
      name: `firstName`, 
      type: `string`, 
      mysqlType: `varchar`, 
      length: 20 
    },
    { 
      name: `lastName`, 
      type: `string`, 
      mysqlType: `varchar`, 
      length: 20 
    },
    { 
      name: `checkingBalance`, 
      type: `number`, 
      mysqlType: `double`, 
      setTransform: x => parseFloat(x) 
    },
    { 
      name: `permissions`, 
      type: `Array`, 
      mysqlType: `text`, 
      saveTransform: x => x.join(`,`), 
      loadTransform: x => x.split(`,`).map(x => parseInt(x))
    },
    { 
      name: `favoriteDay`, 
      type: `Date`, 
      mysqlType: `datetime`, 
      saveTransform: x => moment(x).format(`Y-MM-DD HH:mm:ss`), 
      loadTransform: x => new Date(x) 
    }
  ],
  indexes: [
    { name: `lastName`, type: `BTREE`, columns: [ `lastName` ] }
  ]
};

/** Create the User object */
ezobjects.createObject(configUser);

/** Create new user, initializing with object passed to constructor */
const user = new User({
  username: `richlowe`,
  firstName: `Rich`,
  lastName: `Lowe`,
  checkingBalance: 4.32,
  permissions: [1, 3, 5],
  favoriteDay: new Date(`01-01-2018`)
});

/** Test if user is an instance of DatabaseRecord */
console.log(ezobjects.instanceOf(user, `DatabaseRecord`));

/** Self-executing async wrapper so we can await results */
(async () => {
  try {
    /** Create table if it doesn`t already exist */
    await ezobjects.createTable(db, configUser);

    /** Insert user into the database */
    await user.insert(db);

    /** Log user (should have automatically incremented ID now) */
    console.log(user);

    /** Change the property values a bit */
    user.checkingBalance(50.27);
    user.firstName(`Richard`);
    user.favoriteDay(new Date(`09-01-2019`));

    /** Update user in the database */
    await user.update(db);

    /** Log user (should have `checkingBalance` of 50.27) */
    console.log(user);

    /** Create another user */
    const anotherUser = new User();
    
    /** Assuming ID of last user was 1, load record from database */
    await anotherUser.load(db, 1);

    /** Log anotherUser */
    console.log(anotherUser);

    /** Delete the user from the database */
    await anotherUser.delete(db);
  } catch ( err ) {
    console.log(err.message);
  } finally {
    /** Close database connection */
    db.close();
  }
})();
```

### Expected Output

```
true
User {
  _id: 1,
  _username: `richlowe`,
  _firstName: `Rich`,
  _lastName: `Lowe`,
  _checkingBalance: 4.32,
  _permissions: [ 1, 3, 5 ],
  _favoriteDay: 2018-01-01T06:00:00.000Z }
User {
  _id: 1,
  _username: `richlowe`,
  _firstName: `Richard`,
  _lastName: `Lowe`,
  _checkingBalance: 50.27,
  _permissions: [ 1, 3, 5 ],
  _favoriteDay: 2019-09-01T05:00:00.000Z }
User {
  _id: 1,
  _username: `richlowe`,
  _firstName: `Richard`,
  _lastName: `Lowe`,
  _checkingBalance: 50.27,
  _permissions: [ 1, 3, 5 ],
  _favoriteDay: 2019-09-01T05:00:00.000Z }
```

## Basic EZ Object Method Signatures

These are the object method signatures even the most basic of EZ Objects will have:

### new MyObject([data])
 * **Parameter:** data - `PlainObject` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any provided key/value pairs in the plain object `data`.  Keys can either be equal to the name of a property, or they can be have an underscore before the name of a property, as would be the case if you were to JSON.stringify() and then JSON.parse() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.

### new MyObject([data])
 * **Parameter:** data - `string` - (optional)
 * **Description:** Create a new MyObject object and initialize it using either defaults or any provided key/value pairs in the JSON encoded string `data`.  Keys can either be equal to the name of a property, or they can be have an underscore before the name of a property, as would be the case if you were to JSON.stringify() an EZ Object.  This allows for easy transferability in cases where JSON is used as the transfer medium.

### MyObject.init([data])
 * **Parameter:** data - `PlainObject`
 * **Description:** Initialize this object using either defaults or any provided key/value pairs in the plain object `data`.  This is also the method used by the constructor.
 
In addition, each property you define will have a single method that is a getter and setter, and 
it will have the following signatures:

### MyObject.myProperty()
 * **Returns:** `mixed`
 * **Description:** Get the value of the property.
 
### MyObject.myProperty(value)
 * **Parameter:** value - `mixed`
 * **Throws:** `TypeError` if `value` is not of the correct javascript data type for myProperty
 * **Returns:** this
 * **Description:** Set the value of the property, throwing an error if the javascript data type does not match the configuration, this is how the strict typing is implemented.  This signature returns `this` to allow for set call chaining.

## MySQL EZ Object Method Signatures

These are the object method signatures that will additionally be provided if your configuration contains a `tableName`,
meaning it's intended to be linked to a MySQL table:

### MyObject.delete(db)
 * **Parameter:** db - `MySQLConnection`
 * **Description:** Delete the record in database `db`, table `tableName`, that has its `id` field equal to the `id` property of this object.

### MyObject.insert(db)
 * **Parameter:** db - `MySQLConnection`
 * **Description:** Insert this object's property values into the database `db`, table `tableName`, and store the resulting insertId in the `id` property of this object.

### MyObject.load(db, id)
 * **Parameter:** db - `MySQLConnection`
 * **Parameter:** id number The value of the `id` property of the record you wish to load
 * **Description:** Load the record in database `db`, table `tableName`, that has its `id` field equal to provided `id` parameter.

### MyObject.load(db, fieldValue)
 * **Parameter:** db - `MySQLConnection`
 * **Parameter:** fieldValue - `mixed` - The value of the `stringSearchField` property of the record you wish to load
 * **Description:** Load the record in database `db`, table `tableName`, that has its `stringSearchField` field equal to provided `fieldValue` parameter.  Here, the actual field name of `stringSearchField` is provided in the object configuration, see the configuration section below.

### MyObject.load(url)
 * **Parameter:** url - `string` - The URL of a back-end that provides JSON data compatible with this object's initializer
 * **Description:** Load the JSON-encoded data obtained from `url` using this object's initializer.  
 * **Note:** This signature is useful only when your classes are standalone browserify'd and requires you to implement a backend at `url` that will output the JSON.  This signature also requires you have jQuery loaded prior to use.

### MyObject.update(db)
 * **Parameter:** db - `MySQLConnection`
 * **Description:** Update the record in database `db`, table `tableName`, with its `id` field equal to the `id` property of this object, using this object's property values.

## Module Exports

The EZ Objects module exports two functions and a MySQL class object:

### ezobjects.createTable(db, objectConfig)
A function that creates a MySQL table corresponding to the configuration outlined in `objectConfig`, if it doesn't already exist

### ezobjects.createObject(objectConfig)
A function that creates an ES6 class corresponding to the configuration outlined in `objectConfig`, with constructor, initializer, getters, setters, and also delete, insert, load, and update if `tableName` is configured

### ezobjects.MySQLConnection(mysqlConfig)
A MySQL database connection class that wraps the standard mysql object and provides it with async/await functionality and transaction helpers

## Configuration Specifications

See the following for how to configure your EZ Objects:

### A basic object configuration can have the following:

* **className** - `string` - (required) Name of the class
* **properties** - `Array` - (required) An array of property configurations that the object (and MySQL table, if applicable) should have corresponding properties for
* **extends** - `mixed` - (optional) The object that the new object should be extended from \[required to extend object]

### A MySQL object configuration can also have the following:

* **extendsConfig** - `object` - (optional) The EZ Object configuration for the object that is being extended from \[required to extend object for use with MySQL table link]
* **tableName** - `string` - (optional) Provide if object should be linked with MySQL database table
* **stringSearchField** - `string` - (optional) The name of a unique property of type `string` that you want to be able to load with as an alternative to `id`
* **indexes** - `Array` - (optional) An array of MySQL index configurations that should be created in the MySQL table

### A basic property configuration can have the following:

* **name** - `string` - (required) Name of the property, must conform to both JavaScript and MySQL rules
* **type** - `string` - (optional) JavaScript data type that the property must be equal to \[either **type** or **instanceOf** is required]
* **instanceOf** - `string` - (optional) JavaScript class constructor name that the property must be an instance of \[either **type** or **instanceOf** is required]
* **default** - `mixed` - (optional) Sets the default value for the property in the class object
* **initTransform** - `function` - (optional) Function that transforms and returns the property value prior to initializing (does not affect ezobjects defaults or custom defaults)
* **getTransform** - `function` - (optional) Function that transforms and returns the property value prior to getting
* **setTransform** - `function` - (optional) Function that transforms and returns the property value prior to setting

### A MySQL property configuration can also have the following:

* **mysqlType** - `string` - (optional) MySQL data type for the property \[required for MySQL table association]
* **length** - `number` - (optional) MySQL data length for the property \[required for MySQL table association on some data types like VARCHAR]
* **decimals** - `number` - (optional) Number of decimals that should be provided for certain data types when SELECT'ed from the MySQL table
* **primary** - `boolean` - (optional) Indicates the property is a PRIMARY KEY in the MySQL table \[required for MySQL table association on at least one property in the table]
* **unique** - `boolean` - (optional) Indicates the property is a UNIQUE KEY in the MySQL table
* **null** - `boolean` - (optional) Indicates the property can be NULL \[default is properties must be NOT NULL]
* **mysqlDefault** - `mixed` - (optional) Sets the default value for the property in the MySQL table, assuming its of the correct type
* **unsigned** - `boolean` - (optional) Indicates the property should be unsigned in the MySQL table
* **zerofill** - `boolean` - (optional) Indicates the property should be zero-filled in the MySQL table
* **comment** - `string` - (optional) Indicates the property should note the provided comment in the MySQL table
* **charsetName** - `string` - (optional) Indicates the property should use the provided charset in the MySQL table
* **collationName** - `string` - (optional) Indicates the property should use the provided collation in the MySQL table
* **autoIncrement** - `boolean` - (optional) Indicates the property should be auto-incremented in the MySQL table
* **saveTransform** - `function` - (optional) Function that transforms and returns the property value prior to saving in the database
* **loadTransform** - `function` - (optional) Function that transforms and returns the property value after loading from the database

### A MySQL index configuration can have the following (for MySQL table association only):

* **name** - `string` - (required) Name of the index, can be arbitrary, but must be unique and not PRIMARY
* **columns** - `Array` - (required) An array of strings containing property names to be indexed
* **type** - `string` - (optional) Index type, can be BTREE or HASH, defaults to BTREE
* **keyBlockSize** - `number` - (optional) Indicates the index should use the provided key block size
* **withParser** - `string` - (optional) Indicates the index should use the provided parser
* **visible** - `boolean` - (optional) Indicates the index should be visible
* **invisible** - `boolean` - (optional) Indicates the index should be invisible

### Default intiailizations for different JavaScript types

* `number` - 0
* `string` - ``
* `boolean` - false
* `function` - function () { }
* `Array` - []
* Everything else - null

## Contributing

Please open an issue on the GitHub repository if you find any broken functionality or other bugs/errors.  Feature requests
will also be accepted, but are not guaranteed to be implemented.

## License

MIT Licensed
