jQuery(document).ready(($) => {
  AdapterJS.webRTCReady(isUsingPlugin => {
    getUserMedia({ video: true, audio: true },
      stream => {
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
          attachMediaStream(localVideo, stream);
        }
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      },
      error => {
        console.warn(error.message);
      }
    );

    peerConnection = new RTCPeerConnection();
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
        if (socketId == socket.id) {
          usernameEl.innerHTML = `Socket (you): ${socketId}`;
        }
        else {
          usernameEl.innerHTML = `Socket: ${socketId}`;
          userContainerEl.addEventListener("click", () => {
            //unselectUsersFromList();
            userContainerEl.setAttribute("class", "active-user active-user--selected");
            const talkingWithInfo = document.getElementById("talking-with-info");
            talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
            callUser(socketId);
          });
        }
        userContainerEl.appendChild(usernameEl); 
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

    function liveness() {
      setTimeout(() =>{
          socket.emit('liveness');
          liveness();
      }, 30000);
    }
    liveness();
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
  });
});