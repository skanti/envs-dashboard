import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './quasar'
import axios from 'axios';

import VueLodash from 'vue-lodash'
import lodash from 'lodash'
Vue.use(VueLodash, { lodash: lodash })

import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)

// -> axios
axios.interceptors.response.use(res => {
  return Promise.resolve(res);
}, err => {
  if (!!err.response && err.response.status === 401) {
      store.dispatch('logout');
  }
  return Promise.reject(err);
});

// <-

Vue.config.productionTip = false
new Vue({
  router,
  store,
  render: function (h) { return h(App) }
}).$mount('#app')
