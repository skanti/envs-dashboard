// persistent variables, rest is not saved in local storage
import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate';

const persisted_state = createPersistedState({ paths: [ 'logged_in', 'access_token', 'user' ] });
import axios from 'axios';

const store = createStore({
  plugins: [persisted_state],
  state: {
    logged_in: false,
    access_token: '',
    user: '',
  },
  mutations: {
    user(state, user) {
      state.user = user;
    },
    logout (state) {
      state.logged_in = false;
      state.access_token = '';
      state.user = '';
    },
    login (state, { access_token, user }) {
      state.logged_in = true;
      state.access_token = access_token;
      state.user = user;
    }
  },
  actions: {
    login ({ commit }, data) {
      return axios.post('/api/login', data).then(res => {
        commit('login', { access_token: res.data.access_token, user: 'xyz' });
        return Promise.resolve(res.data)
      }).catch(err => {
        return Promise.reject(err)
      })
    },
    logout ({ commit }) {
      commit('logout');
    }
  }
})

export default store;
