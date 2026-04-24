export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { pin } = await req.json()
  const validPin = process.env.APP_PIN

  if (!validPin) {
    return new Response(JSON.stringify({ error: 'PIN no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (pin === validPin) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: false, error: 'PIN incorrecto' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}
