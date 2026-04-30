import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debug environment variables
console.log('Environment variables loaded:', {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY ? '***' + import.meta.env.VITE_CLOUDINARY_API_KEY.slice(-4) : 'undefined',
  allViteVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// Test Cloudinary connectivity
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

    console.log('Testing Cloudinary connection...', {
      cloudName,
      uploadPreset,
      apiKey: apiKey ? '***' + apiKey.slice(-4) : 'undefined',
      allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    });

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary configuration missing');
      return false;
    }

    // Create a small test image (1x1 pixel)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1, 1);
    }

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to create test blob');
          resolve(false);
          return;
        }

        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        console.log('Created test file:', testFile.size, 'bytes');

        const formData = new FormData();
        formData.append('file', testFile);
        formData.append('upload_preset', uploadPreset);

        try {
          console.log('Making test upload request to:', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          console.log('Test upload response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Test upload successful:', data);
            resolve(true);
          } else {
            const errorText = await response.text();
            console.error('Test upload failed with response:', errorText);
            resolve(false);
          }
        } catch (error) {
          console.error('Test upload network error:', error);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (error) {
    console.error('Cloudinary test failed:', error);
    return false;
  }
};
// Cloudinary upload utility
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

  console.log('Cloudinary upload starting...', {
    cloudName,
    uploadPreset,
    hasApiKey: !!apiKey,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_CLOUDINARY'))
  });

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not found');
  }

  // Validate file
  if (!file || file.size === 0) {
    throw new Error('Invalid file provided');
  }

  // Check file size (max 10MB for free tier)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum 10MB allowed.');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Try unsigned upload first (with preset)
  if (uploadPreset) {
    console.log('Trying unsigned upload with preset...');
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'qr-orders');
    formData.append('resource_type', 'image');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log('Unsigned upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Unsigned upload successful:', data);
        return data.secure_url;
      } else {
        const errorText = await response.text();
        console.warn('Unsigned upload failed, trying authenticated upload...', {
          status: response.status,
          error: errorText
        });
      }
    } catch (error) {
      console.warn('Unsigned upload failed, trying authenticated upload...', error);
    }
  }

  // Fallback to authenticated upload if unsigned fails or no preset
  if (apiKey) {
    console.log('Trying authenticated upload...');

    // Generate timestamp and signature (simplified for demo)
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadParams = {
      timestamp: timestamp,
      folder: 'qr-orders',
      resource_type: 'image'
    };

    // Note: In production, you should generate proper signature on backend
    // For now, let's try a basic authenticated upload
    const authFormData = new FormData();
    authFormData.append('file', file);
    authFormData.append('api_key', apiKey);
    authFormData.append('timestamp', timestamp.toString());
    authFormData.append('folder', 'qr-orders');
    authFormData.append('resource_type', 'image');

    // For demo purposes, try without signature first
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: authFormData,
        }
      );

      console.log('Authenticated upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Authenticated upload failed:', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Authenticated upload successful:', data);

      if (!data.secure_url) {
        throw new Error('No secure URL returned from Cloudinary');
      }

      return data.secure_url;
    } catch (error) {
      console.error('Authenticated upload error:', error);
      throw error;
    }
  }

  throw new Error('No valid Cloudinary upload method available');
};
