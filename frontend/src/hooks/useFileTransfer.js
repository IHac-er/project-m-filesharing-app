import { useRef } from "react";

export function useFileTransfer(dataChannelRef, onFileReceived, setTransferProgress, myId, showToast) {

    const MAX_BUFFER = 1 * 1024 * 1024;
    const MAX_FILE_SIZE = 500 * 1024 * 1024;

    const incomingFileRef = useRef(null);               
    const receivedChunksRef = useRef([]);               
    const receivedSizeRef = useRef(0);          

    function sendFile(file) {
        const chunksize = 64 * 1024; 

        if (!dataChannelRef.current ||
            dataChannelRef.current.readyState !== "open") {
            console.log("DataChannel not ready");
            return;
        }
    
        // STEP 1: Send Metadata
        // Tell the receiver what file is coming so they can prepare their UI
        dataChannelRef.current.send(JSON.stringify({
            type: "file-meta",
            name: file.name, 
            size: file.size
        }));
        
        // STEP 2: Update Local UI (Sender's View)
        // Create a local blob URL so the sender can see their own file instantly
        const localUrl = URL.createObjectURL(file);
        onFileReceived({
            type: "file",
            name: file.name,
            size: file.size,
            url: localUrl,
            sender: myId
        });

        // Open the progress bar toast
        setTransferProgress({
            type: "sending",
            name: file.name,
            progress: 0
        });

        // STEP 3: Begin Chunking & Sending
        const reader = new FileReader();
        let offset = 0; 
        
        // This function fires every time a 64KB slice is successfully read
        reader.onload = (event) => {
            function sendChunk() {
                // BACKPRESSURE HANDLING: 
                // If the network is struggling and our buffer is full, wait 50ms and try again.
                if (dataChannelRef.current.bufferedAmount > MAX_BUFFER) {
                    setTimeout(sendChunk, 50);
                    return;
                }

                // Send the raw binary data
                dataChannelRef.current.send(event.target.result);
                offset += event.target.result.byteLength;
                
                // Update the Progress Bar UI
                const percent = Math.floor((offset / file.size) * 100);
                setTransferProgress({
                    type: "sending",
                    name: file.name,
                    progress: percent
                });

                // If there is still file left, read the next slice. Otherwise, close the progress bar.
                if (offset < file.size) {
                    readSlice(offset);
                } else {
                    setTransferProgress(null);
                }
            }
            sendChunk();
        };

        // Helper function to read a specific 64KB chunk of the file
        function readSlice(o) {
            const slice = file.slice(o, o + chunksize);
            reader.readAsArrayBuffer(slice); // Triggers reader.onload()
        }

        // Kick off the recursive reading process starting at byte 0
        readSlice(0);
    }

    function handleIncomingData(event) {

        // SCENARIO A: Receiving Metadata (String)
        if (typeof event.data === "string") {
            const message = JSON.parse(event.data);

            if (message.type === "file-meta") {
                incomingFileRef.current = message;
                receivedChunksRef.current = [];
                receivedSizeRef.current = 0;

                setTransferProgress({
                    type: "receiving",
                    name: message.name,
                    progress: 0
                });

                console.log("Receiving File: ", message.name);
            }
        } 
        
        // SCENARIO B: Receiving Binary Chunks (ArrayBuffer)
        else {
            // Push the chunk into memory and update our byte count
            receivedChunksRef.current.push(event.data);
            receivedSizeRef.current += event.data.byteLength;

            // Safety check: Don't process chunks if we missed the metadata
            if (!incomingFileRef.current || !incomingFileRef.current.size) {
                return;
            }

            // Update Progress Bar UI
            const percent = Math.floor(
                (receivedSizeRef.current / incomingFileRef.current.size) * 100
            );
            setTransferProgress({
                type: "receiving",
                name: incomingFileRef.current.name,
                progress: percent
            });

            // STEP 3: Reassembly
            // If we have received all the bytes, stitch them together!
            if (receivedSizeRef.current >= incomingFileRef.current.size) {
                // Combine all the ArrayBuffers into a single downloadable File Object (Blob)
                const blob = new Blob(receivedChunksRef.current);
                const url = URL.createObjectURL(blob);  // Generate a local download link

                // Send the completed file payload up to the main Chat UI
                const fileMessage = {
                    type: "file",
                    name: incomingFileRef.current.name,
                    size: incomingFileRef.current.size,
                    url: url,
                    sender: "peer"
                };

                onFileReceived(fileMessage);

                // Close the progress bar
                setTransferProgress(null);
            }
        }
    }

    function handleFileSelect(event) {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
            showToast("Connection not ready. Please wait a moment.");
            event.target.value = "";
            return;
        }

        const file = event.target?.files?.[0];
        if (!file) return

        if (file.size > MAX_FILE_SIZE) {
            showToast("File too large! Please keep files under 500MB.");
            event.target.value = "";
            return;
        }

        sendFile(file);
    }

    return {
        handleFileSelect,
        handleIncomingData
    };
}