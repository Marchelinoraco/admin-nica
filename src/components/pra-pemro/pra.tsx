"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PreprocessingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPreprocessed = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:5001/admin/preprocessed");
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreprocessed();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ⚙️ Preview Pra-pemrosesan
      </h2>

      {error && <p className="text-red-500">{error}</p>}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-2">Komentar Asli</th>

                <th className="border px-2 py-2">Hasil Pra-pemrosesan </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-2 py-2">{item.full_text}</td>

                  <td className="border px-2 py-2">{item.text_final}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
