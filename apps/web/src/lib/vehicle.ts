import type { Vehicle } from '@kharcha/shared';

/** Stay under Express 900kb JSON and Vercel body limits after base64. */
export const MAX_VEHICLE_IMAGE_CHARS = 350_000;

export function vehicleImageSrc(vehicle: Pick<Vehicle, 'kind' | 'image_url'>) {
  if (vehicle.image_url) return vehicle.image_url;
  return vehicle.kind === '4w' ? '/4w-skeleton.png' : '/2w-skeleton.png';
}

export async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  let maxEdge = 360;
  let quality = 0.68;

  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not read that image.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_VEHICLE_IMAGE_CHARS) return dataUrl;
    maxEdge = Math.round(maxEdge * 0.75);
    quality = Math.max(0.42, quality - 0.08);
  }

  throw new Error('Image is still too large. Try a smaller photo.');
}
