<template>
  <v-app>
    <v-app-bar color="surface" elevation="2" height="64">
      <v-img src="/hp-logo.png" max-width="40" class="ml-4" contain />
      <v-app-bar-title class="font-weight-bold text-primary">
        Monitor SDS — Auna
      </v-app-bar-title>
      <template #append>
        <div class="text-caption text-medium-emphasis mr-3" v-if="store.lastUpdate">
          Actualizado: {{ formatTime(store.lastUpdate) }}
        </div>
        <v-btn
          icon="mdi-refresh"
          :loading="store.loading"
          color="primary"
          variant="tonal"
          class="mr-2"
          @click="store.fetchSdsData()"
        />
        <v-btn
          icon="mdi-logout"
          variant="tonal"
          color="error"
          class="mr-2"
          @click="logout"
        />
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4">

        <!-- Stats Cards -->
        <v-row class="mb-4">
          <v-col cols="6" sm="4" md="2" v-for="stat in statCards" :key="stat.label">
            <v-card
              rounded="lg"
              :color="stat.color"
              :variant="filtroEstadoCard === stat.filtro ? 'elevated' : 'tonal'"
              class="pa-3 text-center"
              style="cursor:pointer"
              @click="toggleFiltroCard(stat.filtro)"
            >
              <v-icon :icon="stat.icon" size="28" class="mb-1" />
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption">{{ stat.label }}</div>
              <v-icon
                v-if="filtroEstadoCard === stat.filtro"
                icon="mdi-filter-check"
                size="14"
                class="mt-1"
              />
            </v-card>
          </v-col>
        </v-row>

        <!-- Filtros -->
        <v-card rounded="lg" class="mb-4 pa-3" color="surface">
          <v-row density="comfortable">
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Buscar serie, sede, área..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
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
                clearable
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
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filtroTipo"
                :items="['COLOR', 'MONOCROMATICA']"
                label="Tipo"
                variant="outlined"
                density="compact"
                hide-details
                clearable
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
                clearable
              />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
              <v-btn variant="tonal" color="secondary" block @click="limpiarFiltros">
                Limpiar
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <!-- Tabla principal -->
        <v-card rounded="lg" color="surface">
          <v-data-table
            :headers="headers"
            :items="filteredData"
            :loading="store.loading"
            density="compact"
            fixed-header
            height="560"
            items-per-page="25"
            @click:row="(_, { item }) => openDetail(item)"
            style="cursor:pointer"
          >
            <template #item.estado_dispositivo="{ item }">
              <v-chip
                :color="estadoColor(item.estado_dispositivo)"
                size="small"
                variant="tonal"
                label
              >
                <v-icon start :icon="estadoIcon(item.estado_dispositivo)" size="14" />
                {{ item.estado_dispositivo }}
              </v-chip>
            </template>

            <template #item.toners="{ item }">
              <div class="d-flex gap-1 py-1" v-if="item.toners.length">
                <v-tooltip
                  v-for="toner in item.toners"
                  :key="toner.index"
                  :text="`${toner.colour} — ${toner.percentLeft}% — ${toner.estado_toner}`"
                >
                  <template #activator="{ props }">
                    <v-progress-circular
                      v-bind="props"
                      :model-value="toner.percentLeft"
                      :color="tonerColor(toner.colour, toner.percentLeft)"
                      size="28"
                      width="4"
                    >
                      <span style="font-size:8px">{{ toner.percentLeft }}</span>
                    </v-progress-circular>
                  </template>
                </v-tooltip>
              </div>
              <span v-else class="text-medium-emphasis text-caption">Sin datos</span>
            </template>

            <template #item.ultimo_suministro="{ item }">
              <div v-if="item.ultimo_suministro">
                <div class="text-caption font-weight-medium">{{ item.ultimo_suministro.descripcion }}</div>
                <v-chip
                  :color="envioColor(item.ultimo_suministro.status_envio)"
                  size="x-small"
                  variant="tonal"
                  label
                >
                  {{ item.ultimo_suministro.status_envio }}
                </v-chip>
              </div>
              <span v-else class="text-medium-emphasis text-caption">Sin registro</span>
            </template>

            <template #item.status="{ item }">
              <v-chip
                :color="item.status === 'PRODUCCION' || item.status === 'PRODUCCIÓN' ? 'success' : 'warning'"
                size="small"
                variant="tonal"
                label
              >
                {{ item.status }}
              </v-chip>
            </template>

          </v-data-table>
        </v-card>

      </v-container>
    </v-main>

    <!-- ===== DIALOG DETALLE ===== -->
    <v-dialog v-model="dialog" max-width="780" scrollable>
      <v-card v-if="selectedDevice" rounded="lg">
        <v-card-title class="pa-4 d-flex align-center">
          <v-icon icon="mdi-printer" class="mr-2" color="primary" />
          {{ selectedDevice.modelo_completo }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
        </v-card-title>
        <v-divider />

        <!-- Tabs del dialog -->
        <v-tabs v-model="dialogTab" color="primary" class="px-4">
          <v-tab value="info">Info</v-tab>
          <v-tab value="toners">Tóners</v-tab>
          <v-tab value="suministro">Suministro</v-tab>
          <v-tab value="editar">
            <v-icon start icon="mdi-pencil" size="16" />
            Editar
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="pa-4">
          <v-tabs-window v-model="dialogTab">

            <!-- TAB INFO -->
            <v-tabs-window-item value="info">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-2 text-primary mb-2">Ubicación</div>
                  <v-list density="compact" class="bg-transparent pa-0">
                    <v-list-item v-for="(val, key) in ubicacionInfo" :key="key" class="px-0">
                      <template #prepend>
                        <span class="text-caption text-medium-emphasis mr-2" style="min-width:80px">{{ key }}</span>
                      </template>
                      <span class="text-caption font-weight-medium">{{ val }}</span>
                    </v-list-item>
                  </v-list>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-2 text-primary mb-2">Estado SDS</div>
                  <v-chip :color="estadoColor(selectedDevice.estado_dispositivo)" variant="tonal" label class="mb-3">
                    {{ selectedDevice.estado_dispositivo }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis mt-2">
                    Último contacto: {{ selectedDevice.lastContact || 'N/A' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Serie: {{ selectedDevice.serie }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Modelo SDS: {{ selectedDevice.modelo_sds || 'N/A' }}
                  </div>
                </v-col>
              </v-row>
            </v-tabs-window-item>

            <!-- TAB TONERS -->
            <v-tabs-window-item value="toners">
              <div v-if="selectedDevice.toners.length">
                <v-row dense>
                  <v-col cols="6" sm="3" v-for="toner in selectedDevice.toners" :key="toner.index">
                    <v-card variant="tonal" :color="tonerColor(toner.colour, toner.percentLeft)" rounded="lg" class="pa-3 text-center">
                      <v-progress-circular
                        :model-value="toner.percentLeft"
                        :color="tonerColor(toner.colour, toner.percentLeft)"
                        size="56"
                        width="6"
                        class="mb-2"
                      >
                        {{ toner.percentLeft }}%
                      </v-progress-circular>
                      <div class="text-caption font-weight-bold">{{ toner.colour }}</div>
                      <div class="text-caption">{{ toner.daysLeft }} días</div>
                      <div class="text-caption text-medium-emphasis">{{ toner.sku }}</div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
              <div v-else class="text-center py-6">
                <v-icon icon="mdi-toner" size="48" color="grey" class="mb-2" />
                <div class="text-caption text-medium-emphasis">Sin datos de tóner desde SDS</div>
              </div>
            </v-tabs-window-item>

            <!-- TAB SUMINISTRO -->
            <v-tabs-window-item value="suministro">
              <div v-if="selectedDevice.ultimo_suministro">
                <v-card variant="outlined" rounded="lg" class="pa-4">
                  <v-row dense>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Descripción</div>
                      <div class="text-body-2 font-weight-medium">{{ selectedDevice.ultimo_suministro.descripcion }}</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">SKU</div>
                      <div class="text-body-2 font-weight-medium">{{ selectedDevice.ultimo_suministro.sku }}</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Color</div>
                      <div class="text-body-2 font-weight-medium">{{ selectedDevice.ultimo_suministro.color }}</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Guía</div>
                      <div class="text-body-2 font-weight-medium">{{ selectedDevice.ultimo_suministro.guia }}</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Fecha entrega</div>
                      <div class="text-body-2 font-weight-medium">{{ selectedDevice.ultimo_suministro.fecha_entrega }}</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Porcentaje al envío</div>
                      <div class="text-body-2 font-weight-medium">{{ selectedDevice.ultimo_suministro.porcentaje }}%</div>
                    </v-col>
                    <v-col cols="12">
                      <v-chip :color="envioColor(selectedDevice.ultimo_suministro.status_envio)" size="small" variant="tonal" label>
                        {{ selectedDevice.ultimo_suministro.status_envio }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card>
              </div>
              <div v-else class="text-center py-6">
                <v-icon icon="mdi-package-variant" size="48" color="grey" class="mb-2" />
                <div class="text-caption text-medium-emphasis">Sin registro de suministros</div>
              </div>
            </v-tabs-window-item>

            <!-- TAB EDITAR -->
            <v-tabs-window-item value="editar">
              <v-row>

                <!-- Editar inventario -->
                <v-col cols="12">
                  <v-expansion-panels variant="accordion">

                    <!-- Panel 1: Datos de ubicación -->
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-icon icon="mdi-map-marker" class="mr-2" color="primary" size="18" />
                        Editar datos de ubicación
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-row dense class="mt-2">
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="editForm.sede" label="Sede" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="editForm.area" label="Área" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="editForm.sub_area" label="Sub Área" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="editForm.piso" label="Piso" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="editForm.operario" label="Operario" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-select
                              v-model="editForm.status"
                              :items="['PRODUCCION', 'BACKUP']"
                              label="Status"
                              variant="outlined"
                              density="compact"
                            />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-select
                              v-model="editForm.zona"
                              :items="['LIMA', 'PROVINCIA']"
                              label="Zona"
                              variant="outlined"
                              density="compact"
                            />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="editForm.unidad_negocio" label="Unidad de Negocio" variant="outlined" density="compact" />
                          </v-col>
                        </v-row>
                        <v-btn
                          color="primary"
                          variant="tonal"
                          :loading="savingInventario"
                          @click="guardarInventario"
                          class="mt-2"
                        >
                          <v-icon start icon="mdi-content-save" />
                          Guardar cambios
                        </v-btn>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <!-- Panel 2: Tóner manual -->
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-icon icon="mdi-toner" class="mr-2" color="warning" size="18" />
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
                              type="number"
                              min="0"
                              max="100"
                              :prepend-inner-icon="'mdi-circle'"
                              :color="color.color"
                            />
                          </v-col>
                        </v-row>
                        <v-btn
                          color="warning"
                          variant="tonal"
                          :loading="savingToner"
                          @click="guardarTonerManual"
                          class="mt-2"
                        >
                          <v-icon start icon="mdi-content-save" />
                          Guardar tóner manual
                        </v-btn>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <!-- Panel 3: Agregar suministro -->
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-icon icon="mdi-package-variant-plus" class="mr-2" color="success" size="18" />
                        Agregar registro de suministro
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-row dense class="mt-2">
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.descripcion_suministro" label="Descripción" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.sku" label="SKU" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-select
                              v-model="suministroForm.Color"
                              :items="['BLACK', 'CYAN', 'MAGENTA', 'YELLOW']"
                              label="Color"
                              variant="outlined"
                              density="compact"
                            />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.guia" label="Guía" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.fecha_enprega" label="Fecha entrega (DD/MM/YYYY)" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.porcentaje" label="Porcentaje (%)" type="number" min="0" max="100" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.dias_restantes" label="Días restantes" type="number" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-select
                              v-model="suministroForm.status_envio"
                              :items="['ATENDIDO', 'PENDIENTE', 'CANCELADO']"
                              label="Status envío"
                              variant="outlined"
                              density="compact"
                            />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.contacto" label="Contacto" variant="outlined" density="compact" />
                          </v-col>
                          <v-col cols="12" sm="6">
                            <v-text-field v-model="suministroForm.atencion" label="Atención" variant="outlined" density="compact" />
                          </v-col>
                        </v-row>
                        <v-btn
                          color="success"
                          variant="tonal"
                          :loading="savingSuministro"
                          @click="guardarSuministro"
                          class="mt-2"
                        >
                          <v-icon start icon="mdi-plus" />
                          Agregar suministro
                        </v-btn>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                  </v-expansion-panels>
                </v-col>
              </v-row>
            </v-tabs-window-item>

          </v-tabs-window>
        </v-card-text>

        <!-- Snackbar feedback -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="bottom right">
          {{ snackbar.text }}
        </v-snackbar>

      </v-card>
    </v-dialog>

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSdsStore } from '../stores/sdsStore'

const router = useRouter()
const store = useSdsStore()

// --- Filtros ---
const search = ref('')
const filtroEstado = ref(null)
const filtroZona = ref(null)
const filtroTipo = ref(null)
const filtroStatus = ref(null)
const filtroEstadoCard = ref(null)

// --- Dialog ---
const dialog = ref(false)
const dialogTab = ref('info')
const selectedDevice = ref(null)

// --- Saving states ---
const savingInventario = ref(false)
const savingToner = ref(false)
const savingSuministro = ref(false)

// --- Snackbar ---
const snackbar = ref({ show: false, text: '', color: 'success' })

// --- Formularios ---
const editForm = ref({})
const tonerManualForm = ref({ BLACK: null, CYAN: null, MAGENTA: null, YELLOW: null })
const suministroForm = ref({
  descripcion_suministro: '',
  sku: '',
  Color: 'BLACK',
  guia: '',
  fecha_enprega: '',
  porcentaje: null,
  dias_restantes: null,
  status_envio: 'ATENDIDO',
  contacto: '',
  atencion: 'BOLSA'
})

const coloresDisponibles = [
  { key: 'BLACK', label: 'Negro', color: 'blue-grey' },
  { key: 'CYAN', label: 'Cyan', color: 'cyan' },
  { key: 'MAGENTA', label: 'Magenta', color: 'pink' },
  { key: 'YELLOW', label: 'Amarillo', color: 'yellow-darken-2' }
]

// --- Headers tabla ---
const headers = [
  { title: 'Serie', key: 'serie', width: '130px' },
  { title: 'Sede', key: 'sede' },
  { title: 'Área', key: 'area' },
  { title: 'Sub Área', key: 'sub_area' },
  { title: 'Piso', key: 'piso', width: '60px' },
  { title: 'Operario', key: 'operario' },
  { title: 'Tipo', key: 'tipo', width: '110px' },
  { title: 'Status', key: 'status', width: '110px' },
  { title: 'Estado SDS', key: 'estado_dispositivo', width: '150px' },
  { title: 'Tóners', key: 'toners', width: '140px', sortable: false },
  { title: 'Último Suministro', key: 'ultimo_suministro', sortable: false },
]

// --- Opciones filtros ---
const estadoOptions = ['SINCRONIZADO', 'STAND_BY', 'DESINCRONIZADO', 'SIN_SDS']

const zonaOptions = computed(() =>
  [...new Set(store.combinedData.map(d => d.zona).filter(Boolean))]
)

const statusOptions = computed(() =>
  [...new Set(store.combinedData.map(d => d.status).filter(Boolean))]
)

// --- Data filtrada ---
const filteredData = computed(() => {
  return store.combinedData.filter(item => {
    if (filtroEstadoCard.value && item.estado_dispositivo !== filtroEstadoCard.value) return false
    if (filtroEstado.value && item.estado_dispositivo !== filtroEstado.value) return false
    if (filtroZona.value && item.zona !== filtroZona.value) return false
    if (filtroTipo.value && item.tipo !== filtroTipo.value) return false
    if (filtroStatus.value && item.status !== filtroStatus.value) return false
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
})

// --- Stat cards ---
const statCards = computed(() => [
  { label: 'Total', value: store.stats.total, color: 'primary', icon: 'mdi-printer', filtro: null },
  { label: 'Sincronizados', value: store.stats.sincronizados, color: 'success', icon: 'mdi-check-circle', filtro: 'SINCRONIZADO' },
  { label: 'Stand By', value: store.stats.standby, color: 'warning', icon: 'mdi-clock-outline', filtro: 'STAND_BY' },
  { label: 'Desincronizados', value: store.stats.desincronizados, color: 'error', icon: 'mdi-alert-circle', filtro: 'DESINCRONIZADO' },
  { label: 'Sin SDS', value: store.stats.sinSds, color: 'secondary', icon: 'mdi-wifi-off', filtro: 'SIN_SDS' },
  { label: 'Críticos', value: store.stats.criticos, color: 'error', icon: 'mdi-toner', filtro: 'CRITICO' },
])

// --- Toggle filtro por card ---
function toggleFiltroCard(filtro) {
  if (!filtro) {
    filtroEstadoCard.value = null
    return
  }
  filtroEstadoCard.value = filtroEstadoCard.value === filtro ? null : filtro
}

// --- Info ubicación para el dialog ---
const ubicacionInfo = computed(() => {
  if (!selectedDevice.value) return {}
  return {
    'Unidad': selectedDevice.value.unidad_negocio,
    'Zona': selectedDevice.value.zona,
    'Sede': selectedDevice.value.sede,
    'Área': selectedDevice.value.area,
    'Sub Área': selectedDevice.value.sub_area,
    'Piso': selectedDevice.value.piso,
    'Operario': selectedDevice.value.operario,
    'Tipo': selectedDevice.value.tipo,
    'Tamaño': selectedDevice.value.tamanio,
  }
})

// --- Abrir dialog ---
function openDetail(item) {
  selectedDevice.value = item
  dialogTab.value = 'info'
  editForm.value = {
    sede: item.sede,
    area: item.area,
    sub_area: item.sub_area,
    piso: item.piso,
    operario: item.operario,
    status: item.status,
    zona: item.zona,
    unidad_negocio: item.unidad_negocio
  }
  tonerManualForm.value = {
    BLACK: item.toners_manual?.BLACK || null,
    CYAN: item.toners_manual?.CYAN || null,
    MAGENTA: item.toners_manual?.MAGENTA || null,
    YELLOW: item.toners_manual?.YELLOW || null
  }
  suministroForm.value = {
    descripcion_suministro: '',
    sku: '',
    Color: 'BLACK',
    guia: '',
    fecha_enprega: '',
    porcentaje: null,
    dias_restantes: null,
    status_envio: 'ATENDIDO',
    contacto: '',
    atencion: 'BOLSA'
  }
  dialog.value = true
}

// --- Guardar inventario ---
async function guardarInventario() {
  savingInventario.value = true
  try {
    const nuevoInventario = store.inventario.map(item => {
      if (item.serie === selectedDevice.value.serie) {
        return { ...item, ...editForm.value }
      }
      return item
    })
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = {
      show: true,
      text: ok ? 'Inventario actualizado correctamente' : 'Error al guardar',
      color: ok ? 'success' : 'error'
    }
  } finally {
    savingInventario.value = false
  }
}

// --- Guardar tóner manual ---
async function guardarTonerManual() {
  savingToner.value = true
  try {
    const nuevoInventario = store.inventario.map(item => {
      if (item.serie === selectedDevice.value.serie) {
        return { ...item, toners_manual: { ...tonerManualForm.value } }
      }
      return item
    })
    const ok = await store.updateJson('inventario.json', nuevoInventario)
    snackbar.value = {
      show: true,
      text: ok ? 'Tóner manual guardado correctamente' : 'Error al guardar',
      color: ok ? 'success' : 'error'
    }
  } finally {
    savingToner.value = false
  }
}

// --- Agregar suministro ---
async function guardarSuministro() {
  savingSuministro.value = true
  try {
    const hoy = new Date().toLocaleDateString('es-PE')
    const nuevoSuministro = {
      ...suministroForm.value,
      serie: selectedDevice.value.serie,
      modelo: selectedDevice.value.modelo_completo,
      cliente: selectedDevice.value.unidad_negocio,
      direccion: `${selectedDevice.value.sede} - ${selectedDevice.value.area}`,
      fecha_registro: hoy,
      tipo: 'SUMINISTROS',
      cantidad: 1
    }
    const nuevosSuministros = [nuevoSuministro, ...store.suministros]
    const ok = await store.updateJson('suministros.json', nuevosSuministros)
    snackbar.value = {
      show: true,
      text: ok ? 'Suministro agregado correctamente' : 'Error al guardar',
      color: ok ? 'success' : 'error'
    }
    if (ok) {
      suministroForm.value = {
        descripcion_suministro: '',
        sku: '',
        Color: 'BLACK',
        guia: '',
        fecha_enprega: '',
        porcentaje: null,
        dias_restantes: null,
        status_envio: 'ATENDIDO',
        contacto: '',
        atencion: 'BOLSA'
      }
    }
  } finally {
    savingSuministro.value = false
  }
}

// --- Helpers de color ---
function estadoColor(estado) {
  const map = {
    SINCRONIZADO: 'success',
    STAND_BY: 'warning',
    DESINCRONIZADO: 'error',
    SIN_SDS: 'secondary',
    SIN_DATOS: 'grey'
  }
  return map[estado] || 'grey'
}

function estadoIcon(estado) {
  const map = {
    SINCRONIZADO: 'mdi-check-circle',
    STAND_BY: 'mdi-clock-outline',
    DESINCRONIZADO: 'mdi-alert-circle',
    SIN_SDS: 'mdi-wifi-off',
    SIN_DATOS: 'mdi-help-circle'
  }
  return map[estado] || 'mdi-help-circle'
}

function tonerColor(colour, percent) {
  if (percent <= 10) return 'error'
  if (percent <= 25) return 'warning'
  const map = {
    BLACK: 'blue-grey',
    CYAN: 'cyan',
    MAGENTA: 'pink',
    YELLOW: 'yellow-darken-2'
  }
  return map[colour] || 'primary'
}

function envioColor(status) {
  const map = {
    ATENDIDO: 'success',
    PENDIENTE: 'warning',
    CANCELADO: 'error'
  }
  return map[status] || 'grey'
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function limpiarFiltros() {
  filtroEstado.value = null
  filtroZona.value = null
  filtroTipo.value = null
  filtroStatus.value = null
  filtroEstadoCard.value = null
  search.value = ''
}

function logout() {
  sessionStorage.removeItem('authenticated')
  sessionStorage.removeItem('app_pin')
  router.push('/')
}

// --- Auto refresh cada 2 horas ---
let interval = null

onMounted(async () => {
  await store.loadStaticData()
  await store.fetchSdsData()
  interval = setInterval(() => store.fetchSdsData(), 2 * 60 * 60 * 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>