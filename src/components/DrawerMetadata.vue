<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <c-metadata :metadata="metadata" class="q-pa-md" />
  </q-drawer>
</template>

<script>
import cMetadata from './Metadata'
export default {
  name: 'DrawerMetadata',
  components: { cMetadata },
  data () {
    return {

    }
  },
  computed: {
    metadata () {
      if (!this.$store.state.books.book || !this.$store.state.books.book.manifest) return {}
      return this.$store.state.books.book.manifest.metadata
    },
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'metadata'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'metadata')
      }
    }
  }
}
</script>
