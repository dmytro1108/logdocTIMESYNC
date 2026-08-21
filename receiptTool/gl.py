import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance
import argparse 
import json
import ollama
import subprocess
import re
import os
from cryptography.fernet import Fernet
import zipfile
from socket import *
import sys
import time

#device = "mps" if torch.backends.mps.is_available() else "cpu"
#processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
#model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten").to(device)
#model.eval()

DBG = 0
DBG2 = 0
LLMDBG = 0
TMP = 0

'''
    method that seperates each line, and returns the seperated lines as an array
'''
def ln(a):
    g = []
    for i in a.splitlines():
        i = i.strip()
        if i != "":
            g.append(i)
    return g

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
