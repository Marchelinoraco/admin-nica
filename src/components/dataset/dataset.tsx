"use client";

import React, { useState } from "react";
import Papa from "papaparse";

type ApiResponse = {
  head: { emotion: string; full_text: string }[];
  tail: { emotion: string; full_text: string }[];
};

export default function Dataset() {
  const [data, setData] = useState<string[][]>([]);
  const [apiResult, setApiResult] = useState<ApiResponse | null>(null);
  const [showPreprocessed, setShowPreprocessed] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 20;

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const parsed = result.data as string[][];
        const filtered = parsed.filter((row) => row.length && row[0]);
        setData(filtered);
        setApiResult(null);
        setShowPreprocessed(false);
        setPage(0);
      },
      error: (error) => console.error("Parsing error:", error),
    });
  };

  const handlePreprocessing = async () => {
    const komentarList = data.map((row) => row[0]);

    try {
      const res = await fetch("http://localhost:5000/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ komentar: komentarList }),
      });

      const result = await res.json();
      setApiResult(result);
      setShowPreprocessed(true);
      setPage(0);
    } catch (error) {
      console.error("Error preprocessing:", error);
    }
  };

  const totalData = showPreprocessed
    ? [...(apiResult?.head ?? []), ...(apiResult?.tail ?? [])].length
    : data.length;

  const start = page * perPage;
  const end = start + perPage;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Dataset</h2>
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

      <table className="w-full border border-gray-400 text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1 text-center">No.</th>
            {showPreprocessed ? (
              <>
                <th className="border px-2 py-1">Komentar Asli</th>
                <th className="border px-2 py-1">Setelah Pra-pemrosesan</th>
              </>
            ) : (
              <>
                <th className="border px-2 py-1">Komentar</th>
                <th className="border px-2 py-1">Label Emosi Manual</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {!showPreprocessed &&
            data.slice(start, end).map((row, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1 text-center">
                  {start + idx + 1}
                </td>
                <td className="border px-2 py-1">{row[0]}</td>
                <td className="border px-2 py-1">{row[1]}</td>
              </tr>
            ))}

          {showPreprocessed &&
            [...(apiResult?.head ?? []), ...(apiResult?.tail ?? [])]
              .slice(start, end)
              .map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1 text-center">
                    {start + idx + 1}
                  </td>
                  <td className="border px-2 py-1">{row.full_text}</td>
                  <td className="border px-2 py-1">{row.emotion}</td>
                </tr>
              ))}
        </tbody>
      </table>

      {/* Pagination & Action */}
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
          {!showPreprocessed && data.length > 0 && (
            <button
              onClick={handlePreprocessing}
              className="bg-gray-700 text-white px-4 py-1 rounded shadow"
            >
              Pra-pemrosesan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
