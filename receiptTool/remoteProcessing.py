import gl
from localProcessing import localProcessing

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

def unzip_data(zip_filename, extract_dir):
    """
    Unzips the package, restoring the key.key file and the preProcessing directory.
    """
    zip_filename = gl.Path('hub') / gl.Path(zip_filename)
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

def downloadUnzipDecrypt(file, f, dwnldDir, m):
    masterHub = gl.Path(m)
    fileToUnzip = file
    remote_path = "remote:" / fileToUnzip
    local_path = str(dwnldDir / masterHub)
    unzipDirectoryName = gl.Path("hub") / "good_morning_mr_freeman"

    # Run the rclone copy command to download the file
    gl.subprocess.run(["/opt/homebrew/bin/rclone", "copy", remote_path, local_path], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text=True)
    print(f"Downloaded: {local_path}")

    # continue with the processing pipeline
    unzip_data(fileToUnzip, unzipDirectoryName)
    
    # unencrypt the files
    print("Decrypting files...")
    serverDecrypt(f, unzipDirectoryName)
    print("Process finished! Your unencrypted images are in the preProcessing folder.")

    return True

def processEncryptZip(f, u , modelName):

    files = gl.os.listdir(u)
    om = gl.Path("hub") / "processed_results.txt"
    
    with open(om, "w") as l:
        for i in files:
            filePath = gl.Path("hub") / "good_morning_mr_freeman" / i
            outputDir = gl.Path("hub") / "good_morning_mr_freeman"

            # or just import it and call it manually
            # o = gl.subprocess.run(["python path","receiptTool/localProcessing.py", filePath, outputDir, modelName], capture_output=True, text=True)
            o = localProcessing("./detections", i, modelName)
            
            l.write(o)
    
    # encrypt the file
    encrypted_data = f.encrypt(om)
    
    # zip it
    with gl.zipfile.ZipFile(gl.Path("hub") / "rise_and_shine.zip", 'w', gl.zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(encrypted_data, arcname=gl.os.path.basename(om))
    print(f"Successfully created {gl.Path('hub') / "rise_and_shine.zip"}")
    
    gl.subprocess.run(["/opt/homebrew/bin/rclone", "copy", gl.Path('hub') / "rise_and_shine.zip", "remote:"], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text=True)
    print(f"Uploaded file: {om}")

    return True

def handleRclone(dwnldDir, modelName):
    masterHub = gl.Path.cwd() / "hub"
    # load the key
    key = load_key(masterHub) # copy of the same duplicate key is stored on each device
    f = gl.Fernet(key)
    
    dwnldDir = gl.Path(dwnldDir)
    masterHub = gl.Path.cwd() / "hub"
    unzipDirectoryName = gl.Path("hub") / "good_morning_mr_freeman" # server sees this to unzip

    zipFileName = gl.Path("hub") / "rise_and_shine" # server builds this for the client as a zip file
    
    output = gl.subprocess.run(["/opt/homebrew/bin/rclone", "ls", "remote:"], stdout=gl.subprocess.PIPE, stderr=gl.subprocess.PIPE, text = True)
    n=output.stdout

    filesList = sanitizeOutput(n)
    for i in range(len(filesList)):
        if filesList[i] == "good_morning_mr_freeman.zip": # Slavic Drinks Market Analysis.docx good_morning_mr_freeman.zip
            fileToUnzip = filesList[i]

            print("found-the-file!",filesList[i])
            
            downloadUnzipDecrypt(gl.Path(fileToUnzip), f, dwnldDir, masterHub)

    processEncryptZip(f, unzipDirectoryName, modelName)

    return True

# start rclone server on windows pc
def spinUpServer(port, dwnldDir, modelName):
    
    serverSocket = gl.socket(gl.AF_INET, gl.SOCK_STREAM)
    # serverSocket.bind(('127.0.0.1', port))
    serverSocket.bind(('127.0.0.1', port))
    serverSocket.listen(5)

    handleRcloneCompleted = False

    while True:
        gl.time.sleep(30)

        if not handleRcloneCompleted:
            handleRcloneCompleted = handleRclone(dwnldDir, modelName)
            
        if handleRcloneCompleted:
            gl.time.sleep(300)
        else:
            continue

    # address will be in use everytime you manually kill the process
    sys.exit()

if __name__ == "__main__":
    ''' Remote processing is a standalone script
    It is used to process images on a remote server
    It is only run standalone on the server, not on the client machine
    '''
    port = 9191 # to change?

    dwnldDir = gl.Path.cwd()
    spinUpServer(port, dwnldDir, "moondream") # qwen2.5vl:7b