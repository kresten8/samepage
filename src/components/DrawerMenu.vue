<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <q-list>
      <q-item :to="{ name: 'intro' }" clickable>
        <q-item-section>
          {{$t('intro page')}}
        </q-item-section>
      </q-item>
      <q-item clickable>
        <q-item-section>
          {{$store.getters['settings/language']()}}
        </q-item-section>
        <q-item-section avatar>
          <q-icon name="las la-angle-down" :class="showLanguage && 'rotate-180'" style="transition: all 0.5s" />
        </q-item-section>
        <q-menu auto-close v-model="showLanguage">
          <q-list style="min-width: 300px">
            <q-item @click="$store.commit('settings/setLanguage', language.id)" clickable v-for="language in $store.getters['settings/languages']()" :key="language.id">
              <q-item-section>{{language.label}}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
      <q-item>
        <q-item-section>
          {{$version()}}
        </q-item-section>
      </q-item>
      <q-item v-if="$store.getters['cloud/getUser']()" clickable @click="$store.dispatch('cloud/logout')">
        <q-item-section>
          {{$t('logout')}}
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
export default {
  name: 'DrawerMenu',
  data () {
    return {
      showLanguage: false
    }
  },
  computed: {
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'menu'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'menu')
      }
    }
  }
}
</script>
