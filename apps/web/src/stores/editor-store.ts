import { create } from "zustand";
export const useEditorStore = create(() => ({
  selectedNodeId: null,
  isDirty: false,
}));
