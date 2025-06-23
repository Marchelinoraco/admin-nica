"use client";

import React, { useState } from "react";
import axios from "axios";

interface TokenDetail {
  word: string;
  tfidf: number;
  [key: string]: any;
}

interface StepByStep {
  [label: string]: {
    log_prior: number;
    log_likelihood_sum: number;
    total_log_score: number;
    details: TokenDetail[];
  };
}

interface TfidfDetail {
  word: string;
  tf: number;
  idf: number;
  tfidf: number;
}

interface LogPriorDetail {
  count: number;
  total: number;
  prior: number;
  log_prior: number;
}

interface PredictionResult {
  text: string;
  emotion: string;
  confidence: number;
  probabilities: { [label: string]: number };
  tfidf: { [word: string]: number };
  tfidf_detail: TfidfDetail[];
  step_by_step: StepByStep;
  prior_detail?: { [label: string]: LogPriorDetail };
  probability_detail?: {
    [label: string]: {
      log_score: number;
      exp_log_score: number;
      sum_exp_scores: number;
      final_probability: number;
    };
  };
  error?: string;
}

const emotionMap: { [key: string]: string } = {
  joy: "Senang",
  sadness: "Sedih",
  anger: "Marah",
  fear: "Takut",
  love: "Cinta",
  surprise: "Terkejut",
  trust: "Percaya",
  neutral: "Netral",
};

const Validasi: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleAnalyze = async () => {
    try {
      const res = await axios.post<PredictionResult>(
        "http://localhost:5001/predict",
        { text: inputText }
      );
      setResult(res.data);
    } catch (error: any) {
      setResult({
        text: inputText,
        emotion: "",
        confidence: 0,
        probabilities: {},
        tfidf: {},
        tfidf_detail: [],
        step_by_step: {},
        error: error.response?.data?.error || "Gagal memproses prediksi",
      });
    }
  };

  return (
    <div className="p-4 my-10 mx-10">
      <h1 className="text-2xl font-bold mb-4">Validasi</h1>
      <textarea
        className="w-full p-3 border mb-4 rounded"
        rows={4}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Masukkan teks untuk dianalisis..."
      />

      <button
        onClick={handleAnalyze}
        disabled={!inputText.trim()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Analisis
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          {result.error ? (
            <p className="text-red-500">{result.error}</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-2">Hasil Analisis</h2>
              <p>
                <strong>Teks:</strong> {result.text}
              </p>
              <p>
                <strong>Emosi:</strong>{" "}
                <span className="text-blue-700 font-bold">
                  {emotionMap[result.emotion] || result.emotion}
                </span>
              </p>
              <p>
                <strong>Keyakinan:</strong>{" "}
                {(result.confidence * 100).toFixed(2)}%
              </p>

              {/* Step 1: TF-IDF */}
              <div className="mt-4">
                <h3 className="font-semibold text-blue-600">
                  1. Perhitungan TF-IDF
                </h3>
                <table className="w-full text-sm mt-2 border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Kata</th>
                      <th className="border px-2 py-1">TF</th>
                      <th className="border px-2 py-1">IDF</th>
                      <th className="border px-2 py-1">TF-IDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tfidf_detail.map((item, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{item.word}</td>
                        <td className="border px-2 py-1">
                          {item.tf.toFixed(4)}
                        </td>
                        <td className="border px-2 py-1">
                          {item.idf.toFixed(4)}
                        </td>
                        <td className="border px-2 py-1">
                          {item.tfidf.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Step 2: Prior */}
              {result.prior_detail && (
                <div className="mt-4">
                  <h3 className="font-semibold text-blue-600">
                    2. Perhitungan Prior
                  </h3>
                  <ul className="list-disc ml-6 text-sm">
                    {Object.entries(result.prior_detail).map(([label, val]) => (
                      <li key={label}>
                        <strong>{emotionMap[label] || label}:</strong> log(
                        {val.count} / {val.total}) = {val.log_prior.toFixed(6)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 3: Log-Likelihood */}
              <div className="mt-4">
                <h3 className="font-semibold text-blue-600">
                  3. Likelihood dan Total Skor
                </h3>
                {Object.entries(result.step_by_step).map(([label, step]) => (
                  <div key={label} className="mt-2 border p-2 rounded bg-white">
                    <p className="font-bold">{emotionMap[label] || label}</p>
                    <p> Probabilitas Prior: {step.log_prior.toFixed(6)}</p>
                    <p>
                      Probailitas Kondisi : {step.log_likelihood_sum.toFixed(6)}
                    </p>

                    <table className="w-full text-xs mt-2 border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-2 py-1">Kata</th>
                          <th className="border px-2 py-1">TF-IDF</th>
                          <th className="border px-2 py-1">f(w,c)</th>
                          <th className="border px-2 py-1">∑f(w,c)</th>
                          <th className="border px-2 py-1">|V|</th>
                          <th className="border px-2 py-1">log(P(w|c))</th>
                          <th className="border px-2 py-1">log * TF-IDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {step.details.map((item, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{item.word}</td>
                            <td className="border px-2 py-1">
                              {item.tfidf.toFixed(6)}
                            </td>
                            <td className="border px-2 py-1">
                              {item.count_w_class}
                            </td>
                            <td className="border px-2 py-1">
                              {item.total_words_in_class}
                            </td>
                            <td className="border px-2 py-1">
                              {item.vocab_size}
                            </td>
                            <td className="border px-2 py-1">
                              {item[`log(P(w|${label}))`]?.toFixed(6)}
                            </td>
                            <td className="border px-2 py-1">
                              {item[`log(P(w|${label})) * tfidf`]?.toFixed(6)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Step 4: Probabilitas Akhir */}
              <div className="mt-4">
                <h3 className="font-semibold text-blue-600">4.Klasifikasi</h3>
                <table className="w-full mt-2 text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1">Label</th>
                      <th className="border px-2 py-1">Log Score</th>
                      <th className="border px-2 py-1">exp(Log Score)</th>
                      <th className="border px-2 py-1">Σ exp</th>
                      <th className="border px-2 py-1"> Hasil Probabilitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.probability_detail &&
                      Object.entries(result.probability_detail).map(
                        ([label, val]) => (
                          <tr key={label}>
                            <td className="border px-2 py-1">
                              {emotionMap[label] || label}
                            </td>
                            <td className="border px-2 py-1">
                              {val.log_score.toFixed(6)}
                            </td>
                            <td className="border px-2 py-1">
                              {val.exp_log_score.toFixed(6)}
                            </td>
                            <td className="border px-2 py-1">
                              {val.sum_exp_scores.toFixed(6)}
                            </td>
                            <td className="border px-2 py-1 font-semibold text-blue-700">
                              {(val.final_probability * 100).toFixed(2)}%
                            </td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Validasi;
