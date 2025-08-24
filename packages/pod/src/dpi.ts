export const cmToIn = (cm: number) => cm / 2.54;

export const pixelsRequired = (cm: number, dpi: number) =>
  Math.round(cmToIn(cm) * dpi);

export const dpiFrom = (cm: number, px: number) => px / cmToIn(cm);
