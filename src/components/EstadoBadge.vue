<template>
  <div class="d-flex align-center gap-1">
    <span class="estado-dot" :style="`background:${dotColor}`" />
    <span class="text-caption font-weight-medium" style="color:#333;">
      {{ estado }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: {
    type: String,
    required: true
  }
})

const dotColor = computed(() => {
  const map = {
    SINCRONIZADO: '#2e7d32',
    STAND_BY: '#f57c00',
    DESINCRONIZADO: '#c62828',
    SIN_SDS: '#aaa',
    SIN_DATOS: '#ddd'
  }
  return map[props.estado] || '#ddd'
})
</script>

<style scoped>
.estado-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
</style>