import React from 'react'
import ReactDOM from 'react-dom/client'
import Accounts from './components/Accounts'
import WebSocketLink from './components/WebSocketLink'

// imports for the tools
import { Mileage } from './components/Mileage'
import { Document } from './components/Document'

import Board from './components/Dashboard'

import './assets/main.css';
import { createBoard, getBoardByID, getBoardsByUser, updateBoard, deleteBoard } from './ipc'
import { retrieveAllMiles} from './ipc' 

//Constants for easier style prototyping
const COLUMN_TEXT_COLOR: string = "black";
const COLUMN_BUTTON_SIZE: string = "150%";
const COLUMN_FONT_SIZE: string = COLUMN_BUTTON_SIZE;
const BUTTON_FONT_SIZE: string = COLUMN_BUTTON_SIZE;

const USER_ID = 1

type MainViewProps = {
  board: Board
  exportYear: number
  activeTool: "mileage" | "documents" | "notifications" | null
  theme: "dark" | "light"
}

type DisplayColProp = { // render board state with columns
  board: Board
  boardList: Board[]
  debugMsg: string
  logInState: string
  successMsg: string
  username: string
  email: string
  password: string
  demoBoardID: number
  theme: "dark" | "light"
  activeTool: "mileage" | "documents" | "notifications" | null
}

class MainView extends React.Component<MainViewProps, DisplayColProp> {
  board: Board
  activeTool: "mileage" | "documents" | "notifications" | null
  theme: "dark" | "light"
  newLink: any
  myAccount: Accounts

  constructor(props: MainViewProps) {
    super(props)
    this.board = props.board
    this.activeTool = props.activeTool
    this.theme = props.theme

    this.state = {
      board: this.board,
      boardList: [],
      debugMsg: '',
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
      boardList: this.state.boardList,
      logInState: "login",
      debugMsg: "logging in..."
    })
  }

  signUp = () => {
    this.setState({
      board: this.state.board,
      boardList: this.state.boardList,
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
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
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
      <div className="mainview">
        <aside className="leftSidebar">
          <div className="sidebarHeader">
            <div className="welcomeText">
              Welcome {this.state.successMsg}
            </div>
          </div>

          <div className="accountActions">
            <button onClick={() => {this.login()}}>login</button>
            <button onClick={() => {this.signUp()}}>sign up</button>
            <button onClick={() => {this.export()}}>export</button>
          </div>

          <div className="cardBlock">
            {this.state.logInState == "login" ? loginWindow : (this.state.logInState == "signUp" ? signUpWindow : (this.state.logInState == "loggedIn" ? loggedInWindow : null)) }
          </div>

          <div className="sidebarStatus">
            <div className="statusLabel">Status</div>
            <div className="statusMessage">&gt;&gt; {this.state.debugMsg || "ready"}</div>
          </div>
        </aside>

        <main className="mainPanel">
          <section className="workspaceFrame">
            <header className="workspaceHeader">
              <div>
                <p className="eyebrow">Kan-App Workspace</p>
                <h1>{this.state.activeTool ? "Tool View" : "Dashboard"}</h1>
              </div>
              {this.state.activeTool ? (
                <button className="closeToolButton" onClick={() => this.setState({ activeTool: null, debugMsg: "tool closed" })}>close tool</button>
              ) : null}
            </header>

            <div className="workspaceBody">
              {this.state.activeTool === null ? (
                <div className="dashboardGrid">
                  <div className="dashboardHero">
                    <p className="eyebrow">No tool selected</p>
                    <h2>Pick a tool from the dock.</h2>
                    <p>Your tools stay contained here, so long OCR results and logs scroll inside this workspace instead of breaking the sidebars.</p>
                  </div>

                  <div className="dashboardCard">
                    <span className="dashboardMetric">2026</span>
                    <p>Export Year</p>
                  </div>

                  <div className="dashboardCard">
                    <span className="dashboardMetric">{this.state.board.totalMiles}</span>
                    <p>Total Miles</p>
                  </div>

                  <div className="dashboardCard">
                    <span className="dashboardMetric">{this.state.board.documentCount}</span>
                    <p>Documents</p>
                  </div>
                </div>
              ) : null}

              {this.state.activeTool === "mileage" ? (
                <div className="toolShell">
                  <Mileage onClose={() => this.setState({ activeTool: null, debugMsg: "mileage tool closed" })} />
                </div>
              ) : null}

              {this.state.activeTool === "documents" ? (
                <div className="toolShell">
                  <Document onClose={() => this.setState({ activeTool: null , debugMsg: "doc tool closed"})} />
                </div>
              ) : null}
            </div>
          </section>
        </main>

        <aside className="rightDock">
          <button className="dockButton" title="Mileage Tracker" onClick={async () => {this.setState({ activeTool: "mileage", debugMsg: "mileage tool opened" });}}>
            <img src="/icon.png" alt="Mileage Tracker" />
          </button>

          <button className="dockButton" title="Show Mileage History" onClick={async () => {const logs = await retrieveAllMiles(); this.setState({ debugMsg: `loaded ${logs.length} mileage logs` })}}>
            <img src="/icon2.png" alt="show mileage history" />
          </button>

          <button className="dockButton" title="Upload Document" onClick={async () => {this.setState({ activeTool: "documents", debugMsg: "documents tool opened" });}}>
            <img src="/icon3.png" alt="Upload document" />
          </button>
        </aside>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>
    <MainView board={new Board(2026)} exportYear={2026} activeTool={null} theme={"light"}/>
    </div>
  </React.StrictMode>
)
