import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/summary',
  },
  {
    path: '/summary',
    name: 'summary',
    component: () => import('../pages/summary/index.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/tool/'),
  base: '/tool/',
  routes,
})

export default router