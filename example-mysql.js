/** Require external modules */
const fs = require('fs');
const moment = require('moment');

/** Require internal modules */
const ezobjects = require('./index');
const mysqlConnection = require('./mysql-connection');

const db = new mysqlConnection.MySQLConnection(JSON.parse(fs.readFileSync('mysql-config.json')));

const configDatabaseRecord = {
  className: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'number', mysqlType: 'int', autoIncrement: true, primary: true, setTransform: x => parseInt(x) }
  ]
};

ezobjects.createObject(configDatabaseRecord);

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

(async () => {
  try {
    await ezobjects.createTable(db, configPerson);
    ezobjects.createObject(configPerson);

    const person = new Person({
      firstName: 'Rich',
      lastName: 'Lowe',
      checkingBalance: 4.32,
      permissions: [1, 3, 4],
      favoriteDay: new Date('01-01-2018')
    });

    console.log(person);

    await person.insert(db);

    console.log(person);

    const person2 = new Person();

    await person2.load(db, 2);

    console.log(person2);

    person2.checkingBalance(50.74);

    await person2.update(db);
  } catch ( err ) {
    console.log(err.message);
  } finally {
    db.close();
  }
})();
