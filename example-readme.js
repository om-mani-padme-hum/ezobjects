const ezobjects = require('./index');
const fs = require('fs');
const moment = require('moment');

/** 
 * Load external MySQL configuration which uses the following JSON format:
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
 * property, but it has the MySQL configuration properties on `id` because
 * it will be extended by a class that is linked to a MySQL table and
 * therefore it will need the MySQL configuration of the `id` property.
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
