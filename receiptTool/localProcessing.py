from pathlib import Path
import ollama


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



# local processing: this processing will use a configuration of ollama that will call it directly for processing
# the processing

'''
    method will run tesseract, filter and write the output as metadata
    method will run a local VLM  model, filter and write  the output as 
'''
def localProcessing(outputDir, img):
    
    outputDir = Path(outputDir)
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
    result = llmVisionator(outputDir, img)
    return result

def llmVisionator(outputDir, img):
    outputDir = Path(outputDir)
    #toProcess = json.loads(dump)
    
    visionResults = []

    imagePath = outputDir / img # look at this pic

    # Use a raw string, no variables. Keep it incredibly direct.
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

    response = ollama.generate(
        model="qwen2.5vl:7b",
        prompt=prompt,
        images=[str(imagePath)],
        options={
            "temperature": 0.0,
            "num_predict": 150  # Increased to prevent JSON truncation
        }
    )
    
    raw = response["response"].strip()

    if TMP:
        print(raw)

    result = {
        "file": img,
        "visual_text": raw.strip(),
        "vision_source": "qwen2.5-vl:7b", # ollama run qwen2.5-vl:7b
        "vision_trust": "low"
    }
    
    visionResults.append(result)
    # imagePath.unlink() # removes the image

    return visionResults

if __name__ == "__main__":
    # Example usage
    output_directory = "C:\\Users\\Omen\\Documents\\summer2026\\TrucktimeLOGSYNC\\receiptTool\\temp"
    image_file = "t1.jpg"

    result = localProcessing(output_directory, image_file)
    print(result)
