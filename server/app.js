const express    = require('express');
const path       = require('path');
const port       = process.env.PORT || 3000;
const app        = express();
const fs         = require('fs');
var http         = require('http').createServer(app);
const storage    = path.join(__dirname, "..", 'storage');

/**
 * WebSocket Configuration
 */
var io = require('socket.io')(http, {});

/**
* Pocker backend implementation.
*/
const lpNs = '/lp';
const lp = io.of(lpNs);
const lpApp = {
    messages: [],
    announcements: [],
    topics: {
        culture: 'culture',
        medicine: 'medicine',
        business: 'business',
    }
};
lp.on('connect', function(socket) {
    console.log('socket connected');
    socket.on('error', e => {
        console.log('socket error');
    });
    socket.on('disconnect', () => {
        console.log('socket disconnect');
    });
    socket.on('liveness', () => {
        console.log('socket is live');
    });
    socket.on('status', () => {
        const userRooms = Object.keys(lp.adapter.sids[socket.id]);
        userRooms.shift();
        lp.to(socket.id).emit('status', {
            topics: lpApp.topics,
            rooms: userRooms,
        });
        console.log('socket status');
    });
    // May be array.
    socket.on('join', rooms => {
        socket.join(rooms, function(e) {
            console.log('joining: ' + rooms);
            const userRooms = Object.keys(lp.adapter.sids[socket.id]);
            userRooms.shift();
            let announcements = [];
            // Todo implenet skip / take functions.
            lpApp.announcements.forEach(item => {
                let include = userRooms.filter(value => item.topics.includes(value));
                if (include.length) {
                    announcements.push(item);
                }
            });
            console.log(announcements);
            lp.to(socket.id).emit('status', {
                topics: lpApp.topics,
                rooms: userRooms,
                announcements: announcements
            });
            console.log('socket join complete');
        });
    });
    socket.on('leave',  room => {
        socket.leave(room);
        const userRooms = Object.keys(lp.adapter.sids[socket.id]);
        userRooms.shift();
        let announcements = [];
        // Todo implenet skip / take functions.
        lpApp.announcements.forEach(item => {
            let include = userRooms.filter(value => item.topics.includes(value));
            if (include.length) {
                announcements.push(item);
            }
        });
        console.log(announcements);
        lp.to(socket.id).emit('status', {
            topics: lpApp.topics,
            rooms: userRooms,
            announcements: announcements
        });
        console.log('socket leave');
    });
    socket.on('announcement', (mes) => {
        message = {
            text: mes.text,
            name: mes.name,
            author: socket.id,
            time: new Date().getTime(),
            topics: mes.topics || [],
        };
        const userRooms = Object.keys(lp.adapter.sids[socket.id]);
        userRooms.shift();
        console.log(userRooms);
        let delivery = lp.to(socket.id);
        userRooms.forEach(room => {
            delivery = delivery.to(room);
            message.topics[room] = room;
        });
        lpApp.announcements.unshift(message);
        delivery.emit('announcement', message);
    });
    socket.on('message', (mes) => {
        message = {
            text: mes.text,
            name: mes.name,
            author: socket.id,
            time: new Date().getTime(),
            topics: mes.topics || [],
        };
        const userRooms = Object.keys(lp.adapter.sids[socket.id]);
        userRooms.shift();
        console.log(userRooms);
        let delivery = lp.to(socket.id);
        userRooms.forEach(room => {
            delivery = delivery.to(room);
            message.topics[room] = room;
        });
        lpApp.messages.unshift(message);
        delivery.emit('message', message);
    });
});
/**
 *   Storage
 */
app.use(express.static(path.join(storage)));

app.get('/', function (req, res) {
    res.sendFile(path.join(storage, `index.html`));
});

app.get('/:file', function (req, res) {
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
