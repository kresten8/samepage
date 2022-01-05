<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <q-list separator>
      <q-item v-for="(menuitem, index) in menu" :key="index" clickable @click.native="menuitem.click" class="text-primary text-weight-bold">
        <q-item-section>
          {{menuitem.label || menuitem.tooltip}}
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
export default {
  name: 'DrawerMobileMenu',
  props: ['menu'],
  computed: {
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'mobilemenu'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'mobilemenu')
      }
    }
  }
}
</script>
