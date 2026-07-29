import { checkApiRateLimit } from '../../utils/rate-limiter';

export async function POST(request: Request) {
  const rateLimitError = checkApiRateLimit(request, 10, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const { code, redirectUri } = await request.json();
    if (!code) {
      return Response.json({ status: 'error', message: 'Falta el código de autorización' }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID || process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return Response.json({ status: 'error', message: 'Credenciales de LinkedIn no configuradas en el servidor' }, { status: 500 });
    }

    // 1. Intercambiar el código por el token de acceso
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return Response.json({ status: 'error', message: `Error de LinkedIn: ${errText}` }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Obtener el perfil del usuario (usando OpenID Connect que es el estándar actual)
    const userinfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userinfoResponse.ok) {
      // Fallback a me y emailAddress si el nuevo userinfo no está disponible
      const meRes = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const emailRes = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(*,(handle~))', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!meRes.ok) {
        return Response.json({ status: 'error', message: 'No se pudo obtener el perfil de LinkedIn' }, { status: 400 });
      }

      const meData = await meRes.json();
      const emailData = emailRes.ok ? await emailRes.json() : null;

      const name = `${meData.localizedFirstName || ''} ${meData.localizedLastName || ''}`.trim();
      const email = emailData?.elements?.[0]?.['handle~']?.emailAddress || `${meData.id}@linkedin.com`;

      return Response.json({ status: 'success', name, email });
    }

    const profile = await userinfoResponse.json();
    const name = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim();
    const email = profile.email;

    return Response.json({ status: 'success', name, email });
  } catch (err: any) {
    return Response.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
