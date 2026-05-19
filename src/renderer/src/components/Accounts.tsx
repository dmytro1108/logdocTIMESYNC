// import WebSocketLink from './components/WebSocketLink'
import { login, signup } from '../ipc'

export default class Accounts {
	
  	userName: string
  	email: string
  	password: string
    // kept for backwards compat but not used directly
    username: string

	constructor(userName: string, email: string, password: string) {
		this.userName = userName;
        this.username = userName;
		this.email = email
		this.password = password;
	}
	
	getuser(): string{
		return this.username;
	}
	
	getemail(): string{
		return this.email;
	}
	
	clearaccount(): void {
		this.username = "";
		this.email = "";
		this.password = "";
	}
	
	
	async login(username: string, password: string, app): Promise<void> {
		this.username = username;
		this.password = password;		
		
        // WebSocket call commented out for local demo
        // app.newLink.sendMessage(JSON.stringify({ "command":"login", "code": { "username": username, "password": password}}), this.postLogin, app);

        // Replaced with IPC to local accounts DB
        const result = await login(username, password)
        this.postLogin(JSON.stringify(result), app)
	}
	
	postLogin(command, app): void{
		const response = JSON.parse(command);
		
		if (response.response == 0) {
			app.myAccount.email = response.email;
			app.setState({ 
				debugMsg: "Successfully logged in",
				logInState: "loggedIn",
				email: app.myAccount.email,
				password: ""
				})
	
		}
		else if (response.response == 1) {
			app.myAccount.clearaccount();
			app.setState({ 
				debugMsg: "Entered password does not match for entered username" 
				})
			
		}
		else if (response.response == 2) {
			app.myAccount.clearaccount();
			app.setState({ 
				debugMsg: "Entered username does not exist" 
				})
			
		}
		else if (response.response == 10) {
			app.myAccount.clearaccount();
			app.setState({ 
				debugMsg: "MariaDB down, please try again at a later time" 
				})
		}
	}
	
	async signUp(username: string, email: string, password: string, app): Promise<void>{
		this.username = username;
		this.email = email
		this.password = password;		
		
        // WebSocket call commented out for local demo
        // app.newLink.sendMessage(JSON.stringify({ "command":"create_account", "code": { "username": username, "email": email, "password": password}}), this.postSignUp, app);

        // Replaced with IPC to local accounts DB
        const result = await signup(username, email, password)
        this.postSignUp(JSON.stringify(result), app)
	}
	
	postSignUp(command, app): void{
		
		const response = JSON.parse(command);
		
		if (response.response == 0) {
			app.setState({ 
				debugMsg: "Successfully signed up",
				logInState: "loggedIn",
				password: ""
				})
	
		}
		else if (response.response == 1) {
			app.myAccount.clearaccount();
			app.setState({ 
				debugMsg: "Username is already taken" 
				})
		}
	}

}
