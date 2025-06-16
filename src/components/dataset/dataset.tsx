"use client";

import React, { useState } from "react";
import Papa from "papaparse";

type ApiResponse = {
  head: { emotion: string; full_text: string }[];
  tail: { emotion: string; full_text: string }[];
};

export default function Dataset() {
  const [data, setData] = useState<string[][]>([]);
  const [showPreprocessed, setShowPreprocessed] = useState(false);
  const [editableRawData, setEditableRawData] = useState<string[][]>([]);
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);
  const [editableData, setEditableData] = useState<
    { full_text: string; emotion: string }[]
  >([]);
  const [page, setPage] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const perPage = 20;

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
      const res = await fetch("http://127.0.0.1:5000/admin/preview", {
        method: "GET",
      });

      const result: ApiResponse = await res.json();
      setApiResult(result);
      setShowPreprocessed(true);
      setPage(0);

      const merged = [...(result.head ?? []), ...(result.tail ?? [])];
      setEditableData(merged);
    } catch (error) {
      console.error("Error preprocessing:", error);
    }
  };

  const handleEdit = (
    index: number,
    field: "full_text" | "emotion",
    value: string
  ) => {
    const updated = [...editableData];
    updated[index][field] = value;
    setEditableData(updated);
  };

  const handleSave = async () => {
    console.log("Data yang disimpan:", editableData);
    // Kirim ke backend jika dibutuhkan
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:5000/admin/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      alert(result.message || "Upload berhasil");
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert("Upload gagal");
    }
  };

  const totalData = editableRawData.length;
  const start = page * perPage;
  const end = start + perPage;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
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
            className="bg-gray-700 text-white px-4 py-2 rounded cursor-pointer shadow"
          >
            Unggah CSV
          </label>
        </div>
      </div>

      {/* Tabel Dataset Mentah */}
      <table className="w-full border border-gray-400 text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1 text-center">No.</th>
            <th className="border px-2 py-1 text-center">Komentar</th>
            <th className="border px-2 py-1 text-center">Label Emosi</th>
          </tr>
        </thead>
        <tbody>
          {editableRawData.slice(start, end).map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1 text-center">
                {start + idx + 1}
              </td>
              <td className="border px-2 py-1">
                <input
                  value={row[0] || ""}
                  onChange={(e) =>
                    handleRawEdit(start + idx, 0, e.target.value)
                  }
                  className="w-full px-1 py-1 border border-gray-300 rounded"
                />
              </td>
              <td className="border px-2 py-1">
                <select
                  value={row[1] || ""}
                  onChange={(e) =>
                    handleRawEdit(start + idx, 1, e.target.value)
                  }
                  className="w-full px-1 py-1 border border-gray-300 rounded"
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
            className="bg-gray-700 text-white px-4 py-1 rounded shadow"
          >
            Pra-pemrosesan
          </button>

          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-1 rounded shadow"
          >
            Upload File ke Backend
          </button>
        </div>
      </div>

      {/* Tabel Hasil Pra-pemrosesan */}
      {apiResult && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-2">Hasil Pra-pemrosesan</h2>
          <table className="w-full border border-gray-400 text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2 py-1 text-center">No.</th>
                <th className="border px-2 py-1 text-center">
                  Komentar Setelah Pra-pemrosesan
                </th>
                <th className="border px-2 py-1 text-center">Label Emosi</th>
              </tr>
            </thead>
            <tbody>
              {editableData.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border px-2 py-1">
                    <input
                      value={row.full_text}
                      onChange={(e) =>
                        handleEdit(idx, "full_text", e.target.value)
                      }
                      className="w-full px-1 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <select
                      value={row.emotion}
                      onChange={(e) =>
                        handleEdit(idx, "emotion", e.target.value)
                      }
                      className="w-full px-1 py-1 border border-gray-300 rounded"
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

          <div className="mt-4">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded shadow"
            >
              Simpan Hasil Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
