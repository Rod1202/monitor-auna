<template>
  <v-dialog :model-value="modelValue" max-width="780" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card v-if="device" rounded="xl" elevation="0" border>

      <!-- Header -->
      <v-card-title class="pa-5 d-flex align-center" style="border-bottom:1px solid #eee;">
        <div>
          <div class="text-body-1 font-weight-bold" style="color:#111;">{{ device.modelo_completo }}</div>
          <div class="text-caption" style="color:#aaa;">{{ device.serie }}</div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="grey" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <!-- Tabs principales -->
      <v-tabs v-model="tab" color="#0066ff" class="px-4" style="border-bottom:1px solid #eee;">
        <v-tab value="info" style="font-size:13px;">Info</v-tab>
        <v-tab value="toners" style="font-size:13px;">Tóners</v-tab>
        <v-tab value="suministro" style="font-size:13px;">Suministro</v-tab>
        <v-tab value="editar" style="font-size:13px;">
          <v-icon start icon="mdi-pencil" size="14" />
          Editar
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-5">
        <v-tabs-window v-model="tab">

          <!-- TAB INFO -->
          <v-tabs-window-item value="info">
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-caption font-weight-bold mb-3" style="color:#0066ff; text-transform:uppercase; letter-spacing:0.08em;">Ubicación</div>
                <div v-for="(val, key) in ubicacionInfo" :key="key" class="d-flex mb-2">
                  <span class="text-caption" style="color:#aaa; min-width:90px;">{{ key }}</span>
                  <span class="text-caption font-weight-medium" style="color:#111;">{{ val }}</span>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption font-weight-bold mb-3" style="color:#0066ff; text-transform:uppercase; letter-spacing:0.08em;">Estado SDS</div>
                <EstadoBadge :estado="device.estado_dispositivo" class="mb-3" />
                <div class="text-caption mb-1" style="color:#aaa;">Último contacto: <span style="color:#333;">{{ device.lastContact || 'N/A' }}</span></div>
                <div class="text-caption mb-1" style="color:#aaa;">Modelo SDS: <span style="color:#333;">{{ device.modelo_sds || 'N/A' }}</span></div>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- TAB TONERS -->
          <v-tabs-window-item value="toners">
            <div v-if="device.toners.length">
              <v-row dense>
                <v-col cols="6" sm="3" v-for="toner in device.toners" :key="toner.index">
                  <v-card elevation="0" rounded="xl" border class="pa-4 text-center">
                    <TonerGauge
                      :colour="toner.colour"
                      :percent-left="toner.percentLeft"
                      :days-left="toner.daysLeft"
                      :sku="toner.sku"
                      :size="56"
                      :width="5"
                      :show-label="true"
                      :show-days="true"
                      :show-sku="true"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </div>
            <div v-else class="text-center py-8">
              <v-icon icon="mdi-toner" size="40" color="#ddd" class="mb-2" />
              <div class="text-caption" style="color:#aaa;">Sin datos de tóner desde SDS</div>
            </div>
          </v-tabs-window-item>

          <!-- TAB SUMINISTRO -->
          <v-tabs-window-item value="suministro">

            <!-- Sub tabs por color -->
            <v-tabs
              v-model="suministroTab"
              color="#0066ff"
              density="compact"
              class="mb-4"
              style="border-bottom:1px solid #f1f5f9;"
            >
              <v-tab
                v-for="stab in suministroTabs"
                :key="stab.key"
                :value="stab.key"
                style="font-size:12px; min-width:80px;"
              >
                <span
                  class="mr-1"
                  :style="`width:8px; height:8px; border-radius:50%; background:${stab.dotColor}; display:inline-block; flex-shrink:0;`"
                />
                {{ stab.label }}
              </v-tab>
            </v-tabs>
                        <!-- Info firstRead por color -->
            <v-card
            v-if="firstReadDelColor"
            elevation="0"
            rounded="lg"
            class="pa-3 mb-4 d-flex align-center gap-3"
            style="background:#f8fafc; border:1px solid #e2e8f0;"
            >
            <v-avatar size="32" color="#e8f0fe" rounded="lg">
                <v-icon icon="mdi-clock-outline" size="18" color="#0066ff" />
            </v-avatar>
            <div>
                <div class="text-caption" style="color:#94a3b8;">Primera lectura SDS del tóner</div>
                <div class="text-caption font-weight-bold" style="color:#1e293b;">
                {{ formatFirstRead(firstReadDelColor) }}
                </div>
            </div>
            </v-card>
            <v-tabs-window v-model="suministroTab">
              <v-tabs-window-item
                v-for="stab in suministroTabs"
                :key="stab.key"
                :value="stab.key"
              >
                <!-- Timeline historial -->
                <div v-if="historialPorColor(stab.key).length" style="max-height:380px; overflow-y:auto;">
                  <v-timeline density="compact" side="end" truncate-line="both">
                    <v-timeline-item
                      v-for="(envio, index) in historialPorColor(stab.key)"
                      :key="index"
                      :dot-color="envioTimelineColor(envio.status_envio)"
                      size="x-small"
                    >
                      <v-card
                        elevation="0"
                        rounded="lg"
                        class="pa-3 mb-1"
                        style="border:1px solid #e2e8f0;"
                      >
                        <!-- Fecha y estado -->
                        <div class="d-flex align-center justify-space-between mb-2">
                          <div class="d-flex align-center gap-1">
                            <v-icon icon="mdi-calendar" size="13" color="#94a3b8" />
                            <span class="text-caption font-weight-bold" style="color:#1e293b;">
                            {{ envio.fecha_enprega && envio.fecha_enprega.trim() !== '' ? envio.fecha_enprega : 'Sin fecha' }}
                            </span>
                          </div>
                          <v-chip
                            size="x-small"
                            rounded="lg"
                            :color="envioChipColor(envio.status_envio)"
                            variant="tonal"
                            style="font-weight:700;"
                          >
                            {{ envio.status_envio || 'SIN ESTADO' }}
                          </v-chip>
                        </div>

                        <!-- Detalles -->
                        <v-divider class="mb-2" />
                        <div class="d-flex flex-column" style="gap:5px;">
                          <div class="d-flex align-start gap-2">
                            <span class="text-caption" style="color:#94a3b8; min-width:65px; flex-shrink:0;">SKU</span>
                            <span class="text-caption font-weight-medium" style="color:#334155;">{{ envio.sku || 'N/A' }}</span>
                          </div>
                          <div class="d-flex align-start gap-2">
                            <span class="text-caption" style="color:#94a3b8; min-width:65px; flex-shrink:0;">Guía</span>
                            <span class="text-caption font-weight-medium" style="color:#334155;">{{ envio.guia || 'N/A' }}</span>
                          </div>
                          <div class="d-flex align-start gap-2 mt-1">
                            <span class="text-caption" style="color:#94a3b8; min-width:65px; flex-shrink:0;">Dirección</span>
                            <span class="text-caption font-weight-medium" style="color:#334155; word-break:break-word; line-height:1.4;">{{ envio.direccion || 'N/A' }}</span>
                          </div>
                        </div>
                      </v-card>
                    </v-timeline-item>
                  </v-timeline>
                </div>

                <!-- Sin registros -->
                <div v-else class="text-center py-8">
                  <v-icon icon="mdi-package-variant-closed" size="40" color="#ddd" class="mb-2" />
                  <div class="text-caption" style="color:#aaa;">Sin registros de envío para este color</div>
                </div>

              </v-tabs-window-item>
            </v-tabs-window>

          </v-tabs-window-item>

          <!-- TAB EDITAR -->
          <v-tabs-window-item value="editar">
            <v-expansion-panels variant="accordion" elevation="0">

              <!-- Panel 1: Tóner manual -->
              <v-expansion-panel rounded="xl" class="mb-2" style="border:1px solid #eee;">
                <v-expansion-panel-title style="font-size:13px; font-weight:600;">
                  <v-icon icon="mdi-toner" class="mr-2" color="#f57c00" size="16" />
                  Registrar tóner manual (Sin SDS)
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mt-2">
                    <v-col cols="12" sm="6" v-for="color in coloresDisponibles" :key="color.key">
                      <v-text-field
                        v-model="tonerManualForm[color.key]"
                        :label="`${color.label} (%)`"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        type="number"
                        min="0"
                        max="100"
                      />
                    </v-col>
                  </v-row>
                  <v-btn color="#f57c00" variant="flat" rounded="lg" size="small" :loading="savingToner" @click="guardarTonerManual" class="mt-1">
                    <v-icon start icon="mdi-content-save" size="16" />
                    Guardar tóner manual
                  </v-btn>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Panel 2: Agregar suministro -->
              <v-expansion-panel rounded="xl" style="border:1px solid #eee;">
                <v-expansion-panel-title style="font-size:13px; font-weight:600;">
                  <v-icon icon="mdi-package-variant-plus" class="mr-2" color="#2e7d32" size="16" />
                  Agregar registro de suministro
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mt-2">
                    <v-col cols="12" sm="6">
                      <v-autocomplete
                        v-model="suministroForm.sku"
                        :items="skusDisponibles"
                        label="SKU"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        prepend-inner-icon="mdi-barcode"
                        clearable
                        color="#0066ff"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="suministroForm.Color"
                        :items="coloresDisponibles.map(c => c.key)"
                        label="Color"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        color="#0066ff"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="suministroForm.fecha_enprega"
                        label="Fecha de entrega (DD/MM/YYYY)"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        prepend-inner-icon="mdi-calendar"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="suministroForm.guia"
                        label="Guía"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        prepend-inner-icon="mdi-truck-outline"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="suministroForm.status_envio"
                        :items="['SOLICITADO', 'ATENDIDO', 'PENDIENTE', 'CANCELADO']"
                        label="Status envío"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        color="#0066ff"
                      />
                    </v-col>
                  </v-row>
                  <v-btn color="#2e7d32" variant="flat" rounded="lg" size="small" :loading="savingSuministro" @click="guardarSuministro" class="mt-1">
                    <v-icon start icon="mdi-plus" size="16" />
                    Agregar suministro
                  </v-btn>
                </v-expansion-panel-text>
              </v-expansion-panel>

            </v-expansion-panels>
          </v-tabs-window-item>

        </v-tabs-window>
      </v-card-text>

      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="bottom right">
        {{ snackbar.text }}
      </v-snackbar>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSdsStore } from '../stores/sdsStore'
import TonerGauge from './TonerGauge.vue'
import EstadoBadge from './EstadoBadge.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  device: { type: Object, default: null }
})

defineEmits(['update:modelValue'])

const store = useSdsStore()

const tab = ref('info')
const suministroTab = ref('BLACK')
const savingToner = ref(false)
const savingSuministro = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const tonerManualForm = ref({ BLACK: null, CYAN: null, MAGENTA: null, YELLOW: null })
const suministroForm = ref({
  sku: '',
  Color: 'BLACK',
  fecha_enprega: '',
  guia: '',
  status_envio: 'SOLICITADO'
})

// --- Colores disponibles según tipo ---
const coloresDisponibles = computed(() => {
  const esColor = props.device?.tipo === 'COLOR'
  if (esColor) {
    return [
      { key: 'BLACK', label: 'Negro' },
      { key: 'CYAN', label: 'Cyan' },
      { key: 'MAGENTA', label: 'Magenta' },
      { key: 'YELLOW', label: 'Amarillo' }
    ]
  }
  return [{ key: 'BLACK', label: 'Negro' }]
})

// --- Sub tabs del historial de suministros ---
const suministroTabs = computed(() => {
  const esColor = props.device?.tipo === 'COLOR'
  const tabs = esColor
    ? [
        { key: 'BLACK', label: 'Negro', dotColor: '#000000' },
        { key: 'CYAN', label: 'Cyan', dotColor: '#0097a7' },
        { key: 'MAGENTA', label: 'Magenta', dotColor: '#ad1457' },
        { key: 'YELLOW', label: 'Amarillo', dotColor: '#f9a825' },
      ]
    : [
        { key: 'BLACK', label: 'Negro', dotColor: '#000000' },
      ]

  // Agregar tab de repuestos si tiene registros
  const tieneRepuestos = store.suministros.some(s => {
    if (s.serie !== props.device?.serie) return false
    const c = s.Color?.toUpperCase()
    return !['BLACK', 'CYAN', 'MAGENTA', 'YELLOW'].includes(c)
  })

  if (tieneRepuestos) {
    tabs.push({ key: 'REPUESTO', label: 'Repuestos', dotColor: '#64748b' })
  }

  return tabs
})

// --- Historial filtrado por serie y color, ordenado por fecha desc ---
function historialPorColor(colorKey) {
  return store.suministros
    .filter(s => {
      if (s.serie !== props.device?.serie) return false
      const c = s.Color?.toUpperCase()
      if (colorKey === 'REPUESTO') {
        return !['BLACK', 'CYAN', 'MAGENTA', 'YELLOW'].includes(c)
      }
      return c === colorKey
    })
    .sort((a, b) => {
      const parseFecha = (f) => {
        if (!f || f.trim() === '') return Infinity 
        const parts = f.split('/')
        if (parts.length !== 3) return Infinity
        const [d, m, y] = parts
        const fecha = new Date(`${y}-${m}-${d}`).getTime()
        return isNaN(fecha) ? Infinity : fecha
      }
      return parseFecha(b.fecha_enprega) - parseFecha(a.fecha_enprega)
    })
}

// --- Colores para el timeline ---
function envioTimelineColor(status) {
  const map = {
    ATENDIDO: '#2e7d32',
    PENDIENTE: '#f57c00',
    CANCELADO: '#c62828',
    SOLICITADO: '#0066ff',
    TRANSITO: '#f57c00'
  }
  return map[status?.toUpperCase()] || '#94a3b8'
}

function envioChipColor(status) {
  const map = {
    ATENDIDO: 'success',
    PENDIENTE: 'warning',
    CANCELADO: 'error',
    SOLICITADO: 'info',
    TRANSITO: 'warning'
  }
  return map[status?.toUpperCase()] || 'grey'
}

// --- SKUs disponibles ---
const skusDisponibles = computed(() =>
  [...new Set(store.suministros.map(s => s.sku).filter(Boolean))].sort()
)

// --- Watch device ---
watch(() => props.device, (newDevice) => {
  if (!newDevice) return
  tab.value = 'info'
  suministroTab.value = 'BLACK'
  tonerManualForm.value = {
    BLACK: newDevice.toners_manual?.BLACK || null,
    CYAN: newDevice.toners_manual?.CYAN || null,
    MAGENTA: newDevice.toners_manual?.MAGENTA || null,
    YELLOW: newDevice.toners_manual?.YELLOW || null
  }
  suministroForm.value = {
    sku: '',
    Color: 'BLACK',
    fecha_enprega: '',
    guia: '',
    status_envio: 'SOLICITADO'
  }
})

// firstRead del tóner activo según el sub-tab seleccionado
const firstReadDelColor = computed(() => {
  if (!props.device?.toners?.length) return null
  const toner = props.device.toners.find(
    t => t.colour?.toUpperCase() === suministroTab.value
  )
  return toner?.firstRead || null
})

function formatFirstRead(isoDate) {
  if (!isoDate) return 'N/A'
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoDate
  }
}

// --- Info ubicación ---
const ubicacionInfo = computed(() => {
  if (!props.device) return {}
  return {
    'Unidad': props.device.unidad_negocio,
    'Zona': props.device.zona,
    'Sede': props.device.sede,
    'Área': props.device.area,
    'Sub Área': props.device.sub_area,
    'Piso': props.device.piso,
    'Operario': props.device.operario,
    'Tipo': props.device.tipo,
  }
})

// --- Guardar tóner manual ---
async function guardarTonerManual() {
  savingToner.value = true
  try {
    const nuevoInventario = store.inventario.map(item =>
      item.serie === props.device.serie ? { ...item, toners_manual: { ...tonerManualForm.value } } : item
    )
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = { show: true, text: ok ? 'Tóner manual guardado' : 'Error al guardar', color: ok ? 'success' : 'error' }
  } finally { savingToner.value = false }
}

// --- Guardar suministro ---
async function guardarSuministro() {
  if (!suministroForm.value.sku || !suministroForm.value.fecha_enprega) {
    snackbar.value = { show: true, text: 'SKU y fecha son requeridos', color: 'warning' }
    return
  }
  savingSuministro.value = true
  try {
    const hoy = new Date().toLocaleDateString('es-PE')
    const skuInfo = store.suministros.find(s => s.sku === suministroForm.value.sku)
    const nuevoSuministro = {
      atencion: 'BOLSA',
      cliente: props.device.unidad_negocio,
      direccion: `${props.device.sede} - ${props.device.area}`,
      contacto: '',
      fecha_registro: hoy,
      tipo: 'SUMINISTROS',
      modelo: props.device.modelo_completo,
      serie: props.device.serie,
      porcentaje: null,
      dias_restantes: null,
      cantidad: 1,
      descripcion_suministro: skuInfo?.descripcion_suministro || suministroForm.value.sku,
      sku: suministroForm.value.sku,
      guia: suministroForm.value.guia,
      fecha_enprega: suministroForm.value.fecha_enprega,
      status_envio: suministroForm.value.status_envio,
      Color: suministroForm.value.Color
    }
    const ok = await store.updateJson('suministros.json', [nuevoSuministro, ...store.suministros])
    snackbar.value = { show: true, text: ok ? 'Suministro agregado' : 'Error al guardar', color: ok ? 'success' : 'error' }
    if (ok) {
      suministroForm.value = { sku: '', Color: 'BLACK', fecha_enprega: '', guia: '', status_envio: 'SOLICITADO' }
    }
  } finally { savingSuministro.value = false }
}
</script>