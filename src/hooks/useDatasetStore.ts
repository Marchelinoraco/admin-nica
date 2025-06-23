import { create } from "zustand";

type DataItem = {
  full_text: string;
  emotion: string;
};

type DatasetStore = {
  data: DataItem[];
  setData: (data: DataItem[]) => void;
  clearData: () => void;
};

export const useDatasetStore = create<DatasetStore>((set) => ({
  data: [],
  setData: (data) => set({ data }),
  clearData: () => set({ data: [] }),
}));
