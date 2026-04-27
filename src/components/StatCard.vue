<template>
  <v-card
    elevation="0"
    rounded="xl"
    class="stat-card d-flex flex-column"
    :class="{ 'stat-card--active': isActive }"
    :style="`--dynamic-color: ${textColor}; background: #fff; cursor: pointer; height: 100%; border: 1px solid #e2e8f0;`"
    @click="$emit('click')"
  >
    <div class="pa-3 pa-md-5 d-flex flex-column" style="height:100%;">
      <div class="d-flex justify-space-between align-start mb-2">
        <div class="font-weight-bold" :style="`color:${textColor}; text-transform:uppercase; letter-spacing:0.05em; font-size:11px;`">
          {{ label }}
        </div>
        <v-icon
          v-if="icon"
          :icon="isActive ? 'mdi-filter-check' : icon"
          size="20"
          :color="isActive ? textColor : '#cbd5e1'"
          style="transition:all 0.3s ease;"
        />
      </div>
      
      <div class="mb-2">
        <div class="font-weight-black" style="color:#1e293b; line-height:1; font-size: clamp(1.8rem, 3vw, 2.5rem); letter-spacing: -0.02em;">
          {{ value }}
        </div>
      </div>

      <div class="mt-auto" v-if="isPercentageValid">
        <div class="d-flex justify-space-between align-end mb-1">
          <span style="font-size:11px; font-weight:800;" :style="`color:${textColor}`">{{ percentage }}%</span>
        </div>
        <v-progress-linear :model-value="percentage" :color="textColor" height="4" rounded bg-color="#f1f5f9" />
      </div>
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
  icon: { type: String, default: 'mdi-chart-box-outline' }
})

defineEmits(['click'])

const isPercentageValid = computed(() => props.label.toLowerCase() !== 'total' && props.totalValue > 0)
const percentage = computed(() => isPercentageValid.value ? Math.round((props.value / props.totalValue) * 100) : 0)
</script>

<style scoped>
.stat-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
.stat-card:hover { border-color: var(--dynamic-color) !important; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.05) !important; }
.stat-card--active { border-color: var(--dynamic-color) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.04) !important; }
.stat-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:4px; background:var(--dynamic-color); opacity:0; transition:opacity 0.3s ease; }
.stat-card:hover::before, .stat-card--active::before { opacity:1; }
</style>