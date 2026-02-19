VisualFlow AI Service (FastAPI)
------------------------------
Requirements:
  - Python 3.9+
  - pip

Install:
  pip install -r requirements.txt

Run:
  uvicorn main:app --reload --port 8000

Endpoint:
  POST /analyze
  Body: { "text": "resume text here" }
