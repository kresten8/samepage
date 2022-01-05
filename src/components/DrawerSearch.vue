<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <q-list separator>
      <q-item>
        <q-item-section>
          <q-item-label>
            <q-input v-model="searchString" :placeholder="$t('type query')" clearable @clear="search" @keypress.enter="search" />
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn :label="$t('search')" unelevated color="primary" @click="search" />
        </q-item-section>
      </q-item>
      <q-item v-for="(result, index) in searchResults" :key="index" clickable @click.native="openSearch(result)">
        <q-item-section>
          <q-item-label>
            {{result.excerpt}}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
export default {
  name: 'DrawerSearch',
  data () {
    return {
      searchString: '',
      searchResults: []
    }
  },
  computed: {
    book () {
      return JSON.parse(JSON.stringify(this.$store.state.books.book))
    },
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'search'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'search')
      }
    }
  },
  methods: {
    openSearch (result) {
      this.$store.commit('books/setSearch', result)
    },
    search () {
      console.log(this.book)
      this.searchResults = []
      if (!this.searchString) return false
      var searchString = this.searchString.toLowerCase()
      this.book.pages.forEach((page, index) => {
        var element = document.createElement('div')
        element.innerHTML = page.html
        var matches = element.innerText.split(new RegExp(`(?=${searchString})`, 'ig'))
        if (matches.length > 1) {
          for (let i = 0; i < matches.length - 1; i++) {
            this.searchResults.push({
              search: searchString,
              excerpt: matches[i].substr(matches[i].length - 100) + matches[i + 1].substr(0, 100),
              fragment: matches[i + 1].substr(0, 100),
              page: page.nr,
              index: index
            })
          }
        }
      })
    }
  }
}
</script>
