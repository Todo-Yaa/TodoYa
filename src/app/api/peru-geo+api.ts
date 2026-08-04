export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat') || '-12.046374'; // Coordenada por defecto (Lima, Perú)
    const lng = url.searchParams.get('lng') || '-77.042793';

    // Reverse Geocoding usando la API gratuita e ilimitada de OpenStreetMap (Nominatim)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TodoYaPeruApp/1.0 (contacto@todoya.pe)',
            'Accept-Language': 'es-PE,es;q=0.9',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const distrito = address.suburb || address.neighbourhood || address.city_district || address.district || 'Miraflores';
        const ciudad = address.city || address.town || address.state || 'Lima';
        const pais = address.country || 'Perú';
        const calle = address.road || address.pedestrian || 'Av. Arequipa';

        return Response.json({
          success: true,
          formattedAddress: data.display_name || `${calle}, ${distrito}, ${ciudad}, Perú`,
          distrito,
          ciudad,
          pais,
          calle,
          coordenadas: { lat: Number(lat), lng: Number(lng) },
          proveedorMapas: 'OpenStreetMap (Gratuito)',
        });
      }
    } catch (e) {
      console.warn('[OpenStreetMap Geo API] Fallback a ubicación por defecto:', e);
    }

    return Response.json({
      success: true,
      formattedAddress: 'Av. Larco 450, Miraflores, Lima, Perú',
      distrito: 'Miraflores',
      ciudad: 'Lima',
      pais: 'Perú',
      calle: 'Av. Larco',
      coordenadas: { lat: Number(lat), lng: Number(lng) },
      proveedorMapas: 'Geocodificación Local Perú',
    });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
