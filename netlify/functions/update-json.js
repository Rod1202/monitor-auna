export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { pin, archivo, datos } = await req.json()

    const adminPin = process.env.APP_PIN
    const viewerPin = process.env.APP_PIN_VIEWER

    const pinValido = pin === adminPin || (viewerPin && pin === viewerPin)
    if (!pinValido) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Solo permitir estos archivos
    const archivosPermitidos = ['inventario.json', 'suministros.json']
    if (!archivosPermitidos.includes(archivo)) {
      return new Response(JSON.stringify({ error: 'Archivo no permitido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const filePath = `public/data/${archivo}`

    // Obtener SHA actual del archivo
    const getResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    )

    const fileData = await getResponse.json()
    const sha = fileData.sha

    // Actualizar archivo
    const content = Buffer.from(JSON.stringify(datos, null, 2)).toString('base64')

    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update ${archivo} via Monitor SDS`,
          content,
          sha
        })
      }
    )

    if (!updateResponse.ok) {
      const err = await updateResponse.json()
      throw new Error(err.message || 'Error al actualizar GitHub')
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('ERROR update-json:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}