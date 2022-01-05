<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
    @click="openBookmark({})"
  >
    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label>
            <q-btn :label="$t('add bookmark')" flat rounded class="text-primary bg-grey-3" @click.stop="addBookmark" />
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-btn icon="samepage:sort" round flat class="bg-grey-3 text-primary" @click="$q.notify($t('not implemented yet'))" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-for="(bookmark, index) in bookmarks" :key="index">
        <q-item-section @click.stop="openBookmark(bookmark)">
          <q-item-label class="row text-button text-uppercase">
            <div class="col">
              {{bookmark.text}}
            </div>
            <div class="col-auto">
              {{$formatDate(bookmark.date)}}
            </div>
          </q-item-label>
          <q-item-label caption class="row">
            <div class="col q-pt-sm">
              {{$t('page', { page: bookmark.page })}}
            </div>
            <div class="col-auto">
              <div class="text-no-wrap flex items-center">
                <div class="color inline-block q-mr-sm" :class="!bookmark.color && 'color-none'" @click.stop :style="'background-color: ' + (bookmark.color || '')">
                  <q-popup-edit v-model="bookmark.color" :ref="'color-' + bookmark.id">
                    <q-select stack-label :label="$tc('colors', 1)" :value="bookmark.color" @input="color => updateBookmark({ ...bookmark, color: color }, bookmark)" use-input map-options emit-value @new-value="addColor" :options="colors">
                      <template v-slot:option="scope">
                        <q-item
                          v-bind="scope.itemProps"
                          v-on="scope.itemEvents"
                        >
                          <q-item-section>
                            <q-item-label>{{scope.opt.label}}</q-item-label>
                          </q-item-section>
                          <q-item-section avatar>
                            <q-icon name="samepage:trash" class="text-primary" @click.stop="$store.commit('settings/deleteColor', scope.opt)" round flat dense />
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                  </q-popup-edit>
                </div>
                <q-btn icon="samepage:trash" @click.stop="deleteBookmark(bookmark)" flat round class="text-primary" />
              </div>
            </div>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
import cAddBookmarkDialog from '../components/AddBookmarkDialog'
import { uid } from 'quasar'
export default {
  name: 'DrawerBookmarks',
  computed: {
    bookmarks: {
      get () {
        return this.$clone((this.$store.state.books.book && this.$store.state.books.book.manifest && this.$store.state.books.book.manifest.bookmarks) || [])
      },
      set (colors) {
        console.log(colors)
      }
    },
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'bookmarks'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'bookmarks')
      }
    },
    colors () {
      return this.$store.state.settings.colors.map(color => {
        return {
          label: this.$tc(color),
          value: color
        }
      })
    }
  },
  watch: {
    drawerOpen: function (isOpen) {
      if (isOpen) {
        this.$store.commit('books/showBookmarks', this.bookmarks)
      } else {
        this.$store.commit('books/showBookmarks', [])
      }
    }
  },
  methods: {
    deleteBookmark (bookmark) {
      this.$store.dispatch('books/deleteBookmark', { bookmark: bookmark })
    },
    openBookmark (bookmark) {
      console.log(bookmark)
      this.$store.commit('books/setBookmark', bookmark)
    },
    updateBookmark (bookmark) {
      console.log(bookmark, this.$store.state.books.book.id, this.$refs)
      if (this.$refs['color-' + bookmark.id] && this.$refs['color-' + bookmark.id][0]) this.$refs['color-' + bookmark.id][0].hide()
      this.$store.dispatch('books/setBookmark', { bookId: this.$store.state.books.book.id, bookmark: bookmark })
    },
    addColor (color, done) {
      console.log(color)
      this.$store.commit('settings/addColor', color)
      done(color, 'add-unique')
    },
    addBookmark () {
      console.log(this.$store.state)
      this.$q.dialog({
        component: cAddBookmarkDialog,
        parent: this,
        persistent: true,
        page: this.$store.state.books.book.pages[this.$store.state.books.page].nr
      }).onOk(bookmark => {
        bookmark.id = uid()
        bookmark.date = new Date().toISOString()
        this.$store.dispatch('books/setBookmark', { bookmark: bookmark, bookId: this.$store.state.books.book.id }).then(() => {
          this.$store.commit('books/setBookmark', bookmark)
        })
      })
    }
  }
}
</script>
