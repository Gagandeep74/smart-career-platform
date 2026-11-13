import io
import pypdf
import pdfplumber
import re
from typing import Any

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Module 2: Resume Processing
    Extracts raw text from a PDF file representation.
    Attempts pdfplumber first for better layout preservation, falls back to PyPDF.
    
    Args:
        file_bytes (bytes): The loaded byte-stream of the PDF file.
        
    Returns:
        str: The extracted raw text string.
    """
    text_content = ""
    try:
        # Step 1: Attempt extraction using pdfplumber which is stronger for structural tables
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"
                    
    except Exception as e:
        print(f"pdfplumber extraction failed, falling back to pypdf: {e}")
        # Step 2: Fallback to pypdf for basic extraction
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
        except Exception as fallback_e:
            raise ValueError(f"Could not extract text from PDF: {fallback_e}")
            
    # Clean up excess whitespace
    cleaned_text = " ".join(text_content.split())
    return cleaned_text

def extract_text_from_txt(file_bytes: bytes) -> str:
    """
    Extracts raw text from a plain .txt file.
    """
    try:
        return file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        return file_bytes.decode('latin-1')


_SECTION_NAMES = {
    "experience": {"experience", "work experience", "employment", "professional experience"},
    "education": {"education", "academic background"},
    "projects": {"projects", "selected projects"},
    "languages": {"languages", "language skills"},
    "achievements": {"achievements", "awards", "honors"},
}


def extract_structured_resume(text: str) -> dict[str, Any]:
    """Extract conservative, editable resume sections from plain text.

    This intentionally uses heading and line heuristics rather than inventing
    details. Unrecognized text remains available through the raw summary.
    """
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sections: dict[str, list[str]] = {name: [] for name in _SECTION_NAMES}
    current: str | None = None
    for line in lines:
        heading = re.sub(r"[^a-z ]", "", line.lower()).strip()
        matched = next((name for name, aliases in _SECTION_NAMES.items() if heading in aliases), None)
        if matched:
            current = matched
            continue
        if current:
            sections[current].append(line)

    email = next(iter(re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)), "")
    links = re.findall(r"https?://\S+", text)
    location = ""
    for line in lines[:8]:
        if re.search(r"@", line) and "|" in line:
            location = line.split("|", 1)[1].strip()
            break
        if "@" not in line and not re.search(r"https?://", line) and any(char.isalpha() for char in line):
            if "," in line:
                location = line
                break

    experience = []
    for line in sections["experience"]:
        parts = re.split(r"\s+[|@-]\s+|\s+at\s+", line, maxsplit=1, flags=re.IGNORECASE)
        if len(parts) == 2:
            experience.append({"role": parts[0], "company": parts[1], "dates": "", "bullets": ""})
        elif line.startswith(("-", "•", "*")):
            if experience:
                experience[-1]["bullets"] += line.lstrip("-•* ").strip() + "\n"

    education = []
    for line in sections["education"]:
        parts = re.split(r"\s+[|,-]\s+", line, maxsplit=1)
        education.append({
            "degree": parts[0],
            "school": parts[1] if len(parts) == 2 else "",
            "dates": "",
        })

    return {
        "email": email,
        "location": location,
        "links": links,
        "experience": experience,
        "education": education,
        "projects": sections["projects"],
        "languages": sections["languages"],
        "achievements": sections["achievements"],
    }
