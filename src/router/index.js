import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: []
    },
    {
      path: '/pushStream',
      name: 'pushStream',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/pushStream/index.vue')
    },
    {
      path: '/pullStream',
      name: 'pullStream',
      component: () => import('../views/pullStream/index.vue')
    },
    {
      path: '/:catchAll(.*)',
      name: 'notFound',
      component: () => import('../views/notFound/index.vue')
    }
  ]
})

export default router
