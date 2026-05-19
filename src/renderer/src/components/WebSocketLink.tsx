//Brings in websocket from node.js
//import WebSocket from 'ws';

//const WebSocket = require('ws');

export default class WebSocketLink {
	
	ipAddress: string
  	port: string
	socket: any

	//contruct with the ipaddress and port, which should not change during run
	constructor(ipAddress: string, port) {
		this.ipAddress = ipAddress;
		this.port = port;
	}
	
	//create a new connection to websocket
	createConnnection(message: string, callback, app) {
		
		//create socket
		this.socket = new WebSocket("ws://" + this.ipAddress + ":" + this.port);
		
		//send message
		this.settupWebSocket(message, callback, app);
		
	}
	
	//code for setting up websocket and waiting for response
	settupWebSocket(message: string, callback, app) {
		
		//settup event to send message once the websocket has open
		this.socket.addEventListener("open", () => {
			this.socket.send(message);
			//this.socket.close();
		});
		
		//console.log("test");
		
		//settup event to instructions once event is received
		this.socket.addEventListener("message", (e) => {
		//call specific function to deal with response from server 
		callback(e.data, app);
		//close socket
		this.socket.close();
		});
		
	}
	
	//events to run when sennding a message
	sendMessage (message: string, callback, app) { 
		
		this.createConnnection(message, callback, app);
		
	}
	
		
}

