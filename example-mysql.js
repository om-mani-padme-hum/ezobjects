const ezobjects = require('./index');
const mysqlConnection = require('./mysql-connection');

const db = new mysqlConnection.MySQLConnection({
  host: 'localhost',
  user: 'ezobjects',
  password: 'password',
  database: 'ezobjects'
});

const configDatabaseRecord = {
  className: 'DatabaseRecord',
  properties: [
    { name: 'id', type: 'number', mysqlType: 'int', autoIncrement: true, primary: true }
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
    { name: 'checkingBalance', type: 'number', mysqlType: 'double' },
    { name: 'permissions', type: 'string', mysqlType: 'text' },
    { name: 'favoriteDay', type: 'Date', mysqlType: 'datetime' }
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
      permissions: 'asdf',
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
