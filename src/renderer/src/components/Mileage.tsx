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
            debugMsg: `logged: ${end - start} miles`
        })
    }

    render() {
      const calculatedMiles = (+this.state.endingMiles || 0) - (+this.state.startingMiles || 0)

      const mileageWindow = (
        <div className="mileagePanel">
            <div className="mileageTopStrip">
                <div>
                    <p className="eyebrow">Mileage</p>
                    <h2>Quick log</h2>
                </div>

                <button className="iconCloseButton" onClick={this.props.onClose}>×</button>
            </div>

            <div className="mileageQuickCard">
                <div className="mileageTotalPill">
                    <span>Total</span>
                    <strong>{calculatedMiles > 0 ? calculatedMiles : 0}</strong>
                </div>

                <div className="mileageInputGrid">
                    <label className="mileageFieldCard">
                        <span>Start</span>
                        <input
                            className="mileageInput"
                            placeholder={this.state.lastEndMiles !== null ? String(this.state.lastEndMiles) : "0"}
                            value={this.state.startingMiles}
                            onChange={(e) => this.setState({ startingMiles: e.target.value })}
                        />
                    </label>

                    <label className="mileageFieldCard">
                        <span>End</span>
                        <input
                            className="mileageInput"
                            placeholder="0"
                            value={this.state.endingMiles}
                            onChange={(e) => this.setState({ endingMiles: e.target.value })}
                            onKeyDown={async (e) => {
                                if (e.key === "Enter") {
                                    await this.safeLog()
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="mileageMetaRow">
                    <div>
                        <span>Last end</span>
                        <strong>{this.state.lastEndMiles !== null ? this.state.lastEndMiles : "—"}</strong>
                    </div>

                    <div>
                        <span>Logs</span>
                        <strong>{this.state.mileageLogs.length}</strong>
                    </div>
                </div>

                <div className="toolActionRow mileageActionRow">
                    <button className="primaryActionButton" onClick={async () => { await this.safeLog() }}>
                        save log
                    </button>
                    <span className="miniStatus">{this.state.debugMsg || "ready"}</span>
                </div>
            </div>
        </div>
    )

    const mileageHistoryDashboard = (
        <div className="historyDashboard">
            <div className="historyHeader">
                <div>
                    <p className="eyebrow">History</p>
                    <h2>Recent logs</h2>
                </div>

                <div className="historyButtons">
                    <button
                        onClick={async () => {
                            const logs = await retrieveAllMiles()
                            this.setState({ mileageLogs: logs, debugMsg: "mileage logs refreshed" })
                        }}>
                        refresh
                    </button>

                    <button
                        className="dangerButton"
                        onClick={async () => {
                            await deleteAllMiles()
                            this.setState({ mileageLogs: [], lastEndMiles: null, debugMsg: "all mileage logs deleted" })
                        }}>
                        clear
                    </button>
                </div>
            </div>

            <div className="historyList">
                {this.state.mileageLogs.length > 0 ? (
                    this.state.mileageLogs.map((log) => (
                        <div className="historyLogCard" key={log.id}>
                            <div className="historyLogMain">
                                <strong>{log.totalMiles} mi</strong>
                                <span>{new Date(log.dateCreated).toLocaleDateString()}</span>
                            </div>

                            <div className="historyLogSub">
                                {log.startMiles ?? "?"} → {log.endMiles ?? "?"}
                            </div>

                            <button
                                className="smallDangerButton"
                                onClick={async () => {
                                    await deleteMilesById(log.id)
                                    const logs = await retrieveAllMiles()
                                    this.setState({ mileageLogs: logs, debugMsg: "mileage log deleted" })
                                }}>
                                delete
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="emptyHistoryBox" aria-hidden="true" />
                )}
            </div>
        </div>
    )

    return (
        <div className="toolInner mileageToolInner">
            {mileageWindow}
            {mileageHistoryDashboard}
        </div>
    )
  }
}