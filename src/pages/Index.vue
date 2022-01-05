<template>
  <q-page>
    <div v-if="loading" class="absolute" style="z-index: 2; left: 50%; top: 50%; transform: translate(-50%, -50%)">
      <q-spinner-gears size="5rem" color="primary" />
    </div>
    <div class="q-pa-md row items-start q-gutter-md">
      <div class="full-width row">
        <h1 class="col-8 q-px-md q-my-none">{{$tc('local books', 2)}}</h1>
        <div class="col-4 text-right"><q-btn flat class="bg-primary text-white" rounded :label="$t('add book')" @click="importBook" /></div>
      </div>
      <q-card class="book-card" flat bordered v-for="(book, index) in books" :key="index" @click="openBook(book)">
        <div class="row">
          <div class="col-6">
            <img v-if="coverImages[book.id]" :src="coverImages[book.id]" class="thumb block" />
          </div>
          <div class="col-6 q-pa-sm" style="word-break: break-all">
            {{$ellipsis($store.getters['books/getBookTitle'](book), 60)}}
            <div v-if="book.revision && book.revision.description" style="font-size: 0.75rem" class="text-grey-7">{{book.revision.description}}</div>
            <c-metadata :metadata="book.manifest.metadata" :summary="true" class="q-pt-sm" />
          </div>
        </div>
        <q-btn icon="samepage:settings" class="absolute-bottom-right q-ma-sm" dense round flat @click.stop :loading="$store.getters['cloud/uploading'](book.id)">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item clickable v-close-popup @click.stop="deleteBook(book)">
                <q-item-section>{{$tc('delete')}}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="regenerateBook(book.id)">
                <q-item-section>{{$tc('regenerate')}}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="exportBook(book, true)">
                <q-item-section>{{$tc('export without scans')}}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click.stop="exportBook(book, false)">
                <q-item-section>{{$tc('export with scans')}}</q-item-section>
              </q-item>
              <q-item v-if="$store.getters['cloud/getUser']()" clickable v-close-popup @click.stop="uploadToCloud(book)">
                <q-item-section>{{$tc('upload to cloud')}}</q-item-section>
              </q-item>
              <q-item v-if="book.manifest && book.manifest.revision">
                <q-item-section>{{book.manifest && book.manifest.revision && ('Rev. ' + book.manifest.revision.substr(0, 6))}}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-card>
      <h1 class="full-width q-px-md">{{$tc('remote books', 2)}}</h1>
      <q-card v-if="!$store.getters['cloud/getUser']()" class="book-card" flat bordered>
        {{$t('log in to cloud')}}
        <q-input v-model="user.email" :label="$t('email')" />
        <q-input v-model="user.password" :label="$t('password')" type="password" />
        <q-btn @click="$store.dispatch('cloud/login', user)" :label="$t('login')" flat rounded class="q-mt-sm bg-grey-3 text-primary" />
      </q-card>
      <q-card class="book-card" flat bordered v-for="(book) in remoteBooks" :key="book.id" @click="showBookInfo(book)">
        <div class="row">
          <div class="col-6">
            <img v-if="book.cover" :src="book.cover" class="thumb block" />
          </div>
          <div class="col-6 q-pa-sm" style="word-break: break-all">
            {{$ellipsis(book.title, 60)}}
            <c-metadata v-if="book.manifest" :metadata="book.manifest.metadata" :summary="true" class="q-pt-sm" />
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import cRemoteBookInfo from '../components/RemoteBookInfo'
import cMetadata from '../components/Metadata'
export default {
  name: 'PageIndex',
  components: {
    cMetadata
  },
  data () {
    return {
      loading: false,
      coverImages: {},
      books: [],
      user: {
        email: '',
        password: ''
      }
    }
  },
  computed: {
    remoteBooks () {
      console.log(this.$store.getters['cloud/getBooks']())
      return this.$store.getters['cloud/getBooks']()
    }
  },
  created () {
    if (!this.$store.state.settings.introShown) {
      this.$router.push({ name: 'intro' })
      return false
    }
    this.$store.commit('books/setTitle', 'title')
    this.$store.commit('books/setButtons', [
      { icon: 'samepage:menu', click: () => { this.$store.dispatch('books/toggleDrawer', 'menu') } }
    ])
    this.$store.dispatch('books/getBooks').then((books) => {
      console.log(books)
      this.books = []
      /* if (!books['books/max-havelaar-12345']) {
        this.importBook('books/max-havelaar.zip')
      } */
      Object.values(books).forEach(book => {
        this.$store.dispatch('books/getCoverImage', book).then((blob) => {
          if (blob) {
            this.coverImages = { ...this.coverImages, [book.id]: window.URL.createObjectURL(blob) }
          }
          this.books.push(book)
        })
      })
    })
    /* if (!this.$store.state.books.books['max-havelaar-1234']) {
      this.regenerateBook('max-havelaar-1234')
    }
    if (!this.$store.state.books.books['alice-in-wonderland-1234']) {
      this.regenerateBook('alice-in-wonderland-1234')
    } */
  },
  methods: {
    uploadToCloud (book) {
      const user = this.$store.getters['cloud/getUser']()
      if (!user.displayName) {
        this.$q.dialog({
          title: this.$t('display name needed'),
          message: this.$t('please enter your display name'),
          persistent: true,
          prompt: {
            model: '',
            type: 'text'
          },
          cancel: true
        }).onOk(name => {
          return this.$store.dispatch('cloud/setName', name).then(() => {
            return this.continueUpload(book)
          })
        })
      } else {
        return this.continueUpload(book)
      }
    },
    continueUpload (book) {
      this.$q.dialog({
        title: this.$t('description'),
        message: this.$t('please enter a description to accompany your revision'),
        persistent: true,
        prompt: {
          model: '',
          type: 'textarea'
        },
        cancel: true
      }).onOk(description => {
        return this.$store.dispatch('cloud/upload', { ...book, description: description })
      })
    },
    regenerateBook (bookId) {
      this.loading = true
      setTimeout(() => {
        this.$addBook(bookId).then(() => {
          this.loading = false
          console.log('finished')
        })
      }, 500)
    },
    exportBook (book, excludeScans) {
      this.loading = true
      setTimeout(() => {
        return this.$store.dispatch('books/getBook', book.id).then(book => {
          return this.$exportBook(book, excludeScans)
        }).then(() => {
          this.loading = false
          return true
        })
      }, 500)
    },
    importBook (e) {
      const input = document.createElement('input')
      input.type = 'file'
      input.onchange = (e) => {
        this.loading = true
        setTimeout(() => {
          let book = false
          this.$importBook(input).then((generatedBook) => {
            book = generatedBook
            console.log(book)
            return this.$store.dispatch('books/getCoverImage', book)
          }).then((blob) => {
            if (blob) {
              this.coverImages = { ...this.coverImages, [book.id]: window.URL.createObjectURL(blob) }
            }
            this.books.push(book)
            this.loading = false
          })
        }, 500)
      }
      input.click()
    },
    deleteBook (book) {
      console.log(book)
      this.$store.dispatch('books/deleteBook', book.id).then(() => {
        this.books = this.books.filter(b => book.id !== b.id)
      })
    },
    openBook (book) {
      this.$router.push({ name: 'book', params: { book: book.id } })
    },
    showBookInfo (book) {
      this.$q.dialog({
        component: cRemoteBookInfo,
        parent: this,
        persistent: true,
        book: book
      }).onOk(book => {
        this.$store.dispatch('books/getCoverImage', book).then((blob) => {
          if (blob) {
            this.coverImages = { ...this.coverImages, [book.id]: window.URL.createObjectURL(blob) }
          }
          this.books.push(book)
        })
      })
    }
  }
}
</script>
