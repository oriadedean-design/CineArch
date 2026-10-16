// Upload limits (same as the iPhone app and the documents bucket): 1 MB per file,
// 5 GB of documents per account. Photos are shrunk in the browser to fit;
// a PDF must already be 1 MB or less.

export const MAX_FILE_BYTES = 1_048_576;
export const ACCOUNT_LIMIT_BYTES = 5_368_709_120;

const mb = (n: number) => `${(n / 1_048_576).toFixed(1)} MB`;

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Couldn't open that image."));
  img.src = URL.createObjectURL(file);
});

/** A file ready to upload under 1 MB: images re-encoded as JPEG, smaller until they fit. */
export const fitUnder1MB = async (file: File): Promise<File> => {
  if (file.size <= MAX_FILE_BYTES && file.type !== 'image/heic') return file;
  if (!file.type.startsWith('image/')) {
    throw new Error(`This file is ${mb(file.size)}. Files must be 1 MB or less. Upload a photo of it instead, and CineArch will shrink it to fit.`);
  }
  const img = await loadImage(file);
  for (const side of [2000, 1600, 1280, 1000, 800]) {
    const scale = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.8, 0.65, 0.5, 0.35]) {
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', q));
      if (blob && blob.size <= MAX_FILE_BYTES) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    }
  }
  throw new Error("Couldn't shrink that image under 1 MB.");
};

/** Plain words for the storage errors people can hit. */
export const uploadError = (e: any): Error => {
  const m = String(e?.message ?? e);
  if (/row-level security|policy/i.test(m)) return new Error("You've used your 5 GB of documents, or your plan doesn't include uploads. Delete some old proof to make room.");
  if (/exceeded the maximum allowed size|too large/i.test(m)) return new Error('Files must be 1 MB or less.');
  return e instanceof Error ? e : new Error(m);
};
