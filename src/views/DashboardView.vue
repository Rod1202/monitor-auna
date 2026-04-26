<template>
  <v-app theme="light">

    <AppSidebar active-route="dashboard" />

    <v-main style="background:#f1f5f9; height: 100vh; display: flex; flex-direction: column;">
      <div class="pa-6 d-flex flex-column flex-grow-1" style="min-height: 0;">

        <div class="d-flex align-center mb-6 gap-3 flex-shrink-0">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar serie o área..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            bg-color="#fff"
            style="max-width:340px;"
          />
          <v-spacer />
          <div class="text-caption font-weight-medium" style="color:#64748b;" v-if="store.lastUpdate">
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

        <v-row class="mb-6 flex-shrink-0" dense>
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
          class="pa-5 mb-6 flex-shrink-0" 
          style="background:#fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02);"
        >
          <div class="d-flex align-center mb-4">
            <v-icon icon="mdi-filter-variant" size="20" color="#64748b" class="mr-2" />
            <span class="font-weight-bold" style="color: #334155; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">
              Filtros de Búsqueda
            </span>
          </div>
          
          <v-row dense align="center">
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filtroSede"
                :items="sedeOptions"
                label="Sede"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                clearable
                bg-color="#f8fafc"
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filtroZona"
                :items="zonaOptions"
                label="Zona"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                clearable
                bg-color="#f8fafc"
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filtroTipo"
                :items="tipoOptions"
                label="Tipo"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                clearable
                bg-color="#f8fafc"
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filtroStatus"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                clearable
                bg-color="#f8fafc"
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filtroEstado"
                :items="estadoOptions"
                label="Estado SDS"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                clearable
                bg-color="#f8fafc"
                color="#0066ff"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn
                color="#0066ff"
                variant="tonal"
                rounded="lg"
                size="large"
                block
                class="text-none font-weight-bold"
                style="height: 40px;"
                @click="limpiarFiltros"
              >
                <v-icon start icon="mdi-filter-off-outline" size="18" />
                Limpiar
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <v-card 
          elevation="0" 
          rounded="xl" 
          class="d-flex flex-column flex-grow-1"
          style="background:#fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); min-height: 0; overflow: hidden;"
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
          >

            <template #item.sede="{ item }">
              <div class="text-body-2 font-weight-bold" style="color: #1e293b;">
                {{ item.sede }}
              </div>
            </template>

            <template #item.area="{ item }">
              <div>
                <div class="text-body-2 font-weight-medium" style="color: #334155;">{{ item.area }}</div>
                <div class="text-caption" style="color:#94a3b8;">{{ item.sub_area }}</div>
              </div>
            </template>

            <template #item.operario="{ item }">
              <div class="text-body-2" style="color: #334155;">
                {{ item.operario || 'Sin asignar' }}
              </div>
            </template>

            <template #item.serie="{ item }">
              <div class="d-flex flex-column justify-center" style="gap: 2px; padding-top: 2px; padding-bottom: 2px;">
                <div style="font-size: 15px; font-weight: 800; color: #0066ff; letter-spacing: 0.02em; line-height: 1.1;">
                  {{ item.serie }}
                </div>
                
                <div style="font-size: 10.5px; font-weight: 400; color: #94a3b8; text-transform: uppercase; line-height: 1.2; max-width: 150px;">
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
              <div class="d-flex gap-1 align-center py-1" style="gap:8px;" v-if="item.toners && item.toners.length">
                <TonerGauge
                  v-for="toner in item.toners"
                  :key="toner.index"
                  :colour="toner.colour"
                  :percent-left="toner.percentLeft"
                  :days-left="toner.daysLeft"
                  :sku="toner.sku"
                  :size="32"
                  :width="4"
                />
              </div>
              <span v-else class="text-caption" style="color:#cbd5e1;">—</span>
            </template>

            <template #item.ultimo_suministro="{ item }">
              <div v-if="item.ultimo_suministro">
                <div class="text-caption font-weight-bold" style="color:#334155; margin-bottom: 2px;">
                  {{ item.ultimo_suministro.fecha_entrega }}
                </div>
                <v-chip 
                  size="x-small" 
                  variant="flat" 
                  :color="item.ultimo_suministro.status_envio?.toUpperCase() === 'ENTREGADO' ? '#10b981' : '#f59e0b'"
                  class="font-weight-bold text-white"
                >
                  {{ item.ultimo_suministro.status_envio || 'DESCONOCIDO' }}
                </v-chip>
              </div>
              <span v-else class="text-caption" style="color:#cbd5e1;">Sin envíos</span>
            </template>

            <template #item.accion_requerida="{ item }">
              <v-btn
                variant="outlined"
                color="#cbd5e1"
                size="small"
                rounded="lg"
                class="text-none font-weight-bold"
                style="color: #64748b;"
                elevation="0"
                @click.stop="openDetail(item)"
              >
                Revisar
              </v-btn>
            </template>

          </v-data-table>
        </v-card>

      </div>
    </v-main>

    <DeviceDetailDialog
      v-model="dialog"
      :device="selectedDevice"
    />

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSdsStore } from '../stores/sdsStore'
import AppSidebar from '../components/AppSidebar.vue'
import StatCard from '../components/StatCard.vue'
import TonerGauge from '../components/TonerGauge.vue'
import EstadoBadge from '../components/EstadoBadge.vue'
import StatusChip from '../components/StatusChip.vue'
import DeviceDetailDialog from '../components/DeviceDetailDialog.vue'

const store = useSdsStore()

const search = ref('')
const filtroEstado = ref(null)
const filtroZona = ref(null)
const filtroTipo = ref(null)
const filtroStatus = ref(null)
const filtroSede = ref(null)
const filtroEstadoCard = ref(null)
const dialog = ref(false)
const selectedDevice = ref(null)

const headers = [
  { title: 'Sede', key: 'sede', width: '130px' },
  { title: 'Área / Sub Área', key: 'area', width: '160px' },
  { title: 'Operario', key: 'operario', width: '140px' },
  { title: 'Serie / Modelo', key: 'serie', width: '140px' },
  { title: 'Status', key: 'status', width: '110px' },
  { title: 'Estado SDS', key: 'estado_dispositivo', width: '140px' },
  { title: 'Tóners', key: 'toners', width: '160px', sortable: false },
  { title: 'Último Envío / Status', key: 'ultimo_suministro', width: '160px', sortable: false },
  { title: 'Acción Requerida', key: 'accion_requerida', align: 'center', width: '140px', sortable: false },
]

const filterDataForOptions = (skipKey = null) => {
  return store.combinedData.filter(item => {
    if (filtroEstadoCard.value === 'CRITICO') {
      if (!item.toners?.some(t => t.estado_toner === 'CRITICO')) return false
    } else if (filtroEstadoCard.value && item.estado_dispositivo !== filtroEstadoCard.value) return false

    if (skipKey !== 'estado_dispositivo' && filtroEstado.value && item.estado_dispositivo !== filtroEstado.value) return false
    if (skipKey !== 'zona' && filtroZona.value && item.zona !== filtroZona.value) return false
    if (skipKey !== 'tipo' && filtroTipo.value && item.tipo !== filtroTipo.value) return false
    if (skipKey !== 'status' && filtroStatus.value && item.status !== filtroStatus.value) return false
    if (skipKey !== 'sede' && filtroSede.value && item.sede !== filtroSede.value) return false

    if (search.value) {
      const q = search.value.toLowerCase()
      return (
        item.serie?.toLowerCase().includes(q) ||
        item.sede?.toLowerCase().includes(q) ||
        item.area?.toLowerCase().includes(q) ||
        item.sub_area?.toLowerCase().includes(q) ||
        item.operario?.toLowerCase().includes(q)
      )
    }
    
    return true
  })
}

const filteredData = computed(() => filterDataForOptions(null))

const sedeOptions = computed(() => [...new Set(filterDataForOptions('sede').map(d => d.sede).filter(Boolean))].sort())
const zonaOptions = computed(() => [...new Set(filterDataForOptions('zona').map(d => d.zona).filter(Boolean))].sort())
const tipoOptions = computed(() => [...new Set(filterDataForOptions('tipo').map(d => d.tipo).filter(Boolean))].sort())
const statusOptions = computed(() => [...new Set(filterDataForOptions('status').map(d => d.status).filter(Boolean))].sort())
const estadoOptions = computed(() => [...new Set(filterDataForOptions('estado_dispositivo').map(d => d.estado_dispositivo).filter(Boolean))].sort())

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

function limpiarFiltros() {
  filtroEstado.value = null
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
:deep(.v-field) {
  border-color: #e2e8f0 !important;
}
:deep(.v-data-table) {
  font-family: inherit;
}
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

/* --- SOLUCIÓN DE SCROLL Y PAGINACIÓN PARA LA TABLA --- */
.custom-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* El cuerpo de la tabla crecerá ocupando el espacio libre y mostrará su propio scroll */
:deep(.custom-table .v-table__wrapper) {
  flex-grow: 1 !important;
  overflow-y: auto !important;
  min-height: 0; /* Obliga a flexbox a respetar los límites del contenedor padre */
}

/* Evitamos que la zona de paginación reduzca su tamaño */
:deep(.custom-table .v-data-table-footer) {
  flex-shrink: 0 !important;
  border-top: 1px solid #e2e8f0 !important;
  background-color: #fff;
}
</style>