import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps()[0];
const storage = getStorage(app);

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `products/${productId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  const metadata = {
    contentType: file.type,
    customMetadata: { productId, uploadedAt: new Date().toISOString() },
  };

  const snapshot = await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(snapshot.ref);
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (e) {
    // Ignore if already deleted or URL not from Storage
    console.warn('Image delete skipped:', e);
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxSizeMB = 5;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP and AVIF images are accepted.' };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Image must be under ${maxSizeMB} MB.` };
  }
  return { valid: true };
}
