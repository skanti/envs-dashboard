import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'

import Main from '@/pages/Main.vue'
import Login from '@/pages/Login.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'Main',
      component: Main,
      meta: { requires_auth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    }
  ]
})

router.beforeEach((to, from, next) => {
  const state = store.state;
  if (to.matched.some(record => record.meta.requires_auth)) {
    if (state.access_token) {
      next();
    } else {
      return next('/login');
    }
  } else {
    next();
  }
})



export default router
