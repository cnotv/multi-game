
export const LOCAL_STORAGE_KEY = 'UI';
export const getLocalStorageObject = (): Record<string, any> => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
export const setStorageItem = (state: Record<string, any>, key: string) => localStorage.setItem(
  LOCAL_STORAGE_KEY,
  JSON.stringify({
    ...getLocalStorageObject(),
    [key]: state[key]
  })
);
export const getStorageItem = (state: any, key: string) => (state ? state[key] = getLocalStorageObject()[key] : null);