<template>
  <v-navigation-drawer permanent width="200" style="background:#fff; border-right:1px solid #eee;">

    <!-- Logo -->
    <div class="pa-2 d-flex align-center justify-center mb-1">
      <img src="/logoMT.avif" style="width:140px; height:140px; object-fit:contain;" />
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
    </v-list>

    <!-- Footer -->
    <template #append>
      <div class="pa-3">
        <v-divider class="mb-3" />

        <!-- Botón salir -->
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

        <!-- Créditos -->
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
import { useRouter } from 'vue-router'

defineProps({
  activeRoute: {
    type: String,
    default: 'dashboard'
  }
})

const router = useRouter()

function logout() {
  sessionStorage.removeItem('authenticated')
  sessionStorage.removeItem('app_pin')
  router.push('/')
}
</script>

<style scoped>
.credits-wrap {
  background: #f0f4ff;
  border-radius: 8px;
}
</style>