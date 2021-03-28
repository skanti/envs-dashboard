import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate';

const dataState = createPersistedState({});
Vue.use(Vuex)

import axios from 'axios';

export default new Vuex.Store({
  plugins: [dataState],
  state: {
    user: '',
    access_token: '',
  },
  mutations: {
    user(state, user) {
      state.user = user;
    },
    access_token(state, access_token) {
      state.access_token = access_token;
    }
  },
  actions: {
    login({ commit }, data) {
      return axios.post('/api/login', data).then(res => {
        commit('access_token', res.data.access_token);
        return Promise.resolve(res.data);
      }).catch(err => {
        return Promise.reject(err);
      });
    },
    logout({commit}) {
      commit('access_token', '');
      commit('user', '');
    }
  },
})
