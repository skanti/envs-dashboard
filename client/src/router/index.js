import { createWebHistory, createRouter } from 'vue-router';
import store from '@/store'

import Main from '@/pages/Main.vue';
import Login from '@/pages/Login.vue';


const routes = [
  {
    path: '/',
    component: Main,
    meta: { requires_auth: true },
  },
  {
    path: '/login',
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const state = store.state;
  const logged_in = state.logged_in && (state.access_token != '');

  // redirect to auth page if not logged in
  if (to.matched.some(record => record.meta.requires_auth)) {
    if (logged_in) {
      return next();
    } else {
      return next('/login')
    }
  }

  // fallback
  next()
})


export default router;

