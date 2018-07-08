<<<<<<< HEAD
const ezobjects = require(`./index`);

/** Create a customized object on the global (node) or window (browser) namespace */
ezobjects.createClass({
  className: `DatabaseRecord`,
  properties: [
    { name: `id`, type: `number`, setTransform: x => parseInt(x) }
  ]
});
=======
/** Require external modules */
const fs = require(`fs`);
const util = require(`util`);
>>>>>>> 6d49df4442e867a351c43326fb61424fa52015aa

/** Require internal modules */
const ezobjects = require(`./index`);

/** Connect to the MySQL database using login info stored externally */
const db = new ezobjects.MySQLConnection(JSON.parse(fs.readFileSync(`mysql-config.json`)));

<<<<<<< HEAD
/** Create another customized object that extends the first one */
ezobjects.createClass({
  className: `Person`,
  extends: DatabaseRecord,
=======
/** 
 * Configure a new EZ Object class called Example that tests out the
 * various data types supported.
 *
 * VERY IMPORTANT: 
 *
 * All MySQL EZ Objects MUST have an integer `id` field that will serve 
 * as an auto-incrementing primary index.
 */
const configExample = {
  tableName: `examples`,
  className: `Example`,
>>>>>>> 6d49df4442e867a351c43326fb61424fa52015aa
  properties: [
    { name: `id`, type: `int` },
    { name: `bitExample`, type: `bit`, length: 2 },
    { name: `tinyintExample`, type: `tinyint` },
    { name: `tinyintExample2`, type: `tinyint`, unsigned: true, zerofill: true },
    { name: `smallintExample`, type: `smallint` },
    { name: `mediumintExample`, type: `mediumint` },
    { name: `intExample`, type: `int` },
    { name: `integerExample`, type: `integer` },
    { name: `bigintExample`, type: `bigint` },
    { name: `doubleExample`, type: `double` },
    { name: `floatExample`, type: `float` },
    { name: `decimalExample`, type: `decimal`, length: 5, decimals: 3 },
    { name: `numericExample`, type: `numeric`, length: 8, decimals: 5 },
    { name: `dateExample`, type: `date` },
    { name: `timeExample`, type: `time` },
    { name: `timestampExample`, type: `timestamp` },
    { name: `datetimeExample`, type: `datetime` },
    { name: `yearExample`, type: `year` },
    { name: `charExample`, type: `char`, length: 2 },
    { name: `charExample2`, type: `char`, length: 2, characterSet: `latin1`, collate: `latin1_german1_ci` },
    { name: `varcharExample`, type: `varchar`, length: 40 },
    { name: `varcharExample2`, type: `varchar`, length: 40, allowNull: true },
    { name: `binaryExample`, type: `binary`, length: 4 },
    { name: `varbinaryExample`, type: `varbinary`, length: 4 },
    { name: `tinyblobExample`, type: `tinyblob` },
    { name: `blobExample`, type: `blob` },
    { name: `mediumblobExample`, type: `mediumblob` },
    { name: `longblobExample`, type: `longblob` },
    { name: `tinytextExample`, type: `tinytext` },
    { name: `textExample`, type: `text` },
    { name: `mediumtextExample`, type: `mediumtext` },
    { name: `longtextExample`, type: `longtext` },
    { name: `enumExample`, type: `enum`, values: [`one`, `two`, `three`] },
    { name: `setExample`, type: `set`, values: [`a`, `b`, `c`, `d`] },
    
    { name: `booleanExample`, type: `boolean` },
    { name: `functionExample`, type: `function` },
    { name: `functionExample2`, type: `function`, store: true },
    { name: `ezobjectTypeExample`, type: `OtherObj` },
    { name: `ezobjectInstanceExample`, instanceOf: `OtherObj` },
    { name: `ezobjectInstanceExample2`, instanceOf: `OtherObj`, store: false },
    
    { name: `bitArrayExample`, type: `Array`, arrayOf: { type: `bit`, length: 2 } },
    { name: `tinyintArrayExample`, type: `Array`, arrayOf: { type: `tinyint` } },
    { name: `tinyintArrayExample2`, type: `Array`, arrayOf: { type: `tinyint`, unsigned: true, zerofill: true } },
    { name: `smallintArrayExample`, type: `Array`, arrayOf: { type: `smallint` } },
    { name: `mediumintArrayExample`, type: `Array`, arrayOf: { type: `mediumint` } },
    { name: `intArrayExample`, type: `Array`, arrayOf: { type: `int` } },
    { name: `integerArrayExample`, type: `Array`, arrayOf: { type: `integer` } },
    { name: `bigintArrayExample`, type: `Array`, arrayOf: { type: `bigint` } },
    { name: `doubleArrayExample`, type: `Array`, arrayOf: { type: `double` } },
    { name: `floatArrayExample`, type: `Array`, arrayOf: { type: `float` } },
    { name: `decimalArrayExample`, type: `Array`, arrayOf: { type: `decimal`, length: 5, decimals: 3 } },
    { name: `numericArrayExample`, type: `Array`, arrayOf: { type: `numeric`, length: 8, decimals: 5 } },
    { name: `dateArrayExample`, type: `Array`, arrayOf: { type: `date` } },
    { name: `timeArrayExample`, type: `Array`, arrayOf: { type: `time` } },
    { name: `timestampArrayExample`, type: `Array`, arrayOf: { type: `timestamp` } },
    { name: `datetimeArrayExample`, type: `Array`, arrayOf: { type: `datetime` } },
    { name: `yearArrayExample`, type: `Array`, arrayOf: { type: `year` } },
    { name: `charArrayExample`, type: `Array`, arrayOf: { type: `char`, length: 2 } },
    { name: `charArrayExample2`, type: `Array`, arrayOf: { type: `char`, length: 2, characterSet: `latin1`, collate: `latin1_german1_ci` } },
    { name: `varcharArrayExample`, type: `Array`, arrayOf: { type: `varchar`, length: 40 } },
    { name: `varcharArrayExample2`, type: `Array`, arrayOf: { type: `varchar`, length: 40, allowNull: true } },
    { name: `binaryArrayExample`, type: `Array`, arrayOf: { type: `binary`, length: 4 } },
    { name: `varbinaryArrayExample`, type: `Array`, arrayOf: { type: `varbinary`, length: 4 } },
    { name: `tinyblobArrayExample`, type: `Array`, arrayOf: { type: `tinyblob` } },
    { name: `blobArrayExample`, type: `Array`, arrayOf: { type: `blob` } },
    { name: `mediumblobArrayExample`, type: `Array`, arrayOf: { type: `mediumblob` } },
    { name: `longblobArrayExample`, type: `Array`, arrayOf: { type: `longblob` } },
    { name: `tinytextArrayExample`, type: `Array`, arrayOf: { type: `tinytext` } },
    { name: `textArrayExample`, type: `Array`, arrayOf: { type: `text` } },
    { name: `mediumtextArrayExample`, type: `Array`, arrayOf: { type: `mediumtext` } },
    { name: `longtextArrayExample`, type: `Array`, arrayOf: { type: `longtext` } },
    { name: `enumArrayExample`, type: `Array`, arrayOf: { type: `enum`, values: [`one`, `two`, `three`] } },
    { name: `setArrayExample`, type: `Array`, arrayOf: { type: `set`, values: [`a`, `b`, `c`, `d`] } },
    
    { name: `booleanArrayExample`, type: `Array`, arrayOf: { type: `boolean` } },
    { name: `functionArrayExample`, type: `Array`, arrayOf: { type: `function` } },
    { name: `functionArrayExample2`, type: `Array`, arrayOf: { type: `function`, store: true } },
    { name: `ezobjectTypeArrayExample`, type: `Array`, arrayOf: { type: `OtherObj` } },
    { name: `ezobjectInstanceArrayExample`, type: `Array`, arrayOf: { instanceOf: `OtherObj` } },
    { name: `ezobjectInstanceArrayExample2`, type: `Array`, arrayOf: { instanceOf: `OtherObj` } },
  ],
  indexes: [
    { name: `varcharExample`, type: `BTREE`, columns: [ `varcharExample` ] },
    { name: `charExample`, type: `HASH`, columns: [ `charExample` ] }
  ]
};

/** Create the Example class */
ezobjects.createClass(configExample);

/** Configure a simple `other` object for use in the example */
const configOtherObj = {
  className: `OtherObj`,
  tableName: `other_objects`,
  properties: [
    { name: `id`, type: `int` },
    { name: `name`, type: `varchar`, length: 40 }
  ]
};

/** Create the OtherObj class */
ezobjects.createClass(configOtherObj);

/** Create a simple extended object for use in the example */
ezobjects.createClass({
  className: `ExtendedObj`,
  tableName: `extendedObjects`,
  extends: OtherObj,
  extendsConfig: configOtherObj,
}); 

/** Create new example object, initializing with object passed to constructor */
const example = new Example({
  bitExample: Buffer.from([0b1, 0b0]),
  tinyintExample: -128,
  tinyintExample2: 255,
  smallintExample: -32767,
  mediumintExample: -8388608,
  intExample: -2147483648,
  integerExample: -2147483648,
//  bigintExample: -9223372036854775808,
  doubleExample: 193448295822329038402340234.23840923804823094809234245,
  floatExample: 1927492498374.2348927395,
  decimalExample: 23.452,
  numericExample: 942.28734,
  dateExample: new Date(`1986-06-20`),
  timeExample: `-838:59:59`,
  timestampExample: new Date(`2011-07-16T04:52:23-06:00`),
  datetimeExample: new Date(`2011-07-16T04:52:23-06:00`),
  yearExample: 2004,
  charExample: `AU`,
  charExample2: `ÄÜ`,
  varcharExample: `Varchar Example`,
  varcharExample2: null,
  binaryExample: Buffer.from([0x04, 0x7F, 0x13, 0x38]),
  varbinaryExample: Buffer.from([0x04, 0x7F]),
  tinyblobExample: Buffer.from(`I am a tiny blob up to 256 bytes`),
  blobExample: Buffer.from(`I am a bigger blob up to 65 kB`),
  mediumblobExample: Buffer.from(`I am a bigger blob up to 16 MB`),
  longblobExample: Buffer.from(`I am a bigger blob up to 4 GB`),
  tinytextExample: `I am a tiny text up to 256 bytes`,
  textExample: `I am a bigger text up to 65 kB`,
  mediumtextExample: `I am a bigger text up to 16 MB`,
  longtextExample: `I am a bigger text up to 4 GB`,
  enumExample: `two`,
  setExample: `a,d,d`,
  
  booleanExample: true,
  functionExample: (arg) => { return `I am ${arg}`; },
  functionExample2: (arg) => { return `I am ${arg} stored`; },
  ezobjectTypeExample: new OtherObj({ name: `Type Example` }),
  ezobjectInstanceExample: new ExtendedObj({ name: `Instance Example Stored` }),
  ezobjectInstanceExample2: new ExtendedObj({ name: `Instance Example Not Stored` }),

  bitArrayExample: [Buffer.from([0b1, 0b0]), Buffer.from([0b0, 0b1])],
  tinyintArrayExample: [-128, 128],
  tinyintArrayExample2: [0, 255],
  smallintArrayExample: [-32767, 32767],
  mediumintArrayExample: [-8388608, 8388608],
  intArrayExample: [-2147483648, 2147483648],
  integerArrayExample: [-2147483648, 2147483648],
  bigintArrayExample: [-9223372036854775808, 9223372036854775808],
  doubleArrayExample: [-193448295822329038402340234.23840923804823094809234245, 193448295822329038402340234.23840923804823094809234245],
  floatArrayExample: [-1927492498374.2348927395, 1927492498374.2348927395],
  decimalArrayExample: [-23.452, 23.452],
  numericArrayExample: [-942.28734, 942.28734],
  dateArrayExample: [new Date(`06-20-1986`), new Date(`11-02-1909`)],
  timeArrayExample: [`-838:59:59`, `838:59:59`],
  timestampArrayExample: [new Date(`2011-07-16T04:52:23-06:00`), new Date(`2013-04-26T17:04:13-06:00`)],
  datetimeArrayExample: [new Date(`2011-07-16T04:52:23-06:00`), new Date(`2013-04-26T17:04:13-06:00`)],
  yearArrayExample: [2004, 1968],
  charArrayExample: [`AU`, `CD`],
  charArrayExample2: [`ÄÜ`, `CD`],
  varcharArrayExample: [`Varchar Example`, `Another Varchar Example`],
  varcharArrayExample2: [null, `Varchar Example 2`],
  binaryArrayExample: [Buffer.from([0x04, 0x7F, 0x13, 0x38]), Buffer.from([0xA3, 0x09])],
  varbinaryArrayExample: [Buffer.from([0x04, 0x7F]), Buffer.from([0xA3, 0x09, 0xDC])],
  tinyblobArrayExample: [Buffer.from(`I am a tiny blob up to 256 bytes`), Buffer.from(`I am another tiny blob up to 256 bytes`)],
  blobArrayExample: [Buffer.from(`I am a bigger blob up to 65 kB`), Buffer.from(`I am another bigger blob up to 65 kB`)],
  mediumblobArrayExample: [Buffer.from(`I am a bigger blob up to 16 MB`), Buffer.from(`I am another bigger blob up to 16 MB`)],
  longblobArrayExample: [Buffer.from(`I am a bigger blob up to 4 GB`), Buffer.from(`I am another bigger blob up to 4 GB`)],
  tinytextArrayExample: [`I am a tiny text up to 256 bytes`, `I am another tiny text up to 256 bytes`],
  textArrayExample: [`I am a bigger text up to 65 kB`, `I am another bigger text up to 65 kB`],
  mediumtextArrayExample: [`I am a bigger text up to 16 MB`, `I am another bigger text up to 16 MB`],
  longtextArrayExample: [`I am a bigger text up to 4 GB`, `I am another bigger text up to 4 GB`],
  enumArrayExample: [`two`, `one`],
  setArrayExample: [`a,d`, `a,c,d,d`],
  
  booleanArrayExample: [false, true],
  functionArrayExample: [(arg) => { return `I am ${arg} 1`; }, (arg) => { return `I am ${arg} 2`; }],
  functionArrayExample2: [(arg) => { return `I am ${arg} stored 1`; }, (arg) => { return `I am ${arg} stored 2`; }],
  ezobjectTypeArrayExample: [new OtherObj({ name: `Type Example 1` }), new OtherObj({ name: `Type Example 2` })],
  ezobjectInstanceArrayExample: [new ExtendedObj({ name: `Instance Example Stored 1` }), new ExtendedObj({ name: `Instance Example Stored 2` })],
  ezobjectInstanceArrayExample2: [new ExtendedObj({ name: `Instance Example Not Stored 1` }), new ExtendedObj({ name: `Instance Example Not Stored 2` })]
});

/** Log the initialized example object */
console.log(`Initialized example object:`);
console.log(`${util.inspect(example, { depth: null })}\n`);

/** Self-executing async wrapper so we can await results */
(async () => {
  //try {
    /** Create table if it doesn`t already exist */
    await ezobjects.createTable(configOtherObj, db);
    
    /** Create table if it doesn`t already exist */
    await ezobjects.createTable(configExample, db);

    /** Insert example into the database */
    await example.insert(db);

    /** Get the inserted ID */
    const id = example.id();
    
    /** Create a second example object */
    const example2 = new Example();

    /** Attempt to load the original example from the database into example2 */
    await example2.load(id, db);
        
    /** Test stored anonymous function */
    console.log(`${example2.functionExample()(`Rich`)}\n`);
  
    /** Log the database loaded example object */
    console.log(`Database loaded example object:`);
    console.log(util.inspect(example2, { depth: null }));
  //} catch ( err ) {
  //  console.log(err.message);
  //} finally {
    /** Close database connection */
    db.close();
  //}
})();
