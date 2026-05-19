//old code for running the server in node.js, switch to using python instead
//class for connecting to Mariadb server, sending command, and receivng results from the Mariadb server.

//import connector for mariadb
import * as mariadb from 'mariadb';

export default class ServerDB {
    
	serverCr;
	conn : mariadb.Connection;
	
	
	 constructor(serverCrFile) {
		 this.serverCr = JSON.parse(serverCrFile);
    }
    
    public async start() {
		try{
			this.conn = await mariadb.createConnection({
				host: this.serverCr.host,
				port: this.serverCr.port,
				user: this.serverCr.username,
				password: this.serverCr.password,
				database: this.serverCr.database
			});
			
			console.log(`Connected! (id=${this.conn.threadId})`);
			
			
			
			await this.conn.close();
			await this.conn.close();
			console.log(`Connected! (id=${this.conn.threadId})`);
			
		} catch (e) {
			//console.log(e);
		}
	}
    
    
    
    
    
    public async close() {
		console.log(`Connected!`);
		//await this.conn.end();		
	}
	
	
	
	
	public test() {
		
		return this.serverCr.username;
		
		
	}


}



