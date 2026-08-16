import gl
from rt import metaProcessing
"""

The file contains functions for pre-processing an image for TrOCR handwritten text detection

"""
def preProcessImg(myImg, blr, lnk, dil):
    img = gl.cv2.imread(myImg)
    if img is None:
        raise FileNotFoundError(gl.filePath)

    pilImg = gl.Image.open(myImg).convert("RGB")
    
    if gl.DBG: pilImg.show()
    
    rgb = gl.cv2.cvtColor(img, gl.cv2.COLOR_BGR2RGB)
    gray = gl.cv2.cvtColor(img, gl.cv2.COLOR_BGR2GRAY)
    height, width = gray.shape[:2]

    blur = gl.cv2.GaussianBlur(gray, blr, 0)

    _, ink = gl.cv2.threshold(
        blur, 0, 255,
        gl.cv2.THRESH_BINARY_INV + gl.cv2.THRESH_OTSU
    )

    hKernel = gl.cv2.getStructuringElement(gl.cv2.MORPH_RECT, (lnk[0], 1)) # mask horizontal lines
    vKernel = gl.cv2.getStructuringElement(gl.cv2.MORPH_RECT, (1, lnk[1])) # mask vertical lines

    if gl.TMP: 
        print(hKernel)
        print(vKernel)
    
    horizontal = gl.cv2.morphologyEx(ink, gl.cv2.MORPH_OPEN, hKernel)
    vertical = gl.cv2.morphologyEx(ink, gl.cv2.MORPH_OPEN, vKernel)

    lines = gl.cv2.bitwise_or(horizontal, vertical)
    remLines = gl.cv2.subtract(ink, lines)

    kernel = gl.cv2.getStructuringElement(gl.cv2.MORPH_RECT, dil)

    if gl.TMP: print(kernel) # mask headers, tables
    
    joined = gl.cv2.dilate(remLines, kernel, iterations=1)

    # shape coordinates
    contours, _ = gl.cv2.findContours(
        joined,
        gl.cv2.RETR_EXTERNAL,
        gl.cv2.CHAIN_APPROX_SIMPLE
    )

    return contours, remLines, height, width

def boxify(contours, remLines, height, width, minArea, minBox, maxWR, maxHR, maxDensity, boxRejectOne, boxRejectTwo):
    boxes = []

    for c in contours:
        x, y, w, h = gl.cv2.boundingRect(c)
        area = w * h

        if area < minArea:
            continue
        if w < minBox[0] or h < minBox[1]:
            continue
        if w > width * maxWR:
            continue
        if h > height * maxHR:
            continue

        roi = remLines[y:y+h, x:x+w]
        density = gl.cv2.countNonZero(roi) / max(1, area)

        if density > maxDensity:
            continue
        if h < boxRejectOne[0] and w < boxRejectOne[1]:
            continue
        if w < boxRejectTwo[0] and h < boxRejectTwo[1]:
            continue

        boxes.append((x, y, x + w, y + h))

    return boxes

def read_with_trocr(image_path):
    img = gl.Image.open(image_path).convert("RGB")

    img = gl.ImageOps.grayscale(img)
    img = gl.ImageEnhance.Contrast(img).enhance(2.2)
    img = gl.ImageEnhance.Sharpness(img).enhance(2.0)

    w, h = img.size
    img = img.resize((w * 3, h * 3))

    img = img.convert("RGB")

    pixel_values = gl.processor(
        images=img,
        return_tensors="pt"
    ).pixel_values.to(gl.device)

    with gl.torch.no_grad():
        generated_ids = gl.model.generate(
            pixel_values,
            max_new_tokens=64
        )

    return gl.processor.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0].strip()

def singleTP(myImg, outputDir, boxes):
    savedFiles = []
    metadata = []
    
    img = gl.cv2.imread(myImg)
    if img is None:
        raise FileNotFoundError(gl.filePath)
    rgb = gl.cv2.cvtColor(img, gl.cv2.COLOR_BGR2RGB)
    gray = gl.cv2.cvtColor(img, gl.cv2.COLOR_BGR2GRAY)
    height, width = gray.shape[:2]

    pilImg = gl.Image.open(myImg).convert("RGB")
    
    if gl.DBG: pilImg.show()

    boxes = sorted(boxes, key=lambda b: (b[1], b[0]))

    vis = rgb.copy()

    fDump = "llm_receipt_dump.txt"

    for idx, (x1, y1, x2, y2) in enumerate(boxes):
        pad = 12

        x1p = max(0, x1 - pad)
        y1p = max(0, y1 - pad)
        x2p = min(width, x2 + pad)
        y2p = min(height, y2 + pad)

        gl.cv2.rectangle(vis, (x1p, y1p), (x2p, y2p), (255, 0, 0), 2)

        crop = pilImg.crop((x1p, y1p, x2p, y2p))

        fNew = f"image-{idx:03d}.png"
        
        savePath = outputDir / fNew
        crop.save(savePath)
        savedFiles.append(savePath)

        dump_path = outputDir / fDump

        text = read_with_trocr(savePath)
        
        if gl.DBG:
            print(text)
            
        if text and len(text.strip()) >= 3: # filter length
            t = text.strip() + "\n"
            
            metadata.append({ # only add
                "file": fNew,
                "extracted": text
            })
                        
            with open(dump_path, "a") as f:
                f.write(t)
            if gl.DBG: print(str(dump_path))
        else:
            # trash collection
            savePath.unlink()

        if gl.TMP: crop.show()

    if gl.DBG:
        gl.ollama.show(vis, f"detected boxes: {len(boxes)}")

    return savedFiles, metadata

def writeRecords(outputDir, records):
    metadataPath = gl.Path(outputDir) / "metadata.json"
    
    with open(metadataPath, "w", encoding="utf-8") as f:
        gl.json.dump(records, f, indent=2)

'''
This function is the main orchestrator.
'''
def hDPOne(filePath, outputDir, blr, lnk, dil, minArea, minBox, maxWR, maxHR, maxDensity, boxRejectOne, boxRejectTwo, pName, on, dbg=False):
    outputDir = gl.Path(outputDir)
    outputDir.mkdir(parents=True, exist_ok=True)

    contours, remLines, height, width = preProcessImg(filePath, blr, lnk, dil)
    boxes = boxify(contours, remLines, height, width, minArea, minBox, maxWR, maxHR, maxDensity, boxRejectOne, boxRejectTwo)
    
    # boxes get snipped, exported and processed by TrOCR
    savedFiles, metadata = singleTP(filePath, outputDir, boxes)
    
    # read from the file after TrOCR is done
    # reserved for the debugging step after the main processing and TrOCR is complete
    if gl.DBG:
        # writeRecords(outputDir, metadata) # finish compile
        reusable = []
        metadataPath = gl.Path(outputDir) / "metadata.json"
        with open(metadataPath, "r") as f:
            data = gl.json.load(f)
            
            reusable.extend(data)
        metaProcessing(filePath, outputDir, reusable, on)
    else:
        metaProcessing(filePath, outputDir, metadata, on) # final step


if __name__ == "__main__":
    parser = gl.argparse.ArgumentParser()
    parser.add_argument("filePath")
    parser.add_argument("--out", default="./detections")
    parser.add_argument("--ai",default = "false")
    args = parser.parse_args()

    sample = args.filePath
    baseOut = gl.Path(args.out)
    aiFlag = args.ai
    baseOut.mkdir(parents=True, exist_ok=True)
    
    passes = []

    passes.append((baseOut / "detected1", (5, 5), (45, 35), (22, 4), 180, (18, 7), 0.70, 0.15, 0.38, (14, 90), (85, 30), "pass_one", aiFlag))

    folders = []

    for item in gl.tqdm(passes, desc="Detecting handwriting regions"):
        folder = item[0]
        params = item[1:]

        hDPOne(sample, folder, *params)
        folders.append(folder)

