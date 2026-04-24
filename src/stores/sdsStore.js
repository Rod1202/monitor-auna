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

  // --- Data combinada (cruce de las 3 fuentes) ---
  const combinedData = computed(() => {
    return inventario.value.map(item => {
      const serie = item.serie

      // Cruce con SDS devices
      const device = devices.value.find(d => d.serialNumber === serie)

      // Cruce con SDS consumables
      const consumable = consumables.value.find(d => d.deviceId === device?.deviceId)

      // Cruce con suministros
      const suministro = suministros.value
        .filter(s => s.serie === serie)
        .sort((a, b) => new Date(b.fecha_enprega) - new Date(a.fecha_enprega))[0]

      return {
        // Inventario
        ...item,

        // Estado dispositivo
        deviceId: device?.deviceId || null,
        lastContact: device?.lastContact || null,
        estado_dispositivo: device ? device.estado_dispositivo : 'SIN_SDS',
        modelo_sds: device?.modelo || null,

        // Toners actuales
        toners: consumable?.toners || [],

        // Último suministro enviado
        ultimo_suministro: suministro ? {
          descripcion: suministro.descripcion_suministro,
          sku: suministro.sku,
          fecha_entrega: suministro.fecha_enprega,
          status_envio: suministro.status_envio,
          color: suministro.Color,
          guia: suministro.guia,
          porcentaje: suministro.porcentaje,
          dias_restantes: suministro.dias_restantes
        } : null
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

      // Recargar datos locales inmediatamente
      await loadStaticData()
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