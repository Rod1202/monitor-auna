import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      beforeEnter: (to, from, next) => {
        sessionStorage.getItem('authenticated') === 'true' ? next() : next('/')
      }
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: () => import('../views/InventarioView.vue'),
      beforeEnter: (to, from, next) => {
        sessionStorage.getItem('authenticated') === 'true' ? next() : next('/')
      }
    },
    {
      path: '/envios-mes',
      name: 'envios-mes',
      component: () => import('../views/EnviosMesView.vue'),
      beforeEnter: (to, from, next) => {
        if (sessionStorage.getItem('authenticated') !== 'true') {
          next('/')
          return
        }
        sessionStorage.getItem('app_pin') === '2026' ? next() : next('/dashboard')
      }
    }
  ]
})

export default router
