import gl
from localProcessing import llmVisionator

# read the raw binary content of the image directly
def imageToBytes(im, enc, opt):
    
    # Open the file in binary read mode

    if opt:
        with open(im, "rb") as binary_file:
            # Read the entire content of the file
            data = binary_file.read()
            return data
    else:
        with open(im, "wb") as encryptedFile:
            encryptedFile.write(enc)

def bytesToImage(im):
    
    with open(im, "rb") as binary_file:
        data = binary_file.read()
        return data

def write_key(m):
    """
    Generates a key and save it into a file
    """
    key = gl.Fernet.generate_key()
    with open(gl.Path(m) / "key.key", "wb") as key_file:
        key_file.write(key)

def load_key(m):
    """
    Loads the key from the current directory named `key.key`
    """
    return open(gl.Path(m) / "key.key", "rb").read()

def unzip_data(mp, a, extract_dir):
    """
    Unzips the package, restoring the key.key file and the preProcessing directory.
    """
    zip_filename = mp / a
    print(f"Unzipping {zip_filename}...")
    
    # Open the zip file in read mode
    with gl.zipfile.ZipFile(zip_filename, 'r') as zipf:
        # Extract all contents to the specified directory (default is current directory)
        zipf.extractall(extract_dir)
        
    print("Unzip complete!")

def serverDecrypt(f, unzipDir):
    
    files = gl.os.listdir(unzipDir)

    for i in files:
        # Build the file path
        dirPath = unzipDir
        i2 = gl.Path(dirPath) / gl.Path(i)
    
        # Read the encrypted bytes
        dData = bytesToImage(i2)
    
        # Decrypt the data inside the loop
        decrypted_data = f.decrypt(dData)
    
        # Write the decrypted data back to disk
        imageToBytes(i2, decrypted_data, 0)
    
        print(f"Decrypted file: {i}")

def sanitizeOutput(rcloneLsInput):
    
    nice = gl.ln(rcloneLsInput)
    niceLength = len(nice)
    count = -1
    firstWhitespace = 0
    buildWord = ''
    sanitizedOutput = []
    
    
    for x in range(niceLength):
        for y in range(len(nice[x])):
            if nice[x][y] == ' ':
                count = 1
                firstWhitespace = y # position of the first whitespace
                break
    
        startingIndex = firstWhitespace + 1
        endingIndex = startingIndex + len(nice[x][startingIndex:])
        
        for startingIndex in range(startingIndex, endingIndex):
            buildWord += nice[x][startingIndex]
    
        if count > 0:
            sanitizedOutput.append(buildWord)
            buildWord = ''
            count = 0

    return sanitizedOutput

def downloadUnzipDecrypt(f, mp, file, sh, ch):

    remote_path = "remote:" / file
    local_path = str(mp)

    unzipDirectoryName = mp / sh

    # Run the rclone copy command to download the file
    gl.subprocess.run(["/opt/homebrew/bin/rclone", "copy", remote_path, local_path], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text=True)
    print(f"Downloaded: {local_path}")

    # rclone deletefile remote_path, part of cleanup
    gl.subprocess.run(["/opt/homebrew/bin/rclone", "deletefile", remote_path], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text=True)


    # continue with the processing pipeline
    unzip_data(mp, file, unzipDirectoryName)
    
    # unencrypt the files
    print("Decrypting files...")
    serverDecrypt(f, unzipDirectoryName)
    print("Process finished! Your unencrypted images are in the preProcessing folder.")
    return True

def processEncryptZip(f, mp, u, modelName, sh, ch):

    files = gl.os.listdir(u)
    om = mp / "processed_results.txt"

    results = []
    
    for i in files:
        filePath = mp / sh / i

        if gl.DBG:
            print("file for processing: ", i, "using the model: :", modelName)

        outputDir = mp / sh

        # or just import it and call it manually
        # o = gl.subprocess.run(["python path","receiptTool/localProcessing.py", filePath, outputDir, modelName], capture_output=True, text=True)
        o = llmVisionator(outputDir, filePath, modelName) # def llmVisionator(outputDir, img, modelName):

        result = {
            "source_address": o.get("source_address", ""),
            "destination_address": o.get("destination_address", "")
        }
        results.append(result)

    with open(om, "w", encoding="utf-8") as l:
        gl.json.dump(results, l, indent=4, ensure_ascii=False)
    print("results writtent to: ", om )

    # read and recode the file into bytes
    d = imageToBytes(om, "", 1)

    # encrypt the file
    encrypted_data = f.encrypt(d)

    imageToBytes(om, encrypted_data, 0)

    outFile = mp / gl.Path(ch+".zip")
    # zip it
    with gl.zipfile.ZipFile(outFile, 'w', gl.zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(om, arcname=gl.os.path.basename(om))
    print(f"Successfully created {outFile}")
    
    gl.subprocess.run(["/opt/homebrew/bin/rclone", "copy", outFile, "remote:"], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text=True)
    print(f"Uploaded file: {om} successfully")

    return True

def handleRclone(p, modelName, sh, ch):
    mp = gl.Path(p)
    # load the key
    key = load_key(mp) # copy of the same duplicate key is stored on each device
    f = gl.Fernet(key)
    
    unzipDirectoryName = mp / sh # server sees this to unzip
    zipFileName = mp / ch # server builds this for the client as a zip file
    
    output = gl.subprocess.run(["/opt/homebrew/bin/rclone", "ls", "remote:"], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text = True)
    n=output.stdout

    filesList = sanitizeOutput(n)
    for i in range(len(filesList)):
        if filesList[i] == gl.Path(sh+".zip"):
            fileToUnzip = gl.Path(filesList[i])

            print("found-the-file!", filesList[i])
            
            downloadUnzipDecrypt(f, mp, fileToUnzip, sh, ch)

    r = processEncryptZip(f, mp, unzipDirectoryName, modelName, sh, ch)

    return r

# start rclone server on windows pc
def spinUpServer(port, p, t, modelName, sh, ch):
    
    serverSocket = gl.socket(gl.AF_INET, gl.SOCK_STREAM)
    # serverSocket.bind(('127.0.0.1', port))
    serverSocket.bind(('127.0.0.1', port))
    serverSocket.listen(5)

    handleRcloneCompleted = False
    
    t = int(t)
    modelName = str(modelName) # frequently breaks so cast it

    while True:
        gl.time.sleep(30)

        if not handleRcloneCompleted:
            handleRcloneCompleted = handleRclone(p, modelName, sh, ch)
            
            if handleRcloneCompleted == False:
                continue
            else:
                # ⋆｡ ☁︎｡ ⋆｡ ☾ ｡ ⋆cleanup⋆｡ ☁︎｡ ⋆｡ ☾ ｡ ⋆
                cleanUpDir = p / sh
                gl.shutil.rmtree(cleanUpDir)
                # gl.os.remove(p /"key.key")
                gl.os.remove(p/gl.Path(sh+".zip")) # clean up
                gl.os.remove(p/gl.Path(ch+".zip"))
                gl.os.remove(p/"processed_results.txt")
            
        if handleRcloneCompleted:
            gl.time.sleep(t)
            handleRcloneCompleted = False
        else:
            continue

    # address will be in use everytime you manually kill the process
    sys.exit()

DATA = False # server log
DACK= "ACK"
SUCCESS = "1"
INVALID = "3"
ADDRESS = '127.0.0.1'
PORT = 9191 # to change?

# client is meant to connect to the server 
def clientHello(jsonData):
    gl.subprocess.Popen(["/opt/miniconda3/envs/receipt_processing/bin/python", "remoteProcessing.py", "--remoteSwitch", "1"])
    gl.time.sleep(1)

    # attempt a connection to the address and port
    client =  gl.socket(gl.AF_INET, gl.SOCK_STREAM)
    client.connect((ADDRESS, PORT))

    # parse the json object into a list: l = ["file1.png", "file2.png"...]
    file_paths = [item['filePath'] for item in jsonData]

    # Serialize to a valid JSON array so the server can easily decode it
    message = f"CLOSE-{gl.json.dumps(file_paths)}"
    client.sendall(message.encode("utf-8"))
    response = client.recv(4096)

    print(response.decode("utf-8"))

def make_response(code, data_type, msg):
    return code + " " + data_type + " " + msg

def handleClientHello(connectionSocket, addr):
    if DATA: print('Connection from', addr)

    message = connectionSocket.recv(1024).decode()
    if DATA: print('Recieved', message)
    while True: # comms with client

        if message == "":
            if DATA: print("Client disconnected")
            break

        if message.startswith("CLOSE-"):
            payload = message.removeprefix("CLOSE-")  # Python 3.9+ (or use message[6:])
            if payload:
                try:
                    paths = gl.json.loads(payload)
                    print(f"Received file paths to close: {paths}")
                except gl.json.JSONDecodeError:
                    print(f"Received raw data: {payload}")

            response = make_response(SUCCESS, DACK, "Closing connection")
            connectionSocket.sendall(response.encode())
            break

        if message == "UPLOAD":
            response = make_response(SUCCESS, DACK, "uploading")
            connectionSocket.sendall(response.encode())
            break

        if message == "DOWNLOAD":
            response = make_response(SUCCESS, DACK, "downloading")
            connectionSocket.sendall(response.encode())
            break

    pass

# we make three different calls, 
def clientServer(port, p, t, modelName, sh, ch):
    # port 9192
    # server runs and only purpose is to communicate with the client and do
    # whatever the client says, is also responsible for killing the client server
    serverSocket = gl.socket(gl.AF_INET, gl.SOCK_STREAM)
    # serverSocket.bind(('127.0.0.1', port))
    serverSocket.bind((ADDRESS, port)) # of use '127.0.0.2' when running on the same pc
    serverSocket.listen(5)

    while True:
        if DATA: print('Ready to serve...')

        connectionSocket, addr = serverSocket.accept()
        
        client_thread = gl.threading.Thread(target=handleClientHello, args=(connectionSocket, addr))
        client_thread.start()
        
    sys.exit()

if __name__ == "__main__":
    parser = gl.argparse.ArgumentParser()
    parser.add_argument("--throttleSpeed", default = "300")
    parser.add_argument("--modelName", default = "moondream")
    parser.add_argument("--remoteSwitch", type=int, default = 1)

    # typescript will pass in a list as a variable, and i will unpack it here
    # https://stackoverflow.com/questions/15753701/how-can-i-pass-a-list-as-a-command-line-argument-with-argparse
    parser.add_argument('--data', type=gl.json.loads) # #/opt/miniconda3/envs/receipt_processing/bin/python remoteProcessing.py --remoteSwitch 2 --nargs ""/mypath/file1.png" "/mypath/file2.png" "/mypath/file3.png""
    # maybe pass a json object as an argument


    args = parser.parse_args()

    tSpeed = args.throttleSpeed
    mdName = args.modelName
    s = args.remoteSwitch
    a = args.data

    # processing hub
    p = gl.Path.cwd() / "receiptTool" / "hub"
    serverHandles = "good_morning_mr_freeman"
    clientHandles = "rise_and_shine"

    if s == 0:
        spinUpServer(PORT, p, tSpeed, mdName, serverHandles, clientHandles) # qwen2.5vl:7b or moondream
    elif s == 1:
        # or when integrating we simply make two calls on this file
        # /opt/miniconda3/envs/receipt_processing/bin/python remoteProcessing.py --remoteSwitch 1
        clientServer(PORT, p, tSpeed, mdName, serverHandles, clientHandles)
    else:
        #/opt/miniconda3/envs/receipt_processing/bin/python remoteProcessing.py --remoteSwitch 2
        clientHello(a)