const docket = require(`docket-parser`);

docket.title(`EZ Objects v2.8.1`);
docket.linkClass(`text-success`);
docket.parseFiles([`index.js`, `mysql-connection.js`]);
docket.generateDocs(`docs`);
