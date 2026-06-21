import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch
import argparse 
from pathlib import Path
from tqdm import tqdm
import json
import ollama
import subprocess
import re

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
