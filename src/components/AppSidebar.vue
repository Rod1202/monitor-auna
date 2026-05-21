<template>
  <v-navigation-drawer
    v-model="drawer"
    :permanent="lgAndUp"
    :temporary="!lgAndUp"
    width="200"
    style="background:#fff; border-right:1px solid #eee;"
  >
    <!-- Logo -->
    <div class="pa-2 d-flex align-center justify-center mb-1">
      <img src="/logoMT.avif" style="width:120px; height:120px; object-fit:contain;" />
    </div>

    <v-divider class="mb-2" />

    <!-- Nav -->
    <v-list density="compact" nav class="px-2">
      <v-list-item
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        value="dashboard"
        rounded="lg"
        :active="activeRoute === 'dashboard'"
        active-color="#0066ff"
        class="mb-1"
        @click="router.push('/dashboard')"
      />
      <v-list-item
        prepend-icon="mdi-printer-outline"
        title="Inventario"
        value="inventario"
        rounded="lg"
        :active="activeRoute === 'inventario'"
        active-color="#0066ff"
        @click="router.push('/inventario')"
      />
      <v-list-item
        v-if="isClient2026"
        prepend-icon="mdi-truck-fast-outline"
        title="Envios del Mes"
        value="envios-mes"
        rounded="lg"
        :active="activeRoute === 'envios-mes'"
        active-color="#0066ff"
        @click="router.push('/envios-mes')"
      />
    </v-list>

    <!-- Footer -->
    <template #append>
      <div class="pa-3">
        <v-divider class="mb-3" />
        <v-btn
          block
          variant="tonal"
          color="error"
          rounded="lg"
          size="small"
          class="mb-3"
          @click="logout"
        >
          <v-icon start icon="mdi-logout" size="16" />
          Cerrar sesión
        </v-btn>
        <div class="text-center mt-1">
          <span style="font-size:9px; font-weight:600; color:#888; letter-spacing:0.04em;">
            Power by Rodrigo Carbonel ®
          </span>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

defineProps({
  activeRoute: {
    type: String,
    default: 'dashboard'
  }
})

const router = useRouter()
const { lgAndUp } = useDisplay()
const drawer = ref(true)
const isClient2026 = sessionStorage.getItem('app_pin') === '2026'

function logout() {
  sessionStorage.removeItem('authenticated')
  sessionStorage.removeItem('app_pin')
  sessionStorage.removeItem('role')
  router.push('/')
}

defineExpose({ drawer })
</script>
