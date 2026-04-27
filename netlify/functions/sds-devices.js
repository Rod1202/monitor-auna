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

    // Llamada a la API de HP
    const devicesResponse = await fetch(
      `https://hp-sds-latam.insightportal.net/PortalAPI/api/devices?customerId=${customerId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    console.log('Devices status:', devicesResponse.status)
    const devicesData = await devicesResponse.json()
    console.log('Total devices (Raw):', devicesData.length)

    // 1. Primero, mapeamos todos los equipos para tener sus estados y formatos listos
    const mappedDevices = devicesData.map((device) => ({
      deviceId: device.deviceId || null,
      serialNumber: device.serialNumber || 'N/A',
      lastContact: device.lastContact || null,
      estado_dispositivo: calcularEstado(device.lastContact),
      modelo: device.model || 'N/A',
    }))

    // 2. Lógica de Depuración de Series Duplicadas
    const uniqueDevicesMap = {}

    for (const current of mappedDevices) {
      const serial = current.serialNumber

      // Si la serie no existe en nuestro objeto, la agregamos
      if (!uniqueDevicesMap[serial]) {
        uniqueDevicesMap[serial] = current
      } else {
        // Si ya existe, tenemos un choque. Evaluamos cuál sobrevive:
        const existing = uniqueDevicesMap[serial]

        // REGLA 1: Si el nuevo es 'SINCRONIZADO' y el que ya teníamos no lo es, lo reemplazamos.
        if (current.estado_dispositivo === 'SINCRONIZADO' && existing.estado_dispositivo !== 'SINCRONIZADO') {
          uniqueDevicesMap[serial] = current
        } 
        // REGLA 1 (Inversa): Si el que ya teníamos es 'SINCRONIZADO' y el nuevo no lo es, ignoramos el nuevo.
        else if (existing.estado_dispositivo === 'SINCRONIZADO' && current.estado_dispositivo !== 'SINCRONIZADO') {
          continue
        } 
        // REGLA 2: Si ambos tienen el mismo peso (ej. ambos DESINCRONIZADOS, STAND_BY, o incluso ambos SINCRONIZADOS)
        // Sobrevive el que tenga la fecha 'lastContact' más reciente.
        else {
          const timeCurrent = current.lastContact ? new Date(current.lastContact).getTime() : 0
          const timeExisting = existing.lastContact ? new Date(existing.lastContact).getTime() : 0

          if (timeCurrent > timeExisting) {
            uniqueDevicesMap[serial] = current
          }
        }
      }
    }

    // Convertimos el objeto de nuevo a un array final limpio
    const results = Object.values(uniqueDevicesMap)
    console.log('Total devices (Únicos depurados):', results.length)

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