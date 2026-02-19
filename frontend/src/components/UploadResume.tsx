import React, { useRef, useState } from "react";
import API from "../api";
import type { AnalyzeResp } from "../types";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import * as mammoth from "mammoth";

type Props = {
  setResult: (data: AnalyzeResp | null) => void;
};

export default function UploadResume({ setResult }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResp | null>(null); // Local analysis for preview

  async function extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    setResult(null);
    setAnalysis(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractPdfText(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const docx = await mammoth.extractRawText({ arrayBuffer });
        text = docx.value;
      } else {
        text = await file.text();
      }

      if (!text || text.trim().length < 20) {
        setErr("Unable to extract text. Upload a valid resume.");
        return;
      }

      setPreviewText(text.slice(0, 5000));
      analyze(text);
    } catch (err) {
      console.error(err);
      setErr("Failed to read file. Please try again.");
    }
  }

  async function analyze(text: string) {
    setLoading(true);
    setErr(null);
    setResult(null);
    setAnalysis(null);

    try {
      const res = await API.post<AnalyzeResp>("/ai/analyze", { text });
      setResult(res.data);   // update shared App state
      setAnalysis(res.data); // local state for preview
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Analysis failed. Try again later.");
      setResult(null);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6 md:p-12">
      {/* Upload Card */}
      <div className="w-full md:w-2/3 p-6 rounded-3xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-500">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 text-center">
          Upload Your Resume
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Supported formats: <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.txt</strong>
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={onFile}
            className="file:border-0 file:bg-teal-600 file:text-white file:px-4 file:py-2 file:rounded-lg
                       file:cursor-pointer file:hover:bg-teal-500 transition-all duration-300
                       w-full md:w-auto"
          />

          <button
            className="px-6 py-2 bg-gray-100/50 text-gray-800 rounded-lg border border-gray-300
                       hover:bg-gray-200 transition-all duration-300 shadow-md hover:shadow-lg"
            onClick={() => {
              setPreviewText("");
              setFileName("");
              setResult(null);
              setErr(null);
              setAnalysis(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Reset
          </button>
        </div>

        {fileName && (
          <div className="mt-4 text-sm text-gray-700 text-center">
            <strong>Uploaded:</strong> {fileName}
          </div>
        )}

        {err && <div className="mt-4 text-red-600 font-semibold text-center">{err}</div>}
        {loading && (
          <div className="mt-4 text-blue-700 font-semibold animate-pulse text-center">
            Analyzing your resume...
          </div>
        )}
      </div>

      {/* Preview + Analysis Card */}
      {previewText && (
        <div className="w-full md:w-2/3 p-6 rounded-3xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg transition-all duration-500 hover:shadow-2xl">
          <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 text-center">
            Preview of Resume
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {previewText}
          </p>

          {analysis && (
            <div className="mt-6 text-center text-gray-800">
              <p className="font-semibold text-indigo-600 text-lg">
                ATS Score: {analysis.ats_score}
              </p>
              <p className="font-semibold text-teal-700 text-lg">
                Suggested Role: {analysis.recommended_role}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
