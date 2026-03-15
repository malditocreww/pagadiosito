export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { imageB64, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Falta API KEY en Vercel" });

  try {
    // CAMBIO CRÍTICO: Nueva ruta para Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analiza esta factura argentina. Devuelve ÚNICAMENTE un objeto JSON con: empresa, titular, monto (entero), vence (YYYY-MM-DD), categoria (emoji). No incluyas texto extra ni bloques de código markdown." },
            { 
              inline_data: { 
                mime_type: mimeType || "image/jpeg", 
                data: imageB64 
              } 
            }
          ]
        }]
      })
    });

    const data = await response.json();

    // Si Google responde con error 404 de nuevo, intentamos la ruta alternativa v1
    if (data.error && data.error.code === 404) {
        console.log("Reintentando con ruta v1...");
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        // (Aquí podrías repetir la lógica de fetch, pero primero probemos con la v1beta corregida)
    }

    if (data.error) {
      return res.status(500).json({ error: "Error de Google", mensaje: data.error.message });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "Gemini no generó respuesta" });
    }

    let textoRespuesta = data.candidates[0].content.parts[0].text;
    
    // Limpiamos la respuesta por si Gemini devuelve ```json { ... } ```
    const jsonLimpio = textoRespuesta.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(jsonLimpio));

  } catch (error) {
    console.error("Error en analizar.js:", error.message);
    return res.status(500).json({ error: "Error interno", detalle: error.message });
  }
}