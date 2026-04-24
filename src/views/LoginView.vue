<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height login-bg">
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="pa-6 rounded-xl" elevation="10">

              <v-card-title class="text-center mb-2">
                <v-img
                  src="/hp-logo.png"
                  max-width="80"
                  class="mx-auto mb-4"
                  contain
                />
                <div class="text-h5 font-weight-bold">Monitor SDS</div>
                <div class="text-caption text-medium-emphasis">Auna — Control de Impresoras</div>
              </v-card-title>

              <v-card-text>
                <v-otp-input
                  v-model="pin"
                  length="4"
                  type="password"
                  variant="outlined"
                  :error="error"
                  @finish="handleLogin"
                />
                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  class="mt-3"
                  density="compact"
                >
                  PIN incorrecto
                </v-alert>
              </v-card-text>

              <v-card-actions class="px-4">
                <v-btn
                  block
                  color="primary"
                  size="large"
                  :loading="loading"
                  @click="handleLogin"
                >
                  Ingresar
                </v-btn>
              </v-card-actions>

            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const pin = ref('')
const error = ref(false)
const loading = ref(false)

async function handleLogin() {
  if (pin.value.length < 4) return

  loading.value = true
  error.value = false

  try {
    const response = await fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin.value })
    })

    const data = await response.json()

    if (data.success) {
      sessionStorage.setItem('authenticated', 'true')
      sessionStorage.setItem('app_pin', pin.value)
      router.push('/dashboard')
    } else {
      error.value = true
      pin.value = ''
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  background: radial-gradient(ellipse at center, #1a237e22 0%, #121212 70%);
}
</style>