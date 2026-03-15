export default async function handler(req, res) {
  // Manejo de CORS y método
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { imageB64 } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Falta la GEMINI_API_KEY en las variables de entorno de Vercel" });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analiza esta factura argentina. Extrae los datos y devuelve SOLO un objeto JSON con estas claves: empresa, titular, monto (entero), vence (YYYY-MM-DD), categoria (emoji). No respondas nada fuera del JSON." },
            { inline_data: { mime_type: "image/jpeg", data: imageB64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
        return res.status(500).json({ error: "Error de Google API", detalles: data.error });
    }

    const textoRespuesta = data.candidates[0].content.parts[0].text;
    const jsonLimpio = textoRespuesta.replace(/```json|```/g, "").trim();
    
    res.status(200).json(JSON.parse(jsonLimpio));
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor", mensaje: error.message });
  }
}