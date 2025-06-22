"use client";

import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";

// Interface
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
const labelTranslations: Record<string, string> = {
  joy: "Senang",
  sadness: "Sedih",
  anger: "Marah",
  trust: "Percaya",
  fear: "Takut",
  surprise: "Terkejut",
  neutral: "Netral",
};

const LoadingModal = () => (
  <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid" />
      <p className="text-sm font-medium text-gray-700">Memproses data...</p>
    </div>
  </div>
);

const NotificationModal = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white shadow-xl rounded-lg max-w-md w-full p-6 border border-gray-200 relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-lg font-bold"
        >
          &times;
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800 mb-2">
            Notifikasi
          </div>
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

const orderedLabels = [
  "joy",
  "trust",
  "surprise",
  "neutral",
  "fear",
  "sadness",
  "anger",
];

const AdminPanel: React.FC = () => {
  const [data, setData] = useState<string[][]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [confusionMatrix, setConfusionMatrix] =
    useState<ConfusionMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [editableRawData, setEditableRawData] = useState<string[][]>([]);
  const [preprocessingPreview, setPreprocessingPreview] = useState<any[]>([]);
  const [splitRatio, setSplitRatio] = useState(0.8);

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
        setPage(0);
      },
      error: (error) => console.error("Parsing error:", error),
    });
  };

  const uploadToAPI = async () => {
    if (!file) {
      setMessage("Tidak ada file yang dipilih");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:5001/admin/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage(res.data.message || "Berhasil upload ke server");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Gagal upload ke server");
    } finally {
      setLoading(false);
    }
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

  const fetchPreprocessed = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:5001/admin/preprocessed");
      setPreprocessingPreview(res.data);
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("http://127.0.0.1:5001/admin/train", {
        split_ratio: splitRatio,
      });
      setMessage(res.data.message || "Training selesai");
      setMetrics({
        accuracy: res.data.accuracy,
        precision: res.data.precision,
        recall: res.data.recall,
      });
      setConfusionMatrix(res.data.confusion_matrix);
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Gagal training.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-4xl font-bold text-center text-gray-800">
        Evaluasi Model Emosi
      </h1>

      {/* Section: Dataset Mentah */}
      <section className="bg-white shadow rounded-xl p-6 border border-gray-200">
        <div className="flex justify-between mb-4 items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              📄 Dataset Mentah
            </h2>
            {message && (
              <NotificationModal
                message={message}
                onClose={() => setMessage("")}
              />
            )}

            <p className="text-sm text-gray-600">Total Data: {totalData}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="upload"
            />
            <label
              htmlFor="upload"
              className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700 transition"
            >
              Pilih CSV
            </label>
            <button
              onClick={uploadToAPI}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              disabled={!file}
            >
              Upload Dataset
            </button>
          </div>
        </div>

        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-2">No.</th>
                <th className="border px-2 py-2">Komentar</th>
                <th className="border px-2 py-2">Label Emosi</th>
              </tr>
            </thead>
            <tbody>
              {editableRawData.slice(start, end).map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-center">
                    {start + idx + 1}
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      value={row[0] || ""}
                      onChange={(e) =>
                        handleRawEdit(start + idx, 0, e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      value={row[1] || ""}
                      onChange={(e) =>
                        handleRawEdit(start + idx, 1, e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">-- Pilih Emosi --</option>
                      <option value="joy">senang</option>
                      <option value="sadness">sedih</option>
                      <option value="anger">marah</option>
                      <option value="trust">percaya</option>
                      <option value="fear">takut</option>
                      <option value="surprise">terkejut</option>
                      <option value="neutral">netral</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Navigasi Page */}
        <div className="flex justify-between mt-4 items-center">
          <span className="text-sm">
            Halaman {page + 1} dari {Math.ceil(totalData / perPage)}
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
              onClick={fetchPreprocessed}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
            >
              Lihat Pra-pemrosesan
            </button>
          </div>
        </div>
      </section>

      {/* Section: Pra-pemrosesan */}
      {preprocessingPreview.length > 0 && (
        <section className="bg-white shadow rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            ⚙️ Preview Pra-pemrosesan
          </h2>
          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-2">Komentar Asli</th>
                  <th className="border px-2 py-2">Casefolding</th>
                  <th className="border px-2 py-2">Tokenizing</th>
                  <th className="border px-2 py-2">Clean</th>
                  <th className="border px-2 py-2">Stopword</th>
                  <th className="border px-2 py-2">Steamming</th>
                  <th className="border px-2 py-2">Setelah Final</th>
                </tr>
              </thead>
              <tbody>
                {preprocessingPreview.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-2 py-2">{item.full_text}</td>
                    <td className="border px-2 py-2">
                      {item.text_casefoldingText}
                    </td>
                    <td className="border px-2 py-2">
                      {item.text_token?.join(" ")}
                    </td>
                    <td className="border px-2 py-2">{item.text_clean}</td>
                    <td className="border px-2 py-2">
                      {item.text_stop?.join(" ")}
                    </td>
                    <td className="border px-2 py-2">
                      {item.text_steming?.join(" ")}
                    </td>
                    <td className="border px-2 py-2">{item.text_final}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Split Ratio + Train */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Pilih Split Rasio:</label>
              <select
                value={splitRatio}
                onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                className="border px-3 py-1 rounded"
              >
                <option value={0.6}>60% Training / 40% Test</option>
                <option value={0.7}>70% Training / 30% Test</option>
                <option value={0.8}>80% Training / 20% Test</option>
                <option value={0.9}>90% Training / 10% Test</option>
              </select>
            </div>
            <button
              onClick={trainModel}
              className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition"
            >
              🔁 Train Model
            </button>
          </div>
        </section>
      )}

      {/* Section: Evaluasi */}
      {metrics && confusionMatrix && (
        <section className="bg-white shadow rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📊 Evaluasi Model
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Akurasi</h3>
              <p className="text-xl font-bold text-green-700">
                {(metrics.accuracy * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Presisi</h3>
              <p className="text-xl font-bold text-blue-700">
                {(metrics.precision * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-gray-700 mb-2">Recall</h3>
              <p className="text-xl font-bold text-purple-700">
                {(metrics.recall * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse border mt-4">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-2 py-1">Label</th>
                  {orderedLabels.map((label, i) => (
                    <th key={i} className="border px-2 py-1">
                      {labelTranslations[label] || label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderedLabels.map((rowLabel, i) => {
                  const rowIndex = confusionMatrix.labels.indexOf(rowLabel);
                  const rowData = confusionMatrix.matrix[rowIndex] || [];
                  return (
                    <tr key={i}>
                      <td className="border px-2 py-1 font-semibold bg-gray-100">
                        {labelTranslations[rowLabel] || rowLabel}
                      </td>
                      {orderedLabels.map((colLabel, j) => {
                        const colIndex =
                          confusionMatrix.labels.indexOf(colLabel);
                        const value = rowData[colIndex] ?? 0;
                        return (
                          <td key={j} className="border px-2 py-1">
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {loading && <LoadingModal />}
    </div>
  );
};

export default AdminPanel;
