const Express    = require('express');
const path       = require('path');
const port       = process.env.PORT || 3000;
const express    = Express();
const fs         = require('fs');
var http         = require('http').createServer(express);
const storage    = path.join(__dirname, "..", 'storage');
const App        = require('./app.js');

/**
 * WebSocket Configuration
 */
var io = require('socket.io')(http, {});
/**
* App backend socket.io implementation.
*/
new App(io).bind();
/**
 *   Storage
 */
express.use(Express.static(path.join(storage)));

express.get('/', function (req, res) {
    res.sendFile(path.join(storage, `index.html`));
});

express.get('/:file', function (req, res) {
    const fileName = req.params.file;
    const filePath = path.join(storage, `${fileName}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    }
    else {
      res.status(404).end('Not found');
    }
});

http.listen(port, () => console.log(`\x1b[40m`,`\x1b[32m`,
`
    [+] Server         : http://0.0.0.0:${port}
    [+] Storage Path   : ${storage}

    [~] Running Server...

`,`\x1b[0m`));
