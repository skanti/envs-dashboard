<template>
  <div class='q-ma-sm'>

    <!-- header -->
    <div class='q-ma-lg'>
      <div class='text-h5 text-center text-bold'> Envs Dashboard </div>
      <div class='row q-gutter-lg justify-center'>
        <q-btn color='dark' label='Logout' icon='logout' @click='click_logout()' no-caps unelevated />
        <q-btn :loading='loading' color='blue-5' :label='api_token' icon='vpn_key' @click='click_copy(api_token)' no-caps outline/>
        <q-btn :loading='loading' color='red-5' label='Save' icon='save' @click='click_save()' no-caps unelevated/>
      </div>
    </div>
    <!-- header -->

    <!-- env -->
    <div class='row q-col-gutter-sm'>
      <div class='col-12 col-sm-4' v-for='(env,i) in make_tree()' :key="'env' + i">
        <q-card flat bordered>
          <q-card-section class='q-py-sm'>
            <div class='row items-center no-wrap'>
              <div class='col'>
                <q-input label='Environment Name (Example: jenkins, zucc, hotfix)'
                  :model-value='env.name' bg-color='blue-3' input-class='text-dark' debounce='300'
                  @update:model-value='v => on_change({ env: env.name}, {env: v})' dense standout/>
              </div>
              <div class='col-auto'>
                <q-btn class='fit' color='blue-5' icon='content_copy' @click='click_copy_env(env.name)'
                  flat no-caps/>
              </div>
            </div>
          </q-card-section>
          <q-card-section class='q-py-sm q-ml-md' v-for='(tag,j) in env.tags' :key="'tag' + j">
            <q-input label='Tag Name (Example: mongodb, moosend, rabbitmq)'
              :model-value='tag.name' bg-color='green-3' input-class='text-dark' debounce='300'
              @update:model-value='v => on_change({ env: env.name, tag: tag.name}, {tag: v.toLowerCase()})' dense standout/>
            <div class='q-ml-md q-mt-md'>
              <div class='row items-center q-col-gutter-xs q-mb-xs' v-for='(item,k) in tag.items' :key="'env' + i + 'tag' + j + 'item' + k">
                <div class='col-auto'>
                  <q-btn color='red-5' icon='delete_outline' size='sm'
                    @click='click_remove_item({ id: item.id })' dense unelevated/>
                  </div>
                <div class='col-5'>
                  <q-input :model-value='item.key' bg-color='orange-2' input-class='text-dark' debounce='300'
                    @update:model-value='v => on_change({ id: item.id }, {key: v.toUpperCase()})'
                    style='font-size:0.8em' dense standout>
                    <template v-slot:append>
                      <q-btn size='sm' icon='content_copy' @click='click_copy(item.key)' round dense flat/>
                    </template>
                    <template v-if='is_key_duplicate({env: env.name, key: item.key})' v-slot:after>
                      <q-icon color='red-5' name='warning' />
                    </template>
                  </q-input>
                </div>
                <div class='col-6'>
                  <q-input :model-value='item.val' bg-color='orange-2' debounce='300' input-class='text-dark'
                    @update:model-value='v => on_change({ id: item.id }, {val: v})'
                    style='font-size:0.8em' dense standout >
                    <template v-slot:append>
                      <q-btn size='sm' icon='content_copy' @click='click_copy(item.val)' round dense flat/>
                    </template>
                  </q-input>
                </div>
              </div>
            </div>
            <div class='q-ml-md'>
              <q-btn color='orange-5' label='New Item' icon='add' @click="click_new_item({ env: env.name, tag: tag.name, key: 'SOME_KEY'})"
                dense outline no-caps/>
            </div>
          </q-card-section>

          <q-card-section class='q-ml-md'>
            <q-btn color='green-3' label='New Tag' icon='add' @click="click_new_item({ env: env.name, tag: 'TAG_NAME' })" dense outline no-caps/>
          </q-card-section>
        </q-card>
      </div>

      <div class='col-12-sm col-4'>
        <q-btn color='blue-5' label='New Environment' icon='add' @click="click_new_item({env: 'ENV_NAME'})" dense outline no-caps/>
      </div>

    </div>
    <!-- env -->
  </div>
</template>

<script>

import axios from 'axios'
import { copyToClipboard } from 'quasar'
import lodash from 'lodash';


export default {
  components: { },
  data () {
    return {
      loading: false,
      api_token: '',
      error: false,
      envs: [],
      envs_original: []
    }
  },
  created () {
    axios.defaults.headers.common['x-access-token'] = this.$store.state.access_token
    axios.interceptors.response.use(res => {
      return res;
    }, err => {
      if (err.response != undefined && err.response.status === 401) {
        this.$store.dispatch('logout');
        this.notify('Session expired.', 'Logging out...')
        setTimeout(() => this.$router.go(), 3000);
        return Promise.reject(err);
      }
    });

    this.sync()
  },
  methods: {
    make_tree () {
      const env_list = new Set(this.envs.map(v => v.env))
      const tag_list = new Set(this.envs.map(v => v.tag))

      const tree = Array.from(env_list).map(e => {
        const tags = Array.from(tag_list).map(t => {
          const items = this.envs.filter(item => item.env == e && item.tag == t)
          return { name: t, items: items }
        })
        return { name: e, tags: tags }
      })

      return tree
    },
    async sync () {
      this.loading = true
      let res = await axios.get('/api/api_token')
      this.api_token = res.data

      res = await axios.get('/api/db')
      this.envs = res.data
      this.envs_original = lodash.clone(this.envs)
      this.loading = false
    },
    generate_new_id() {
      const ids = new Set(this.envs.map(x => x.id));
      for (let i = 0; i < 1000; i++) {
        const id = Math.random().toString(36).slice(2)
        if (!ids.has(id)) {
          return id;
        }
      }
      throw Error('Could not generate new ID');
    },
    click_new_item (query) {
      const items = lodash.filter(this.envs, query)
      if (items.length > 0) {
        this.notify('New item already exists', 'Canceled!')
        return
      }
      const id = this.generate_new_id();
      const vals = { id: id, env: 'ENV_NAME', tag: 'TAG_NAME', key: 'SOME_KEY', val: 'SOME_VALUE' }
      const item = Object.assign(vals, query)
      this.envs.push(item)
    },
    click_copy_env (env) {
      const env_new = `${env}1`
      const items = lodash.filter(this.envs, { env: env })
      for (const item of items) {
        const item_new = { ...item, env: env_new }
        this.envs.push(item_new)
      }
    },
    click_remove_item (query) {
      const idx = lodash.findIndex(this.envs, query)
      this.envs.splice(idx, 1)
    },
    on_change (query, update) {
      const items = lodash.filter(this.envs, query)
      for (const item of items) {
        Object.assign(item, update)
      }
    },
    is_key_duplicate (query) {
      const items = lodash.filter(this.envs, query)
      return items.length > 1
    },
    async click_save () {
      this.loading = true
      await axios.post('/api/db', { data: this.envs })
      await this.sync()
      this.notify(null, 'Saved!')
      this.loading = false
    },
    async click_copy (text) {
      copyToClipboard(text)
      this.notify(text, 'Copied!')
    },
    notify (message, caption) {
      this.$q.notify({ timeout: 1000, color: 'orange-5', icon: 'chat', caption: caption, message: message, position: 'bottom' })
    },
    click_logout () {
      this.$store.dispatch('logout')
      this.$router.go()
    }
  }
}
</script>
