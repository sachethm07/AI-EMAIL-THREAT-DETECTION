"""Static, metadata-only checks. Attachment contents are never opened or executed."""
import mimetypes

EXECUTABLE = {"exe", "scr", "js", "vbs", "bat", "cmd", "lnk", "iso", "jar", "msi", "hta", "ps1", "com", "pif"}
CONTAINER = {"docm", "xlsm", "pptm", "zip", "rar", "7z", "html", "htm", "img"}
DOCUMENT = {"pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "txt"}


def flags(att: dict) -> list[str]:
    parts = att["filename"].lower().split(".")
    ext, out = parts[-1], []
    if ext in EXECUTABLE:
        out.append("Executable or script file type")
    elif ext in CONTAINER:
        out.append("Archive, macro or HTML file type")
    if len(parts) >= 3 and parts[-2] in DOCUMENT and ext in EXECUTABLE | CONTAINER:
        out.append("Double extension disguises the real file type")
    guessed = mimetypes.guess_type(att["filename"])[0]
    declared = att.get("content_type")
    if guessed and declared and declared != "application/octet-stream" and guessed != declared:
        out.append(f"Declared type {declared} does not match extension")
    if att.get("size") == 0:
        out.append("Empty file")
    return out
