import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Resize image to max 400x400 before uploading
async function resizeImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const resized = await resizeImage(file);
  const storageRef = ref(storage, `avatars/${userId}.jpg`);
  await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
