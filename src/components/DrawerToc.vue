<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <q-list>
      <q-item clickable v-for="(chapter, index) in chapters" :key="index" @click.native="openChapter(chapter)">
        <q-item-section>
          <q-item-label>
            {{chapter.title}}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
export default {
  name: 'DrawerToc',
  computed: {
    chapters () {
      return this.$clone((this.$store.state.books.book && this.$store.state.books.book.manifest && this.$store.state.books.book.manifest.toc) || []).sort((a, b) => a.pageIndex - b.pageIndex)
    },
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'toc'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'toc')
      }
    }
  },
  methods: {
    openChapter (chapter) {
      console.log(chapter)
      this.$router.push({ name: 'book', params: { book: this.$store.state.books.book.id, chapter: chapter.href.replace('#', '') } })
    }
  }
}
</script>
