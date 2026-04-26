<template>
  <v-app theme="light">

    <AppSidebar active-route="inventario" />

    <v-main style="background:#f1f5f9; height: 100vh; display: flex; flex-direction: column;">
      <div class="pa-6 d-flex flex-column flex-grow-1" style="min-height: 0;">

        <!-- Header -->
        <div class="d-flex align-center mb-6 gap-3 flex-shrink-0">
          <div>
            <div class="text-h6 font-weight-bold" style="color:#1e293b;">Inventario de Equipos</div>
            <div class="text-caption" style="color:#64748b;">Gestión y monitoreo de activos.</div>
          </div>
          <v-spacer />
          <v-btn variant="outlined" rounded="lg" size="small" style="border-color:#e2e8f0; color:#64748b;" @click="exportarCSV">
            <v-icon start icon="mdi-download" size="16" />
            Exportar
          </v-btn>
        </div>

        <!-- Stats -->
        <v-row class="mb-6 flex-shrink-0" dense>
          <v-col cols="6" sm="3" v-for="stat in quickStats" :key="stat.label">
            <v-card elevation="0" rounded="xl" class="pa-4" style="background:#fff; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
              <div class="d-flex align-center justify-space-between mb-3">
                <v-avatar size="36" rounded="lg" :style="`background:${stat.bg}`">
                  <v-icon :icon="stat.icon" size="18" :color="stat.color" />
                </v-avatar>
              </div>
              <div style="font-size:2rem; font-weight:900; color:#1e293b; line-height:1;" class="mb-1">{{ stat.value }}</div>
              <div class="text-caption font-weight-medium mb-2" style="color:#94a3b8;">{{ stat.label }}</div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span style="font-size:11px; color:#94a3b8; font-weight:500;">Porcentaje del total</span>
                <span class="font-weight-bold" :style="`font-size:11px; color:${stat.color};`">{{ stat.porcentaje }}%</span>
              </div>
              <v-progress-linear :model-value="stat.porcentaje" :color="stat.color" height="6" rounded bg-color="#e2e8f0" />
            </v-card>
          </v-col>
        </v-row>

        <!-- Filtros -->
        <v-card elevation="0" rounded="xl" class="pa-5 mb-6 flex-shrink-0" style="background:#fff; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.02);">
          <div class="d-flex align-center mb-4">
            <v-icon icon="mdi-filter-variant" size="20" color="#64748b" class="mr-2" />
            <span class="font-weight-bold" style="color:#334155; letter-spacing:0.05em; text-transform:uppercase; font-size:12px;">Filtros de Búsqueda</span>
          </div>
          <v-row dense align="center">
            <v-col cols="12" md="4">
              <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Buscar serie, modelo, sede..." variant="outlined" density="compact" hide-details rounded="lg" bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select v-model="filtroSede" :items="sedeOptions" label="Sede" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select v-model="filtroTipo" :items="['COLOR', 'MONOCROMATICA']" label="Tipo" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select v-model="filtroStatus" :items="statusOptions" label="Status" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-btn color="#0066ff" variant="tonal" rounded="lg" size="large" block class="text-none font-weight-bold" style="height:40px;" @click="limpiarFiltros">
                <v-icon start icon="mdi-filter-off-outline" size="18" />
                Limpiar
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <!-- Tabla -->
        <v-card elevation="0" rounded="xl" class="d-flex flex-column flex-grow-1" style="background:#fff; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.02); min-height:0; overflow:hidden;">
          <v-data-table
            :headers="headers"
            :items="filteredData"
            :loading="store.loading"
            density="comfortable"
            fixed-header
            class="custom-table"
            items-per-page="10"
            hover
          >
            <template #item.unidad_negocio="{ item }">
              <span class="text-caption font-weight-medium" style="color:#334155;">{{ item.unidad_negocio }}</span>
            </template>

            <template #item.sede="{ item }">
              <div>
                <div class="text-body-2 font-weight-bold" style="color:#1e293b;">{{ item.sede }}</div>
                <div class="text-caption" style="color:#94a3b8;">{{ item.zona }} · Piso {{ item.piso }}</div>
              </div>
            </template>

            <template #item.area="{ item }">
              <div>
                <div class="text-body-2 font-weight-medium" style="color:#334155;">{{ item.area }}</div>
                <div class="text-caption" style="color:#94a3b8;">{{ item.sub_area }}</div>
              </div>
            </template>

            <template #item.modelo_completo="{ item }">
              <div>
                <div class="text-body-2 font-weight-medium" style="color:#1e293b;">{{ item.modelo_completo }}</div>
                <div class="text-caption" style="color:#94a3b8;">{{ item.tipo }} · {{ item.funcionalidad }}</div>
              </div>
            </template>

            <template #item.serie="{ item }">
              <div style="font-size:13px; font-weight:800; color:#0066ff; letter-spacing:0.02em;">
                {{ item.serie }}
              </div>
            </template>

            <template #item.operario="{ item }">
              <div class="d-flex align-center gap-2">
                <span class="text-caption" style="color:#334155;">{{ item.operario || 'Sin asignar' }}</span>
              </div>
            </template>

            <template #item.status="{ item }">
              <StatusChip :status="item.status" />
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex justify-center" style="gap:6px; padding:4px 0;">
                <v-btn size="small" variant="tonal" color="#0066ff" rounded="lg" icon="mdi-pencil-outline" @click.stop="abrirEditar(item)" />
                <v-btn size="small" variant="tonal" color="#f57c00" rounded="lg" icon="mdi-swap-horizontal" @click.stop="abrirReemplazar(item)" />
                <v-btn size="small" variant="tonal" color="#c62828" rounded="lg" icon="mdi-archive-arrow-down-outline" @click.stop="confirmarRetiro(item)" />
              </div>
            </template>
          </v-data-table>
        </v-card>

      </div>
    </v-main>

    <!-- ===== DIALOG EDITAR ===== -->
    <v-dialog v-model="dialogEditar" max-width="560">
      <v-card v-if="itemSeleccionado" rounded="xl" elevation="0" style="border:1px solid #e2e8f0;">
        <v-card-title class="pa-5 d-flex align-center" style="border-bottom:1px solid #eee;">
          <div>
            <div class="text-body-1 font-weight-bold" style="color:#1e293b;">Editar equipo</div>
            <div class="text-caption" style="color:#0066ff;">{{ itemSeleccionado.serie }}</div>
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" color="grey" size="small" @click="dialogEditar = false" />
        </v-card-title>
        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="editForm.unidad_negocio"
                :items="unidadOptions"
                label="Unidad de Negocio"
                variant="outlined"
                density="compact"
                rounded="lg"
                clearable
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="editForm.sede"
                :items="sedeOptions"
                label="Sede"
                variant="outlined"
                density="compact"
                rounded="lg"
                clearable
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="editForm.area"
                :items="areaOptions"
                label="Área"
                variant="outlined"
                density="compact"
                rounded="lg"
                clearable
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="editForm.sub_area"
                :items="subAreaOptions"
                label="Sub Área"
                variant="outlined"
                density="compact"
                rounded="lg"
                clearable
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.piso"
                label="Piso"
                variant="outlined"
                density="compact"
                rounded="lg"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editForm.status"
                :items="['PRODUCCION', 'BACKUP']"
                label="Status"
                variant="outlined"
                density="compact"
                rounded="lg"
                color="#0066ff"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="dialogEditar = false">Cancelar</v-btn>
          <v-btn color="#0066ff" variant="flat" rounded="lg" :loading="savingEditar" @click="guardarEdicion">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ===== DIALOG REEMPLAZAR ===== -->
    <v-dialog v-model="dialogReemplazar" max-width="600">
      <v-card v-if="itemSeleccionado" rounded="xl" elevation="0" style="border:1px solid #e2e8f0;">
        <v-card-title class="pa-5 d-flex align-center" style="border-bottom:1px solid #eee;">
          <div>
            <div class="text-body-1 font-weight-bold" style="color:#1e293b;">Reemplazar equipo</div>
            <div class="text-caption" style="color:#f57c00;">{{ itemSeleccionado.serie }}</div>
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" color="grey" size="small" @click="dialogReemplazar = false" />
        </v-card-title>
        <v-card-text class="pa-5">
          <v-card elevation="0" rounded="lg" class="pa-3 mb-4" style="background:#f8fafc; border:1px solid #e2e8f0;">
            <div class="text-caption font-weight-bold mb-2" style="color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">
              Ubicación del equipo a reemplazar
            </div>
            <v-row dense>
              <v-col cols="6" v-for="(val, key) in ubicacionReemplazo" :key="key">
                <div class="text-caption" style="color:#94a3b8;">{{ key }}</div>
                <div class="text-caption font-weight-medium" style="color:#1e293b;">{{ val }}</div>
              </v-col>
            </v-row>
          </v-card>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="reemplazarForm.nueva_serie"
                label="Nueva serie"
                variant="outlined"
                density="compact"
                rounded="lg"
                prepend-inner-icon="mdi-barcode"
                placeholder="Ingresa el número de serie del nuevo equipo"
              />
            </v-col>
            <v-col cols="12">
              <v-autocomplete
                v-model="reemplazarForm.nuevo_modelo"
                :items="modelosDisponibles"
                label="Seleccionar modelo"
                variant="outlined"
                density="compact"
                rounded="lg"
                prepend-inner-icon="mdi-printer-outline"
                clearable
                color="#0066ff"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="text" color="grey" @click="dialogReemplazar = false">Cancelar</v-btn>
          <v-btn color="#f57c00" variant="flat" rounded="lg" :loading="savingReemplazar" @click="guardarReemplazo">
           
            Reemplazar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ===== DIALOG CONFIRMAR RETIRO ===== -->
    <v-dialog v-model="dialogRetiro" max-width="420">
      <v-card v-if="itemSeleccionado" rounded="xl" elevation="0" style="border:1px solid #e2e8f0;">
        <v-card-text class="pa-6 text-center">
          <v-avatar size="56" color="#ffebee" rounded="xl" class="mb-4">
            <v-icon icon="mdi-archive-arrow-down-outline" size="28" color="#c62828" />
          </v-avatar>
          <div class="text-body-1 font-weight-bold mb-1" style="color:#1e293b;">¿Retirar este equipo?</div>
          <div class="text-caption mb-1" style="color:#94a3b8;">Esta acción cambiará el estado a</div>
          <v-chip size="small" color="#ffebee" style="color:#c62828; font-weight:700;" class="mb-3">RETIRADO</v-chip>
          <div class="text-body-2 font-weight-bold" style="color:#0066ff;">{{ itemSeleccionado.serie }}</div>
          <div class="text-caption" style="color:#94a3b8;">{{ itemSeleccionado.modelo_completo }}</div>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-btn variant="text" color="grey" block @click="dialogRetiro = false">Cancelar</v-btn>
          <v-btn color="#c62828" variant="flat" rounded="lg" block :loading="savingRetiro" @click="guardarRetiro">
            Confirmar retiro
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="bottom right">
      {{ snackbar.text }}
    </v-snackbar>

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSdsStore } from '../stores/sdsStore'
import AppSidebar from '../components/AppSidebar.vue'
import StatusChip from '../components/StatusChip.vue'

const store = useSdsStore()

const search = ref('')
const filtroSede = ref(null)
const filtroTipo = ref(null)
const filtroStatus = ref(null)

const dialogEditar = ref(false)
const dialogReemplazar = ref(false)
const dialogRetiro = ref(false)
const itemSeleccionado = ref(null)

const savingEditar = ref(false)
const savingReemplazar = ref(false)
const savingRetiro = ref(false)

const snackbar = ref({ show: false, text: '', color: 'success' })

const editForm = ref({})
const reemplazarForm = ref({ nueva_serie: '', nuevo_modelo: '' })

const headers = [
  { title: 'Unidad de Negocio', key: 'unidad_negocio', width: '130px' },
  { title: 'Sede', key: 'sede', width: '150px' },
  { title: 'Área / Sub Área', key: 'area', width: '150px' },
  { title: 'Modelo', key: 'modelo_completo', width: '220px' },
  { title: 'Serie', key: 'serie', width: '120px' },
  { title: 'Operario', key: 'operario', width: '130px' },
  { title: 'Status', key: 'status', width: '100px' },
  { title: 'Acciones', key: 'actions', width: '130px', sortable: false, align: 'center' },
]

// --- Opciones para filtros y dialogs ---
const sedeOptions = computed(() => [...new Set(store.inventario.map(d => d.sede).filter(Boolean))].sort())
const statusOptions = computed(() => [...new Set(store.inventario.map(d => d.status).filter(Boolean))].sort())
const unidadOptions = computed(() => [...new Set(store.inventario.map(d => d.unidad_negocio).filter(Boolean))].sort())
const areaOptions = computed(() => [...new Set(store.inventario.map(d => d.area).filter(Boolean))].sort())
const subAreaOptions = computed(() => [...new Set(store.inventario.map(d => d.sub_area).filter(Boolean))].sort())
const modelosDisponibles = computed(() => [...new Set(store.inventario.map(d => d.modelo_completo).filter(Boolean))].sort())

const filteredData = computed(() => {
  return store.inventario.filter(item => {
    if (filtroSede.value && item.sede !== filtroSede.value) return false
    if (filtroTipo.value && item.tipo !== filtroTipo.value) return false
    if (filtroStatus.value && item.status !== filtroStatus.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      return (
        item.serie?.toLowerCase().includes(q) ||
        item.modelo_completo?.toLowerCase().includes(q) ||
        item.sede?.toLowerCase().includes(q) ||
        item.area?.toLowerCase().includes(q) ||
        item.operario?.toLowerCase().includes(q)
      )
    }
    return true
  })
})

const quickStats = computed(() => {
  const total = store.inventario.length
  const produccion = store.inventario.filter(d => d.status === 'PRODUCCION' || d.status === 'PRODUCCIÓN').length
  const backup = store.inventario.filter(d => d.status === 'BACKUP').length
  const reemplazados = store.inventario.filter(d => d.status === 'REEMPLAZO').length
  return [
    { label: 'Impresoras registradas', value: total, icon: 'mdi-printer-outline', color: '#0066ff', bg: '#e8f0fe', porcentaje: 100 },
    { label: 'En producción', value: produccion, icon: 'mdi-check-circle-outline', color: '#2e7d32', bg: '#e8f5e9', porcentaje: total ? Math.round((produccion / total) * 100) : 0 },
    { label: 'En backup', value: backup, icon: 'mdi-archive-outline', color: '#f57c00', bg: '#fff8e1', porcentaje: total ? Math.round((backup / total) * 100) : 0 },
    { label: 'Reemplazados', value: reemplazados, icon: 'mdi-swap-horizontal', color: '#c62828', bg: '#ffebee', porcentaje: total ? Math.round((reemplazados / total) * 100) : 0 },
  ]
})

const ubicacionReemplazo = computed(() => {
  if (!itemSeleccionado.value) return {}
  const i = itemSeleccionado.value
  return {
    'Sede': i.sede, 'Área': i.area,
    'Sub Área': i.sub_area, 'Piso': i.piso,
    'Operario': i.operario, 'Zona': i.zona,
  }
})

function abrirEditar(item) {
  itemSeleccionado.value = item
  editForm.value = {
    unidad_negocio: item.unidad_negocio,
    sede: item.sede,
    area: item.area,
    sub_area: item.sub_area,
    piso: item.piso,
    status: item.status,
  }
  dialogEditar.value = true
}

async function guardarEdicion() {
  savingEditar.value = true
  try {
    const nuevoInventario = store.inventario.map(item =>
      item.serie === itemSeleccionado.value.serie ? { ...item, ...editForm.value } : item
    )
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = { show: true, text: ok ? 'Equipo actualizado correctamente' : 'Error al guardar', color: ok ? 'success' : 'error' }
    if (ok) dialogEditar.value = false
  } finally { savingEditar.value = false }
}

function abrirReemplazar(item) {
  itemSeleccionado.value = item
  reemplazarForm.value = { nueva_serie: '', nuevo_modelo: item.modelo_completo }
  dialogReemplazar.value = true
}

async function guardarReemplazo() {
  if (!reemplazarForm.value.nueva_serie || !reemplazarForm.value.nuevo_modelo) {
    snackbar.value = { show: true, text: 'Completa todos los campos', color: 'warning' }
    return
  }
  savingReemplazar.value = true
  try {
    const modeloInfo = store.inventario.find(d => d.modelo_completo === reemplazarForm.value.nuevo_modelo)
    const nuevoEquipo = {
      ...itemSeleccionado.value,
      serie: reemplazarForm.value.nueva_serie,
      modelo_completo: reemplazarForm.value.nuevo_modelo,
      tipo: modeloInfo?.tipo || itemSeleccionado.value.tipo,
      funcionalidad: modeloInfo?.funcionalidad || itemSeleccionado.value.funcionalidad,
      impresion: modeloInfo?.impresion || itemSeleccionado.value.impresion,
      tamanio: modeloInfo?.tamanio || itemSeleccionado.value.tamanio,
      status: 'PRODUCCION',
    }
    const nuevoInventario = store.inventario.map(item =>
      item.serie === itemSeleccionado.value.serie ? { ...item, status: 'REEMPLAZO' } : item
    )
    nuevoInventario.push(nuevoEquipo)
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = { show: true, text: ok ? 'Equipo reemplazado correctamente' : 'Error al guardar', color: ok ? 'success' : 'error' }
    if (ok) dialogReemplazar.value = false
  } finally { savingReemplazar.value = false }
}

function confirmarRetiro(item) {
  itemSeleccionado.value = item
  dialogRetiro.value = true
}

async function guardarRetiro() {
  savingRetiro.value = true
  try {
    const nuevoInventario = store.inventario.map(item =>
      item.serie === itemSeleccionado.value.serie ? { ...item, status: 'RETIRADO' } : item
    )
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = { show: true, text: ok ? 'Equipo retirado correctamente' : 'Error al guardar', color: ok ? 'success' : 'error' }
    if (ok) dialogRetiro.value = false
  } finally { savingRetiro.value = false }
}

function limpiarFiltros() {
  filtroSede.value = null
  filtroTipo.value = null
  filtroStatus.value = null
  search.value = ''
}

function exportarCSV() {
  const cols = ['serie', 'unidad_negocio', 'zona', 'sede', 'area', 'sub_area', 'piso', 'operario', 'modelo_completo', 'tipo', 'funcionalidad', 'tamanio', 'impresion', 'status']
  const rows = store.inventario.map(item => cols.map(h => `"${item[h] || ''}"`).join(','))
  const csv = [cols.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inventario.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  if (!store.inventario.length) await store.loadStaticData()
  if (!store.devices.length) await store.fetchSdsData()
})
</script>

<style scoped>
:deep(.v-data-table th) {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: #64748b !important;
  font-weight: 700 !important;
  background-color: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
}
:deep(.v-data-table td) {
  border-bottom: 1px solid #f1f5f9 !important;
}
.custom-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}
:deep(.custom-table .v-table__wrapper) {
  flex-grow: 1 !important;
  overflow-y: auto !important;
  min-height: 0;
}
:deep(.custom-table .v-data-table-footer) {
  flex-shrink: 0 !important;
  border-top: 1px solid #e2e8f0 !important;
  background-color: #fff;
}
</style>