# pre-process all the files in the folder
import gl

def clientPreProcessing(rawArray):

    dirPath = 'preProcessing'
    
    # create a directory if it doesn't exist
    if not gl.os.path.exists(dirPath):
          gl.os.makedirs(dirPath)
        
    # iterate over the array and rename each file
    count = 0
    for i in rawArray:
        gl.os.rename(i, gl.Path(dirPath) / gl.Path(str(count) + ".png"))
        count += 1

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

def clientEncrypt(key, f):
    # open the directory, iterate through each file and encrypt each one
    files = gl.os.listdir('preProcessing')
    
    count = 0
    for i in files:
        # encrypt each file

        # build the path
        dirPath = 'preProcessing'
        i2 = gl.Path(dirPath) / gl.Path(i)

        fData = imageToBytes(i2, "", 1)

        # encrypt
        encrypted = f.encrypt(fData)

        # write the data
        imageToBytes(i2, encrypted, 0)
        
        print(f"Encrypted file: {i}")

def clientDecrypt(key, f):

    files = gl.os.listdir('preProcessing')

    for i in files:
        # Build the file path
        dirPath = 'preProcessing'
        i2 = gl.Path(dirPath) / gl.Path(i)
    
        # Read the encrypted bytes
        dData = bytesToImage(i2)
    
        # Decrypt the data inside the loop
        decrypted_data = f.decrypt(dData)
    
        # Write the decrypted data back to disk
        imageToBytes(i2, decrypted_data, 0)
    
        print(f"Decrypted file: {i}")

if __name__ == "__main__":
    parser = gl.argparse.ArgumentParser()
    parser.add_argument("arrayOfFiles")
    parser.add_argument("--out", default="./detections")
    args = parser.parse_args()

    sample = args.filePath
    baseOut = gl.Path(args.out)
    baseOut.mkdir(parents=True, exist_ok=True)

