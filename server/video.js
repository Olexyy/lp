class Video {

    constructor(io) {
        this.namespace = '/video';
        this.io = io;
        this.sockets = this.io.of(this.namespace);
        this.socketList = {};
    }

    bind() {
        this.sockets.on('connect', socket => {
            console.log('socket connected');
            socket.on('error', e => {
                delete(this.socketList[socket.id]);
                console.log('socket error');
                this.sockets.emit('status', {
                    list: this.socketList,
                });
            });
            socket.on('disconnect', () => {
                delete(this.socketList[socket.id]);
                console.log('socket disconnect');
                this.sockets.emit('status', {
                    list: this.socketList,
                });
            });
            socket.on('liveness', () => {
                console.log('socket is live');
            });
            socket.on('join', () => {
                this.socketList[socket.id] = { id: socket.id };
                this.sockets.emit('status', {
                    list: this.socketList,
                });
            });
            socket.on('leave',  room => {
                delete(this.socketList[socket.id]);
                console.log('socket disconnect');
                this.sockets.emit('status', {
                    list: this.socketList,
                });
            });
            socket.on("offer", data => {
                socket.to(data.to).emit("offer", {
                  offer: data.offer,
                  socket: socket.id
                });
            });
            socket.on("answer", data => {
                socket.to(data.to).emit("answer", {
                  socket: socket.id,
                  answer: data.answer
                });
            });
        });

        return this;
    }
}

module.exports = Video;