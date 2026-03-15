export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { imageB64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("ERROR: No se encontró la variable GEMINI_API_KEY");
    return res.status(500).json({ error: "Falta la API Key en el servidor" });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analiza esta factura y devuelve SOLO un JSON: {empresa, titular, monto, vence, categoria}." },
            { inline_data: { mime_type: "image/jpeg", data: imageB64 } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error de Google API:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const textoRespuesta = data.candidates[0].content.parts[0].text;
    const jsonLimpio = textoRespuesta.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(jsonLimpio));
  } catch (error) {
    console.error("Error Crítico:", error.message);
    return res.status(500).json({ error: "Error interno", detalle: error.message });
  }
}