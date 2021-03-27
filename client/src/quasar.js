import Vue from 'vue'

import './styles/quasar.scss'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'
import iconSet from 'quasar/icon-set/fontawesome-v5.js'
import { Quasar, Notify } from 'quasar'

Vue.use(Quasar, {
  config: {},
  plugins: {
    Notify
  },
  iconSet: iconSet
})
