import io
import pypdf
import pdfplumber

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
