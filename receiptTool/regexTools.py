import gl

def extractCityStateZipParts(line):
    results = []

    chunks = splitCityStateZipLine(line)

    pattern = r'([A-Za-z][A-Za-z .-]+?),\s*([A-Z]{2})\s*([0-9]{5})'

    for chunk in chunks:
        match = gl.re.search(pattern, chunk)

        if match:
            results.append({
                "city": match.group(1).strip(),
                "state": match.group(2).strip(),
                "zip": match.group(3).strip()
            })

    return results

def cleanStreet(text):
    text = text.strip()
    text = text.replace(" ,", ",")

    while "  " in text:
        text = text.replace("  ", " ")

    if text.endswith("."):
        text = text[:-1]

    return text.strip()

def splitAddressLineByStreetStarts(line):
    line = cleanStreet(line)
    parts = gl.re.split(r'\s+(?=\d+\s+)', line)

    cleaned = []
    for part in parts:
        part = cleanStreet(part)
        if part != "":
            cleaned.append(part)

    return cleaned

def extractStreetParts(line):
    results = []

    chunks = splitAddressLineByStreetStarts(line)

    streetTypes = r'(?:St|Street|Ave|Avenue|Rd|Road|Ct|Court|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Pl|Place)'
    pattern = r'^\d+\s+.+?\s+' + streetTypes + r'(?:,\s*Apt\s*\d+)?$'

    for chunk in chunks:
        match = gl.re.search(pattern, chunk, gl.re.IGNORECASE)

        if match:
            results.append(cleanStreet(match.group(0)))

    return results

def splitCityStateZipLine(line):
    pattern = r'([A-Za-z][A-Za-z .-]+?,\s*[A-Z]{2}\s*[0-9]{5})'
    matches = gl.re.findall(pattern, line)

    cleaned = []
    for match in matches:
        cleaned.append(match.strip())

    return cleaned

def extractAddressPairs(lines):
    candidates = []

    for i in range(len(lines)):
        streetLine = lines[i]
        streetMatches = extractStreetParts(streetLine)

        if len(streetMatches) == 0:
            continue

        cityMatches = []
        cityLine = ""

        # look ahead a few lines for the matching city/state/zip row
        for j in range(i + 1, min(i + 4, len(lines))):
            possibleCityLine = lines[j]
            possibleCityMatches = extractCityStateZipParts(possibleCityLine)

            if len(possibleCityMatches) > 0:
                cityLine = possibleCityLine
                cityMatches = possibleCityMatches
                break

        if len(cityMatches) == 0:
            continue

        count = min(len(streetMatches), len(cityMatches))

        for k in range(count):
            cityObj = cityMatches[k]

            candidates.append({
                "name": "",
                "street": streetMatches[k],
                "city": cityObj["city"],
                "state": cityObj["state"],
                "zip": cityObj["zip"],
                "role": "unknown",
                "confidence": "high",
                "evidence": [
                    "tesseract line: " + streetLine,
                    "tesseract line: " + cityLine
                ]
            })

    return candidates

def assignAddressRoles(lines, candidates):
    joined = "\n".join(lines).lower()

    hasFormerCurrent = "former address" in joined and "current address" in joined
    hasOldNew = "address you gave" in joined and "new address" in joined

    if len(candidates) >= 2 and (hasFormerCurrent or hasOldNew):
        candidates[0]["role"] = "source"
        candidates[1]["role"] = "destination"

    return candidates

def buildAutofillFromCandidates(candidates):
    autofill = {
        "documentType": "",
        "sourceStreet": "",
        "sourceCity": "",
        "sourceState": "",
        "sourceZip": "",
        "destinationStreet": "",
        "destinationCity": "",
        "destinationState": "",
        "destinationZip": "",
        "candidateLocations": candidates,
        "needsReview": True,
        "reviewReason": "Location candidates found. Review before mileage calculation."
    }

    for candidate in candidates:
        if candidate.get("role") == "source":
            autofill["sourceStreet"] = candidate.get("street", "")
            autofill["sourceCity"] = candidate.get("city", "")
            autofill["sourceState"] = candidate.get("state", "")
            autofill["sourceZip"] = candidate.get("zip", "")

        if candidate.get("role") == "destination":
            autofill["destinationStreet"] = candidate.get("street", "")
            autofill["destinationCity"] = candidate.get("city", "")
            autofill["destinationState"] = candidate.get("state", "")
            autofill["destinationZip"] = candidate.get("zip", "")

    return autofill

'''
        ⋆˖⁺‧₊⋆˖⁺‧₊☽◯☾₊‧⁺˖⋆ Running the TrOCR + LLM-VLM hint ⋆˖⁺‧₊⋆˖⁺‧₊☽◯☾₊‧⁺˖⋆

'''

def llmValidator(dump):
    
    myDump = gl.json.dumps(dump, indent = 2)
        
    coolReq = """
    Return ONLY valid JSON.
    
    You are an OCR triage filter.
    
    Task:
    Given a list of objects with "file" and "extracted", return only the files that should be reviewed by a vision model.
    
    Review if extracted text may contain:
    name, date, time, ID/code, number, address/place, receipt/document label, sender, receiver, signature, delivery/pickup, total, or corrupted field-like text.
    
    Reject only:
    empty text, single isolated digits, obvious noise, or useless fragments.
    
    For each selected file:
    - copy the exact "file" value from input
    - write a real short reason based on the extracted text
    - do not copy the schema example
    
    Output JSON shape:
    {
      "review_files": [
        {
          "file": "<copy exact input file>",
          "reason": "<why it should be reviewed>"
        }
      ]
    }
    
    Input:
    """

    myPrompt = f"{coolReq}{myDump}"

    if gl.TMP:
        print(myDump)
        print(myPrompt)
    
    response = gl.ollama.generate(
        model="llama3.2:3b-instruct-q4_K_M",
        prompt= myPrompt,
        format= "json",
        options={
            "temperature": 0
        }
    )
    
    out = gl.json.loads(response['response'])
    return out

def llmVisionator(outputDir, records, dump):
    outputDir = gl.Path(outputDir)
    #toProcess = json.loads(dump)
    
    visionResults = []

    for item in dump["review_files"]:
        fileName = item["file"]

        imagePath = outputDir / fileName # look at this pic

        prompt = f"""
            Look at this image crop.
            
            Only copy visible text.
            Do not create fields.
            Do not create JSON.
            Do not infer.
            Do not describe the image.
            Do not guess.
            
            Return one short line of visible text only.
            
            File:
            {fileName}
            
            Visible text:
        """

        response = gl.ollama.generate(
            model="moondream",
            prompt=prompt,
            images=[str(imagePath)],
            options={
                "temperature": 0,
                "num_predict": 25
            }
        )
        
        raw = response["response"].strip()

        if gl.TMP:
            print(raw)
    
        result = {
            "file": fileName,
            "visual_text": raw.strip(),
            "vision_source": "moondream",
            "vision_trust": "low"
        }
        
        visionResults.append(result)
        imagePath.unlink()

    return visionResults

'''
                .𖥔 ݁ ˖.𖥔 ݁ ˖🌿⊹₊⋆✶⋆.˚ Running Tesseract OCR tool .𖥔 ݁ ˖.𖥔 ݁ ˖🌿⊹₊⋆✶⋆.˚
'''

def metaProcessing(myImage, outputDir, records, on):
    outputDir = gl.Path(outputDir)
    if on:
        # 1. First LLM pass: choose crop images worth vision review
        llmPassOne = llmValidator(records)

        # 2. Second pass: weak Moondream hints
        llmPassTwo = llmVisionator(outputDir, records, llmPassOne)
    
    # 3. Whole-document Tesseract OCR
    result = gl.subprocess.run(
        ["tesseract", str(myImage), "stdout", "-l", "eng", "--psm", "3"],
        stdout=gl.subprocess.PIPE,
        stderr=gl.subprocess.PIPE,
        text=True
    )

    rawText = result.stdout

    # 4. Clean Tesseract into readable non-empty lines
    cleanLines = []
    for line in rawText.splitlines():
        line = line.strip()
        if line != "":
            cleanLines.append(line)

    # 5. Deterministic address candidate extraction
    preCandidates = extractAddressPairs(cleanLines)
    preCandidates = assignAddressRoles(cleanLines, preCandidates)
    ruleBasedAutofill = buildAutofillFromCandidates(preCandidates)

    if gl.TMP:
        print("PRE CANDIDATES:")
        print(gl.json.dumps(preCandidates, indent=2))

    # 6. Build evidence metadata
    if on:
        metadata = {
            "tesseract_records": {
                "raw_text": rawText,
                "lines": cleanLines
            },
            "ocr_records": records,
            "vision_hints": llmPassTwo,
            "pre_candidates": preCandidates
        }
    else:
        metadata = {
            "tesseract_records": {
                "raw_text": rawText,
                "lines": cleanLines
            },
            "ocr_records": records,
            # "vision_hints": llmPassTwo,
            "pre_candidates": preCandidates
        }

    # 7. Build autofill only from deterministic address candidates. 
    # LLM/VLM results stay in metadata as weak evidence, but they do not fill fields. 
    autofill = ruleBasedAutofill 
 
    # 8. Keep review true if candidates exist but source/destination is incomplete.
    if len(autofill.get("candidateLocations", [])) > 0: 
        sourceEmpty = ( 
            autofill.get("sourceStreet", "") == "" or 
            autofill.get("sourceCity", "") == "" or 
            autofill.get("sourceState", "") == "" or 
            autofill.get("sourceZip", "") == "" 
        ) 
 
        destinationEmpty = ( 
            autofill.get("destinationStreet", "") == "" or 
            autofill.get("destinationCity", "") == "" or 
            autofill.get("destinationState", "") == "" or 
            autofill.get("destinationZip", "") == "" 
        ) 
 
        if sourceEmpty or destinationEmpty: 
            autofill["needsReview"] = True 
 
            if autofill.get("reviewReason", "") == "": 
                autofill["reviewReason"] = "Location candidates found, but source/destination role needs review."

    # 9. Final output for Electron/React
    finalOutput = {
        "autofill": autofill,
        "metadata": metadata
    }

    metadataPath = outputDir / "metadata.json"
    dp = "receiptTool/detections"
    dumpPath = gl.Path(dp) / "llm_receipt_dump.txt"

    with open(metadataPath, "w", encoding="utf-8") as f:
        gl.json.dump(finalOutput, f, indent=2)

    with open(dumpPath, "w", encoding="utf-8") as f:
        gl.json.dump(preCandidates, f, indent=2)

    return finalOutput