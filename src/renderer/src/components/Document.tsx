import React from "react"
import { getPathForFile } from "../ipc"

type DocumentProps = {
    onClose: () => void
}

type DocumentState = {
    name: string,
    content: string,
    debugMsg: string,
    isDragging: boolean
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


    constructor(props: DocumentProps) {
        super(props)

        this.name = ""
        this.content = ""
        this.debugMsg = ""
        this.isDragging = false

        this.state = {
            name: "",
            content: "",
            debugMsg: "",
            isDragging: false
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
                    : "no file found"
            })
        }).catch((err) => {
            this.setState({
                isDragging: false,
                debugMsg: `error getting file path: ${err}`
            })
        })
    }

    render() {
        const dragWindow = (
            <div className="document-container">
                <div className="mileageToolHeader">
                    <button onClick={this.props.onClose}>❌</button>
                    
                    <h2>document drop tool</h2>
                    
                    <div className = "dragndrop" onDragOver={(e) => {e.preventDefault(); this.setState({ isDragging: true })}} onDragLeave={() => this.setState({ isDragging: false })} onDrop={this.handleDrop}>
                        <p><strong>Choose a file</strong> or drag it here.</p>
                        <p className="documentDebug">{this.state.debugMsg}</p>
                    </div>
                </div>
            </div>
        )
        return (
            <div>
                {dragWindow}
            </div>
        )
    }
}