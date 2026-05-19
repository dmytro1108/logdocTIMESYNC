//old code for running the server in node.js, switch to using python instead
//Should eventually be moved to a separate repository

//placement of constants for easier modifications
const filePath = "credentials.json"

//import file handler
import fs from 'fs';
//import websocketserver from ws (webserver)
import {WebSocketServer} from 'ws';
//import handler for Mariadb server
import ServerDB from './serverdb/ServerDB.ts';

const serverCrFile = fs.readFileSync(filePath, 'utf-8');





const serverDB = new ServerDB(serverCrFile);


serverDB.start();

//serverDB.close();








//create a websocket ws server at port 3050
const wss = new WebSocketServer({ port: 3050 });

//receive a connection to websocketserver
wss.on('connection', function connection(ws) {
	//receive a message from that commection
	ws.on('message', function message(data) {
		
		//replace this section with specification on what to do based on what was what was received.
		
		//print out the what was received to stdout. For testinng connection
		console.log('Server received: %s', data);
		//Send message back to test that message can be sent back to client
		ws.send(`Server received: ${data}`);
    });
});




