export default async function handler(req, res) {
  // 1. Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { imageB64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Verificamos la clave
  if (!apiKey) {
    return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel" });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analiza esta factura. Devuelve SOLO un objeto JSON con: empresa, titular, monto (numero), vence (YYYY-MM-DD), categoria (emoji)." },
            { inline_data: { mime_type: "image/jpeg", data: imageB64 } }
          ]
        }]
      })
    });

    const data = await response.json();

    // 3. Si Google devuelve error (ej: clave inválida)
    if (data.error) {
      return res.status(500).json({ error: "Google API Error", details: data.error.message });
    }

    // 4. Procesamos la respuesta
    const textoRespuesta = data.candidates[0].content.parts[0].text;
    const jsonLimpio = textoRespuesta.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(jsonLimpio));
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
}