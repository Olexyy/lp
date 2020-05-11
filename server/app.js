class App {

    constructor(io) {
        this.messages = [];
        this.announcements = [];
        this.topics = {
            culture: 'culture',
            medicine: 'medicine',
            business: 'business',
        };
        this.namespace = '/lp';
        this.io = io;
        this.sockets = this.io.of(this.namespace);
    }

    bind() {
        this.sockets.on('connect', socket => {
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
                this.sockets.to(socket.id).emit('status', {
                    topics: this.topics,
                    rooms: this.getRooms(socket.id),
                });
                console.log('socket status');
            });
            // May be array.
            socket.on('join', rooms => {
                socket.join(rooms, e => {
                    console.log('joining: ' + rooms);
                    this.sockets.to(socket.id).emit('status', {
                        topics: this.topics,
                        rooms: this.getRooms(socket.id),
                        announcements: this.getAnnouncements(socket.id),
                    });
                    console.log('socket join complete');
                });
            });
            socket.on('leave',  room => {
                socket.leave(room);
                this.sockets.to(socket.id).emit('status', {
                    topics: this.topics,
                    rooms: this.getRooms(socket.id),
                    announcements: this.getAnnouncements(socket.id)
                });
                console.log('socket leave');
            });
            socket.on('announcement', (mes) => {
                const message = this.parseMessage(mes, socket.id);
                const delivery = this.getDelivery(message, socket.id);
                this.addAnnouncement(message);
                delivery.emit('announcement', message);
            });
            socket.on('message', (mes) => {
                const message = this.parseMessage(mes, socket.id);
                const delivery = this.getDelivery(message, socket.id);
                this.addMessage(message);
                delivery.emit('message', message);
            });
        });

        return this;
    }
    
    getRooms(id) {
        let userRooms = Object.keys(this.sockets.adapter.sids[id]);
        userRooms.shift();
        return userRooms;
    }

    getDelivery(mes, id) {
        const userRooms = this.getRooms(id);
        let delivery = this.sockets.to(id);
        this.sockets.to(id);
        userRooms.forEach(room => {
            delivery = delivery.to(room);
            mes.topics[room] = room;
        });
        return delivery;
    }

    parseMessage(mes, id) {
        return {
            text: mes.text,
            name: mes.name,
            author: id,
            time: new Date().getTime(),
            topics: mes.topics || [],
        };
    }

    addAnnouncement(announcement) {
        this.announcements.unshift(announcement);
    }

    addMessage(message) {
        this.messages.unshift(message);
    }

    getAnnouncements(id) {
        const userRooms = this.getRooms(id);
        let announcements = [];
        this.announcements.forEach(item => {
            let include = userRooms.filter(value => item.topics.includes(value));
            if (include.length) {
                announcements.push(item);
            }
        });
        return announcements;
    }
}

module.exports = App;
