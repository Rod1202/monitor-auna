function calcularEstadoToner(percentLeft) {
  if (percentLeft === null || percentLeft === undefined) return 'SIN_DATOS'
  if (percentLeft <= 10) return 'CRITICO'
  if (percentLeft <= 25) return 'BAJO'
  if (percentLeft <= 50) return 'MEDIO'
  return 'OK'
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

    console.log('USERNAME:', username ? 'OK' : 'VACIO')
    console.log('PASSWORD:', password ? 'OK' : 'VACIO')
    console.log('CUSTOMER_ID:', customerId)

    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    console.log('Intentando autenticación consumables...')

    const authResponse = await fetch('https://hp-sds-latam.insightportal.net/PortalAPI/login', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` }
    })

    console.log('Auth status:', authResponse.status)
    const authData = await authResponse.json()
    const token = authData.access_token
    console.log('Token recibido:', token ? token.substring(0, 50) : 'VACIO')

    if (!token) throw new Error('No se pudo obtener el token')

    const consumablesResponse = await fetch(
      `https://hp-sds-latam.insightportal.net/PortalAPI/api/devices/consumables?customerId=${customerId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    console.log('Consumables status:', consumablesResponse.status)
    const consumablesData = await consumablesResponse.json()
    console.log('Total consumables devices:', consumablesData.length)

    const results = consumablesData.map((device) => {
      const toners = (device.consumables || [])
        .filter(c => c.type === 'TONER')
        .map(c => ({
          consumableId: c.consumableId,
          index: c.index,
          colour: c.colour,
          sku: c.sku,
          description: c.description,
          percentLeft: c.percentLeft,
          daysLeft: c.daysLeft,
          pagesLeft: c.pagesLeft,
          serialNumber: c.serialNumber,
          firstRead: c.firstRead,
          lastRead: c.lastRead,
          daysMonitored: c.daysMonitored,
          estado_toner: calcularEstadoToner(c.percentLeft)
        }))

      return { deviceId: device.deviceId, toners }
    })

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ERROR consumables:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}