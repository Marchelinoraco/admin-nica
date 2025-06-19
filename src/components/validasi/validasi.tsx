"use client";
import React, { useState } from "react";
import axios from "axios";

interface PredictionResult {
  text: string;
  emotion: string;
  confidence: number;
  error?: string;
}

const Validasi: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleAnalyze = async () => {
    try {
      const res = await axios.post<PredictionResult>(
        "http://127.0.0.1:5000/predict",
        {
          text: inputText,
        }
      );
      setResult(res.data);
    } catch (error: any) {
      setResult({
        text: inputText,
        emotion: "",
        confidence: 0,
        error: error.response?.data?.error || "Prediction failed",
      });
    }
  };

  return (
    <div className="p-4 border rounded shadow mt-6 mx-20">
      <h2 className="text-xl font-bold mb-2">Analisis Emosi </h2>
      <textarea
        className="w-full border p-2 mb-2"
        rows={4}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Masukkan teks untuk analisis emosi"
      />
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
        onClick={handleAnalyze}
        disabled={!inputText.trim()}
      >
        Analisis
      </button>

      {result && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          {result.error ? (
            <p className="text-red-600 font-semibold">{result.error}</p>
          ) : (
            <>
              <p>
                <span className="font-medium">Teks:</span> {result.text}
              </p>
              <p>
                <span className="font-medium">Emosi Terdeteksi:</span>{" "}
                <span className="text-blue-600 font-bold uppercase">
                  {result.emotion}
                </span>
              </p>
              <p>
                <span className="font-medium">Keyakinan Model:</span>{" "}
                {(result.confidence * 100).toFixed(2)}%
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Validasi;
