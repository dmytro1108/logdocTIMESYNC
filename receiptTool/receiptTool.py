import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch
import argparse
from pathlib import Path
from tqdm import tqdm

def hDPOne(filePath, outputDir, blr, lnk, dil, minArea, minBox, maxWR, maxHR, maxDensity, boxRejectOne, boxRejectTwo, pName, dbg=False):
    outputDir = Path(outputDir)
    outputDir.mkdir(parents=True, exist_ok=True)

    savedFiles = []

    img = cv2.imread(filePath)
    if img is None:
        raise FileNotFoundError(filePath)

    pilImg = Image.open(filePath).convert("RGB")

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape[:2]

    blur = cv2.GaussianBlur(gray, blr, 0)

    _, ink = cv2.threshold(
        blur, 0, 255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )

    hKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (lnk[0], 1))
    vKernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, lnk[1]))

    horizontal = cv2.morphologyEx(ink, cv2.MORPH_OPEN, hKernel)
    vertical = cv2.morphologyEx(ink, cv2.MORPH_OPEN, vKernel)

    lines = cv2.bitwise_or(horizontal, vertical)
    remLines = cv2.subtract(ink, lines)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, dil)
    joined = cv2.dilate(remLines, kernel, iterations=1)

    contours, _ = cv2.findContours(
        joined,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    boxes = []

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
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
        density = cv2.countNonZero(roi) / max(1, area)

        if density > maxDensity:
            continue
        if h < boxRejectOne[0] and w < boxRejectOne[1]:
            continue
        if w < boxRejectTwo[0] and h < boxRejectTwo[1]:
            continue

        boxes.append((x, y, x + w, y + h))

    boxes = sorted(boxes, key=lambda b: (b[1], b[0]))

    vis = rgb.copy()

    for idx, (x1, y1, x2, y2) in enumerate(boxes):
        pad = 12

        x1p = max(0, x1 - pad)
        y1p = max(0, y1 - pad)
        x2p = min(width, x2 + pad)
        y2p = min(height, y2 + pad)

        cv2.rectangle(vis, (x1p, y1p), (x2p, y2p), (255, 0, 0), 2)

        crop = pilImg.crop((x1p, y1p, x2p, y2p))
        savePath = outputDir / f"image-{idx:03d}.png"
        crop.save(savePath)
        savedFiles.append(savePath)

    if dbg:
        show(vis, f"detected boxes: {len(boxes)}")

    metadata = []

    for idx, (x1, y1, x2, y2) in enumerate(boxes):
        metadata.append({
            "file": f"image-{idx:03d}.png",
            "box": [x1, y1, x2, y2],
            "width": x2 - x1,
            "height": y2 - y1,
            "source": filePath,
            "pass": pName
        })
        
    import json
    with open(Path(outputDir) / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    return boxes, savedFiles

def read_with_trocr(image_path):
    img = Image.open(image_path).convert("RGB")

    img = ImageOps.grayscale(img)
    img = ImageEnhance.Contrast(img).enhance(2.2)
    img = ImageEnhance.Sharpness(img).enhance(2.0)

    w, h = img.size
    img = img.resize((w * 3, h * 3))

    img = img.convert("RGB")

    pixel_values = processor(
        images=img,
        return_tensors="pt"
    ).pixel_values.to(device)

    with torch.no_grad():
        generated_ids = model.generate(
            pixel_values,
            max_new_tokens=64
        )

    return processor.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0].strip()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("filePath")
    parser.add_argument("--out", default="./detections")
    parser.add_argument("--passes", default="1,2,3")
    args = parser.parse_args()

    sample = args.filePath
    baseOut = Path(args.out)
    baseOut.mkdir(parents=True, exist_ok=True)

    selected = set(args.passes.split(","))

    passes = []

    if "1" in selected:
        passes.append((baseOut / "detected1", (5, 5), (45, 35), (22, 4), 180, (18, 7), 0.70, 0.15, 0.38, (14, 90), (85, 30), "pass_one"))

    if "2" in selected:
        passes.append((baseOut / "detected2", (3, 3), (55, 45), (32, 6), 120, (12, 6), 0.82, 0.20, 0.48, (10, 60), (55, 22), "pass_two"))

    if "3" in selected:
        passes.append((baseOut / "detected3", (3, 3), (65, 55), (45, 8), 80, (8, 5), 0.90, 0.25, 0.58, (8, 45), (40, 18), "pass_three"))

    folders = []

    for item in tqdm(passes, desc="Detecting handwriting regions"):
        folder = item[0]
        params = item[1:]

        hDPOne(sample, folder, *params)
        folders.append(folder)

    device = "mps" if torch.backends.mps.is_available() else "cpu"

    processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")

    model = VisionEncoderDecoderModel.from_pretrained(
        "microsoft/trocr-base-handwritten"
    ).to(device)

    model.eval()

    all_text = []

    for folder in folders:
        image_files = sorted(
            list(folder.glob("*.png")) +
            list(folder.glob("*.jpg")) +
            list(folder.glob("*.jpeg"))
        )

        print(f"\nScanning {folder}")
        print(f"Images: {len(image_files)}")

        pbar = tqdm(image_files, desc=f"TrOCR {folder.name}")

        for image_file in pbar:
            try:
                pbar.set_postfix_str(image_file.name)
                text = read_with_trocr(image_file)

                # save space
                image_file.unlink()

                if text:
                    all_text.append(text)

            except Exception as e:
                print(image_file.name, e)

    dump_path = baseOut / "llm_receipt_dump.txt"

    with open(dump_path, "w") as f:
        f.write("\n".join(all_text))

    print(str(dump_path))