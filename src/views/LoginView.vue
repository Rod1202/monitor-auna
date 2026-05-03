<template>
  <v-app theme="light">
    <v-main style="background: #f5f5f5;">
      <v-container fluid style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        
        <v-row class="w-100" align="center" justify="center">
          <v-col cols="12" sm="8" md="5" lg="3">

            <v-card elevation="0" rounded="xl" border class="pa-8" style="background:#fff;">

              <div class="text-center mb-6">
                <div class="mx-auto mb-0" style="width: 240px; height: 120px;">
                  <img src="/logoMT.avif" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
                <div class="text-caption" style="color:#888; line-height: 1.4; margin-top: -5px;">
                  - Supervisado por - <br>
                  Gerencia de Operaciones
                </div>
              </div>

              <div class="text-caption text-center mb-3" style="color:#555; font-weight:500; letter-spacing:0.05em;">
                Ingrese su PIN de acceso
              </div>
              
              <v-otp-input
                v-model="pin"
                length="4"
                type="password"
                variant="outlined"
                :error="error"
                @finish="handleLogin"
                style="--v-field-border-color: #e0e0e0;"
              />
              
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mt-3"
                density="compact"
                rounded="lg"
              >
                PIN incorrecto. Intente nuevamente.
              </v-alert>

              <v-btn
                block
                size="large"
                :loading="loading"
                @click="handleLogin"
                rounded="lg"
                class="mt-5 login-btn"
                elevation="0"
              >
                <v-icon start icon="mdi-login-variant" />
                Ingresar
              </v-btn>

              <div class="text-center mt-5">
                <div class="text-caption" style="color:#aaa;">Power by: Rodrigo Carbonel</div>
              </div>

            </v-card>

            <div class="text-center mt-4">
              <v-icon icon="mdi-printer-check" size="20" style="color:#bbb;" />
            </div>

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
      body: JSON.stringify({ pin: pin.value }),
    })
    const data = await response.json()
    if (data.success) {
      sessionStorage.setItem('authenticated', 'true')
      sessionStorage.setItem('app_pin', pin.value)
      sessionStorage.setItem('role', data.role)
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
.login-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #0066ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn {
  background: #0066ff !important;
  color: white !important;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.login-btn:hover {
  background: #0052cc !important;
}
</style>