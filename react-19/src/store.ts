import { create } from "zustand";
import { Assistant } from "../types/type";

interface AssistantStore {
  selected: Assistant[];
  setSelected: (a: Assistant[]) => void;
}

export const useAssistantStore = create<AssistantStore>((set) => ({
  selected: [],
  setSelected: (a) => set({ selected: a }),
}));
