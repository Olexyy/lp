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
    var storeName = localStorage.getItem('pocker_name');
    var dialogName = document.getElementById('name_dialog');
    var dialogError = document.getElementById('error_dialog');
    var dialogStart = document.getElementById('start_dialog');
    var discuss = false;
    nameItem.val(storeName);
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
        if ($(this).val()) {
            localStorage.setItem('pocker_name', $(this).val());
            socket.emit('update', room, 'name', $(this).val());
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
        discuss = data.discuss;
        tableItems.empty();
        var ownId = socket.id;
        var anyUnvoted = false;
        cardsWrapper.empty();
        Object.keys(data.topics).forEach(topic => {
            action = data.rooms.includes(topic) ? 'remove' : 'add';
            const el = $('<button></button>')
                .addClass('mdl-button mdl-card-pocker-card mdl-shadow--2dp mdl-cell mdl-cell--1-col')
                .text(topic).data('action', action).data('target', topic);
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
        var cards = $('.mdl-card-pocker-card');
        cards.prop('disabled', false);
        if (data.players[ownId].vote !== '') {
            cards.each(function(){
                if ($(this).data('value') === data.players[ownId].vote) {
                    $(this).prop('disabled', true);
                }
            });
        }
        // If discuss we need to show statistics if everybody voted.
        if (discuss) {
            // Negotiate any unvoted if in discuss
            Object.keys(data.players).forEach(function(id) {
                if(data.players[id].vote == '') {
                    anyUnvoted = true;
                }          
            });
        }
    });
    socket.on('message', function(message) {
        const tr =  $("<tr></tr>");
        tr.append(
            $('<td></td>').addClass('width-fixed-50').text(message.time)
        );
        tr.append(
            $('<td></td>').addClass('width-fixed-50').text(message.name)
        )
        tr.append(
            $('<td></td>').addClass('width-minus-100').html(message.text)
        )
        tableItems.append(tr);
    });
});
