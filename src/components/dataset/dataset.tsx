"use client";

import React, { useState } from "react";
import Papa from "papaparse";

type ApiResponse = {
  head: { emotion: string; full_text: string }[];
  tail: { emotion: string; full_text: string }[];
};

type TrainResult = {
  message: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
  };
  report: Record<
    string,
    {
      precision: number;
      recall: number;
      "f1-score": number;
      support: number;
    }
  >;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
};

export default function Dataset() {
  const [data, setData] = useState<string[][]>([]);
  const [editableRawData, setEditableRawData] = useState<string[][]>([]);
  const [editableData, setEditableData] = useState<
    { full_text: string; emotion: string }[]
  >([]);
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState("");
  const [metrics, setMetrics] = useState<TrainResult["metrics"] | null>(null);
  const [report, setReport] = useState<TrainResult["report"] | null>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<
    TrainResult["confusion_matrix"] | null
  >(null);

  const perPage = 20;
  const totalData = editableRawData.length;
  const start = page * perPage;
  const end = start + perPage;

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      complete: (result) => {
        const parsed = result.data as string[][];
        const filtered = parsed.filter((row) => row.length && row[0]);
        setData(filtered);
        setEditableRawData(filtered);
        setApiResult(null);
        setEditableData([]);
        setPage(0);
      },
      error: (error) => console.error("Parsing error:", error),
    });
  };

  const handleRawEdit = (
    rowIndex: number,
    columnIndex: number,
    value: string
  ) => {
    const updated = [...editableRawData];
    if (!updated[rowIndex]) return;
    updated[rowIndex][columnIndex] = value;
    setEditableRawData(updated);
  };

  const handlePreprocessing = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/admin/preview");
      const result: ApiResponse = await res.json();
      setApiResult(result);
      const merged = [...(result.head ?? []), ...(result.tail ?? [])];
      setEditableData(merged);
      setPage(0);
    } catch (error) {
      console.error("Error preprocessing:", error);
    }
  };

  const trainModel = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/admin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableData),
      });
      const result: TrainResult = await res.json();
      setMessage(result.message);
      setMetrics(result.metrics);
      setReport(result.report);
      setConfusionMatrix(result.confusion_matrix);
    } catch (error) {
      console.error("Train model error:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Dataset Mentah</h2>
          <p className="text-sm">Total Data: {totalData}</p>
        </div>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            id="upload"
          />
          <label
            htmlFor="upload"
            className="bg-gray-700 text-white px-4 py-2 rounded cursor-pointer"
          >
            Unggah CSV
          </label>
        </div>
      </div>

      {/* Tabel Dataset Mentah */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2">No.</th>
            <th className="border px-2">Komentar</th>
            <th className="border px-2">Label Emosi</th>
          </tr>
        </thead>
        <tbody>
          {editableRawData.slice(start, end).map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 text-center">{start + idx + 1}</td>
              <td className="border px-2">
                <input
                  value={row[0] || ""}
                  onChange={(e) =>
                    handleRawEdit(start + idx, 0, e.target.value)
                  }
                  className="w-full px-1 py-1 border rounded"
                />
              </td>
              <td className="border px-2">
                <select
                  value={row[1] || ""}
                  onChange={(e) =>
                    handleRawEdit(start + idx, 1, e.target.value)
                  }
                  className="w-full px-1 py-1 border rounded"
                >
                  <option value="">-- Pilih Emosi --</option>
                  <option value="joy">Joy</option>
                  <option value="sadness">Sadness</option>
                  <option value="anger">Anger</option>
                  <option value="trust">Trust</option>
                  <option value="fear">Fear</option>
                  <option value="surprise">Surprise</option>
                  <option value="disgust">Disgust</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Navigasi */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          {page + 1}/{Math.ceil(totalData / perPage)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() =>
              setPage((p) =>
                p + 1 < Math.ceil(totalData / perPage) ? p + 1 : p
              )
            }
            disabled={page + 1 >= Math.ceil(totalData / perPage)}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={handlePreprocessing}
            className="bg-gray-700 text-white px-4 py-1 rounded"
          >
            Pra-pemrosesan
          </button>
          <button
            onClick={trainModel}
            className="bg-green-600 text-white px-4 py-1 rounded"
          >
            Latih Model
          </button>
        </div>
      </div>

      {/* Tabel Pra-pemrosesan */}
      {apiResult && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2">Hasil Pra-pemrosesan</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2">No.</th>
                <th className="border px-2">Komentar</th>
                <th className="border px-2">Label</th>
              </tr>
            </thead>
            <tbody>
              {editableData.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 text-center">{idx + 1}</td>
                  <td className="border px-2">
                    <input
                      value={row.full_text}
                      onChange={(e) =>
                        setEditableData((prev) => {
                          const updated = [...prev];
                          updated[idx].full_text = e.target.value;
                          return updated;
                        })
                      }
                      className="w-full px-1 py-1 border rounded"
                    />
                  </td>
                  <td className="border px-2">
                    <select
                      value={row.emotion}
                      onChange={(e) =>
                        setEditableData((prev) => {
                          const updated = [...prev];
                          updated[idx].emotion = e.target.value;
                          return updated;
                        })
                      }
                      className="w-full px-1 py-1 border rounded"
                    >
                      <option value="">-- Pilih Emosi --</option>
                      <option value="joy">Joy</option>
                      <option value="sadness">Sadness</option>
                      <option value="anger">Anger</option>
                      <option value="trust">Trust</option>
                      <option value="fear">Fear</option>
                      <option value="surprise">Surprise</option>
                      <option value="disgust">Disgust</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hasil Training */}
      {message && (
        <div className="my-6 text-gray-800 bg-yellow-100 p-3 rounded">
          {message}
        </div>
      )}

      {metrics && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Hasil Evaluasi:</h3>
          <ul className="list-disc pl-5">
            <li>
              Akurasi: <strong>{metrics.accuracy}</strong>
            </li>
            <li>
              Presisi: <strong>{metrics.precision}</strong>
            </li>
            <li>
              Recall: <strong>{metrics.recall}</strong>
            </li>
          </ul>
        </div>
      )}

      {report && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Classification Report</h3>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2">Label</th>
                <th className="border px-2">Precision</th>
                <th className="border px-2">Recall</th>
                <th className="border px-2">F1-Score</th>
                <th className="border px-2">Support</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report).map(([label, scores]) =>
                typeof scores === "object" ? (
                  <tr key={label}>
                    <td className="border px-2 font-medium">{label}</td>
                    <td className="border px-2">
                      {scores.precision?.toFixed(4)}
                    </td>
                    <td className="border px-2">{scores.recall?.toFixed(4)}</td>
                    <td className="border px-2">
                      {scores["f1-score"]?.toFixed(4)}
                    </td>
                    <td className="border px-2">
                      {typeof scores.support === "number"
                        ? scores.support
                        : "-"}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      )}

      {confusionMatrix && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Confusion Matrix</h3>
          <table className="border text-sm">
            <thead>
              <tr>
                <th className="border px-2 bg-gray-100">Label</th>
                {confusionMatrix.labels.map((label, i) => (
                  <th key={i} className="border px-2 bg-gray-100">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confusionMatrix.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 font-semibold bg-gray-100">
                    {confusionMatrix.labels[i]}
                  </td>
                  {row.map((val, j) => (
                    <td key={j} className="border px-2 text-center">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
