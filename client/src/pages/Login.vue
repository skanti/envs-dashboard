<template>
  <div class='q-pa-md'>
  <q-card class='q-mx-auto' style='max-width:500px' v-on:keyup.enter='click_submit'>
    <q-card-section class='q-gutter-sm'>
      <!-- input user-->
      <q-input v-model='user' label='Username' type='text' lazy-rules outlined />
      <!-- input user-->

      <!-- input password-->
      <q-input v-model='password' label='Password' type='password'
        :rules='[ val => yup.reach(v$, "password").isValidSync(val) || "Required field"]' lazy-rules outlined />
      <!-- input password-->

      <!-- Status messages -->
      <div v-if='status == "fail"' class='text-red-5'>
        Login gescheitert <i class='times'></i>
      </div>
      <div v-if='status == "success"' class='text-green-5'>
        Login erfolgreich <i class='check_circle'></i>
      </div>
      <!-- Status messages -->

    </q-card-section>

    <q-card-actions align='center'>
      <!-- Login button -->
      <q-btn label='Login' icon='login' :loading='loading'
        color='primary' :disable='false'  @click='click_submit' no-caps />
      <!-- Login button -->
    </q-card-actions>

  </q-card>
</div>

</template>

<script>

import * as yup from 'yup';

export default {
  name: 'Login',
  components: { },
  setup() {
    const v$ = yup.object().shape({
      name: yup.string().required(),
      password: yup.string().required(),
    });
    return {
      yup: yup,
      v$: v$
    };
  },
  data () {
    return {
      status: '',
      password: '',
      loading: false
    }
  },
  computed: {
    user: {
      get () {
        return this.$store.state.user
      },
      set (v) {
        this.$store.commit('user', v.toLowerCase())
      }
    }
  },
  methods: {
    async click_submit () {
      try {
        this.loading = true
        const data = { user: this.user, password: this.password }
        await this.$store.dispatch('login', data)
        this.status = 'success'
        setTimeout(() => this.$router.push('/'), 200)
      } catch (err) {
        console.log(err)
        this.status = 'fail'
      } finally {
        this.loading = false
      }
    }
  },
}
</script>

<style scoped lang='scss'>

</style>
