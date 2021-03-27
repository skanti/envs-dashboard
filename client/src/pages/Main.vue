<template>
  <div class='q-ma-sm'>

    <!-- header -->
    <div class='text-center text-h5 text-bold q-ma-lg'> Envs Injector </div>
    <!-- header -->

    <!-- env -->
    <div class='row q-gutter-sm'>
      <div v-for='(env,i) in envs' :key='"env" + i'>
        <q-card style='width:400px' flat bordered>
          <q-card-section>
            <q-input v-model="env.env" bg-color='blue-3' hint='Example: production, aavetisyan, test123' dense standout/>
          </q-card-section>
          <q-card-section class='q-ml-lg' v-for='(tag,j) in env.tags' :key='"tag" + j'>
            <q-input v-model="tag.tag" bg-color='green-3' hint='Example: MongoDB, Moosend, RabbitMQ' dense standout/>
            <div class='q-ml-lg q-mt-md'>
              <div class='row q-col-gutter-sm q-mb-sm' v-for='(item,k) in tag.items' :key='"env" + i + "tag" + j + "item" + k'>
                <div class='col-6'>
                  <q-input v-model="item.key" bg-color='orange-2' dense standout/>
                </div>
                <div class='col-6'>
                  <q-input v-model="item.val" bg-color='orange-2' dense standout/>
                </div>
              </div>
            </div>
            <div class='q-ml-lg q-mt-md'>
              <q-btn color='orange-5' label='New Item' icon='fas fa-plus' @click='click_new_item(env.env, tag.tag)'
                dense outline no-caps/>
            </div>
          </q-card-section>
          <q-card-section class='q-ml-lg'>
            <q-btn color='green-3' label='New Tag' icon='fas fa-plus' @click='click_new_tag(env.env)' dense outline no-caps/>
          </q-card-section>

          <q-separator />
          <q-card-actions align='right'>
            <q-btn class='q-mb-sm text-center' color='red-5' label='Save' icon='fas fa-save' @click='click_save(env.name)' no-caps unelevated/>
          </q-card-actions>
        </q-card>
      </div>

      <q-card flat bordered>
        <q-card-section>
          <q-btn color='blue-5' label='New Environment' icon='fas fa-plus' @click='click_new_environment' dense outline no-caps/>
        </q-card-section>
      </q-card>

    </div>
    <!-- env -->
  </div>
</template>

<script>

import axios from 'axios';
//import { Query } from 'query';


export default {
  components: { },
  data: function() {
    return {
      envs: [ ],
    };
  },
  computed: {
  },
  created: function() {
    axios.defaults.headers.common['x-access-token'] = this.$store.state.access_token;
    this.sync();
  },
  beforeDestroy: function () {
  },
  methods: {
    sync() {
      axios.get("/api/db").then(res => {
        console.log(res.data);
        this.envs = res.data;
      });

    },
    click_new_environment() {
      const env = 'ENV_NAME';
      let exists = this.lodash.filter(this.envs, { env: env });
      if (exists.length > 0)
        return;
      let item = {
        env: 'ENV_NAME',
        tags: [{
          tag: 'TAG_NAME', items: [{ key: 'SOME_KEY', val: 'SOME_VALUE' }]
        }]
      };
      this.envs.push(item);
    },
    click_new_tag(env) {
      const tag = 'TAG_NAME';
      let exists = this.lodash.filter(this.envs, { env: env, tags: [{tag: tag }] });
      if (exists.length > 0)
        return;
      let item = { env: env,  tag: 'TAG_NAME', key: 'SOME_KEY', val: 'SOME_VALUE' };
      this.envs.push(item);
    },
    click_new_item(env, tag) {
      const key = 'SOME_KEY';
      let exists = this.lodash.filter(this.envs, { env: env,
        tags: [ {tag: tag, items: [{key: key}] }] });
      if (exists.length > 0)
        return;
      let item = { env: env,  tag: tag, key: 'SOME_KEY', val: 'SOME_VALUE' };
      this.envs.push(item);
    },
    click_save(env) {
      let items = this.envs.filter(item => item.name === env);
      console.log(items);
      //axios.post("/api/db", { env: env, data: items }).then(res => {
      //  console.log(res.data);
      //})
    }
  }
}
</script>
