jQuery(document).ready(function($) {
    const socket = io('/lp', {
        transports: ['websocket'],
        upgrade: false
    });
    $(window).on('unload', function() {
        socket.close();
    });
    var cardsWrapper = $('#cards_wrapper');
    var tableItems = $('#table_body');
    var messageItem = $('#message');
    var nameItem = $('#name');
    var changeName = $("#change_name");
    var discussItem = $('#discuss');
    var nameMarker = $('#name_marker');
    var storeNameKey = 'lp_name';
    var storeName = localStorage.getItem(storeNameKey);
    var dialogName = document.getElementById('name_dialog');
    var dialogError = document.getElementById('error_dialog');
    var dialogStart = document.getElementById('start_dialog');
    var discuss = false;
    nameItem.val(storeName);
    nameMarker.text(storeName);
    dialogPolyfill.registerDialog(dialogName);
    dialogPolyfill.registerDialog(dialogError);
    dialogPolyfill.registerDialog(dialogStart);
    dialogStart.showModal();
    messageItem.on('blur', function() {
        socket.emit('message', { text: $(this).val(), name: storeName});
    });
    changeName.on('click', function() {
        dialogName.showModal();
    });
    discussItem.on('click', function() {
        if ($(this).text() === 'Start discussion') {
            socket.emit('discuss', room, true);
        }
        else {
            socket.emit('clear', room);
        }
    });
    nameItem.on('blur', function() {
        const val = $(this).val();
        if (val) {
            localStorage.setItem(storeNameKey, val);
            storeName = val;
            nameMarker.text(val);
            dialogName.close();
        }
    });
    socket.on('connect', function(){
        dialogStart.close();
        if (!storeName) {
            dialogName.showModal();
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
        var ownId = socket.id;
        cardsWrapper.empty();
        Object.keys(data.topics).forEach(topic => {
            action = data.rooms.includes(topic) ? 'remove' : 'add';
            const el = $('<button></button>')
                .addClass('mdl-button mdl-card-pocker-card mdl-shadow--2dp mdl-cell mdl-cell--1-col')
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
            cardsWrapper.append(el);
        });
        if (data.hasOwnProperty('announcements')) {
            // handle announcement + announcement event
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
        tableItems.append(tr);
    });
    function timeConverter(timestamp){
        var a = new Date(timestamp);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
        return time;
      }
});
