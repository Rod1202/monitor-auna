<template>
  <v-chip
    size="x-small"
    rounded="lg"
    :color="bgColor"
    :style="`color:${textColor}; font-weight:600; border:none;`"
  >
    {{ estado }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: {
    type: String,
    required: true
  }
})

const bgColor = computed(() => {
  const map = {
    SINCRONIZADO: '#e8f5e9',
    STAND_BY: '#fff8e1',
    DESINCRONIZADO: '#ffebee',
    SIN_SDS: '#f1f5f9',
    SIN_DATOS: '#f1f5f9'
  }
  return map[props.estado] || '#f1f5f9'
})

const textColor = computed(() => {
  const map = {
    SINCRONIZADO: '#2e7d32',
    STAND_BY: '#f57c00',
    DESINCRONIZADO: '#c62828',
    SIN_SDS: '#64748b',
    SIN_DATOS: '#94a3b8'
  }
  return map[props.estado] || '#94a3b8'
})
</script>