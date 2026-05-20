import React from 'react'
import ReactDOM from 'react-dom/client'
import Accounts from './components/Accounts'
import WebSocketLink from './components/WebSocketLink'

import Board from './components/Dashboard'

import './assets/main.css';
import { createBoard, getBoardByID, getBoardsByUser, updateBoard, deleteBoard } from './ipc'
import { exportToFile, logMiles, retrieveAllMiles, deleteAllMiles, deleteMilesById } from './ipc' 

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
  startingMiles: string
  endingMiles: string
  totalMiles: string
  theme: "dark" | "light"
  activeTool: "mileage" | "documents" | "notifications" | null
  mileageLogs: any[]
  lastEndMiles: number | null
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
      startingMiles: '',
      endingMiles: '',
      totalMiles: '',
      demoBoardID: -1,
      activeTool: null,
      theme: this.theme,
      mileageLogs: [],
      lastEndMiles: null
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

  sum = () => {
    const start = parseFloat(this.state.startingMiles)
    const end = parseFloat(this.state.endingMiles)

    if (isNaN(start) || isNaN(end)) {
      this.setState({ debugMsg: 
        "Please enter valid numbers for miles and expenses." 
      })
    }

    const totalMiles = end - start
    const now = new Date().toLocaleString()

    this.setState({ 
      debugMsg: `logged: ${totalMiles} miles at ${now}` 
    })
  }

  loadLastEndMiles = async () => {
    const logs = await retrieveAllMiles()
  
    if (logs.length > 0) {
      this.setState({
        lastEndMiles: logs[0].endMiles,
        mileageLogs: logs
      })
    }
  }

  safeLog = async () => {
    const start = Number(this.state.startingMiles)
    const end = Number(this.state.endingMiles)
  
    if (Number.isNaN(start) || Number.isNaN(end)) {
      this.setState({ debugMsg: "enter valid mileage numbers" })
      return
    }
  
    if (end < start) {
      this.setState({ debugMsg: "ending mileage cannot be lower than starting mileage" })
      return
    }
  
    if (this.state.lastEndMiles !== null && start < this.state.lastEndMiles) {
      this.setState({
        debugMsg: `starting mileage cannot be lower than last ending mileage: ${this.state.lastEndMiles}`
      })
      return
    }
    
    await logMiles(start, end, "", "")
    await this.loadLastEndMiles()
  
    this.setState({
      startingMiles: "",
      endingMiles: "",
      debugMsg: `logged: ${end - start} miles`
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

    const mileageWindow = (
      <div>
        <div className="mileageToolHeader">
          <button onClick={() => this.setState({ activeTool: null })}>❌</button>
          <h2>track miles tool</h2>
        </div>
    
        <div className="mileageRow">
          <div className="mileageInputSide">
            
            <input className="mileageInput" placeholder={this.state.lastEndMiles !== null ? String(this.state.lastEndMiles) : "0"} value={this.state.startingMiles} onChange={(e) => this.setState({ startingMiles: e.target.value })}/>
          
          </div>
          <div className="arrowNote">
            <span className="drawArrow">⬅</span>
            <p style={{ fontSize: COLUMN_FONT_SIZE }}>starting miles here</p>
          </div>
        </div>
    
        <div className="mileageRow">
          <div className="mileageInputSide">
            <input className="mileageInput" placeholder="😍" value={this.state.endingMiles} onChange={(e) => {this.setState({ endingMiles: e.target.value })}}/>
          </div>
    
          <div className="arrowNote">
            <span className="drawArrow">⬅</span>
            <p style={{ fontSize: COLUMN_FONT_SIZE }}>ending miles here</p>
          </div>
        </div>
    
        <div className="mileageRow">
          <div className="businessMilesCard">
            <label style={{ fontSize: COLUMN_FONT_SIZE }}>Business Miles</label>
            <div>
              {Number(this.state.endingMiles || 0) - Number(this.state.startingMiles || 0)}
            </div>
          </div>
    
          <div className="arrowNote">
            <span className="drawArrow">⬅</span>
            <p style={{ fontSize: COLUMN_FONT_SIZE }}>your total<br />business miles</p>
          </div>
        </div>
    
        <div className="mileageRow saveRow">
        <button className="saveMileageButton" onClick={async () => { await this.safeLog()}}>
          💾 save log
        </button>
    
          <div className="arrowNote whiteArrow">
            <span className="drawArrow">⬅</span>
            <p style={{ fontSize: COLUMN_FONT_SIZE }}>save your<br />mileage log</p>
          </div>
        </div>
    
        <div className="timeHintRow">
          <p className="timeHint">
            🕒 date included
          </p>
    
          <div className="arrowNote whiteArrow">
            <span className="drawArrow">⬅</span>
            <p>we’ll add today’s<br />date & time</p>
          </div>
        </div>
      </div>
    )
    const mileageHistoryDashboard = (
      <div className="historyDashboard">
        <h2>Mileage Log History</h2>
    
        <div className="historyButtons">
          <button
            onClick={async () => {
              const logs = await retrieveAllMiles()
              this.setState({ mileageLogs: logs })
            }}
          >
            refresh logs
          </button>
    
          <button
            className="dangerButton"
            onClick={async () => {
              await deleteAllMiles()
              this.setState({ mileageLogs: [], debugMsg: "all mileage logs deleted" })
            }}
          >
            delete all history
          </button>
        </div>
    
        {this.state.mileageLogs.map((log) => (
          <div className="historyLogCard" key={log.id}>
            <div className="daySeparator">
              {new Date(log.dateCreated).toLocaleDateString()}
            </div>
    
            <div className="logRow">
              <strong>{log.totalMiles} miles</strong>
              <span>{log.fromLocation || "from"} → {log.toLocation || "to"}</span>
    
              <button
                className="smallDangerButton"
                onClick={async () => {
                  await deleteMilesById(log.id)
                  const logs = await retrieveAllMiles()
                  this.setState({ mileageLogs: logs })
                }}
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )
    
    
    return (
      <div className="mainview">
        <div className="rightSide">

          <div>
            <div style = {{ fontSize: "150%", fontWeight: 300, color: COLUMN_TEXT_COLOR}}>
              Welcome {this.state.successMsg}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button style={{ fontSize: BUTTON_FONT_SIZE }} onClick={() => {this.login()}}>login</button>
            <button style={{ fontSize: BUTTON_FONT_SIZE }} onClick={() => {this.signUp()}}>sign up</button>
            <button style={{ fontSize: BUTTON_FONT_SIZE }} onClick={() => {this.export()}}>export</button>
          </div>
         
          <div className ="cardBlock" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {this.state.logInState == "login" ? loginWindow : (this.state.logInState == "signUp" ? signUpWindow : (this.state.logInState == "loggedIn" ? loggedInWindow : null)) }
          </div>

          <div className="tabsView">
            <button className="toolImageButton" onClick={async () => {this.setState({ activeTool: "mileage" }); await this.loadLastEndMiles()}}>
              <img src="/icon.png" alt="Mileage Tracker" width={70} height={70} />
            </button>
            <button className="toolImageButton" onClick={() => retrieveAllMiles()}>
              <img src="/icon2.png" alt="show milage history" width={70} height={70} />
            </button>
            
          </div>
          
        </div>
        
        <div className="leftSide">
          
          <text style = {{ fontSize: BUTTON_FONT_SIZE}}>&gt;&gt;{this.state.debugMsg} </text>

          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
            {this.state.activeTool === "mileage" ? mileageWindow : null}
            {this.state.activeTool === "mileage" ? mileageHistoryDashboard : null}
          </div>

          <div style={{display: "flex"}}>

          </div>
        </div>

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
