<template>
  <v-app theme="light">

    <AppSidebar ref="sidebarRef" active-route="dashboard" />

    <v-main style="background:#f1f5f9;">
      <div 
        class="pa-3 pa-md-6 d-flex flex-column flex-grow-1" 
        :style="lgAndUp ? 'height: 100vh; min-height: 0; overflow: hidden;' : 'min-height: 100vh;'"
      >

        <div class="d-flex align-center mb-4 gap-2 flex-shrink-0">
          <v-btn
            v-if="!lgAndUp"
            icon="mdi-menu"
            variant="text"
            size="small"
            @click="sidebarRef.drawer = !sidebarRef.drawer"
          />
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar serie o modelo..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            bg-color="#fff"
            style="max-width:280px;"
          />
          <v-spacer />
          <div class="text-caption font-weight-medium d-none d-sm-block" style="color:#64748b;" v-if="store.lastUpdate">
            Actualizado: {{ formatTime(store.lastUpdate) }}
          </div>
          <v-btn
            icon="mdi-refresh"
            :loading="store.loading"
            variant="tonal"
            color="#0066ff"
            size="small"
            rounded="lg"
            @click="store.fetchSdsData()"
          />
        </div>

        <v-row class="mb-4 flex-shrink-0" dense>
          <v-col v-for="stat in statCards" :key="stat.label" cols="6" sm="4" md="2">
            <StatCard
              :label="stat.label"
              :value="stat.value"
              :text-color="stat.textColor"
              :is-active="filtroEstadoCard === stat.filtro"
              :total-value="store.stats.total"
              :icon="stat.icon"
              @click="toggleFiltroCard(stat.filtro)"
            />
          </v-col>
        </v-row>

        <v-card
          elevation="0"
          rounded="xl"
          class="pa-3 pa-md-5 mb-4 flex-shrink-0"
          style="background:#fff; border:1px solid #e2e8f0;"
        >
          <div class="d-flex align-center mb-3">
            <v-icon icon="mdi-filter-variant" size="18" color="#64748b" class="mr-2" />
            <span class="font-weight-bold" style="color:#334155; letter-spacing:0.05em; text-transform:uppercase; font-size:11px;">
              Filtros de Búsqueda
            </span>
          </div>
          <v-row dense align="center">
            <v-col cols="12" sm="6" md="2">
              <v-select v-model="filtroSede" :items="sedeOptions" label="Sede" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select v-model="filtroZona" :items="zonaOptions" label="Zona" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select v-model="filtroTipo" :items="tipoOptions" label="Tipo" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select v-model="filtroStatus" :items="statusOptions" label="Status" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select v-model="filtroOperario" :items="operarioOptions" label="Operario" variant="outlined" density="compact" hide-details rounded="lg" clearable bg-color="#f8fafc" color="#0066ff" />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-btn color="#0066ff" variant="tonal" rounded="lg" size="default" block class="text-none font-weight-bold" @click="limpiarFiltros">
                <v-icon start icon="mdi-filter-off-outline" size="16" />
                Limpiar
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <v-card
          elevation="0"
          rounded="xl"
          class="d-flex flex-column flex-grow-1"
          style="background:#fff; border:1px solid #e2e8f0; min-height:0; overflow:hidden;"
        >
          <v-data-table
            :headers="headers"
            :items="filteredData"
            :loading="store.loading"
            density="comfortable"
            fixed-header
            class="custom-table"
            items-per-page="25"
            hover
            @click:row="(_, { item }) => openDetail(item)"
            style="min-width:800px;"
          >
            <template #item.sede="{ item }">
              <div class="text-body-2 font-weight-bold" style="color:#1e293b;">{{ item.sede }}</div>
            </template>

            <template #item.area="{ item }">
              <div>
                <div class="text-body-2 font-weight-medium" style="color:#334155;">{{ item.area }}</div>
                <div class="text-caption" style="color:#94a3b8;">{{ item.sub_area }}</div>
              </div>
            </template>

            <template #item.operario="{ item }">
              <div class="text-body-2" style="color:#334155;">{{ item.operario || 'Sin asignar' }}</div>
            </template>

            <template #item.serie="{ item }">
              <div class="d-flex flex-column justify-center" style="gap:2px;">
                <div class="text-body-2 font-weight-black" style="color:#0066ff;">{{ item.serie }}</div>
                <div class="text-caption" style="color:#94a3b8; text-transform:uppercase; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  {{ item.modelo_completo || 'MODELO NO ESPECIFICADO' }}
                </div>
              </div>
            </template>

            <template #item.status="{ item }">
              <StatusChip :status="item.status" />
            </template>

            <template #item.estado_dispositivo="{ item }">
              <EstadoBadge :estado="item.estado_dispositivo" />
            </template>

            <template #item.toners="{ item }">
              <div class="d-flex align-center py-1" style="gap:6px;" v-if="item.toners && item.toners.length">
                <TonerGauge
                  v-for="toner in item.toners"
                  :key="toner.index"
                  :colour="toner.colour"
                  :percent-left="toner.percentLeft"
                  :days-left="toner.daysLeft"
                  :sku="toner.sku"
                  :size="28"
                  :width="3"
                />
              </div>
              <span v-else class="text-caption" style="color:#cbd5e1;">—</span>
            </template>

            <template #item.ultimo_suministro="{ item }">
              <div v-if="item.ultimo_suministro">
                <div class="text-caption font-weight-bold" style="color:#334155;">{{ item.ultimo_suministro.fecha_entrega }}</div>
                <v-chip size="x-small" variant="flat" :color="envioColor(item.ultimo_suministro.status_envio)" class="font-weight-bold text-white">
                  {{ item.ultimo_suministro.status_envio || 'DESCONOCIDO' }}
                </v-chip>
              </div>
              <span v-else class="text-caption" style="color:#cbd5e1;">Sin envíos</span>
            </template>

            <template #item.accion_requerida="{ item }">
              <v-btn variant="outlined" color="#cbd5e1" size="small" rounded="lg" class="text-none font-weight-bold" style="color:#64748b;" elevation="0" @click.stop="openDetail(item)">
                Revisar
              </v-btn>
            </template>

          </v-data-table>
        </v-card>

      </div>
    </v-main>

    <DeviceDetailDialog v-model="dialog" :device="selectedDevice" />

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useSdsStore } from '../stores/sdsStore'
import AppSidebar from '../components/AppSidebar.vue'
import StatCard from '../components/StatCard.vue'
import TonerGauge from '../components/TonerGauge.vue'
import EstadoBadge from '../components/EstadoBadge.vue'
import StatusChip from '../components/StatusChip.vue'
import DeviceDetailDialog from '../components/DeviceDetailDialog.vue'

const store = useSdsStore()
const { lgAndUp } = useDisplay()
const sidebarRef = ref(null)

const search = ref('')
const filtroOperario = ref(null) // Nuevo filtro
const filtroZona = ref(null)
const filtroTipo = ref(null)
const filtroStatus = ref(null)
const filtroSede = ref(null)
const filtroEstadoCard = ref(null)
const dialog = ref(false)
const selectedDevice = ref(null)

const headers = [
  { title: 'Sede', key: 'sede' },
  { title: 'Área / Sub Área', key: 'area' },
  { title: 'Operario', key: 'operario' },
  { title: 'Serie / Modelo', key: 'serie' },
  { title: 'Status', key: 'status' },
  { title: 'Estado SDS', key: 'estado_dispositivo' },
  { title: 'Tóners', key: 'toners', sortable: false },
  { title: 'Último Envío', key: 'ultimo_suministro', sortable: false },
  { title: 'Acción', key: 'accion_requerida', align: 'center', sortable: false },
]

const filterDataForOptions = (skipKey = null) => {
  return store.combinedData.filter(item => {
    // 1. Filtro por Tarjetas (Mantiene su funcionalidad)
    if (filtroEstadoCard.value === 'CRITICO') {
      if (!item.toners?.some(t => t.estado_toner === 'CRITICO')) return false
    } else if (filtroEstadoCard.value && item.estado_dispositivo !== filtroEstadoCard.value) return false
    
    // 2. Filtros de Selects
    if (skipKey !== 'operario' && filtroOperario.value && item.operario !== filtroOperario.value) return false
    if (skipKey !== 'zona' && filtroZona.value && item.zona !== filtroZona.value) return false
    if (skipKey !== 'tipo' && filtroTipo.value && item.tipo !== filtroTipo.value) return false
    if (skipKey !== 'status' && filtroStatus.value && item.status !== filtroStatus.value) return false
    if (skipKey !== 'sede' && filtroSede.value && item.sede !== filtroSede.value) return false
    
    // 3. Filtro de Búsqueda (Ahora solo Serie y Modelo)
    if (search.value) {
      const q = search.value.toLowerCase()
      return (
        item.serie?.toLowerCase().includes(q) ||
        item.modelo_completo?.toLowerCase().includes(q)
      )
    }
    return true
  })
}

const filteredData = computed(() => filterDataForOptions(null))

// Opciones computadas para los selects
const sedeOptions = computed(() => [...new Set(filterDataForOptions('sede').map(d => d.sede).filter(Boolean))].sort())
const zonaOptions = computed(() => [...new Set(filterDataForOptions('zona').map(d => d.zona).filter(Boolean))].sort())
const tipoOptions = computed(() => [...new Set(filterDataForOptions('tipo').map(d => d.tipo).filter(Boolean))].sort())
const statusOptions = computed(() => [...new Set(filterDataForOptions('status').map(d => d.status).filter(Boolean))].sort())
const operarioOptions = computed(() => [...new Set(filterDataForOptions('operario').map(d => d.operario).filter(Boolean))].sort()) // Nuevo options

const statCards = computed(() => [
  { label: 'Total', value: store.stats.total, textColor: '#0066ff', filtro: null, icon: 'mdi-printer-outline' },
  { label: 'Sincronizados', value: store.stats.sincronizados, textColor: '#2e7d32', filtro: 'SINCRONIZADO', icon: 'mdi-cloud-check-outline' },
  { label: 'Stand By', value: store.stats.standby, textColor: '#f57c00', filtro: 'STAND_BY', icon: 'mdi-pause-circle-outline' },
  { label: 'Desincronizados', value: store.stats.desincronizados, textColor: '#c62828', filtro: 'DESINCRONIZADO', icon: 'mdi-cloud-off-outline' },
  { label: 'Sin SDS', value: store.stats.sinSds, textColor: '#555', filtro: 'SIN_SDS', icon: 'mdi-laptop-off' },
  { label: 'Críticos', value: store.stats.criticos, textColor: '#c62828', filtro: 'CRITICO', icon: 'mdi-alert-circle-outline' },
])

function toggleFiltroCard(filtro) {
  filtroEstadoCard.value = filtroEstadoCard.value === filtro ? null : filtro
}

function openDetail(item) {
  selectedDevice.value = item
  dialog.value = true
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function envioColor(status) {
  const map = { ATENDIDO: '#10b981', PENDIENTE: '#f59e0b', SOLICITADO: '#0066ff', CANCELADO: '#c62828', TRANSITO: '#f59e0b' }
  return map[status?.toUpperCase()] || '#94a3b8'
}

function limpiarFiltros() {
  filtroOperario.value = null
  filtroZona.value = null
  filtroTipo.value = null
  filtroStatus.value = null
  filtroSede.value = null
  filtroEstadoCard.value = null
  search.value = ''
}

let interval = null
onMounted(async () => {
  await store.loadStaticData()
  await store.fetchSdsData()
  interval = setInterval(() => store.fetchSdsData(), 2 * 60 * 60 * 1000)
})
onUnmounted(() => { if (interval) clearInterval(interval) })
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

/* Configuramos la tabla para que ocupe todo el espacio sobrante */
.custom-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* El wrapper interno (donde van las filas) se expande y tiene los scrolls */
:deep(.custom-table .v-table__wrapper) {
  flex-grow: 1 !important;
  overflow-y: auto !important; /* Scroll vertical SOLO para las filas */
  overflow-x: auto !important; /* Scroll horizontal en móviles */
  min-height: 0;
}

/* El pie de tabla (paginación) se mantiene estático abajo */
:deep(.custom-table .v-data-table-footer) {
  flex-shrink: 0 !important;
  border-top: 1px solid #e2e8f0 !important;
  background-color: #fff;
}
</style>