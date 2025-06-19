"use client";

import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import Papa from "papaparse";

interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
}

interface ReportItem {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
}

interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
}

interface PreviewRow {
  emotion: string;
  full_text: string;
}

const AdminPanel: React.FC = () => {
  const [preprocessed, setPreprocessed] = useState<PreviewRow[]>([]);
  const [showPreprocessed, setShowPreprocessed] = useState(false);
  const [data, setData] = useState<string[][]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [report, setReport] = useState<Record<string, ReportItem> | null>(null);
  const [confusionMatrix, setConfusionMatrix] =
    useState<ConfusionMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");

  const [editableRawData, setEditableRawData] = useState<string[][]>([]);

  const [editableData, setEditableData] = useState<
    { full_text: string; emotion: string }[]
  >([]);
  const [preview, setPreview] = useState(null);
  const [datasetCount, setDatasetCount] = useState<number>(0);

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

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:5000/admin/preview");
      setPreview(res.data);
      setDatasetCount(merged.length);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.error || "Gagal mendapatkan preview data"
      );
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("http://127.0.0.1:5000/admin/train");
      setMessage(res.data.message || "Training selesai");
      setMetrics({
        accuracy: res.data.accuracy,
        precision: res.data.precision,
        recall: res.data.recall,
      });
      setReport(res.data.report);
      setConfusionMatrix(res.data.confusion_matrix);
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Gagal training.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

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
            onClick={fetchPreview}
            className="bg-gray-700 text-white px-4 py-1 rounded"
          >
            Pra-pemrosesan
          </button>
        </div>
      </div>

      {preview && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Preview Data</h3>

          <div className="mb-4">
            <h4 className="font-semibold">Head</h4>
            <table className="w-full text-sm border mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Emotion</th>
                  <th className="border px-2 py-1">Full Text</th>
                </tr>
              </thead>
              <tbody>
                {preview.head.map((row, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{row.emotion}</td>
                    <td className="border px-2 py-1">{row.full_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-semibold">Tail</h4>
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Emotion</th>
                  <th className="border px-2 py-1">Full Text</th>
                </tr>
              </thead>
              <tbody>
                {preview.tail.map((row, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{row.emotion}</td>
                    <td className="border px-2 py-1">{row.full_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={trainModel}
              className="bg-green-700 text-white px-4 py-1 rounded"
            >
              Train Model
            </button>
          </div>
        </div>
      )}

      {(metrics || confusionMatrix) && (
        <div className="mt-10">
          <h3 className="text-2xl font-bold mb-4">Evaluasi Model</h3>
          <div>
            <p className="text-sm">Total Data: {totalData}</p>
          </div>

          {confusionMatrix && (
            <div className="mb-8 border rounded overflow-auto">
              <div className="bg-gray-300 text-center font-semibold py-2">
                Confusion Matrix
              </div>
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-gray-100">Label</th>
                    {confusionMatrix.labels.map((label, i) => (
                      <th key={i} className="border px-2 py-1 bg-gray-100">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confusionMatrix.matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1 bg-gray-100 font-semibold">
                        {confusionMatrix.labels[i]}
                      </td>
                      {row.map((val, j) => (
                        <td key={j} className="border px-2 py-1">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {metrics && (
            <div className="grid grid-cols-3 gap-4 text-center mt-6">
              <div className="border p-4 rounded bg-gray-100">
                <h4 className="font-semibold mb-2">Akurasi</h4>
                <div className="bg-white rounded py-2 font-bold text-lg">
                  {(metrics.accuracy * 100).toFixed(0)}%
                </div>
              </div>
              <div className="border p-4 rounded bg-gray-100">
                <h4 className="font-semibold mb-2">Presisi</h4>
                <div className="bg-white rounded py-2 font-bold text-lg">
                  {(metrics.precision * 100).toFixed(0)}%
                </div>
              </div>
              <div className="border p-4 rounded bg-gray-100">
                <h4 className="font-semibold mb-2">Recall</h4>
                <div className="bg-white rounded py-2 font-bold text-lg">
                  {(metrics.recall * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
