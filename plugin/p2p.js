/* P2P Netention network */

exports.plugin = function($N) {
    //https://github.com/marcelklehr/smokesignal

    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {

            var p2p = require('smokesignal');
            options.address = p2p.localIp(options.address);
            
            var node = p2p.createNode(options);
            this.node = node;
            
            // listen on network events...
            console.log('IP', node.options.address, 'ID', node.id)

            node.on('connect', function() {
              // Hey, now we have at least one peer!
              console.log(node.id, 'CONNECTED', node.peers.list.length);
              
              // ...and broadcast stuff -- this is an ordinary duplex stream!
              //node.broadcast.write('a');
            })

            node.on('disconnect', function() {
              console.log('disconnected');
            })
            
            node.on('new peer', function(p) { console.log('new peer', p.id); } );

            // Broadcast is a stream
            process.stdin.pipe(node.broadcast).pipe(process.stdout)

            console.log('starting');
            node.start()

        },
        
        stop: function() {
            console.log('stopping');
            this.node.stop();
        }
    };
};
