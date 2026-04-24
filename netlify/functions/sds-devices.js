function calcularEstado(lastContact) {
  if (!lastContact) return 'SIN_DATOS'
  const ahora = new Date()
  const fecha = new Date(lastContact)
  const diferenciaHoras = (ahora - fecha) / (1000 * 60 * 60)
  if (diferenciaHoras <= 24) return 'SINCRONIZADO'
  if (diferenciaHoras <= 48) return 'STAND_BY'
  return 'DESINCRONIZADO'
}

export default async (req) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const username = process.env.SDS_USERNAME
    const password = process.env.SDS_PASSWORD
    const customerId = process.env.SDS_CUSTOMER_ID

    const credentials = Buffer.from(`${username}:${password}`).toString('base64')

    const authResponse = await fetch('https://hp-sds-latam.insightportal.net/PortalAPI/login', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` }
    })

    const authData = await authResponse.json()
    const token = authData.access_token

    if (!token) throw new Error('No se pudo obtener el token')

    // Una sola llamada para todos los dispositivos
    const devicesResponse = await fetch(
      `https://hp-sds-latam.insightportal.net/PortalAPI/api/devices?customerId=${customerId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    console.log('Devices status:', devicesResponse.status)
    const devicesData = await devicesResponse.json()
    console.log('Total devices:', devicesData.length)

    const results = devicesData.map((device) => ({
      deviceId: device.deviceId || null,
      serialNumber: device.serialNumber || 'N/A',
      lastContact: device.lastContact || null,
      estado_dispositivo: calcularEstado(device.lastContact),
      modelo: device.model || 'N/A',
    }))

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ERROR:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}