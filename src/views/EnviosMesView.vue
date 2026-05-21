<template>
  <v-app theme="light">
    <AppSidebar ref="sidebarRef" active-route="envios-mes" />

    <v-main style="background:#f1f5f9;">
      <div
        class="pa-3 pa-md-6 d-flex flex-column"
        :style="lgAndUp ? 'height: 100vh; min-height: 0; overflow: hidden;' : 'min-height: 100vh;'"
      >
        <div class="d-flex align-center mb-4 flex-shrink-0 page-header">
          <v-btn v-if="!lgAndUp" icon="mdi-menu" variant="text" size="small" @click="sidebarRef.drawer = !sidebarRef.drawer" />
          <v-btn
            color="#0066ff"
            variant="tonal"
            rounded="lg"
            icon="mdi-arrow-left"
            size="small"
            class="mr-3"
            @click="router.push('/dashboard')"
          />
          <div class="min-width-0">
            <div class="text-h6 font-weight-black" style="color:#1e293b; line-height:1.1;">Envios del Mes</div>
            <div class="text-caption" style="color:#64748b;">Suministros atendidos y en transito</div>
          </div>
          <v-spacer />
          <v-chip rounded="lg" variant="tonal" color="#0066ff" class="font-weight-bold">
            {{ atendidos.length }} atendidos
          </v-chip>
        </div>

        <div class="dashboard-grid flex-grow-1">
          <v-card elevation="0" rounded="xl" class="pa-4 chart-panel" style="background:#fff; border:1px solid #e2e8f0;">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-chart-line" size="18" color="#0066ff" class="mr-2" />
              <div>
                <div class="text-subtitle-2 font-weight-black" style="color:#334155;">Historico de Envios</div>
                <div class="text-caption" style="color:#94a3b8;">{{ selectedSku || 'Todos los SKU' }}</div>
              </div>
              <v-spacer />
              <v-btn v-if="selectedSku" size="small" variant="text" color="#0066ff" class="text-none" @click="selectedSku = null">
                Ver todos
              </v-btn>
            </div>

            <svg viewBox="0 0 900 360" class="line-chart" role="img" aria-label="Historico de envios">
              <line x1="58" y1="270" x2="858" y2="270" stroke="#e2e8f0" stroke-width="1" />
              <line x1="58" y1="24" x2="58" y2="270" stroke="#e2e8f0" stroke-width="1" />
              <polyline
                v-if="linePoints"
                :points="linePoints"
                fill="none"
                stroke="#0066ff"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <g v-for="point in lineChartPoints" :key="point.label">
                <circle :cx="point.x" :cy="point.y" r="5" fill="#0066ff" />
                <text :x="point.x" :y="point.y - 12" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">{{ point.count }}</text>
                <text
                  :x="point.x"
                  y="300"
                  text-anchor="end"
                  font-size="12"
                  font-weight="600"
                  fill="#64748b"
                  :transform="`rotate(-32 ${point.x} 300)`"
                >
                  {{ point.label }}
                </text>
              </g>
              <text v-if="!lineChartPoints.length" x="450" y="170" text-anchor="middle" font-size="14" fill="#94a3b8">
                Sin datos atendidos
              </text>
            </svg>
          </v-card>

          <v-card elevation="0" rounded="xl" class="pa-4 chart-panel" style="background:#fff; border:1px solid #e2e8f0;">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-chart-bar" size="18" color="#0066ff" class="mr-2" />
              <div>
                <div class="text-subtitle-2 font-weight-black" style="color:#334155;">Cantidad por SKU</div>
                <div class="text-caption" style="color:#94a3b8;">Atendidos, de mayor a menor</div>
              </div>
            </div>

            <div class="bar-list">
              <button
                v-for="item in skuBars"
                :key="item.sku"
                class="bar-row"
                :class="{ active: selectedSku === item.sku }"
                type="button"
                @click="selectedSku = selectedSku === item.sku ? null : item.sku"
              >
                <span class="bar-label">{{ item.sku }}</span>
                <span class="bar-track">
                  <span class="bar-fill" :style="{ width: `${item.width}%` }" />
                </span>
                <span class="bar-value">{{ item.count }}</span>
              </button>
            </div>
          </v-card>

          <v-card elevation="0" rounded="xl" class="table-panel d-flex flex-column" style="background:#fff; border:1px solid #e2e8f0; min-height:0;">
            <div class="pa-4 pb-2 d-flex align-center">
              <v-icon icon="mdi-truck-delivery-outline" size="18" color="#f57c00" class="mr-2" />
              <div>
                <div class="text-subtitle-2 font-weight-black" style="color:#334155;">Suministros en Transito</div>
                <div class="text-caption" style="color:#94a3b8;">{{ transito.length }} registros pendientes</div>
              </div>
            </div>

            <v-data-table
              :headers="transitoHeaders"
              :items="transito"
              density="comfortable"
              fixed-header
              items-per-page="10"
              class="custom-table"
              style="min-width:900px;"
            >
              <template #item.descripcion_suministro="{ item }">
                <span class="font-weight-medium" style="color:#334155;">{{ item.descripcion_suministro }}</span>
              </template>
              <template #item.sku="{ item }">
                <span class="font-weight-black" style="color:#0066ff;">{{ item.sku }}</span>
              </template>
            </v-data-table>
          </v-card>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import AppSidebar from '../components/AppSidebar.vue'
import { useSdsStore } from '../stores/sdsStore'

const store = useSdsStore()
const router = useRouter()
const { lgAndUp } = useDisplay()
const sidebarRef = ref(null)
const selectedSku = ref(null)

const transitoHeaders = [
  { title: 'Direccion', key: 'direccion' },
  { title: 'Contacto', key: 'contacto' },
  { title: 'Modelo', key: 'modelo' },
  { title: 'Serie', key: 'serie' },
  { title: 'Descripcion Suministro', key: 'descripcion_suministro' },
  { title: 'Sku', key: 'sku' },
  { title: 'Color', key: 'Color' },
]

const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const parseFecha = (fechaStr) => {
  if (!fechaStr) return null
  const [d, m, y] = fechaStr.split('/')
  if (!d || !m || !y) return null
  const fecha = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

const formatMonth = (fecha) => `${meses[fecha.getMonth()]}-${fecha.getFullYear()}`

const atendidos = computed(() =>
  store.suministros.filter(s => s.status_envio?.toUpperCase() === 'ATENDIDO' && parseFecha(s.fecha_enprega))
)

const transito = computed(() =>
  store.suministros.filter(s => s.status_envio?.toUpperCase() === 'TRANSITO')
)

const skuBars = computed(() => {
  const counts = new Map()
  atendidos.value.forEach(item => {
    const sku = item.sku || 'SIN SKU'
    counts.set(sku, (counts.get(sku) || 0) + 1)
  })

  const rows = [...counts.entries()]
    .map(([sku, count]) => ({ sku, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const max = Math.max(...rows.map(r => r.count), 1)
  return rows.map(row => ({ ...row, width: Math.max((row.count / max) * 100, 4) }))
})

const lineData = computed(() => {
  const counts = new Map()

  atendidos.value
    .filter(item => !selectedSku.value || item.sku === selectedSku.value)
    .forEach(item => {
      const fecha = parseFecha(item.fecha_enprega)
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const current = counts.get(key) || { label: formatMonth(fecha), count: 0 }
      current.count += 1
      counts.set(key, current)
    })

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value)
})

const lineChartPoints = computed(() => {
  const data = lineData.value
  if (!data.length) return []

  const max = Math.max(...data.map(d => d.count), 1)
  const width = 800
  const left = 58
  const top = 28
  const height = 236
  const step = data.length > 1 ? width / (data.length - 1) : 0

  return data.map((item, index) => ({
    ...item,
    x: data.length > 1 ? left + index * step : left + width / 2,
    y: top + height - (item.count / max) * height,
  }))
})

const linePoints = computed(() => lineChartPoints.value.map(p => `${p.x},${p.y}`).join(' '))

onMounted(async () => {
  if (!store.suministros.length) {
    await store.loadStaticData()
  }
})
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
  grid-template-rows: minmax(430px, 1.15fr) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
}

.page-header {
  gap: 0;
}

.min-width-0 {
  min-width: 0;
}

.chart-panel {
  min-width: 0;
  overflow: hidden;
}

.table-panel {
  grid-column: 1 / -1;
  overflow: hidden;
}

.line-chart {
  width: 100%;
  height: 360px;
  display: block;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(82px, 120px) 1fr 36px;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.bar-row:hover,
.bar-row.active {
  background: #f8fafc;
}

.bar-label {
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  height: 12px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  background: #0066ff;
  border-radius: 999px;
}

.bar-value {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-align: right;
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

.custom-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.custom-table .v-table__wrapper) {
  flex-grow: 1 !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  min-height: 0;
}

@media (max-width: 960px) {
  .dashboard-grid {
    display: flex;
    flex-direction: column;
  }
}
</style>
