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

      <!-- Tabs -->
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
                <div class="text-caption font-weight-bold mb-3" style="color:#0066ff; text-transform:uppercase; letter-spacing:0.08em;">
                  Ubicación
                </div>
                <div v-for="(val, key) in ubicacionInfo" :key="key" class="d-flex mb-2">
                  <span class="text-caption" style="color:#aaa; min-width:90px;">{{ key }}</span>
                  <span class="text-caption font-weight-medium" style="color:#111;">{{ val }}</span>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption font-weight-bold mb-3" style="color:#0066ff; text-transform:uppercase; letter-spacing:0.08em;">
                  Estado SDS
                </div>
                <EstadoBadge :estado="device.estado_dispositivo" class="mb-3" />
                <div class="text-caption mb-1" style="color:#aaa;">
                  Último contacto: <span style="color:#333;">{{ device.lastContact || 'N/A' }}</span>
                </div>
                <div class="text-caption mb-1" style="color:#aaa;">
                  Modelo SDS: <span style="color:#333;">{{ device.modelo_sds || 'N/A' }}</span>
                </div>
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
            <div v-if="device.ultimo_suministro">
              <v-card elevation="0" rounded="xl" border class="pa-4">
                <v-row dense>
                  <v-col cols="6" v-for="(val, key) in suministroInfo" :key="key" class="mb-3">
                    <div class="text-caption" style="color:#aaa;">{{ key }}</div>
                    <div class="text-body-2 font-weight-medium" style="color:#111;">{{ val }}</div>
                  </v-col>
                  <v-col cols="12">
                    <v-chip
                      size="small"
                      rounded="lg"
                      :color="envioColor(device.ultimo_suministro.status_envio)"
                      variant="tonal"
                    >
                      {{ device.ultimo_suministro.status_envio }}
                    </v-chip>
                  </v-col>
                </v-row>
              </v-card>
            </div>
            <div v-else class="text-center py-8">
              <v-icon icon="mdi-package-variant" size="40" color="#ddd" class="mb-2" />
              <div class="text-caption" style="color:#aaa;">Sin registro de suministros</div>
            </div>
          </v-tabs-window-item>

          <!-- TAB EDITAR -->
          <v-tabs-window-item value="editar">
            <v-expansion-panels variant="accordion" elevation="0">

              <!-- Panel 1: Ubicación -->
              <v-expansion-panel rounded="xl" class="mb-2" style="border:1px solid #eee;">
                <v-expansion-panel-title style="font-size:13px; font-weight:600;">
                  <v-icon icon="mdi-map-marker" class="mr-2" color="#0066ff" size="16" />
                  Editar datos de ubicación
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mt-2">
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="editForm.sede" label="Sede" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="editForm.area" label="Área" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="editForm.sub_area" label="Sub Área" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="editForm.piso" label="Piso" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="editForm.operario" label="Operario" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="editForm.status" :items="['PRODUCCION', 'BACKUP']" label="Status" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="editForm.zona" :items="['LIMA', 'PROVINCIA']" label="Zona" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="editForm.unidad_negocio" label="Unidad de Negocio" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                  </v-row>
                  <v-btn color="#0066ff" variant="flat" rounded="lg" size="small" :loading="savingInventario" @click="guardarInventario" class="mt-1">
                    <v-icon start icon="mdi-content-save" size="16" />
                    Guardar cambios
                  </v-btn>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Panel 2: Tóner manual -->
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

              <!-- Panel 3: Suministro -->
              <v-expansion-panel rounded="xl" style="border:1px solid #eee;">
                <v-expansion-panel-title style="font-size:13px; font-weight:600;">
                  <v-icon icon="mdi-package-variant-plus" class="mr-2" color="#2e7d32" size="16" />
                  Agregar registro de suministro
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mt-2">
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.descripcion_suministro" label="Descripción" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.sku" label="SKU" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="suministroForm.Color" :items="['BLACK', 'CYAN', 'MAGENTA', 'YELLOW']" label="Color" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.guia" label="Guía" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.fecha_enprega" label="Fecha entrega (DD/MM/YYYY)" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.porcentaje" label="Porcentaje (%)" type="number" min="0" max="100" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.dias_restantes" label="Días restantes" type="number" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="suministroForm.status_envio" :items="['ATENDIDO', 'PENDIENTE', 'CANCELADO']" label="Status envío" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.contacto" label="Contacto" variant="outlined" density="compact" rounded="lg" />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model="suministroForm.atencion" label="Atención" variant="outlined" density="compact" rounded="lg" />
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

      <!-- Snackbar -->
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
  modelValue: {
    type: Boolean,
    default: false
  },
  device: {
    type: Object,
    default: null
  }
})

defineEmits(['update:modelValue'])

const store = useSdsStore()

const tab = ref('info')
const savingInventario = ref(false)
const savingToner = ref(false)
const savingSuministro = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const editForm = ref({})
const tonerManualForm = ref({ BLACK: null, CYAN: null, MAGENTA: null, YELLOW: null })
const suministroForm = ref({
  descripcion_suministro: '', sku: '', Color: 'BLACK', guia: '',
  fecha_enprega: '', porcentaje: null, dias_restantes: null,
  status_envio: 'ATENDIDO', contacto: '', atencion: 'BOLSA'
})

const coloresDisponibles = [
  { key: 'BLACK', label: 'Negro' },
  { key: 'CYAN', label: 'Cyan' },
  { key: 'MAGENTA', label: 'Magenta' },
  { key: 'YELLOW', label: 'Amarillo' }
]

// Resetear formularios cuando cambia el device
watch(() => props.device, (newDevice) => {
  if (!newDevice) return
  tab.value = 'info'
  editForm.value = {
    sede: newDevice.sede,
    area: newDevice.area,
    sub_area: newDevice.sub_area,
    piso: newDevice.piso,
    operario: newDevice.operario,
    status: newDevice.status,
    zona: newDevice.zona,
    unidad_negocio: newDevice.unidad_negocio
  }
  tonerManualForm.value = {
    BLACK: newDevice.toners_manual?.BLACK || null,
    CYAN: newDevice.toners_manual?.CYAN || null,
    MAGENTA: newDevice.toners_manual?.MAGENTA || null,
    YELLOW: newDevice.toners_manual?.YELLOW || null
  }
  suministroForm.value = {
    descripcion_suministro: '', sku: '', Color: 'BLACK', guia: '',
    fecha_enprega: '', porcentaje: null, dias_restantes: null,
    status_envio: 'ATENDIDO', contacto: '', atencion: 'BOLSA'
  }
})

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

const suministroInfo = computed(() => {
  if (!props.device?.ultimo_suministro) return {}
  const s = props.device.ultimo_suministro
  return {
    'Descripción': s.descripcion,
    'SKU': s.sku,
    'Color': s.color,
    'Guía': s.guia,
    'Fecha entrega': s.fecha_entrega,
    'Porcentaje': `${s.porcentaje}%`,
    'Días restantes': s.dias_restantes,
  }
})

function envioColor(status) {
  const map = { ATENDIDO: 'success', PENDIENTE: 'warning', CANCELADO: 'error' }
  return map[status] || 'grey'
}

async function guardarInventario() {
  savingInventario.value = true
  try {
    const nuevoInventario = store.inventario.map(item =>
      item.serie === props.device.serie ? { ...item, ...editForm.value } : item
    )
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = { show: true, text: ok ? 'Inventario actualizado' : 'Error al guardar', color: ok ? 'success' : 'error' }
  } finally { savingInventario.value = false }
}

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

async function guardarSuministro() {
  savingSuministro.value = true
  try {
    const hoy = new Date().toLocaleDateString('es-PE')
    const nuevoSuministro = {
      ...suministroForm.value,
      serie: props.device.serie,
      modelo: props.device.modelo_completo,
      cliente: props.device.unidad_negocio,
      direccion: `${props.device.sede} - ${props.device.area}`,
      fecha_registro: hoy,
      tipo: 'SUMINISTROS',
      cantidad: 1
    }
    const ok = await store.updateJson('suministros.json', [nuevoSuministro, ...store.suministros])
    snackbar.value = { show: true, text: ok ? 'Suministro agregado' : 'Error al guardar', color: ok ? 'success' : 'error' }
    if (ok) suministroForm.value = { descripcion_suministro: '', sku: '', Color: 'BLACK', guia: '', fecha_enprega: '', porcentaje: null, dias_restantes: null, status_envio: 'ATENDIDO', contacto: '', atencion: 'BOLETA' }
  } finally { savingSuministro.value = false }
}
</script>