jQuery(document).ready(function($) {
    const socket = io('/lp', {
        transports: ['websocket'],
        upgrade: false
    });
    $(window).on('unload', function() {
        socket.close();
    });
    var topicsWrapper = $('#topics_wrapper');
    var tableMessageItems = $('#table_messages_body');
    var tableAnnouncementItems = $('#table_announcements_body');
    var messageItem = $('#message');
    var announcementItem = $('#announcement');
    var nameItem = $('#name');
    var changeName = $("#change_name");
    var nameMarker = $('#name_marker');
    var storeKey = 'lp';
    var storeObject = localStorage.getItem(storeKey);
    storeObject = storeObject ? JSON.parse(storeObject) : {name:'', topics:[]};
    var dialogName = document.getElementById('name_dialog');
    var dialogError = document.getElementById('error_dialog');
    var dialogStart = document.getElementById('start_dialog');
    nameItem.val(storeObject.name);
    nameMarker.text(storeObject.name);
    dialogPolyfill.registerDialog(dialogName);
    dialogPolyfill.registerDialog(dialogError);
    dialogPolyfill.registerDialog(dialogStart);
    dialogStart.showModal();
    messageItem.on('blur keypress', function(e) {
        if (e.type !== 'keypress' || e.keyCode === 13) {
            const $this = $(this);
            let val = $this.val();
            if (val) {
                socket.emit('message', {
                    text: $(this).val(),
                    name: storeObject.name,
                    topics: lastSync.rooms,
                });
                $this.val('').trigger('change');
            }
        }
    });
    announcementItem.on('blur keypress', function(e) {
        if (e.type !== 'keypress' || e.keyCode === 13) {
            const $this = $(this);
            let val = $this.val();
            if (val) {
                socket.emit('announcement', {
                    text: $(this).val(),
                    name: storeObject.name,
                    topics: lastSync.rooms,
                });
                $this.val('').trigger('change');
            }
        }
    });
    changeName.on('click', function() {
        dialogName.showModal();
    });
    nameItem.on('blur keypress', function(e) {
        if (e.type !== 'keypress' || e.keyCode === 13) {
            const $this = $(this);
            const val = $(this).val();
            if (val) {
                storeObject.name = val;
                localStorage.setItem(storeKey, JSON.stringify(storeObject));
                nameMarker.text(val);
                dialogName.close();
                socket.emit('status');
                $this.val('').trigger('change');
            }
        }
    });
    socket.on('connect', function(){
        dialogStart.close();
        if (!storeObject.name) {
            dialogName.showModal();
        }
        else if (storeObject.topics.length) {
            socket.emit('join', storeObject.topics);
        }
        else {
            socket.emit('status');
        }
    });
    socket.on('error', function() {
        dialogError.showModal();
    });
    socket.on('disconnect', function() {
        dialogError.showModal();
    });
    socket.on('status', function(data) {
        storeObject.topics = data.rooms;
        localStorage.setItem(storeKey, JSON.stringify(storeObject));
        topicsWrapper.empty();
        Object.keys(data.topics).forEach(topic => {
            action = data.rooms.includes(topic) ? 'remove' : 'add';
            const el = $('<button></button>')
                .addClass('mdl-button mdl-card-pocker-card mdl-shadow--2dp mdl-cell mdl-cell--2-col')
                .text(topic).data('action', action).data('target', topic);
            if (action == 'remove') {
                el.addClass('mdl-button--colored');
            }
            el.on('click', function() {
                const $this = $(this);
                if ($this.data('action') === 'add') {
                    socket.emit('join', $this.data('target'));
                } else {
                    socket.emit('leave', $this.data('target'));
                }
            });
            topicsWrapper.append(el);
        });
        // If we recieve announcements in status, fill out them.
        if (data.hasOwnProperty('announcements')) {
            tableAnnouncementItems.empty();
            data.announcements.reverse().forEach(item => {
                const tr =  $("<tr></tr>");
                tr.append(
                    $('<td></td>').addClass('width-fixed-50').text(timeConverter(item.time))
                );
                tr.append(
                    $('<td></td>').addClass('width-fixed-50').text(item.name)
                );
                tr.append(
                    $('<td></td>').addClass('width-minus-100').html(item.text)
                );
                tableAnnouncementItems.append(tr);
            });
        }
    });
    socket.on('message', function(message) {
        const tr =  $("<tr></tr>");
        tr.append(
            $('<td></td>').addClass('width-fixed-50').text(timeConverter(message.time))
        );
        tr.append(
            $('<td></td>').addClass('width-fixed-50').text(message.name)
        );
        tr.append(
            $('<td></td>').addClass('width-minus-100').html(message.text)
        );
        tableMessageItems.append(tr);
    });
    socket.on('announcement', function(message) {
        const tr =  $("<tr></tr>");
        tr.append(
            $('<td></td>').addClass('width-fixed-50').text(timeConverter(message.time))
        );
        tr.append(
            $('<td></td>').addClass('width-fixed-50').text(message.name)
        );
        tr.append(
            $('<td></td>').addClass('width-minus-100').html(message.text)
        );
        tableAnnouncementItems.append(tr);
    });
    function timeConverter(timestamp){
        var a = new Date(timestamp);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var year = a.getFullYear();
        var month = a.getMonth(); //months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
        return time;
    }
    function liveness() {
        setTimeout(() =>{
            socket.emit('liveness');
            liveness();
        }, 30000);
    }
    liveness();
});
