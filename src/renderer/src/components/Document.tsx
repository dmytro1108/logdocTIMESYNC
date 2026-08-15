import React from "react"
import '../assets/popup.css';
import { getPathForFile, performOCR, runReceiptTool, compatibleFile, 
    enterTripDetails, updateTripDetails, retrieveTotalLogs, runDistanceTool, 
    updateLogHistory, retrieveLogHistory, deleteLogHistory, clearLogHistory } from "../ipc"
// styling constants
const BUTTON_SIZE: string = "150%";
const FONT_SIZE: string = BUTTON_SIZE;
const TEXT_COLOR: string = "white";

const BUTTON_HEIGHT: string = "50px"; // for buttons
const BUTTON_WIDTH: string = "100px";
const BUTTON_BORDER_COLOR: string = "white";
const BUTTON_BORDER_WIDTH: string = "2px";
const BUTTON_BORDER_RADIUS: string = "8px";
const BUTTON_BACKGROUND_COLOR: string = "transparent";

const BOX_HEIGHT: string = "200px";
const BOX_WIDTH: string = "300px";
const BOX_BORDER_COLOR: string = "white";

const TOOL_PANEL_BACKGROUND: string = "#111";
const TOOL_SOFT_BACKGROUND: string = "rgba(255, 255, 255, 0.04)";
const TOOL_BORDER: string = `${BUTTON_BORDER_WIDTH} solid ${BUTTON_BORDER_COLOR}`;
const TOOL_RADIUS: string = "12px";
const TOOL_MUTED_TEXT: string = "#d8d8d8";
const TOOL_FIELD_BACKGROUND: string = "rgba(255, 255, 255, 0.06)";

type DocumentProps = {
    onClose: () => void
}

type DocumentState = {
    name: string,
    content: string,
    debugMsg: string,
    historyMsg: string,
    showHistoryDropdown: boolean,
    isDragging: boolean,
    filePath: string,
    fileQueue: string[],
    sourceStreet: string,
    sourceCity: string,
    sourceStateinUSA: string,
    sourceZip: number,
    destinationStreet: string,
    destinationCity: string,
    destinationStateinUSA: string,
    destinationZip: number,
    showAutofillPopup: boolean

    
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
    filePath: string
    sourceStreet: string
    sourceCity: string
    sourceStateinUSA: string
    sourceZip: number
    destinationStreet: string
    destinationCity: string
    destinationStateinUSA: string
    destinationZip: number
    showAutofillPopup: boolean


    constructor(props: DocumentProps) {
        super(props)

        this.name = ""
        this.content = ""
        this.debugMsg = ""
        this.historyMsg = ""
        this.showHistoryDropdown = false
        this.isDragging = false
        this.filePath = ""
        this.sourceStreet = ""
        this.sourceCity = ""
        this.sourceStateinUSA = ""
        this.sourceZip = 0
        this.destinationStreet = ""
        this.destinationCity = ""
        this.destinationStateinUSA = ""
        this.destinationZip = 0
        this.showAutofillPopup = false

        this.state = {
            name: "",
            content: "",
            debugMsg: "",
            historyMsg: "",
            showHistoryDropdown: false,
            isDragging: false,
            filePath: "",
            fileQueue: [],
            sourceStreet: "",
            sourceCity: "",
            sourceStateinUSA: "",
            sourceZip: 0,
            destinationStreet: "",
            destinationCity: "",
            destinationStateinUSA: "",
            destinationZip: 0,
            showAutofillPopup: false
        }
    }

    handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        
        // MICRO-CHANGE: Convert FileList to array and get paths for ALL dropped files
        const files = Array.from(e.dataTransfer.files)
        const paths = await Promise.all(files.map(f => getPathForFile(f)))
        
        // Filter out any files that failed to get a path
        const validPaths = paths.filter(path => path)
    
        if (validPaths.length === 0) {
            this.setState({
                isDragging: false,
                debugMsg: "no valid files found",
                fileQueue: [] // Using queue instead of filePath
            })
            return
        } else {
            this.setState({
                isDragging: false,
                debugMsg: `${validPaths.length} file(s) queued`,
                fileQueue: validPaths // Store the array of paths
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
        // MICRO-CHANGE: Check queue length instead of single string
        if (!this.state.fileQueue || this.state.fileQueue.length === 0) {
            this.setState({ debugMsg: "no files to upload" })
            return
        }
    
        // MICRO-CHANGE: Grab the first file in the queue
        const currentFile = this.state.fileQueue[0]
        this.setState({ debugMsg: `processing ${currentFile}...` })
    
        const isImage = currentFile.endsWith('.png') || currentFile.endsWith('.jpg') || currentFile.endsWith('.jpeg');
    
        try {
            let resultData;
    
            if (!isImage) {
                const myPath = await compatibleFile(currentFile)
                resultData = await performOCR(myPath)
            } else {
                resultData = await runReceiptTool(currentFile)
            }
    
            const { source, destination } = this.parseReceiptToolResult(resultData)
            
            // MICRO-CHANGE: Remove the processed file from the queue
            const remainingQueue = this.state.fileQueue.slice(1);
    
            this.setState({
                fileQueue: remainingQueue, // Update the queue
                content: JSON.stringify({ source, destination }, null, 2),
                debugMsg: resultData,
                sourceStreet: source.street,
                sourceCity: source.city,
                sourceStateinUSA: source.state,
                sourceZip: source.zip,
                destinationStreet: destination.street,
                destinationCity: destination.city,
                destinationStateinUSA: destination.state,
                destinationZip: destination.zip,
                showAutofillPopup: true // Pops up for the user to review
            })
    
        } catch (err) {
            this.setState({ debugMsg: `error processing file: ${err}` })
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

    render() {
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
            <div className="myPopUpAutofill">
                <div className="myPopUpBackground">
                    <div>
                        {/* MICRO-CHANGE: Skip to next file on close */}
                        <button onClick={() => {
                            this.setState({ showAutofillPopup: false });
                            if (this.state.fileQueue && this.state.fileQueue.length > 0) this.processUpload();
                        }}>×</button>
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
                        {/* MICRO-CHANGE: Skip to next file on cancel */}
                        <button onClick={() => {
                            this.setState({ showAutofillPopup: false });
                            if (this.state.fileQueue && this.state.fileQueue.length > 0) this.processUpload();
                        }}>
                            Cancel
                        </button>
                        
                        {/* MICRO-CHANGE: Run existing logic, then trigger the next file in the queue */}
                        <button onClick={async () => {
                            this.setState({ showAutofillPopup: false, debugMsg: "autofill confirmed" }); 
                            this.logLocation(); 
                            await this.processDistance(); 
                            this.fetchForHistory();
                            
                            if (this.state.fileQueue && this.state.fileQueue.length > 0) {
                                this.processUpload();
                            }
                        }}>
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
                    <div>
                        {this.state.filePath ? this.state.filePath :  "🚀"}
                    </div>
                </div>

                <div style={{ marginTop: "10px", padding: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={this.processUpload}>
                        submit
                    </button>

                    <button onClick={() => this.setState({ showHistoryDropdown: !this.state.showHistoryDropdown })}>
                        history
                    </button>
                    {/* Update UI to show count */}
                    <div>
                        {this.state.fileQueue?.length > 0 
                            ? `${this.state.fileQueue.length} file(s) queued 🚀` 
                            : "Drop files here 🚀"}
                    </div>
                </div>
            </div>
        )

        return (
            <div>
                {dropWindow}
                {this.state.showAutofillPopup ? autofillPopup : null}
                <div style={{ "height": "10px", "padding": "10px", "borderTop": "2px dashed var(--ink-line)", "margin": "0" }}></div>
                {this.state.showHistoryDropdown ? historyDropdown : null}
            </div>
        )
    }
}