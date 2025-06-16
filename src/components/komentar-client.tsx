"use client";

import { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/configFirebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { DataTable } from "@/components/datatable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type RowData = {
  id: string;
  comment: string;
  label: string;
};

export default function KomentarClient() {
  const [data, setData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [komentar, setKomentar] = useState("");
  const [label, setLabel] = useState("Neutral");
  const [userUid, setUserUid] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "komentar"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const newData: RowData[] = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          comment: docData.comment ?? "",
          label: docData.label ?? "",
        };
      });
      setData(newData);
    } catch (error) {
      console.error("Firestore fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!komentar.trim()) return;

    try {
      await addDoc(collection(db, "komentar"), {
        comment: komentar,
        label: label,
        createdAt: serverTimestamp(),
        uid: userUid,
      });
      setKomentar("");
      setLabel("Neutral");
      fetchData();
    } catch (error) {
      console.error("Gagal menyimpan komentar:", error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user.uid);
        setUserUid(user.uid);
        await fetchData();
      } else {
        console.log("Belum login");
        setUserUid(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!userUid)
    return <div className="text-center">Silakan login terlebih dahulu</div>;
  if (loading) return <div className="text-center">Memuat data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          value={komentar}
          onChange={(e) => setKomentar(e.target.value)}
          placeholder="Tulis komentar di sini..."
          className="flex-1"
        />
        <Select value={label} onValueChange={(val) => setLabel(val)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Pilih label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Anger">Anger</SelectItem>
            <SelectItem value="Happy">Happy</SelectItem>
            <SelectItem value="Sadness">Sadness</SelectItem>
            <SelectItem value="Love">Love</SelectItem>
            <SelectItem value="Neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSubmit}>Kirim</Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center">Tidak ada data</div>
      ) : (
        <DataTable data={data} />
      )}
    </div>
  );
}
