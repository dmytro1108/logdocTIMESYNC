import gl

def parse_vlm_address(address_string, role_name):
    """Helper to split the VLM's comma-separated string into a JS-compatible dictionary"""
    if not address_string:
        return {"role": role_name, "street": "", "city": "", "state": "", "zip": ""}
    
    # Split by comma and strip whitespace
    parts = [p.strip() for p in address_string.split(",")]
    
    # Pad with empty strings in case the VLM missed parts (e.g., just "Street, City")
    while len(parts) < 4:
        parts.append("")
        
    return {
        "role": role_name,
        "street": parts[0],
        "city": parts[1],
        "state": parts[2],
        "zip": parts[3]
    }

def localProcessing(outputDir, img, modelName):
    
    outputDir = gl.Path(outputDir)
    '''
    result = subprocess.run(
        ["/opt/miniconda3/envs/receipt_processing/bin/tesseract", str(myImage), "stdout", "-l", "eng", "--psm", "3"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    t = result.stdout
    niceT = ln(t)

    print(niceT)
    '''
    # run the VLM
    result = llmVisionator(outputDir, img, modelName)
    return result

def llmVisionator(outputDir, img, modelName):
    outputDir = gl.Path(outputDir)
    #toProcess = json.loads(dump)
    
    imagePath = outputDir / img # look at this pic

    raw = ""

    if modelName == "moondream":

        prompt = """
        Extract only what you see in the image.
        Use exactly this format:
        {"source_address": "", "destination_address": ""}
        """

        response = gl.ollama.generate(
            model=modelName,
            prompt=prompt,
            images=[str(imagePath)],
        )

        raw = response["response"].strip()

    else:
        prompt = """
        You are a highly accurate document data extraction AI. 
        Your task is to analyze the provided image of a shipping label, receipt, or document and extract the sender and receiver addresses.
        
        Rules:
        1. Extract the source address (often labeled as Return Address, From, Sender, or Shipper).
        2. Extract the destination address (often labeled as Ship To, To, Courier Address, Receiver, or Consignee).
        3. Combine multi-line addresses into a single string separated by commas.
        4. If an address cannot be found, set its value to null.
        5. Output strictly as a JSON object. Do not include markdown formatting, conversational text, or explanations.
        
        Expected JSON Schema:
        {
        "source_address": "Street, City, State, Zip",
        "destination_address": "Street, City, State, Zip"
        }
        """
        
        response = gl.ollama.generate(
            model=modelName,
            prompt=prompt,
            images=[str(imagePath)],
            options={
                "temperature": 0.0,
                "num_predict": 150  # Increased to prevent JSON truncation
            }
        )
    
        raw = response["response"].strip()

    # --- START OF FIX: Pre-clean the raw string for markdown wrappers ---
    # 1. Check if the JSON is wrapped in markdown code blocks (```json ... ```)
    if raw.startswith("```"):
        try:
            # Strip markdown start and end markers
            raw = raw.strip('`').replace("json", "").strip()
        except Exception:
            pass # If stripping fails, use the original raw value

    # 2. Defensive check for empty or corrupted data
    if not raw:
        print("Warning: LLM returned an empty response.")
        return {"source_address": "", "destination_address": ""}
    # --- END OF FIX ---


    # temp validation pass
    if gl.TMP:
        print(raw)

    # Use a Try/Except block to handle parsing failures gracefully
    try:
        vlmOut = gl.json.loads(raw)
    except gl.json.JSONDecodeError as e:
        print(f"CRITICAL JSON DECODE ERROR: Failed to parse LLM response. Error: {e}")
        # Fallback: If JSON parsing fails, return empty addresses and log the raw output for debugging.
        return {"source_address": "", "destination_address": ""}


    s = vlmOut.get("source_address", "")
    d = vlmOut.get("destination_address", "")

    # ... rest of the function remains the same


    candidates = []

    source_obj = parse_vlm_address(s, "source")
    dest_obj = parse_vlm_address(d, "destination")

    candidates.append(source_obj)
    candidates.append(dest_obj)

    # imagePath.unlink() # removes the image

    dumpPath = outputDir / "vision_artifact.txt"

    with open(dumpPath, "w", encoding="utf-8") as f:
        gl.json.dump(candidates, f, indent=2)
        
    return {
        "source_address": source_obj,
        "destination_address": dest_obj
    }

if __name__ == "__main__":
    parser = gl.argparse.ArgumentParser()
    parser.add_argument("filePath")
    parser.add_argument("--out", default="./detections")
    parser.add_argument("--model", default="")
    args = parser.parse_args()

    sample = args.filePath
    baseOut = gl.Path(args.out)
    modelName = args.model
    baseOut.mkdir(parents=True, exist_ok=True)

    localProcessing(baseOut, sample, modelName)