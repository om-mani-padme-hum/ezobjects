/** Require external modules */
const fs = require('fs');
const moment = require('moment');

/** Require internal modules */
const ezobjects = require('./index');

/** Connect to the MySQL database using login info stored externally */
const db = new ezobjects.MySQLConnection(JSON.parse(fs.readFileSync('mysql-config.json')));

/** Configure a new EZ Object called DatabaseRecord with one 'id' property */
const configDatabaseRecord = {
  className: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'number', mysqlType: 'int', autoIncrement: true, primary: true, setTransform: x => parseInt(x) }
  ]
};

/** Create the DatabaseRecord object */
ezobjects.createObject(configDatabaseRecord);

/** Configure a new EZ Object called Person that extends from the DatabaseRecord object and adds several additional properties and an index */
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

/** Wrap our test code in a self-executing asynchronous function so we can 'await' responses */
(async () => {
  /** Try/catch/finally to cleanly catch errors and close database connection */
  try {
    /** Await table creation if it doesn't already exist */
    await ezobjects.createTable(db, configPerson);
    
    /** Create the Person object */
    ezobjects.createObject(configPerson);

    /** Create a new instance of the Person object, loaded with data passed to the constructor */
    const person = new Person({
      firstName: 'Rich',
      lastName: 'Lowe',
      checkingBalance: 4.32,
      permissions: [1, 3, 4],
      favoriteDay: new Date('01-01-2018')
    });

    /** Log the current value of the person */
    console.log(person);

    /** Await the insertion of that Person object into the database */
    await person.insert(db);

    /** Log the current value of the person */
    console.log(person);

    /** Create a second instance of the Person object */
    const person2 = new Person();

    /** Await loading of database record with ID 2 into person2 */
    await person2.load(db, 2);

    /** Log the current value of person2 */
    console.log(person2);

    /** Set person2's checking balance to 50.74 */
    person2.checkingBalance(50.74);

    /** Await update of person2 in database */
    await person2.update(db);
  } catch ( err ) {
    /** Log any caught errors */
    console.log(err.message);
  } finally {
    /** Close database connection */
    db.close();
  }
})();
