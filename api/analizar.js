export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Post only' });

  const { imageB64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Falta API KEY en Vercel" });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analiza la factura. Devuelve SOLO un JSON con: empresa, titular, monto (entero), vence (YYYY-MM-DD), categoria (emoji)." },
            { inline_data: { mime_type: "image/jpeg", data: imageB64 } }
          ]
        }]
      })
    });

    const data = await response.json();

    // Si Google nos da error, lo vemos acá
    if (data.error) return res.status(500).json({ error: "Error de Google", details: data.error });

    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(cleanJson));
  } catch (err) {
    return res.status(500).json({ error: "Error interno", msg: err.message });
  }
}