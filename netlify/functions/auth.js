export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { pin } = await req.json()
  const adminPin = process.env.APP_PIN
  const viewerPin = process.env.APP_PIN_VIEWER

  if (!adminPin) {
    return new Response(JSON.stringify({ error: 'PIN no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (pin === adminPin) {
    return new Response(JSON.stringify({ success: true, role: 'admin' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (viewerPin && pin === viewerPin) {
    return new Response(JSON.stringify({ success: true, role: 'viewer' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: false, error: 'PIN incorrecto' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  })
}