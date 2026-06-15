import React from "react"
import '../assets/popup.css';
import { getPathForFile, performOCR, runReceiptTool } from "../ipc"

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
    isDragging: boolean,
    filePath: string,
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
 * The Document.tsx component will consist of a drag and drop box area
 */

export class Document extends React.Component<DocumentProps, DocumentState> {
    name: string
    content: string
    debugMsg: string
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
            isDragging: false,
            filePath: "",
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

    handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        
        const file = e.dataTransfer.files[0]
        getPathForFile(file).then((path) => {
            this.setState({
                isDragging: false,
                debugMsg: file
                    ? `file name: ${file.name} | path: ${path}`
                    : "no file found",
                filePath: path
            })
        }).catch((err) => {
            this.setState({
                isDragging: false,
                debugMsg: `error getting file path: ${err}`,
                filePath: ""
            })
        })
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

        if (Object.keys(source).length === 0 && candidates.length > 0) {
            source = candidates[0]
        }

        if (Object.keys(destination).length === 0 && candidates.length > 1) {
            destination = candidates[1]
        }

        return { source, destination }
    }

    // processUpload
    processUpload = async () => {
        this.setState({ debugMsg: "running receipt tool..." })
        if (!this.state.filePath) {
            this.setState({ debugMsg: "no file to upload" })
            return
        }
        if (!this.state.filePath.endsWith('.png') && !this.state.filePath.endsWith('.jpg') && !this.state.filePath.endsWith('.jpeg')) {
            this.setState({ debugMsg: "unsupported file type, please upload a .png, .jpg, or .jpeg file" })
            return
        }
        try {
            this.setState({ debugMsg: "running OCR tools..." })

            const tesseractResult = await performOCR(this.state.filePath)
            const receiptToolResult = await runReceiptTool(this.state.filePath)
            const { source, destination } = this.parseReceiptToolResult(receiptToolResult)


            this.setState({
                content: JSON.stringify({ source, destination }, null, 2),
                debugMsg: "found source and destination locations",
                sourceStreet: source.street || "",
                sourceCity: source.city || "",
                sourceStateinUSA: source.state || "",
                sourceZip: Number(source.zip) || 0,
                destinationStreet: destination.street || "",
                destinationCity: destination.city || "",
                destinationStateinUSA: destination.state || "",
                destinationZip: Number(destination.zip) || 0,
                showAutofillPopup: true
            })
            
        } catch (err) {
            this.setState({ 
                debugMsg: `error performing OCR: ${err}` })
        }
    }

    render() {
        const autofillPopup = (
            <div className="simpleAutofillPopupBackground">
                <div className="simpleAutofillPopupWindow" style={{ backgroundColor: TOOL_PANEL_BACKGROUND, border: TOOL_BORDER, borderRadius: TOOL_RADIUS }}>
                    <div className="simpleAutofillPopupHeader">
                        <div>
                            <p className="eyebrow">Autofill Preview</p>
                            <h2>Confirm scanned locations</h2>
                            <p>These fields were populated from the document scan. Edit anything that looks wrong, then confirm.</p>
                        </div>
                        <button className="iconCloseButton" onClick={() => this.setState({ showAutofillPopup: false })}>×</button>
                    </div>

                    <div className="simpleAutofillPopupRows">
                        <div className="simpleAutofillPopupSection" style={{ backgroundColor: TOOL_SOFT_BACKGROUND, border: TOOL_BORDER, borderRadius: TOOL_RADIUS }}>
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
                        <div className="simpleAutofillPopupSection" style={{ backgroundColor: TOOL_SOFT_BACKGROUND, border: TOOL_BORDER, borderRadius: TOOL_RADIUS }}>
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
                    <div className="simpleAutofillPopupButtons">
                        <button onClick={() => this.setState({ showAutofillPopup: false })}>
                            Cancel
                        </button>
                        <button className="primaryActionButton" onClick={() => this.setState({ showAutofillPopup: false, debugMsg: "autofill confirmed" })}>
                            Use Autofill
                        </button>
                    </div>
                </div>
            </div>
        )

        const dragWindow = (
            <div className="document-container">
                <div className="toolTopBar">
                    <div>
                        <p className="eyebrow">Document Scanner</p>
                        <h2>Upload files</h2>
                        <p className="toolSubtitle">Drop an image receipt, then run OCR.</p>
                    </div>
                    <button className="iconCloseButton" style={{ width: BUTTON_HEIGHT, height: BUTTON_HEIGHT, borderRadius: BUTTON_BORDER_RADIUS }} onClick={this.props.onClose}>×</button>
                </div>

                <div className={this.state.isDragging ? "uploadDropZone isDragging" : "uploadDropZone"} style={{ minHeight: BOX_HEIGHT, maxWidth: BOX_WIDTH, borderColor: BOX_BORDER_COLOR, color: TEXT_COLOR }} onDragOver={(e) => {e.preventDefault(); this.setState({ isDragging: true })}} onDragLeave={() => this.setState({ isDragging: false })} onDrop={this.handleDrop}>
                    <div className="uploadIcon">☁</div>
                    <p className="uploadTitle">Choose a file or drag it here</p>
                    <p className="uploadHint">PNG, JPG, or JPEG</p>
                    <p className="documentDebug">{this.state.filePath ? this.state.filePath : this.state.debugMsg}</p>
                </div>

                <div className="toolActionRow">
                    <button className="primaryActionButton" style={{ minHeight: BUTTON_HEIGHT, minWidth: BUTTON_WIDTH, borderRadius: BUTTON_BORDER_RADIUS, backgroundColor: BUTTON_BACKGROUND_COLOR }} onClick={this.processUpload}>upload</button>
                    <span className="miniStatus">{this.state.debugMsg || "ready"}</span>
                </div>

                <div className="documentContent">
                    <div className="resultHeader">
                        <h3>OCR Result</h3>
                        <span>{this.state.content ? "output ready" : "waiting for upload"}</span>
                    </div>
                </div>
            </div>
        )
        return (
            <div className="toolInner">
                {dragWindow}
                {this.state.showAutofillPopup ? autofillPopup : null}
            </div>
        )
    }
}