import React from 'react'
import ReactDOM from 'react-dom/client'
import Accounts from './components/Accounts'
import WebSocketLink from './components/WebSocketLink'

// imports for the tools
import { Mileage } from './components/Mileage'
import { Document } from './components/Document'
import { Dashboard} from './components/Dashboard'

import './assets/main.css';
import { createBoard, getBoardByID, getBoardsByUser, updateBoard, deleteBoard, changeTheme, currTheme} from './ipc'
import { retrieveAllMiles} from './ipc' 

//Constants for easier style prototyping
const COLUMN_TEXT_COLOR: string = "black";
const COLUMN_BUTTON_SIZE: string = "150%";
const COLUMN_FONT_SIZE: string = COLUMN_BUTTON_SIZE;
const BUTTON_FONT_SIZE: string = COLUMN_BUTTON_SIZE;

const USER_ID = 1

type MainViewProps = {
  board: Dashboard
  exportYear: number
  activeTool: "mileage" | "documents" | "notifications" | null
  theme: "brown" | "light"
}

type DisplayColProp = { // render board state with columns
  board: Dashboard
  debugMsg: string
  logLines: string[]
  logInState: string
  successMsg: string
  username: string
  email: string
  password: string
  demoBoardID: number
  theme: "brown" | "light"
  activeTool: "mileage" | "documents" | "notifications" | null
}

class MainView extends React.Component<MainViewProps, DisplayColProp> {
  board: Dashboard
  activeTool: "mileage" | "documents" | "notifications" | null
  theme: "brown" | "light"
  newLink: any
  myAccount: Accounts

  constructor(props: MainViewProps) {
    super(props)
    this.board = props.board
    this.activeTool = props.activeTool
    this.theme = props.theme

    this.state = {
      board: this.board,
      debugMsg: '',
      logLines: ['app shell ready'],
      logInState: '',
      successMsg: '',
      username: '',
      email: '',
      password: '',
      demoBoardID: -1,
      activeTool: null,
      theme: this.theme,
    }
    
    //create a single WebSocketLink object, since ideally the location of the server would never change.
    this.newLink = new WebSocketLink("192.168.1.60", "3050")
    //create an account object private information such as password can remain hidden
    this.myAccount = new Accounts("", "", "")
    
  }

  // theme setup on startup
  componentDidMount() {
    this.currentTheme()
  }

  export = async () => {
    const b = this.state.board
    if (!b) return
  
    const payload = {
      year: b.year,
      totalMiles: b.totalMiles,
      totalExpenses: b.totalExpenses,
      documentCount: b.documentCount,
      upcomingDeadlineCount: b.upcomingDeadlineCount
    }

    const result = await window.electron.ipcRenderer.invoke(
      'board:exportJsonToFile',
      JSON.stringify(payload, null, 2)
    )

    if (result.success) {
      this.setState({ debugMsg: "Properly exported file to disk" })
    } else if (result.canceled) {
      this.setState({ debugMsg: "Export to disk cancelled" })
    } else {
      this.setState({ debugMsg: `Error upon export to disk: ${result.error}` })
    }
  }

  login = () => {
    this.setState({
      board: this.state.board,
      logInState: "login",
      debugMsg: "logging in..."
    })
  }

  signUp = () => {
    this.setState({
      board: this.state.board,
      logInState: "signUp",
      debugMsg: "signing up..."
    })
  }

  sbmtCredentials = () => {
    if (this.state.logInState == "login") {
		this.myAccount.login(this.state.username, this.state.password, this);
    }
    else if (this.state.logInState == "signUp") {
		this.myAccount.signUp(this.state.username, this.state.email, this.state.password, this);
    }
  }
  
  // there's just one board
  dbBoard = async () => {
    const board = await createBoard('Sprint 1', 'First sprint board', USER_ID)// use your user id here
    this.setState({
      demoBoardID: board.id,
      debugMsg: "board=" + board.id
    })
  }

  cTheme = async () => {
    const nextTheme = this.state.theme === "brown" ? "light" : "brown"
    const nextThemeId = nextTheme === "brown" ? 1 : 2

    try {
      await changeTheme(nextThemeId, "", "", 1)
      this.setState({
        theme: nextTheme,
        debugMsg: `theme changed to ${nextTheme}`
      })
    } catch (error) {
      this.setState({
        debugMsg: `theme change failed: ${String(error)}`
      })
    }
  }

  currentTheme = async () => {
    const out = await currTheme()  
    const curr = out[0].name
  
    this.setState({
      theme: curr === "light" ? "light" : "brown",
      debugMsg: `loaded ${curr} theme`
    })
  }

  render() {

    const loginWindow = (
      <div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
          </div>
    
          <input type="text" placeholder="username" value={this.state.username}onChange={(e) => this.setState({ username: e.target.value })}/>
          <input type="password" placeholder="password" value={this.state.password} onChange={(e) => this.setState({ password: e.target.value })}/>
    
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" onClick={() => this.setState({ logInState: "", username: "", email: "", password: "", successMsg: "" })}>close</button>
            <button type="button" onClick={() => this.sbmtCredentials()}>enter</button>
          </div>
        </div>
      </div>
    )
    
    const signUpWindow = (
      <div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
          </div>
             
          <input type="text" placeholder="username" value={this.state.username}onChange={(e) => this.setState({ username: e.target.value })}/>
          <input type="text" placeholder="email" value={this.state.email} onChange={(e) => this.setState({ email: e.target.value })}/>
          <input type="password" placeholder="password" value={this.state.password} onChange={(e) => this.setState({ password: e.target.value })}/>
    
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" onClick={() => this.setState({ logInState: "", username: "", email: "", password: "", successMsg: "" })}>close</button>
            <button type="button" onClick={() => this.sbmtCredentials()}>enter</button>
          </div>
        </div>
      </div>
    )
    
   const loggedInWindow = (
      <div>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 10 }}>
          </div>
          <p style = {{ fontSize: BUTTON_FONT_SIZE}}>User:  {this.state.username} </p> 
          <p style = {{ fontSize: BUTTON_FONT_SIZE}}>Email: {this.state.email} </p> 
    
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" onClick={() => {this.setState({ logInState: "", username: "", email: "", password: "", successMsg: "" }); this.myAccount.clearaccount()}}>logout</button>
          </div>
        </div>
      </div>
    )
    
    
    return (
      <div className={`mainview theme-${this.state.theme}`}>
    
        <main className="mainPanel">

        <div style={{position: "fixed", top: "20px", left: "10px", gap: "10px"}}>
          <div className="left-sidebar-stuff">
            <button className="button" style={{marginBottom: "10px", width: "50px", height: "44px", padding: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", marginRight: "15px" }}><img draggable="false" style={{ width: "150%", height: "150%", objectFit: "cover", display: "block" }} src={this.state.theme === "brown" ? "/dark-layout-sidebar-icon.png" : "/light-layout-sidebar-icon.png"} /></button>
            <aside className="leftSidebar" style={{ marginLeft: "-15px" }}>{/* sidebar content */}

              <div>
                  <button style={{ marginBottom: "10px", marginRight: "10px", width: "90px", height: "44px", boxSizing: "border-box" }}className="button" fun-tip-and-more="❌ currently signed in" onClick={() => { this.login() }}>login</button>
                  <button style={{ marginBottom: "10px", marginRight: "10px", width: "90px", height: "44px", boxSizing: "border-box" }} className="button" fun-tip-and-more="☝️ choose your theme" onClick={() => { this.cTheme() }}>{this.state.theme === "brown" ? "light" : "brown"}</button>
                  <button style={{ marginBottom: "10px", marginRight: "10px", width: "90px", height: "44px", boxSizing: "border-box" }} className="button" fun-tip-and-more="➕ create a new account" onClick={() => { this.signUp() }}>sign up</button>
                  <button style={{ marginBottom: "10px", marginRight: "10px", width: "90px", height: "44px", boxSizing: "border-box" }} className="button" fun-tip-and-more="⬇ export your data for 2026" onClick={() => { this.export() }}>export</button>
              </div>

              <div>
                {this.state.logInState === "login" 
                  ? loginWindow 
                  : (this.state.logInState === "signUp" 
                      ? signUpWindow 
                      : (this.state.logInState === "loggedIn" ? loggedInWindow : null)
                    )}
              </div> 
              
              <div style={{ padding: "10px" }}>
                {this.state.debugMsg}
              </div>
            </aside>
          </div>

          <div className="left-sidebar-stuff">
            <button className="button" style={{marginBottom: "10px", width: "50px", height: "44px", padding: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", marginRight: "15px" }} >
            <img draggable="false" style={{ width: "150%", height: "150%", objectFit: "cover", display: "block" }} src={this.state.theme === "brown" ? "/dark-apps.png" : "/light-apps.png"}/></button>
            
            <aside className="leftSidebar" style={{ marginLeft: "-15px" }}>{/* sidebar content */}
              
            <button className="button typewriter" style={{marginBottom: "10px", overflow: "hidden",  width: "auto", height: "44px", padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-start", boxSizing: "border-box", marginRight: "15px" }} onClick={async () => {this.setState({ activeTool: "mileage", debugMsg: "mileage tool opened" });}}>
              <img draggable="false" style={{ width: "30px", height: "30px", objectFit: "contain"}} src={this.state.theme === "brown" ? "/dark-road.png" : "/light-road.png"} alt="Mileage Tracker"/><span className="typewriter-text" style={{ marginLeft: "10px", marginRight: "10px" }}>mileage tool</span></button>
            <button className="button typewriter" style={{marginBottom: "10px", overflow: "hidden", width: "auto", height: "44px", padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-start", boxSizing: "border-box", marginRight: "15px" }} onClick={async () => {this.setState({ activeTool: "documents", debugMsg: "documents tool opened" });}}>
              <img draggable="false" style={{ width: "30px", height: "30px", objectFit: "contain"}}  src={this.state.theme === "brown" ? "/dark-doc.png" : "/light-doc.png"}/><span className="typewriter-text" style={{ marginLeft: "10px", marginRight: "10px" }}>document tool</span></button>
            <button className="button typewriter" style={{overflow: "hidden", width: "auto", height: "44px", padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-start", boxSizing: "border-box", marginRight: "15px" }} onClick={async () => {const logs = await retrieveAllMiles(); this.setState({ debugMsg: `loaded ${logs.length} mileage logs` })}}>
              <img draggable="false" style={{ width: "30px", height: "30px", objectFit: "contain"}} src={this.state.theme === "brown" ? "/dark-mark.png" : "/light-mark.png"} /><span className="typewriter-text" style={{ marginLeft: "10px", marginRight: "10px" }}>coming soon...</span></button>
            </aside>
          </div>
            
        </div>

        <div style={{ position: "fixed", bottom: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 100 }}>
          <div className="left-sidebar-stuff">
            <button className="button" style={{ marginBottom: "10px", width: "50px", height: "44px", padding: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", marginRight: "15px" }}>
            <img draggable="false" style={{ width: "150%", height: "150%", objectFit: "cover", display: "block" }} src={this.state.theme === "brown" ? "/dark-set.png" : "/light-set.png"} /></button>
            

            <aside className="leftBottomCorner" style={{ marginLeft: "-15px" }}>{/* sidebar content */}
            
            <button className="button typewriter" style={{marginBottom: "10px",overflow: "hidden", width: "auto", height: "44px", padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-start", boxSizing: "border-box", marginRight: "15px" }}>
              <img draggable="false" style={{ width: "30px", height: "30px", objectFit: "contain"}} src={this.state.theme === "brown" ? "/dark-cons.png" : "/light-cons.png"} /><span className="typewriter-text" style={{ marginLeft: "10px", marginRight: "10px" }}>developer view</span></button>
            <button className="button typewriter" style={{overflow: "hidden", width: "auto", height: "44px", padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-start", boxSizing: "border-box", marginRight: "15px" }}>
              <img draggable="false" style={{ width: "30px", height: "30px", objectFit: "contain"}} src={this.state.theme === "brown" ? "/dark-mark.png" : "/light-mark.png"} /><span className="typewriter-text" style={{ marginLeft: "10px", marginRight: "10px" }}>Coming soon...</span></button>
            
            </aside>
          </div>
        </div>

          <section>
            <div>{/* the dashboard view changes between the active tooling  */}
              {this.state.activeTool === null ? ( <Dashboard year={"1991"} /> ) : null}
              {this.state.activeTool === "mileage" ? (<Mileage onClose={() => this.setState({ activeTool: null, debugMsg: "mileage tool closed" })} />) : null}
              {this.state.activeTool === "documents" ? (<Document onClose={() => this.setState({ activeTool: null , debugMsg: "doc tool closed"})} />) : null}
            </div>
          </section>
        </main>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>
    <MainView board = {new Dashboard("")} />
    </div>
  </React.StrictMode>
)
