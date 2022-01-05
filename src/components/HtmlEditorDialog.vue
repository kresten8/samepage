<template>
  <q-dialog persistent content-class="html-editor-dialog editor-dialog" ref="dialog" @hide="onDialogHide">
    <div class="bg-white">
      <q-toolbar class="text-weight-bold justify-between q-pr-sm">
        <div>{{$t('html editor')}}</div>
        <q-toolbar-title>
        </q-toolbar-title>
        <div>
          <q-btn :label="$t('save')" class="text-primary bg-grey-3 q-mr-sm" flat rounded @click="save" />
          <q-btn icon="samepage:cross" class="text-primary bg-grey-3" flat round @click="hide" />
        </div>
      </q-toolbar>
      <div>
        <q-splitter
          v-model="split1"
          style="height: 100%"
        >
          <template v-slot:before>
            <div class="editor" :style="'text-align-last: ' + (settings.textAlignLast ? 'justify' : 'inherit') + '; text-align: ' + settings.textAlign + '; width: ' + settings.fixedWidth + 'rem; font-size: ' + settings.fixedFontSize + 'rem; letter-spacing: ' + settings.fixedLetterSpacing + 'em; line-height: ' + settings.fixedLineHeight">
              <q-editor
                ref="editor"
                v-model="html"
                :definitions="{
                  break: {
                    tip: $t('line break'),
                    icon: settings.textAlignLast ? 'samepage:arrow-left' : 'las la-arrows-alt-h',
                    handler: lineBreak
                  }
                }"
                :toolbar="[
                  ['left', 'center', 'right', 'justify', 'break'],
                  ['bold', 'italic', 'strike', 'underline']
                ]"
              />
            </div>
          </template>
          <template v-slot:separator>
            <q-avatar color="grey-3" text-color="primary" size="40px" icon="drag_indicator" />
          </template>
          <template v-slot:after>
            <q-splitter
              v-model="split2"
              style="height: 100%"
            >
              <template v-slot:before>
                <q-input type="textarea" style="white-space: pre-line; height: 100%" v-model="html" borderless />
              </template>
              <template v-slot:separator>
                <q-avatar color="grey-3" text-color="primary" size="40px" icon="drag_indicator" />
              </template>
              <template v-slot:after>
                <div ref="previewScans" class="preview preview-scans">
                  <img :src="image" :style="scanStyle" v-if="image" />
                </div>
              </template>
            </q-splitter>
          </template>
        </q-splitter>
      </div>
    </div>
  </q-dialog>
</template>

<script>
export default {
  props: ['content', 'scan', 'book'],
  data () {
    return {
      loading: false,
      split1: 33,
      split2: 50,
      html: '',
      page: '',
      htmlObject: null,
      scale: 1,
      image: ''
    }
  },
  created () {
    this.htmlObject = document.createElement('div')
    this.loadContent(this.content)
    this.loadScan(this.scan)
    this.$root.$on('currentHTML', currentHTML => {
      this.loadContent('' + currentHTML)
    })
    this.$root.$on('pageImage', pageImage => {
      this.loadScan('' + pageImage)
    })
  },
  beforeDestroy () {
    this.$root.$off('currentHTML', currentHTML => {
      this.loadContent('' + currentHTML)
    })
    this.$root.$off('pageImage', pageImage => {
      this.loadScan('' + pageImage)
    })
  },
  computed: {
    settings () {
      const settings = this.$store.getters['books/getSettings']()
      settings.fixedWidth = this.scale * settings.fixedWidth
      settings.fixedFontSize = this.scale * settings.fixedFontSize
      return settings
    },
    scanStyle () {
      const style = this.book.manifest.style && this.book.manifest.style.scan
      if (!style) return ''
      const filters = []
      for (const filter in (style || [])) {
        if (typeof style[filter].unit !== 'undefined') {
          filters.push(filter + '(' + style[filter].value + style[filter].unit + ')')
        }
      }
      return 'transform: rotate(' + (style.angle || 0) + 'deg) translate (-50%, -50%); height: ' + (10000 / (style.height || 100)) + '%; filter: ' + filters.join(' ')
    }
  },
  methods: {
    loadScan (image) {
      this.image = image
    },
    loadContent (content) {
      this.htmlObject.innerHTML = '' + content
      console.log(this.htmlObject.innerHTML)
      const pagenumbers = this.htmlObject.querySelectorAll('.pagenumber')
      for (let i = 0; i < pagenumbers.length; i++) {
        pagenumbers[i].parentNode.removeChild(pagenumbers[i])
      }
      const actualHTML = this.htmlObject.querySelectorAll('[data-page]')
      this.page = actualHTML[actualHTML.length - 1].getAttribute('data-page')
      this.html = actualHTML[actualHTML.length - 1].innerHTML.trim()
      if (this.html === '' && actualHTML.length === 1) {
        this.html = this.htmlObject.querySelector('[data-page] + div').innerHTML.trim()
      }
      console.log(this.html, this.page)
      // this.htmlObject.childNodes[0].removeChild(this.htmlObject.childNodes[0].childNodes[0])
      // this.html = this.htmlObject.childNodes[0].innerHTML
    },
    show () {
      this.$refs.dialog.show()
    },
    hide () {
      this.$refs.dialog.hide()
    },
    onDialogHide () {
      this.$store.commit('settings/updateSettings', { htmlEditor: false })
      this.$emit('hide')
    },
    lineBreak (val) {
      const editor = this.$refs.editor
      console.log(editor.caret)
      if (editor.caret.selection.anchorNode.parentNode.classList.contains('align-left')) {
        editor.caret.selection.anchorNode.parentNode.replaceWith(editor.caret.selection.anchorNode)
        editor.focus()
      } else {
        const text = editor.caret.selection.anchorNode.textContent.substr(editor.caret.selection.anchorOffset || 0)
        console.log(editor.caret.selection.anchorNode.textContent)
        console.log(editor.caret.selection.anchorOffset * 1)
        console.log(editor.caret.savedPos * 1)
        if (text.length === 0) return false
        console.log(text, text.length)
        const align = this.settings.textAlignLast ? 'left' : 'justify'
        console.log(align)
        this.html = this.html.replace(text, '<span class="align-left"> ' + text + '</span>')
        // editor.runCmd('insertHTML', '')
        editor.focus()
      }
    },
    save () {
      this.loading = true
      setTimeout(() => {
        this.hide()
        this.$emit('ok', '<div data-page="' + this.page + '"><div class="pagenumber">' + this.page + '</div>' + this.html + '</div>')
      }, 100)
    }
  }
}
</script>
<style lang="scss">
  .html-editor-dialog {
    textarea {
      height: calc(90vh - #{$toolbar-min-height});
      padding: $space-base !important;
    }
    .q-toolbar {
      border-bottom: solid 1px $grey-3;
    }
    .preview-scans {
      left: 0;
      width: 100%;
      img {
        height: 100% !important;
        width: 100% !important;
      }
    }
    .editor {
      margin: auto;
      .q-editor__toolbar {
        position: fixed;
        top: calc(5vh + 0.5*#{$space-base} - 0.5*#{$toolbar-min-height});
        left: calc(10em + 5vw);
        width: calc(100% - 20em - 10vw);
        min-width: 29rem;
        max-width: 100vw;
        z-index: 11111111;
        border-bottom: none;
      }
      .q-editor {
        border: none;
        .q-editor__content {
          padding: 0;
        }
        &.q-editor--source {
          .q-editor__content {
            text-align: left;
            text-align-last: left;
          }
        }
      }
    }
  }
</style>
