import type { Vehicle } from '@kharcha/shared';

export function vehicleImageSrc(vehicle: Pick<Vehicle, 'kind' | 'image_url'>) {
  if (vehicle.image_url) return vehicle.image_url;
  return vehicle.kind === '4w' ? '/4w-skeleton.png' : '/2w-skeleton.png';
}

export async function fileToDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 480;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not read image');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.readAsDataURL(file);
    });
  }
}
