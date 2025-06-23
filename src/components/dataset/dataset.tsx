"use client";

import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";

const NotificationModal = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white shadow-xl rounded-lg max-w-md w-full p-6 border border-gray-200 relative">
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

const Datasets: React.FC = () => {
  const [data, setData] = useState<string[][]>([]);
  const [editableRawData, setEditableRawData] = useState<string[][]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);

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

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-4xl font-bold text-center text-gray-800">
        Manajemen Dataset Emosi
      </h1>

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
          </div>
        </div>
      </section>
    </div>
  );
};

export default Datasets;
