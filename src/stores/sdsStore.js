import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSdsStore = defineStore('sds', () => {

  // --- Estado ---
  const devices = ref([])
  const consumables = ref([])
  const inventario = ref([])
  const suministros = ref([])
  const loading = ref(false)
  const lastUpdate = ref(null)
  const error = ref(null)

  // --- Función auxiliar para leer fechas DD/MM/YYYY ---
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return 0
    const partes = fechaStr.split('/')
    if (partes.length === 3) {
      // split devuelve: [0] = dia, [1] = mes, [2] = año
      // Meses en JS van de 0 a 11, por eso restamos 1
      return new Date(partes[2], partes[1] - 1, partes[0]).getTime()
    }
    // Fallback por si alguna fecha viene en formato ISO estándar
    return new Date(fechaStr).getTime() || 0
  }

  // --- Cargar archivos estáticos ---
  async function loadStaticData() {
    try {
      const [invRes, sumRes] = await Promise.all([
        fetch('/data/inventario.json'),
        fetch('/data/suministros.json')
      ])
      inventario.value = await invRes.json()
      suministros.value = await sumRes.json()
    } catch (e) {
      error.value = 'Error al cargar datos estáticos'
    }
  }

  // --- Consultar API SDS ---
  async function fetchSdsData() {
    loading.value = true
    error.value = null
    try {
      const [devRes, conRes] = await Promise.all([
        fetch('/.netlify/functions/sds-devices'),
        fetch('/.netlify/functions/sds-consumables')
      ])
      devices.value = await devRes.json()
      consumables.value = await conRes.json()
      lastUpdate.value = new Date()
    } catch (e) {
      error.value = 'Error al consultar la API de SDS'
      console.error('Error fetchSdsData:', e)
    } finally {
      loading.value = false
    }
  }

  const calcularAccion = (item, procesarToners, suministros, device) => {
  // Solo aplica a series con SDS (no SIN_SDS)
  if (!device) return null

  // Impresoras COLOR — acción fija, solo mostramos info del tóner BLACK
  if (item.tipo === 'COLOR') {
    return 'VALIDAR IMPRESORAS COLOR'
  }

  // A partir de aquí solo MONOCROMATICA
  const tonerBlack = procesarToners.find(t => t.colour?.toUpperCase() === 'BLACK')
  const firstRead = tonerBlack?.firstRead || null

  // Suministros del color BLACK ordenados por fecha desc
  const suministrosBlack = suministros
    .filter(s => s.serie === item.serie && s.Color?.toUpperCase() === 'BLACK')
    .sort((a, b) => parseFecha(b.fecha_enprega) - parseFecha(a.fecha_enprega))

  const ultimoEnvio = suministrosBlack[0]

  // Sin envío registrado
  if (!ultimoEnvio || !ultimoEnvio.fecha_enprega || ultimoEnvio.fecha_enprega.trim() === '') {
    return 'SOLICITAR TONER'
  }

  const statusEnvio = ultimoEnvio.status_envio?.toUpperCase()

  // Estado diferente a ATENDIDO pero no vacío
  if (statusEnvio !== 'ATENDIDO') {
    return 'SEGUIMIENTO'
  }

  // Estado ATENDIDO — comparar firstRead vs fecha entrega
  if (firstRead) {
    const firstReadTs = new Date(firstRead).getTime()
    const fechaEntregaTs = parseFecha(ultimoEnvio.fecha_enprega)

    if (firstReadTs > fechaEntregaTs) {
      // firstRead mayor que fecha entrega → ya usó el tóner
      return 'SOLICITAR TONER'
    } else {
      // firstRead menor o igual → tóner aún en sede
      return 'TONER EN SEDE'
    }
  }

  return 'SOLICITAR TONER'
}

  const calcularEvaluar = (item, suministros, device) => {
    // Solo aplica si tiene SDS y no es COLOR
    if (!device || item.tipo === 'COLOR') return null

    const discoveryDate = device.discoveryDate
    if (!discoveryDate) return null

    // Suministros BLACK ordenados por fecha desc
    const suministrosBlack = suministros
      .filter(s => s.serie === item.serie && s.Color?.toUpperCase() === 'BLACK')
      .sort((a, b) => parseFecha(b.fecha_enprega) - parseFecha(a.fecha_enprega))

    const ultimoEnvio = suministrosBlack[0]
    if (!ultimoEnvio || !ultimoEnvio.fecha_enprega || ultimoEnvio.fecha_enprega.trim() === '') {
      return null
    }

    const discoveryTs = new Date(discoveryDate).getTime()
    const fechaEntregaTs = parseFecha(ultimoEnvio.fecha_enprega)

    return discoveryTs < fechaEntregaTs ? 'EVALUAR' : 'REVISAR CON GESTOR'
  }

  // --- Data combinada (cruce de las 3 fuentes y validaciones internas) ---
  const combinedData = computed(() => {
    return inventario.value.map(item => {
      const serie = item.serie

      // Cruce con SDS devices
      const device = devices.value.find(d => d.serialNumber === serie)

      // Cruce con SDS consumables
      const consumable = consumables.value.find(d => d.deviceId === device?.deviceId)

      // Procesar validación interna POR TÓNER (Serie + Color + Fechas)
      const procesarToners = (consumable?.toners || []).map(toner => {
        // 1. Filtrar suministros que coincidan con esta SERIE y este COLOR específico
        const suministrosDelColor = suministros.value.filter(s => 
          s.serie === serie && 
          s.Color?.toUpperCase() === toner.colour?.toUpperCase()
        )

        // 2. Ordenar usando la función parseFecha (b - a = del más reciente al más antiguo)
        suministrosDelColor.sort((a, b) => parseFecha(b.fecha_enprega) - parseFecha(a.fecha_enprega))
        const ultimoEnvioToner = suministrosDelColor[0]

        // 3. Lógica de comparación de fechas para "evaluar_toner"
        let evaluar_toner = null

        if (ultimoEnvioToner && toner.firstRead) {
          // Asumimos que firstRead viene de la API en un formato estándar reconocible por JS (ISO)
          const firstReadDate = new Date(toner.firstRead).getTime()
          const fechaEntregaDate = parseFecha(ultimoEnvioToner.fecha_enprega)

          if (firstReadDate < fechaEntregaDate) {
            evaluar_toner = "Tiene toner"
          } else if (firstReadDate > fechaEntregaDate) {
            evaluar_toner = "Uso toner"
          } else {
            evaluar_toner = "Misma fecha" 
          }
        }

        // Devolver el objeto del tóner con la nueva información inyectada
        return {
          ...toner,
          evaluar_toner,
          status_envio: ultimoEnvioToner?.status_envio || null,
          ultimo_suministro_fecha: ultimoEnvioToner?.fecha_enprega || null
        }
      })

      // Cruce general de último suministro absoluto (usando parseFecha)
      const suministroGeneral = suministros.value
        .filter(s => s.serie === serie)
        .sort((a, b) => parseFecha(b.fecha_enprega) - parseFecha(a.fecha_enprega))[0]

      return {
        // Inventario
        ...item,

        // Estado dispositivo
        deviceId: device?.deviceId || null,
        lastContact: device?.lastContact || null,
        estado_dispositivo: device ? device.estado_dispositivo : 'SIN_SDS',
        ipAddress: device?.ipAddress || null,
        modelo_sds: device?.modelo || null,

        // Toners procesados con la validación insertada
        toners: procesarToners,

        // Último suministro enviado a nivel general
        ultimo_suministro: suministroGeneral ? {
          descripcion: suministroGeneral.descripcion_suministro,
          sku: suministroGeneral.sku,
          fecha_entrega: suministroGeneral.fecha_enprega,
          status_envio: suministroGeneral.status_envio,
          color: suministroGeneral.Color,
          guia: suministroGeneral.guia,
          porcentaje: suministroGeneral.porcentaje,
          dias_restantes: suministroGeneral.dias_restantes
        } : null,
        accion: calcularAccion(item, procesarToners, suministros.value, device),
        evaluar: calcularEvaluar(item, suministros.value, device),
      }
    })
  })

  // --- Estadísticas para el header del dashboard ---
  const stats = computed(() => ({
    total: combinedData.value.length,
    sincronizados: combinedData.value.filter(d => d.estado_dispositivo === 'SINCRONIZADO').length,
    standby: combinedData.value.filter(d => d.estado_dispositivo === 'STAND_BY').length,
    desincronizados: combinedData.value.filter(d => d.estado_dispositivo === 'DESINCRONIZADO').length,
    sinSds: combinedData.value.filter(d => d.estado_dispositivo === 'SIN_SDS').length,
    criticos: combinedData.value.filter(d =>
      d.toners.some(t => t.estado_toner === 'CRITICO')
    ).length
  }))

  // --- Actualizar JSON via GitHub API ---
async function updateJson(archivo, datos) {
  try {
    const pin = sessionStorage.getItem('app_pin')
    const response = await fetch('/.netlify/functions/update-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, archivo, datos })
    })
    const result = await response.json()
    if (!result.success) throw new Error(result.error)

    // Actualizar el store en memoria directamente (sin fetch al archivo)
    if (archivo === 'inventario.json') {
      inventario.value = datos
    } else if (archivo === 'suministros.json') {
      suministros.value = datos
    }

    return true
  } catch (e) {
    console.error('Error updateJson:', e)
    return false
  }
}

  return {
    devices,
    consumables,
    inventario,
    suministros,
    loading,
    lastUpdate,
    error,
    combinedData,
    stats,
    loadStaticData,
    fetchSdsData,
    updateJson
  }
})