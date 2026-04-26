<template>
  <v-card
    elevation="0"
    rounded="xl"
    class="pa-5 stat-card d-flex flex-column"
    :class="{ 'stat-card--active': isActive }"
    :style="`--dynamic-color: ${textColor}; background: #fff; cursor: pointer; height: 100%; border: 1px solid #e2e8f0;`"
    @click="$emit('click')"
  >
    <div class="d-flex justify-space-between align-start mb-3">
      <div
        class="font-weight-bold"
        :style="`color: ${textColor}; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;`"
      >
        {{ label }}
      </div>
      
      <v-icon
        v-if="icon"
        :icon="isActive ? 'mdi-filter-check' : icon"
        size="24"
        :color="isActive ? textColor : '#cbd5e1'"
        style="transition: all 0.3s ease;"
      />
    </div>

    <div class="mb-4">
      <div style="font-size: 2.5rem; font-weight: 900; color: #1e293b; line-height: 1;">
        {{ value }}
      </div>
    </div>

    <div class="mt-auto" v-if="isPercentageValid">
      <div class="d-flex justify-space-between align-end mb-1">
        <span :style="`font-size: 13px; font-weight: 800; color: ${textColor};`">{{ percentage }}%</span>
      </div>
      <v-progress-linear
        :model-value="percentage"
        :color="textColor"
        height="6"
        rounded
        bg-color="#f1f5f9"
      ></v-progress-linear>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  textColor: { type: String, default: '#0066ff' },
  isActive: { type: Boolean, default: false },
  totalValue: { type: Number, default: 0 },
  // NUEVA PROPIEDAD: Para recibir el ícono de Vuetify
  icon: { type: String, default: 'mdi-chart-box-outline' }
})

defineEmits(['click'])

const isPercentageValid = computed(() => {
  return props.label.toLowerCase() !== 'total' && props.totalValue > 0
})

const percentage = computed(() => {
  if (!isPercentageValid.value) return 0
  return Math.round((props.value / props.totalValue) * 100)
})
</script>

<style scoped>
.stat-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  border-color: var(--dynamic-color) !important;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
}

.stat-card--active {
  border-color: var(--dynamic-color) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--dynamic-color);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before,
.stat-card--active::before {
  opacity: 1;
}
</style>