<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
    @click="openNote({})"
  >
    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label>
            <q-btn :ripple="false" :label="$t('select text to create annotation')" no-caps flat class="text-primary text-left" dense align="left" />
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-btn icon="samepage:sort" round flat class="bg-grey-3 text-primary" @click="$q.notify($t('not implemented yet'))" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-for="(note, index) in notes" :key="index">
        <q-item-section @click.stop="openNote(note)">
          <q-item-label class="row text-button text-uppercase">
            <div class="col">
              {{note.text}}
            </div>
            <div class="col-auto">
              {{$formatDate(note.date)}}
            </div>
          </q-item-label>
          <q-item-label caption class="row">
            <div class="col q-pt-sm">
              {{note.selection}}
            </div>
            <div class="col-auto">
              <div class="text-no-wrap flex items-center">
                <div class="color inline-block q-mr-sm" :class="!note.color && 'color-none'" @click.stop :style="'background-color: ' + (note.color || '')">
                  <q-popup-edit v-model="note.color" :ref="'color-' + note.id">
                    <q-select stack-label :label="$tc('colors', 1)" :value="note.color" @input="color => updateNote({ ...note, color: color }, note)" use-input map-options emit-value @new-value="addColor" :options="colors">
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
                <q-btn icon="samepage:trash" @click.stop="deleteNote(note)" flat round class="text-primary" />
                <q-btn icon="las la-share" :loading="sharing === note.id" @click.stop="shareNote(note)" flat round class="text-primary" />
              </div>
            </div>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
import cShareAnnotationDialog from './ShareAnnotationDialog'
export default {
  name: 'DrawerAnnotations',
  data () {
    return {
      sharing: false
    }
  },
  computed: {
    notes: {
      get () {
        return this.$clone((this.$store.state.books.book && this.$store.state.books.book.manifest && this.$store.state.books.book.manifest.annotations) || [])
      },
      set (colors) {
        console.log(colors)
      }
    },
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'annotations'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'annotations')
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
        this.$store.commit('books/showAnnotations', this.notes)
      } else {
        this.$store.commit('books/showAnnotations', [])
      }
    }
  },
  methods: {
    deleteNote (annotation) {
      this.$store.dispatch('books/deleteAnnotation', { annotation: annotation })
    },
    shareNote (annotation) {
      this.sharing = annotation.id
      this.$store.dispatch('books/shareAnnotation', { annotation: annotation }).then(annotation => {
        this.$q.dialog({
          component: cShareAnnotationDialog,
          parent: this,
          annotation: annotation
        })
        this.sharing = false
      })
    },
    openNote (note) {
      console.log(note)
      this.$store.commit('books/setAnnotation', note)
      // this.$router.push({ name: 'book', params: { book: this.$store.state.books.book.id, chapter: chapter.href.replace('#', '') } })
    },
    updateNote (note) {
      console.log(note, this.$store.state.books.book.id, this.$refs)
      if (this.$refs['color-' + note.id] && this.$refs['color-' + note.id][0]) this.$refs['color-' + note.id][0].hide()
      this.$store.dispatch('books/setAnnotation', { bookId: this.$store.state.books.book.id, annotation: note })
    },
    addColor (color, done) {
      console.log(color)
      this.$store.commit('settings/addColor', color)
      done(color, 'add-unique')
    }
  }
}
</script>
