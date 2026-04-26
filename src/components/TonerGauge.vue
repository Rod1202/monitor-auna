<template>
  <v-tooltip :text="`${colour} — ${percentLeft}% — ${estadoToner}`">
    <template #activator="{ props }">
      <div v-bind="props" class="toner-gauge-wrap">
        <v-progress-circular
          :model-value="percentLeft"
          :color="gaugeColor"
          :size="size"
          :width="width"
        >
          <span :style="`font-size:${fontSize}px; font-weight:700; color:#333;`">
            {{ percentLeft }}
          </span>
        </v-progress-circular>
        <div v-if="showLabel" class="text-caption font-weight-bold mt-1 text-center" style="color:#111;">
          {{ colour }}
        </div>
        <div v-if="showDays" class="text-caption text-center" style="color:#aaa;">
          {{ daysLeft }} días
        </div>
        <div v-if="showSku" class="text-caption text-center" style="color:#bbb;">
          {{ sku }}
        </div>
      </div>
    </template>
  </v-tooltip>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  colour: {
    type: String,
    required: true
  },
  percentLeft: {
    type: Number,
    required: true
  },
  daysLeft: {
    type: Number,
    default: null
  },
  sku: {
    type: String,
    default: null
  },
  size: {
    type: Number,
    default: 36
  },
  width: {
    type: Number,
    default: 4
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  showDays: {
    type: Boolean,
    default: false
  },
  showSku: {
    type: Boolean,
    default: false
  }
})

const fontSize = computed(() => props.size <= 36 ? 9 : 11)

const estadoToner = computed(() => {
  if (props.percentLeft <= 10) return 'CRÍTICO'
  if (props.percentLeft <= 25) return 'BAJO'
  if (props.percentLeft <= 50) return 'MEDIO'
  return 'OK'
})

const gaugeColor = computed(() => {
  if (props.percentLeft <= 10) return '#c62828'
  if (props.percentLeft <= 25) return '#f57c00'
  const map = {
    BLACK: '#455a64',
    CYAN: '#0097a7',
    MAGENTA: '#ad1457',
    YELLOW: '#f9a825'
  }
  return map[props.colour] || '#0066ff'
})
</script>

<style scoped>
.toner-gauge-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>