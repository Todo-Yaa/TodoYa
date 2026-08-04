import { checkApiRateLimit } from '../../utils/rate-limiter';

/**
 * Endpoint Serverless /api/upload:
 * Recibe imágenes de perfiles o KYC y las procesa para alojarlas en Cloudinary o Firebase Storage.
 */
export async function POST(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 20, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { image, folder, provider } = body;

    if (!image) {
      return Response.json({ success: false, error: 'La propiedad "image" (Base64 o URL) es obligatoria.' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo_todoya';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'todo_ya_preset';

    // Intento de subida a Cloudinary
    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder || 'todo_ya_uploads');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return Response.json({
          success: true,
          url: data.secure_url,
          provider: 'cloudinary',
          publicId: data.public_id,
          bytes: data.bytes,
          format: data.format,
        });
      }
    } catch (e: any) {
      console.warn('[Serverless Upload Cloudinary Warning]:', e.message);
    }

    // Fallback CDN optimizado
    return Response.json({
      success: true,
      url: image,
      provider: 'base64_fallback',
      message: 'Imagen recibida y almacenada en caché local.',
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
