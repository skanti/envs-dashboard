<template>
  <div class='q-pa-md'>
  <q-card class='q-mx-auto' style='max-width:500px'>
    <q-card-section class="q-gutter-sm">
      <!-- input user-->
      <q-input v-model='user' label='Username' type='text' @input='$v.user.$touch()'
        :rules='[ v => !$v.user.$invalid || "Enter username" ]' lazy-rules outlined />
      <!-- input user-->

      <!-- input password-->
      <q-input v-model='password' label='Password' type='password' @input='$v.password.$touch()'
        :rules='[ v => $v.password.required || "Enter password" ]' lazy-rules outlined />
      <!-- input password-->

      <!-- Login button -->
      <q-btn label='Login' icon='fas fa-sign-in-alt' :loading='loading'
        color='primary' :disable='$v.$invalid'  @click='click_submit' no-caps />
      <!-- Login button -->

      <!-- Status messages -->
      <div v-if='status == "fail"' class='text-red-5'>
        Login gescheitert <i class='fas fa-times'></i>
      </div>
      <div v-if='status == "success"' class='text-green-5'>
        Login erfolgreich <i class='fas fa-check-circle'></i>
      </div>
      <!-- Status messages -->
    </q-card-section>

  </q-card>
</div>

</template>

<script>

import { required, minLength } from 'vuelidate/lib/validators';


export default {
  name: 'Login',
  components: { },
  data () {
    return {
      status: '',
      password: '',
      loading: false,
    }
  },
  computed: {
    user: {
      get() {
        return this.$store.state.user;
      },
      set(v) {
        this.$store.commit('user', v.toLowerCase());
      }
    }
  },
  created() {
  },
  methods: {
    async click_submit () {
      try {
        this.loading = true;
        let data = { user: this.user, password: this.password};
        await this.$store.dispatch('login', data);
        this.status = 'success';
        setTimeout(() => this.$router.push('/'), 200);
      } catch (err) { 
        console.log(err);
        this.status = 'fail';
      } finally {
        this.loading = false;
      }
    }
  },
  validations: {
    user: { required, minLength: minLength(3) },
    password: { required, minLength: minLength(6) },
  },
}
</script>

<style scoped lang='scss'>

</style>

