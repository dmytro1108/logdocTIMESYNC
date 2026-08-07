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
    showHistoryDropdown: boolean,
    mileageLogs: any[],
    lastEndMiles: null | number,
}
export class Mileage extends React.Component<MileageProps, MilageState> {
    state: MilageState = {
        startingMiles: "",
        endingMiles: "",
        totalMiles: "",
        debugMsg: "",
        showHistoryDropdown: false,
        mileageLogs: [],
        lastEndMiles: null
    }
    componentDidMount = async () => {
      await this.loadLastEndMiles()
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
            totalMiles: `${end - start}`,
            debugMsg: `logged: ${end - start} miles`
        })
    }

    render() {

      const mileageWindow = (
        <div>
            <div  style = {{"right": "100px", "position": "absolute", "textAlign": "center"}}>
                <button onClick={this.props.onClose}>×</button>
            </div>

            <div>
                <div style ={{ "fontSize": "35px","margin": "0", "padding": "10px", "display": "flex"}}>
                    <span>Total: {this.state.totalMiles}</span>
                    <strong></strong>
                </div>

                <div>
                    <label>
                        <span>Start</span>
                        <input placeholder={this.state.lastEndMiles !== null ? String(this.state.lastEndMiles) : "0"} value={this.state.startingMiles} onChange={(e) => this.setState({ startingMiles: e.target.value })}/>
                    </label>

                    <label>
                        <span>End</span>
                        <input placeholder="0" value={this.state.endingMiles} onChange={(e) => this.setState({ endingMiles: e.target.value })} onKeyDown={async (e) => {if (e.key === "Enter") {await this.safeLog()}}}/>
                    </label>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}> {/* Record mileage */}
                    <button onClick={async () => { await this.safeLog() }}>
                        save log
                    </button>
                    <button onClick = {() => this.setState({ showHistoryDropdown: !this.state.showHistoryDropdown })}>
                        history
                    </button>

                </div>
            </div>
        </div>
    )

    const mileageHistoryDashboard = (
        <div>
            <div>
                <div>
                    <button onClick={async () => {const logs = await retrieveAllMiles(); this.setState({ mileageLogs: logs, debugMsg: "mileage logs refreshed" })}}>
                        refresh
                    </button>

                    <button onClick={async () => {await deleteAllMiles(); this.setState({ mileageLogs: [], lastEndMiles: null, debugMsg: "all mileage logs deleted" })}}>
                        clear
                    </button>
                </div>
            </div>

            <div style={{ padding: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {this.state.mileageLogs.length > 0 ? (
                    this.state.mileageLogs.map((log) => (
                        <div key={log.id} style = {{ "padding": "10px" }}>
                            <div>
                                <strong>{log.totalMiles}</strong>
                                <span>{new Date(log.dateCreated).toLocaleDateString()}</span>
                            </div>

                            <div>
                                {log.startMiles ?? "?"} → {log.endMiles ?? "?"}
                            </div>

                            {/* delete mileage log */}
                            <button onClick={async () => {await deleteMilesById(log.id); const logs = await retrieveAllMiles(); this.setState({ mileageLogs: logs, debugMsg: "mileage log deleted" })}}>
                                delete
                            </button>
                        </div>
                    ))
                ) : (
                    <div/>
                )}
            </div>
        </div>
    )

    return (
        <div>
            <div style = {{ "padding": "10px" }}>
                {mileageWindow}
            </div>
            <div style = {{ "height": "10px", "padding": "10px", "borderTop": "2px dashed var(--ink-line)", "margin": "0"}}></div>
                {this.state.showHistoryDropdown ? mileageHistoryDashboard : null}       
            </div>
    )
  }
}