# pre-process all the files in the folder
import os
from pathlib import Path
from cryptography.fernet import Fernet
from PIL import Image

def write_key():
    """
    Generates a key and save it into a file
    """
    key = Fernet.generate_key()
    with open("key.key", "wb") as key_file:
        key_file.write(key)

def load_key():
    """
    Loads the key from the current directory named `key.key`
    """
    return open("key.key", "rb").read()

def clientPreProcessing(rawArray):

    dirPath = 'preProcessing'
    
    # create a directory if it doesn't exist
    if not os.path.exists(dirPath):
          os.makedirs(dirPath)
        
    # iterate over the array and rename each file
    count = 0
    for i in rawArray:
        os.rename(i, Path(dirPath) / Path(str(count) + ".png"))
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
    files = os.listdir('preProcessing')
    
    count = 0
    for i in files:
        # encrypt each file

        # build the path
        dirPath = 'preProcessing'
        i2 = Path(dirPath) / Path(i)

        fData = imageToBytes(i2, "", 1)

        # encrypt
        encrypted = f.encrypt(fData)

        # write the data
        imageToBytes(i2, encrypted, 0)
        
        print(f"Encrypted file: {i}")

def clientDecrypt(key, f):

    files = os.listdir('preProcessing')

    for i in files:
        # Build the file path
        dirPath = 'preProcessing'
        i2 = Path(dirPath) / Path(i)
    
        # Read the encrypted bytes
        dData = bytesToImage(i2)
    
        # Decrypt the data inside the loop
        decrypted_data = f.decrypt(dData)
    
        # Write the decrypted data back to disk
        imageToBytes(i2, decrypted_data, 0)
    
        print(f"Decrypted file: {i}")

if __name__ == "__main__":
    # now we will want to encrypt those files in place and delete the originals
    # all files are deleted and renamed after this step
    # clientPreProcessing(rawDocs)

    # DEMO PART 1
    # generate and write a new key (runs once)
    # write_key()

    # load the previously generated key
    key = load_key()

    # initialize the Fernet class
    f = Fernet(key)

    clientEncrypt(key,f)

    # send the file over gcode

    # pull the processing file and decrypt it
    clientDecrypt(key, f)
