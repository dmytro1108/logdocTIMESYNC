import React from "react"
import { getPathForFile, performOCR, runReceiptTool } from "../ipc"

// styling constants
const BUTTON_SIZE: string = "150%";
const FONT_SIZE: string = BUTTON_SIZE;
const TEXT_COLOR: string = "white";

const BUTTON_HEIGHT: string = "50px"; // for buttons
const BUTTON_WIDTH: string = "100px";
const BUTTON_BORDER_COLOR: string = "white";
const BUTTON_BORDER_WIDTH: string = "2px";
const BUTTON_BORDER_RADIUS: string = "5px";
const BUTTON_BACKGROUND_COLOR: string = "transparent";

const BOX_HEIGHT: string = "200px";
const BOX_WIDTH: string = "300px";
const BOX_BORDER_COLOR: string = "white";

type DocumentProps = {
    onClose: () => void
}

type DocumentState = {
    name: string,
    content: string,
    debugMsg: string,
    isDragging: boolean
    filePath: string
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
    


    constructor(props: DocumentProps) {
        super(props)

        this.name = ""
        this.content = ""
        this.debugMsg = ""
        this.isDragging = false
        this.filePath = ""

        this.state = {
            name: "",
            content: "",
            debugMsg: "",
            isDragging: false,
            filePath: "",
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

            this.setState({
                content: `TESSERACT OCR:\n\n${tesseractResult}\n\nRECEIPT TOOL OCR:\n\n${receiptToolResult}`,
                debugMsg: ""
              })
        } catch (err) {
            this.setState({ 
                debugMsg: `error performing OCR: ${err}` })
        }
    }

    render() {
        const dragWindow = (
            <div className="document-container">
                <div className="toolTopBar">
                    <div>
                        <p className="eyebrow">Document Scanner</p>
                        <h2>Upload files</h2>
                        <p className="toolSubtitle">Drop an image receipt, then run OCR.</p>
                    </div>
                    <button className="iconCloseButton" onClick={this.props.onClose}>×</button>
                </div>

                <div className={this.state.isDragging ? "uploadDropZone isDragging" : "uploadDropZone"} onDragOver={(e) => {e.preventDefault(); this.setState({ isDragging: true })}} onDragLeave={() => this.setState({ isDragging: false })} onDrop={this.handleDrop}>
                    <div className="uploadIcon">☁</div>
                    <p className="uploadTitle">Choose a file or drag it here</p>
                    <p className="uploadHint">PNG, JPG, or JPEG</p>
                    <p className="documentDebug">{this.state.filePath ? this.state.filePath : this.state.debugMsg}</p>
                </div>

                <div className="toolActionRow">
                    <button className="primaryActionButton" onClick={this.processUpload}>upload</button>
                    <span className="miniStatus">{this.state.debugMsg || "ready"}</span>
                </div>

                <div className="documentContent">
                    <div className="resultHeader">
                        <h3>OCR Result</h3>
                        <span>{this.state.content ? "output ready" : "waiting for upload"}</span>
                    </div>
                    <pre>{this.state.content || "OCR output will appear here."}</pre>
                </div>
            </div>
        )
        return (
            <div className="toolInner">
                {dragWindow}
            </div>
        )
    }
}