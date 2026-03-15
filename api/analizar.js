export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') return res.status(405).send('Metodo no permitido');

  const { imageB64 } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY; 

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analiza esta factura argentina. Devuelve SOLO un objeto JSON con: empresa, titular, monto (numero entero), vence (YYYY-MM-DD), categoria (emoji)." },
            { inline_data: { mime_type: "image/jpeg", data: imageB64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    const texto = data.candidates[0].content.parts[0].text;
    const jsonLimpio = texto.replace(/```json|```/g, "").trim();
    
    res.status(200).json(JSON.parse(jsonLimpio));
  } catch (error) {
    res.status(500).json({ error: "Error procesando con Gemini" });
  }
}
