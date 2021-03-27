<template>
  <div class='q-ma-sm'>

    <!-- header -->
    <div class='q-ma-lg'>
      <div class='text-h5 text-center text-bold'> Envs Injector </div>
      <div class='row q-gutter-lg justify-center'>
        <q-btn :loading='loading' color='blue-5' :label='api_token' icon='fas fa-key' @click='click_copy(api_token)' no-caps outline/>
        <q-btn :loading='loading' color='red-5' label='Save' icon='fas fa-save' @click='click_save()' no-caps unelevated/>
      </div>
    </div>
    <!-- header -->

    <!-- env -->
    <div class='row q-gutter-sm no-wrap'>
      <div v-for='(env,i) in tree' :key="'env' + i">
        <q-card style='width:400px' flat bordered>
          <q-card-section class='q-py-sm'>
            <div class="row items-center no-wrap">
              <div class='col'>
                <q-input label='Environment Name (Example: production, zucc, test123)' :value='env.name' bg-color='blue-3'
                  debounce='300' @input='v => on_change({ env: env.name}, {env: v})' dense standout/>
              </div>
              <div class='col-auto'>
                <q-btn class='fit' color='blue-5' icon='fas fa-copy' @click="click_copy_env(env.name)"
                  flat no-caps/>
              </div>
            </div>
          </q-card-section>
          <q-card-section class='q-py-sm q-ml-lg' v-for='(tag,j) in env.tags' :key="'tag' + j">
            <q-input label='Tag Name (Example: MongoDB, Moosend, RabbitMQ)' :value='tag.name' bg-color='green-3'
              debounce='300' @input='v => on_change({ env: env.name, tag: tag.name}, {tag: v})' dense standout/>
            <div class='q-ml-lg q-mt-md'>
              <div class='row items-center q-col-gutter-sm q-mb-sm' v-for='(item,k) in tag.items' :key="'env' + i + 'tag' + j + 'item' + k">
                <div class='col-2'>
                  <q-btn class='fit' color='red-5' icon='fas fa-times' size='sm'
                    @click='click_remove_item({ env: env.name, tag: tag.name, key: item.key})' unelevated/>
                  </div>
                <div class='col-5'>
                  <q-input :value='item.key' bg-color='orange-2' debounce='300'
                    @input='v => on_change({ env: env.name, tag: tag.name, key: item.key}, {key: v.toUpperCase()})'
                    dense standout style='font-size:0.8em'/>
                </div>
                <div class='col-5'>
                  <q-input :value='item.val' bg-color='orange-2' debounce='300'
                    @input='v => on_change({ env: env.name, tag: tag.name, key: item.key}, {val: v})'
                    dense standout style='font-size:0.8em'/>
                </div>
              </div>
            </div>
            <div class='q-ml-lg'>
              <q-btn color='orange-5' label='New Item' icon='fas fa-plus' @click="click_new_item({ env: env.name, tag: tag.name, key: 'SOME_KEY'})"
                dense outline no-caps/>
            </div>
          </q-card-section>

          <q-card-section class='q-ml-lg'>
            <q-btn color='green-3' label='New Tag' icon='fas fa-plus' @click="click_new_item({ env: env.name, tag: 'TAG_NAME' })" dense outline no-caps/>
          </q-card-section>
        </q-card>
      </div>

      <div>
        <q-btn color='blue-5' label='New Environment' icon='fas fa-plus' @click="click_new_item({env: 'ENV_NAME'})" dense outline no-caps/>
      </div>

    </div>
    <!-- env -->
  </div>
</template>

<script>

import axios from 'axios';
import { copyToClipboard } from 'quasar'


export default {
  components: { },
  data: function() {
    return {
      loading: false,
      api_token: '',
      envs: [],
      envs_original: [],
    };
  },
  computed: {
    tree() {
      let env_list = new Set(this.envs.map(v => v.env));
      let tag_list = new Set(this.envs.map(v => v.tag));

      let tree = Array.from(env_list).map(e => {
        let tags = Array.from(tag_list).map(t => {
          let items = this.envs.filter(item => item.env == e && item.tag == t);
          items = [...new Map(items.map(item => [item['key'], item])).values()];
          return { name: t, items: items };
        });
        return { name: e, tags: tags };
      });

      return tree;
    }
  },
  created: function() {
    axios.defaults.headers.common['x-access-token'] = this.$store.state.access_token;
    this.sync();
  },
  methods: {
    async sync() {
      this.loading = true;
      let res = await axios.get('/api/api_token');
      this.api_token = res.data;

      res = await axios.get('/api/db');
      this.envs = res.data;
      this.envs_original = this.lodash.clone(this.envs);
      this.loading = false;
    },
    click_new_item(query) {
      let items = this.lodash.filter(this.envs, query);
      if (items.length > 0) {
      this.notify('New item already exists', 'Canceled!');
        return
      }
      let defaults = { env: 'ENV_NAME', tag: 'TAG_NAME', key: 'SOME_KEY', val: 'SOME_VALUE' };
      let item = Object.assign(defaults, query);
      this.envs.push(item);
    },
    click_copy_env(env) {
      let env_new = `${env}1`;
      let items = this.lodash.filter(this.envs, { env: env });
      for (let item of items) {
        let item_new = { ...item, env: env_new };
        this.envs.push(item_new);
      }
    },
    click_remove_item(query) {
      let idx = this.lodash.findIndex(this.envs, query);
      this.envs.splice(idx, 1);
    },
    on_change(query, update) {
      let items = this.lodash.filter(this.envs, query);
      for (let item of items) {
        Object.assign(item, update);
      }
    },
    async click_save() {
      await axios.post('/api/db', { data: this.envs });
      this.sync();
    },
    async click_copy(text) {
      copyToClipboard(text);
      this.notify(text, 'Copied!');
    },
    notify(message, caption) {
      this.$q.notify({ timeout: 1000, color: 'orange-5', icon: 'fas fa-comment-alt', caption: caption, message: message, position: 'bottom' })
    }
  }
}
</script>
