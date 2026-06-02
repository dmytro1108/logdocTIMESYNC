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
              <div className="mileagePanel">
                <div className="toolTopBar">
                  <div>
                    <p className="eyebrow">Mileage Tracker</p>
                    <h2>Track miles</h2>
                    <p className="toolSubtitle">Enter start and end miles. The total is calculated for you.</p>
                  </div>
                  <button className="iconCloseButton" onClick={this.props.onClose}>×</button>
                </div>

                <div className="mileageHeroCard">
                  <div className="mileageStat">
                    <span className="statLabel">Business Miles</span>
                    <strong>{(+this.state.endingMiles || 0) - (+this.state.startingMiles || 0)}</strong>
                  </div>
                  <div className="mileageStat">
                    <span className="statLabel">Last End</span>
                    <strong>{this.state.lastEndMiles !== null ? this.state.lastEndMiles : "—"}</strong>
                  </div>
                  <div className="mileageStat">
                    <span className="statLabel">Date</span>
                    <strong>Today</strong>
                  </div>
                </div>

                <div className="mileageInputGrid">
                  <label className="mileageFieldCard">
                    <span>Starting miles</span>
                    <input className="mileageInput" placeholder={this.state.lastEndMiles !== null ? String(this.state.lastEndMiles) : "0"} value={this.state.startingMiles} onChange={(e) => this.setState({ startingMiles: e.target.value })}/>
                  </label>

                  <label className="mileageFieldCard">
                    <span>Ending miles</span>
                    <input className="mileageInput" placeholder="0" value={this.state.endingMiles} onChange={(e) => {this.setState({ endingMiles: e.target.value })}}/>
                  </label>
                </div>

                <div className="toolActionRow">
                  <button className="primaryActionButton" onClick={async () => { await this.safeLog()}}>save log</button>
                  <span className="miniStatus">{this.state.debugMsg || "date included automatically"}</span>
                </div>
              </div>
            )
            const mileageHistoryDashboard = (
              <div className="historyDashboard">
                <h2>Mileage Log History</h2>
            
                <div className="historyButtons">
                  <button
                    onClick={async () => {const logs = await retrieveAllMiles(); this.setState({ mileageLogs: logs })}}>
                    refresh logs
                  </button>
            
                  <button
                    className="dangerButton"
                    onClick={async () => {await deleteAllMiles(); this.setState({ mileageLogs: [], debugMsg: "all mileage logs deleted" })}}>
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
                        onClick={async () => {await deleteMilesById(log.id); const logs = await retrieveAllMiles(); this.setState({ mileageLogs: logs })}}>
                        delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
        return (
            <div className="toolInner">
                {mileageWindow}
                {mileageHistoryDashboard}
            </div>
        )
    }
}