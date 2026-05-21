import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const reloadOnChunkError = (error) => {
  const message = String(error?.message || error || '')
  const isChunkError = message.includes('Failed to fetch dynamically imported module')

  if (isChunkError && sessionStorage.getItem('chunk_reload_done') !== 'true') {
    sessionStorage.setItem('chunk_reload_done', 'true')
    window.location.reload()
  }
}

window.addEventListener('error', event => reloadOnChunkError(event.error))
window.addEventListener('unhandledrejection', event => reloadOnChunkError(event.reason))

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#0096D6',    // Azul HP
          secondary: '#00A896',
          background: '#121212',
          surface: '#1E1E1E',
          error: '#CF6679',
          success: '#4CAF50',
          warning: '#FB8C00',
        }
      }
    }
  },
  icons: {
    defaultSet: 'mdi'
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
