const docket = require(`docket-parser`);

docket.title(`EZ Objects v2.10.6`);
docket.linkClass(`text-success`);
docket.parseFiles([`index.js`, `mysql-connection.js`]);
docket.generateDocs(`docs`);
