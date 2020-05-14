const Express    = require('express');
const path       = require('path');
const port       = process.env.PORT || 3000;
const express    = Express();
const http         = require('http').createServer(express);
const storage    = path.join(__dirname, "..", 'storage');
const App        = require('./app.js');
const Video      = require('./video.js');

/**
 * WebSocket Configuration
 */
const io = require('socket.io')(http, { 'perMessageDeflate': false });
/**
* App backend socket.io implementation.
*/
new App(io).bind();
new Video(io).bind();
/**
 * Storage.
 */
express.use(Express.static(path.join(storage)));
/**
 * Single app.
 */
express.get('/', (req, res) => {
    res.sendFile(path.join(storage, `index.html`));
});
express.get('/embed', (req, res) => {
    res.sendFile(path.join(storage, `embed.html`));
});
express.get('/video', (req, res) => {
    res.sendFile(path.join(storage, `video.html`));
});
/**
 * Start server.
 */
http.listen(port, () => console.log(`\x1b[40m`,`\x1b[32m`,
`
    [+] Server         : http://0.0.0.0:${port}
    [+] Storage Path   : ${storage}

    [~] Running Server...

`,`\x1b[0m`));
