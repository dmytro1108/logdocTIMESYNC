import React from "react"
import '../assets/popup.css';
import { getPathForFile, performOCR, runReceiptTool, compatibleFile, 
    enterTripDetails, updateTripDetails, retrieveTotalLogs, runDistanceTool, 
    updateLogHistory, retrieveLogHistory, deleteLogHistory, clearLogHistory, spinUpRemote} from "../ipc"
// styling constants

type DocumentProps = {
    onClose: () => void
}

type DocumentState = {
    name: string,
    content: string,
    debugMsg: string,
    historyMsg: string,
    showHistoryDropdown: boolean,
    showAutofillPopup: boolean,
    showModelDropdown: boolean,
    showModeDropdown: boolean,
    showModeOptionsDropdown:boolean,
    isDragging: boolean,
    selectedMode: string,
    filePath: string,
    filePaths: string[],
    sourceStreet: string,
    sourceCity: string,
    sourceStateinUSA: string,
    sourceZip: number,
    destinationStreet: string,
    destinationCity: string,
    destinationStateinUSA: string,
    destinationZip: number,
}

/**
 * 
 * The Document.tsx component will consist of a drag and drop box area.
 * After a document is dropped, a processing job will be initiated. This
 * will produce an auto-filled result window.
 */

export class Document extends React.Component<DocumentProps, DocumentState> {
    name: string
    content: string
    debugMsg: string
    historyMsg: string
    showHistoryDropdown: boolean
    isDragging: boolean
    selectedModel: string
    selectedMode: string
    filePath: string
    filePaths: string[]
    sourceStreet: string
    sourceCity: string
    sourceStateinUSA: string
    sourceZip: number
    destinationStreet: string
    destinationCity: string
    destinationStateinUSA: string
    destinationZip: number
    showAutofillPopup: boolean
    showModelDropdown: boolean
    showModeDropdown: boolean
    showModeOptionsDropdown: boolean
    constructor(props: DocumentProps) {
        super(props)

        this.name = ""
        this.content = ""
        this.debugMsg = ""
        this.historyMsg = ""
        this.showHistoryDropdown = false
        this.isDragging = false
        this.selectedModel = ""
        this.selectedMode = ""
        this.filePath = ""
        this.filePaths = []
        this.sourceStreet = ""
        this.sourceCity = ""
        this.sourceStateinUSA = ""
        this.sourceZip = 0
        this.destinationStreet = ""
        this.destinationCity = ""
        this.destinationStateinUSA = ""
        this.destinationZip = 0
        this.showAutofillPopup = false
        this.showModelDropdown = false
        this.showModeDropdown = false
        this.showModeOptionsDropdown = false
        this.state = {
            name: "",
            content: "",
            debugMsg: "",
            historyMsg: "",
            showHistoryDropdown: false,
            showModeDropdown: false,
            isDragging: false,
            selectedMode: "",
            filePath: "",
            filePaths: [],
            sourceStreet: "",
            sourceCity: "",
            sourceStateinUSA: "",
            sourceZip: 0,
            destinationStreet: "",
            destinationCity: "",
            destinationStateinUSA: "",
            destinationZip: 0,
            showAutofillPopup: false,
            showModelDropdown: false,
            showModeOptionsDropdown: false
        }
    }

    handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        
        const files = Array.from(e.dataTransfer.files)
        const paths = (await Promise.all(files.map((file) => getPathForFile(file)))).filter(Boolean)
        
        if (paths.length === 0) {
            this.setState({
                isDragging: false,
                debugMsg: "no files found",
                filePaths: []
            })
            return
        } else {
            this.setState({
                isDragging: false,
                debugMsg: files
                    ? `file name: ${files[0].name} | path: ${paths}`
                    : "no file found",
                filePaths: paths
            })
        }
    }

    parseReceiptToolResult = (receiptToolResult: string) => {
        const parsedReceiptToolResult = JSON.parse(receiptToolResult)
        let candidates: any[] = []

        if (Array.isArray(parsedReceiptToolResult)) {
            candidates = parsedReceiptToolResult
        }

        let source: any = {}
        let destination: any = {}

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i]

            if (candidate.role === "source") {
                source = candidate
            }

            if (candidate.role === "destination") {
                destination = candidate
            }
        }

        if (candidates.length > 0) {
            source = candidates[0]
        }

        if (candidates.length > 1) {
            destination = candidates[1]
        }

        return { source, destination }
    }

    processUpload = async () => {
        this.setState({ debugMsg: "running receipt tool..." })
        if (!this.state.filePath) {
            this.setState({ debugMsg: "no file to upload" })
            return
        }
        if (!this.state.filePath.endsWith('.png') && !this.state.filePath.endsWith('.jpg') && !this.state.filePath.endsWith('.jpeg')) {
            // fix unsupported file types
            try {
                const myPath = await compatibleFile(this.state.filePath)
                const tesseractResult = await performOCR(myPath)
                const { source, destination } = this.parseReceiptToolResult(tesseractResult)
                
                this.setState({
                        content: JSON.stringify({ source, destination }, null, 2),
                        sourceStreet: source.street,
                        sourceCity: source.city,
                        sourceStateinUSA: source.state,
                        sourceZip: source.zip,
                        destinationStreet: destination.street,
                        destinationCity: destination.city,
                        destinationStateinUSA: destination.state,
                        destinationZip: destination.zip,
                        showAutofillPopup: true
                    })
            } catch (err) {
                this.setState({ 
                    debugMsg: `error performing OCR: ${err}` })
            }
        } else {
            try {
                this.setState({ debugMsg: "running OCR tools..." })
    
                // const tesseractResult = await performOCR(this.state.filePath)
                const v = await runReceiptTool(this.state.filePath, this.selectedModel)
                const { source, destination } = this.parseReceiptToolResult(v)
                
                this.setState({
                    content: JSON.stringify({ source, destination }, null, 2),
                    debugMsg: v,
                    sourceStreet: source.street,
                    sourceCity: source.city,
                    sourceStateinUSA: source.state,
                    sourceZip: source.zip,
                    destinationStreet: destination.street,
                    destinationCity: destination.city,
                    destinationStateinUSA: destination.state,
                    destinationZip: destination.zip,
                    showAutofillPopup: true
                })
            } catch (err) {
                this.setState({ 
                    debugMsg: `error performing OCR: ${err}` })
            }
        }
    }

    logLocation = async () => {

        await enterTripDetails(
            this.state.sourceStreet,
            this.state.sourceCity,
            this.state.sourceStateinUSA,
            this.state.sourceZip,
            this.state.destinationStreet,
            this.state.destinationCity,
            this.state.destinationStateinUSA,
            this.state.destinationZip
        )
        this.setState({
            debugMsg: "Trip details logged successfully"
        })
    }

    // the method will convert the location details into a string, use to turn into arguments passed into
    // the runDistanceTool method
    turnIntoString = (Street: string, City: string, State: string, Zip: number) => {
        return `${Street}, ${City}, ${State} ${Zip}`
    }

    // run the distance tool with arguments
    processDistance = async () => {
        // turn source and destination into strings
        const sourceString = this.turnIntoString(
            this.state.sourceStreet,
            this.state.sourceCity,
            this.state.sourceStateinUSA,
            this.state.sourceZip
        )
        const destinationString = this.turnIntoString(
            this.state.destinationStreet,
            this.state.destinationCity,
            this.state.destinationStateinUSA,
            this.state.destinationZip
        )

        // run the distance tool
        await runDistanceTool(sourceString, destinationString)
    }

    fetchForHistory = async () => {
        const date = new Date().toISOString();
    
        const sourceString = this.turnIntoString(
            this.state.sourceStreet,
            this.state.sourceCity,
            this.state.sourceStateinUSA,
            this.state.sourceZip
        );
        const destinationString = this.turnIntoString(
            this.state.destinationStreet,
            this.state.destinationCity,
            this.state.destinationStateinUSA,
            this.state.destinationZip
        );
    
        const historyString = `${date} | ${sourceString} -> ${destinationString}`;
        
        // update the table with the new history entry
        await updateLogHistory(date, historyString);

        this.setState({
            historyMsg: historyString
        });
    
        return historyString;
    }

    spinUpServer = async (t:string, md: string, filesJson: string) => {

        await spinUpRemote(t, md);
        this.setState({
            debugMsg: `started server: live running ${md}, with ${t} throttle`
        });
    }

    turnFilesListIntoJson = (files: string[]) => {
        const filesJson = files.map((filePath) => {
            return { filePath }
        })
        return JSON.stringify(filesJson)
    }
    
    render() {
    
        const serverOptionsDropdown = (
            <div style={{ padding: "10px", fontSize: "12px", maxHeight: "300px", overflowY: "auto" }}>
                <div style={{ padding: "5px" }}>
                    <div>throttle speed options</div>
                    <div style={{ padding: "5px" }}>
                        <button onClick={() => { }}>
                            50s
                        </button>
                        <button onClick={() => {  }}>
                            100s
                        </button>
                        <button onClick={() => { this.selectedModel == "moondream" ? this.spinUpServer("300", "moondream",this.turnFilesListIntoJson(this.state.filePaths || [])) : this.spinUpServer("300", "qwen2.5vl:7b", this.turnFilesListIntoJson(this.state.filePaths || [])) }}>
                            300s
                        </button>
                        {/** also make sure to contain a button to choose the model for the remote to use */}
                    </div>
                    <button > {/** TODO: kill process on all platforms, build it myself to understand how processes work */}
                        terminate server
                    </button>
                </div>
            </div>
        );
    
        const modeOptionsDropdown = (
            <div style={{ padding: "10px", fontSize: "12px", maxHeight: "300px", overflowY: "auto" }}>
                <div style={{ padding: "5px" }}>
                    <button>
                        spin up server
                    </button>
                    {this.state.showModeOptionsDropdown ? serverOptionsDropdown : undefined}
                    <button>
                        run as client
                    </button>
                </div>
            </div>
        );
    
        const modeDropdown = (
            <div style={{ padding: "10px", fontSize: "12px", maxHeight: "300px", overflowY: "auto" }}>
                <div style={{ padding: "5px" }}>
                    <button style={{ background: this.state.selectedMode === "local" ? "var(--ink-golden)" : undefined, color: this.state.selectedMode === "local" ? "#111111" : undefined }} onClick={() => this.setState({ selectedMode: "local", showModeDropdown: false })}>
                        local
                    </button>
                </div>
                <div style={{ padding: "5px" }}>
                    <button style={{ background: this.state.selectedMode === "remote" ? "var(--ink-golden)" : undefined, color: this.state.selectedMode === "remote" ? "#111111" : undefined }} onClick={() => this.setState({ selectedMode: "remote", showModeOptionsDropdown: true })}>
                        remote
                    </button>
                    {this.state.showModeOptionsDropdown ? modeOptionsDropdown : undefined}
                </div>
            </div>
        );

        const modelDropdown = (
            <div style={{ "padding": "10px", "fontSize": "12px", maxHeight: "300px", overflowY: "auto" }}>
                <div style={{ "padding": "5px" }}>
                    <button onClick={() => {this.selectedModel = "moondream" ,this.setState({ showModelDropdown: false, debugMsg: "selected moondream" })}}>
                        moondream
                    </button>
                </div>
                <div style={{ "padding": "5px" }}>
                    <button onClick={() => {this.selectedModel = "qwen2.5vl:7b", this.setState({ showModelDropdown: false, debugMsg: "qwen2.5vl:7b" })}}>
                        qwen2.5-vl:7b
                    </button>
                </div>
            </div>
        );

        const historyDropdown = (
            <div>
                <div>
                    <button onClick={async () => {const logs = await retrieveLogHistory(); this.setState({ historyMsg: logs });}}>
                        refresh
                    </button>
        
                    <button onClick={async () => {await clearLogHistory();}}>
                        clear
                    </button>
                </div>
        
                <div style={{ "padding": "10px", "fontSize": "12px", maxHeight: "300px", overflowY: "auto" }}>
                    {Array.isArray(this.state.historyMsg) && this.state.historyMsg.length > 0 ? (
                        this.state.historyMsg.map((log) => (
                            <div key={log.id} style={{ "padding": "10px" }}>
                                <div>
                                    <strong>{log.logDate}: </strong>
                                    <span>{log.myTrip}</span>
                                </div>
        
                                <button onClick={async () => {await deleteLogHistory(log.id);const logs = await retrieveLogHistory();this.setState({ historyMsg: logs });}}>
                                    delete
                                </button>
                            </div>
                        ))

                    ) : (
                        <div>no history yet</div>
                    )}
                </div>
            </div>
        );

        const autofillPopup = (
            <div className = "myPopUpAutofill">
                <div className = "myPopUpBackground">
                    <div>
                        <button onClick={() => this.setState({ showAutofillPopup: false })}>×</button>
                    </div>

                    <div>
                        <div>
                            <h3>Source</h3>

                            <label>Street</label>
                            <input type="text" value={this.state.sourceStreet} onChange={(e) => this.setState({ sourceStreet: e.target.value })} />

                            <label>City</label>
                            <input type="text" value={this.state.sourceCity} onChange={(e) => this.setState({ sourceCity: e.target.value })} />

                            <label>State</label>
                            <input type="text" value={this.state.sourceStateinUSA} onChange={(e) => this.setState({ sourceStateinUSA: e.target.value })} />

                            <label>Zip</label>
                            <input type="number" value={this.state.sourceZip} onChange={(e) => this.setState({ sourceZip: Number(e.target.value) || 0 })} />
                        </div>

                        <div>
                            <h3>Destination</h3>

                            <label>Street</label>
                            <input type="text" value={this.state.destinationStreet} onChange={(e) => this.setState({ destinationStreet: e.target.value })} />

                            <label>City</label>
                            <input type="text" value={this.state.destinationCity} onChange={(e) => this.setState({ destinationCity: e.target.value })} />

                            <label>State</label>
                            <input type="text" value={this.state.destinationStateinUSA} onChange={(e) => this.setState({ destinationStateinUSA: e.target.value })} />

                            <label>Zip</label>
                            <input type="number" value={this.state.destinationZip} onChange={(e) => this.setState({ destinationZip: Number(e.target.value) || 0 })} />
                        </div>
                    </div>

                    <div>
                        <button onClick={() => this.setState({ showAutofillPopup: false })}>
                            Cancel
                        </button>
                        <button onClick={async () => {this.setState({ showAutofillPopup: false, debugMsg: "autofill confirmed" }); this.logLocation(); await this.processDistance(); this.fetchForHistory()}}>
                            Use Autofill
                        </button>
                    </div>
                </div>
            </div>
        )

        const dropWindow = (
            <div>    
                <div style = {{"right": "100px", "position": "absolute", "textAlign": "center"}}>
                    <button onClick={this.props.onClose}>×</button>
                </div>

                {/* Droppable field for files */}
                <div className = "myBoxDropOutline" onDragOver={(e) => {
                    e.preventDefault() 
                    this.setState({ isDragging: true })
                    }}
                    onDragLeave={() => this.setState({ isDragging: false })} onDrop={this.handleDrop}>
                    <div style={{"fontSize": "20px", "color": this.state.isDragging ? "var(--ink-golden)" : "var(--ink-text)"}}>
                        {this.state.filePath ? this.state.filePath :  "launch zone 🚀"}
                    </div>
                </div>

                <div style={{ marginTop: "10px", padding: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={this.processUpload}>
                        launch
                    </button>
                    {this.state.debugMsg}

                    <button onClick={() => this.setState({ showHistoryDropdown: !this.state.showHistoryDropdown })}>
                        history
                    </button>
                    
                    <button onClick={() => this.setState({ showModelDropdown: !this.state.showModelDropdown })}>
                        model
                    </button>

                    <button onClick={() => this.setState({ showModeDropdown: !this.state.showModeDropdown })}>
                        mode
                    </button>
                </div>
            </div>
        )

        return (
            <div>
                {dropWindow}
                {this.state.showAutofillPopup ? autofillPopup : null}
                <div style={{ "height": "10px", "padding": "10px", "borderTop": "2px dashed var(--ink-line)", "margin": "0" }}></div>
                {this.state.showHistoryDropdown ? historyDropdown : null}
                {this.state.showModelDropdown ? modelDropdown : null}
                {this.state.showModeDropdown ? modeDropdown : null}
            </div>
        )
    }
}