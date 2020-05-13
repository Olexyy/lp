jQuery(document).ready(function($) {
    const { RTCPeerConnection, RTCSessionDescription } = window;
    peerConnection = new RTCPeerConnection();
    navigator.getUserMedia(
        { video: true, audio: true },
        stream => {
          const localVideo = document.getElementById("local-video");
          if (localVideo) {
            localVideo.srcObject = stream;
          }
          stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        },
        error => {
          console.warn(error.message);
        }
    );
    peerConnection.ontrack = function({ streams: [stream] }) {
        const remoteVideo = document.getElementById("remote-video");
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
        }
    };
    const socket = io('/video', {
        transports: ['websocket'],
        upgrade: false
    });
    $(window).on('unload', function() {
        socket.close();
    });
    socket.on('connect', function(){
        socket.emit('join');
    });
    socket.on('error', function(e) {
        console.error(e);
    });
    socket.on('disconnect', function() {
        console.error('Socket disconnected');
    });
    socket.on('status', function(data) {
        
        updateUserList(Object.keys(data.list));

        // storeObject.topics = data.rooms;
        // localStorage.setItem(storeKey, JSON.stringify(storeObject));
        // topicsWrapper.empty();
        // Object.keys(data.topics).forEach(topic => {
        //     action = data.rooms.includes(topic) ? 'remove' : 'add';
        //     const el = $('<button></button>')
        //         .addClass('mdl-button mdl-card-pocker-card mdl-shadow--2dp mdl-cell mdl-cell--2-col')
        //         .text(topic).data('action', action).data('target', topic);
        //     if (action == 'remove') {
        //         el.addClass('mdl-button--colored');
        //     }
        //     el.on('click', function() {
        //         const $this = $(this);
        //         if ($this.data('action') === 'add') {
        //             socket.emit('join', $this.data('target'));
        //         } else {
        //             socket.emit('leave', $this.data('target'));
        //         }
        //     });
        //     topicsWrapper.append(el);
        // });
        // // If we recieve announcements in status, fill out them.
        // if (data.hasOwnProperty('announcements')) {
        //     tableAnnouncementItems.empty();
        //     data.announcements.forEach(item => {
        //         const tr =  $("<tr></tr>");
        //         tr.append(
        //             $('<td></td>').addClass('width-fixed-50').text(timeConverter(item.time))
        //         );
        //         tr.append(
        //             $('<td></td>').addClass('width-fixed-50').text(item.name)
        //         );
        //         tr.append(
        //             $('<td></td>').addClass('width-minus-100').html(item.text)
        //         );
        //         tableAnnouncementItems.append(tr);
        //     });
        //}
    });
    function updateUserList(socketIds) {
        const activeUserContainer = $("#active-user-container");
        activeUserContainer.empty();
        socketIds.forEach(socketId => {
            const userContainerEl = createUserItemContainer(socketId);
            activeUserContainer.append(userContainerEl);
        });
    }
    function createUserItemContainer(socketId) {
        const userContainerEl = document.createElement("div");
        const usernameEl = document.createElement("p");
        userContainerEl.setAttribute("class", "active-user");
        userContainerEl.setAttribute("id", socketId);
        usernameEl.setAttribute("class", "username");
        usernameEl.innerHTML = `Socket: ${socketId}`;
        userContainerEl.appendChild(usernameEl);
        userContainerEl.addEventListener("click", () => {
          //unselectUsersFromList();
          userContainerEl.setAttribute("class", "active-user active-user--selected");
          const talkingWithInfo = document.getElementById("talking-with-info");
          talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
          callUser(socketId);
        }); 
        return userContainerEl;
    }
    
    async function callUser(socketId) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
        socket.emit("offer", {
          offer,
          to: socketId
        });
    }

    socket.on("offer", async data => {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        
        socket.emit("answer", {
          answer,
          to: data.socket
        });
    });
    let isAlreadyCalling = false;
    socket.on("answer", async data => {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        if (!isAlreadyCalling) {
          callUser(data.socket);
          isAlreadyCalling = true;
        }
       });

    // socket.on('message', function(message) {
    //     const tr =  $("<tr></tr>");
    //     tr.append(
    //         $('<td></td>').addClass('width-fixed-50').text(timeConverter(message.time))
    //     );
    //     tr.append(
    //         $('<td></td>').addClass('width-fixed-50').text(message.name)
    //     );
    //     tr.append(
    //         $('<td></td>').addClass('width-minus-100').html(message.text)
    //     );
    //     tableMessageItems.append(tr);
    // });
    // socket.on('announcement', function(message) {
    //     const tr =  $("<tr></tr>");
    //     tr.append(
    //         $('<td></td>').addClass('width-fixed-50').text(timeConverter(message.time))
    //     );
    //     tr.append(
    //         $('<td></td>').addClass('width-fixed-50').text(message.name)
    //     );
    //     tr.append(
    //         $('<td></td>').addClass('width-minus-100').html(message.text)
    //     );
    //     tableAnnouncementItems.append(tr);
    // });
    // function timeConverter(timestamp){
    //     var a = new Date(timestamp);
    //     var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    //     var year = a.getFullYear();
    //     var month = a.getMonth(); //months[a.getMonth()];
    //     var date = a.getDate();
    //     var hour = a.getHours();
    //     var min = a.getMinutes();
    //     var sec = a.getSeconds();
    //     if (sec <= 9) sec = `0${sec}`;
    //     if (min <= 9) min = `0${min}`;
    //     if (hour <= 9) hour = `0${hour}`;
    //     var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
    //     return time;
    // }
    function liveness() {
        setTimeout(() =>{
            socket.emit('liveness');
            liveness();
        }, 30000);
    }
    liveness();
});