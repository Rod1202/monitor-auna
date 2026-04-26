<template>
  <v-chip
    size="x-small"
    rounded="lg"
    :color="bgColor"
    :style="`color:${textColor}; font-weight:600; border:none;`"
  >
    {{ status }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const isProduccion = computed(() =>
  props.status === 'PRODUCCION' || props.status === 'PRODUCCIÓN'
)

const bgColor = computed(() =>
  isProduccion.value ? '#e8f5e9' : '#fff8e1'
)

const textColor = computed(() =>
  isProduccion.value ? '#2e7d32' : '#f57f17'
)
</script>