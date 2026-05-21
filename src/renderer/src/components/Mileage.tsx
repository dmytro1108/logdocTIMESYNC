import React from "react"
import { deleteAllMiles, deleteMilesById, logMiles, retrieveAllMiles } from "../ipc"

const COLUMN_BUTTON_SIZE: string = "150%";
const COLUMN_FONT_SIZE: string = COLUMN_BUTTON_SIZE;

type MileageProps = {
    onClose: () => void
}

type MilageState = {
    startingMiles: string,
    endingMiles: string,
    totalMiles: string,
    debugMsg: string,
    mileageLogs: any[],
    lastEndMiles: null | number,
}
export class Mileage extends React.Component<MileageProps, MilageState> {
    state: MilageState = {
        startingMiles: "",
        endingMiles: "",
        totalMiles: "",
        debugMsg: "",
        mileageLogs: [],
        lastEndMiles: null
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
        const start = +this.state.startingMiles
        const end = +this.state.endingMiles
        
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
        const mileageWindow = (
              <div>
                <div className="mileageToolHeader">
                  <button onClick={this.props.onClose}>❌</button>
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
                    <input className="mileageInput" placeholder="" value={this.state.endingMiles} onChange={(e) => {this.setState({ endingMiles: e.target.value })}}/>
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
                      {(+this.state.endingMiles || 0) - (+this.state.startingMiles || 0)}
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
                    🕒 date included 😃
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
                    onClick={async () => {const logs = await retrieveAllMiles()
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
            <div>
                {mileageWindow}
                {mileageHistoryDashboard}
            </div>
        )
    }
}