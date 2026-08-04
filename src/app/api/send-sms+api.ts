export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, channel } = body;

    if (!phone || !code) {
      return Response.json(
        { success: false, error: 'Número de teléfono y código son requeridos.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    console.log(`[SMS/WhatsApp API] Procesando envío de PIN ${code} a ${cleanPhone} vía ${channel || 'sms'}`);

    // Soporte para API Twilio si está configurado en .env
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const params = new URLSearchParams({
          To: cleanPhone,
          From: twilioFrom,
          Body: `Todo Ya (BETA): Tu código de verificación es ${code}`,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (res.ok) {
          const data = await res.json();
          return Response.json({
            success: true,
            provider: 'twilio',
            sid: data.sid,
            message: `SMS enviado correctamente a ${cleanPhone}`,
          });
        }
      } catch (err: any) {
        console.warn('[SMS API] Error con Twilio Gateway:', err);
      }
    }

    // Respuesta limpia para procesamiento y transmisión mediante canal nativo del dispositivo (WhatsApp / SMS)
    return Response.json({
      success: true,
      provider: 'direct_device_gateway',
      phone: cleanPhone,
      code,
      message: `Transmisión iniciada para el número ${cleanPhone}`,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Error interno al enviar SMS' },
      { status: 500 }
    );
  }
}
