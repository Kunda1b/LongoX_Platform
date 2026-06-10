import { create } from 'zustand';
export const useAppStore = create(() => ({ tenant: null, user: null, theme: 'light' }));
