import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('../views/AboutView.vue')
    // },
    {
      path: '/charts',
      name: 'charts',
      component: () => import('../views/ChartsPage.vue')
    },
    {
      path: '/datasource',
      name: 'datasource',
      component: () => import('../views/DataSourcePage.vue')
    },
    {
      path: '/onepage',
      name: 'onepage',
      component: () => import('../views/OnePage.vue')
    },
    {
      path: '/report&viewer',
      name: 'report&viewer',
      component: () => import('../views/ReportsViewerPage.vue')
    }
  ]
})

export default router
