import gl
from regexTools import extractAddressPairs, assignAddressRoles, buildAutofillFromCandidates


'''
    method will run tesseract, filter and write the output as metadata
'''
def tOrchestration(outputDir, myImage):
    outputDir = gl.Path(outputDir)

    result = gl.subprocess.run(
        ["tesseract", str(myImage), "stdout", "-l", "eng", "--psm", "3"],
        stdout=gl.subprocess.PIPE,
        stderr=gl.subprocess.PIPE,
        text=True
    )
    t = result.stdout

    niceT = gl.ln(t)

    # address candidate extraction
    preCandidates = extractAddressPairs(niceT)
    preCandidates = assignAddressRoles(niceT, preCandidates)
    ruleBasedAutofill = buildAutofillFromCandidates(preCandidates)

    # metadata
    metadata = {
        "tesseract_records": {
            "raw_text": t,
            "lines": niceT
        },
        "pre_candidates": preCandidates
    }

    autofill = ruleBasedAutofill
    if len(preCandidates) > 0:
        autofill["candidateLocations"] = preCandidates
    
        if autofill.get("sourceStreet", "") == "":
            autofill["sourceStreet"] = ruleBasedAutofill["sourceStreet"]
            autofill["sourceCity"] = ruleBasedAutofill["sourceCity"]
            autofill["sourceState"] = ruleBasedAutofill["sourceState"]
            autofill["sourceZip"] = ruleBasedAutofill["sourceZip"]
    
        if autofill.get("destinationStreet", "") == "":
            autofill["destinationStreet"] = ruleBasedAutofill["destinationStreet"]
            autofill["destinationCity"] = ruleBasedAutofill["destinationCity"]
            autofill["destinationState"] = ruleBasedAutofill["destinationState"]
            autofill["destinationZip"] = ruleBasedAutofill["destinationZip"]
    
        autofill["needsReview"] = True
    
        if autofill.get("reviewReason", "") == "":
            autofill["reviewReason"] = "Rule-based address candidates found. Review before mileage calculation."

    
    #  review, source/destination is blank
    if len(autofill.get("candidateLocations", [])) > 0:
        sourceEmpty = (
            autofill.get("sourceStreet", "") == "" and
            autofill.get("sourceCity", "") == "" and
            autofill.get("sourceState", "") == "" and
            autofill.get("sourceZip", "") == ""
        )

        destinationEmpty = (
            autofill.get("destinationStreet", "") == "" and
            autofill.get("destinationCity", "") == "" and
            autofill.get("destinationState", "") == "" and
            autofill.get("destinationZip", "") == ""
        )

        if sourceEmpty or destinationEmpty:
            autofill["needsReview"] = True

            if autofill.get("reviewReason", "") == "":
                autofill["reviewReason"] = "Location candidates found, but source/destination role needs review."

    finalOutput = {
        "autofill": autofill,
        "metadata": metadata
    }

    metadataPath = outputDir / "metadata.json"
    dumpPath = outputDir / "llm_receipt_dump.txt"

    with open(metadataPath, "w", encoding="utf-8") as f:
        gl.json.dump(finalOutput, f, indent=2)

    with open(dumpPath, "w", encoding="utf-8") as f:
        gl.json.dump(preCandidates, f, indent=2)

    return finalOutput

if __name__ == "__main__":
    parser = gl.argparse.ArgumentParser()
    parser.add_argument("filePath")
    parser.add_argument("--out", default="./detections")
    args = parser.parse_args()

    sample = args.filePath
    baseOut = gl.Path(args.out)
    baseOut.mkdir(parents=True, exist_ok=True)

    tOrchestration(baseOut, sample)


