from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import re
import docx
import io
import PyPDF2

app = FastAPI(title="VisualFlow AI Service Enhanced")

# -----------------------------
# Models
# -----------------------------
class Req(BaseModel):
    text: str

class Resp(BaseModel):
    ats_score: int
    recommended_role: str
    matched_keywords: List[str]
    explanation: str

# -----------------------------
# Keyword definitions
# -----------------------------
ROLE_KEYWORDS = {
    "Software Engineer": [
        "python", "java", "c++", "javascript", "typescript", "spring boot",
        "node.js", "react", "angular", "vue", "api", "rest", "microservices",
        "oop", "docker", "kubernetes", "git", "ci/cd", "sql"
    ],

    "Data Scientist": [
        "python", "r", "sql", "pandas", "numpy", "matplotlib", "seaborn",
        "scikit-learn", "tensorflow", "keras", "machine learning", "deep learning",
        "statistics", "data analysis", "nlp"
    ],

    "DevOps Engineer": [
        "docker", "kubernetes", "jenkins", "terraform", "ansible", "ci/cd",
        "aws", "azure", "gcp", "monitoring", "prometheus", "grafana", "logging",
        "linux", "bash"
    ],

    "Frontend Developer": [
        "html", "css", "javascript", "typescript", "react", "angular", "vue",
        "next.js", "responsive design", "redux", "state management", "axios",
        "graphql", "testing"
    ],

    "Backend Developer": [
        "python", "java", "node.js", "spring boot", "django", "flask", "rest api",
        "graphql", "sql", "mysql", "postgresql", "mongodb", "docker", "ci/cd", "git"
    ],

    "Machine Learning Engineer": [
        "python", "numpy", "pandas", "scikit-learn", "tensorflow", "keras", "pytorch",
        "deep learning", "machine learning", "nlp", "model training", "feature engineering"
    ],

    "QA Engineer": [
        "manual testing", "automation testing", "selenium", "cypress", "jest",
        "unit testing", "integration testing", "regression testing", "api testing",
        "performance testing", "jira", "test planning", "test scripts"
    ],

    "Cybersecurity Engineer": [
        "network security", "firewall", "vpn", "ssl", "tls", "encryption",
        "penetration testing", "ethical hacking", "incident response", "siem",
        "cloud security", "secure coding", "owasp", "vulnerability assessment"
    ]
}


STOPWORDS = set([
    "the","a","an","and","or","of","in","on","with","for","to","from","by",
    "as","at","this","that","is","are","be","have","has","it","its"
])

# -----------------------------
# Helper functions
# -----------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    text = ""
    doc = docx.Document(io.BytesIO(file_bytes))
    for para in doc.paragraphs:
        text += para.text + " "
    return text

def compute_ats_and_role(text: str):
    t = text.lower()
    # remove stopwords for better matching
    t_words = [w for w in re.findall(r'\b\w+\b', t) if w not in STOPWORDS]

    keywords_found = set()
    role_scores = {r: 0 for r in ROLE_KEYWORDS}
    total_kw = sum(len(kws) for kws in ROLE_KEYWORDS.values())

    for r, kws in ROLE_KEYWORDS.items():
        for kw in kws:
            # match keyword if present in the text words
            if kw.lower() in t:
                role_scores[r] += 1
                keywords_found.add(kw)

    recommended = max(role_scores.items(), key=lambda x: x[1])[0]
    matched = sorted([k for k in keywords_found])
    score = int(min(100, round(len(keywords_found) / total_kw * 100)))
    explanation = f"Matched keywords: {', '.join(matched)}. Role score breakdown: " + \
                  ", ".join([f"{r}:{s}" for r, s in role_scores.items()])
    return score, recommended, matched, explanation

# -----------------------------
# Endpoints
# -----------------------------
@app.post("/analyze", response_model=Resp)
async def analyze_text(req: Req):
    if not req.text or len(req.text.strip()) < 5:
        return {"ats_score":0, "recommended_role":"Unknown", "matched_keywords":[], "explanation":"Resume text too short"}
    score, role, matched, explanation = compute_ats_and_role(req.text)
    return {"ats_score":score, "recommended_role":role, "matched_keywords":matched, "explanation":explanation}

@app.post("/analyze-file", response_model=Resp)
async def analyze_file(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    file_bytes = await file.read()

    if ext == "pdf":
        text = extract_text_from_pdf(file_bytes)
    elif ext == "docx":
        text = extract_text_from_docx(file_bytes)
    elif ext in ["txt", "md"]:
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        return JSONResponse(status_code=400, content={"error": "Unsupported file type"})

    if not text.strip():
        return {"ats_score":0, "recommended_role":"Unknown", "matched_keywords":[], "explanation":"No readable text found in file"}

    score, role, matched, explanation = compute_ats_and_role(text)
    return {"ats_score":score, "recommended_role":role, "matched_keywords":matched, "explanation":explanation}
