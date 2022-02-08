<template>
  <q-page class="row">
    <component :is="'style'" type="text/css">
      {{book.style || ''}}
      {{$store.state.books.audio.style || ''}}
      {{settingsStyle}}
    </component>
    <div class="absolute-top-left" style="z-index: 100" v-if="viewMode === 'fixed'">
      <div class="q-ma-sm q-btn-toggle inline-block">
        <q-btn @click="zoom(1.1)" round flat color="primary" icon="samepage:plus" />
        <q-btn @click="zoom(0)" round flat color="primary" icon="las la-sync" />
        <q-btn @click="zoom(0.9)" round flat color="primary" icon="samepage:minus" />
      </div>
      <div class="q-ma-sm q-btn-toggle inline-block">
        <q-btn @click="enablePan = true" round flat :class="enablePan ? 'bg-primary text-grey-3' : 'bg-grey-3 text-primary'" icon="las la-hand-pointer" />
        <q-btn @click="enablePan = false" round flat :class="!enablePan ? 'bg-primary text-grey-3' : 'bg-grey-3 text-primary'" icon="las la-i-cursor" />
      </div>
    </div>
    <div class="absolute q-ma-sm q-btn-toggle" style="z-index: 100; left: 50%; transform: translateX(-50%)" v-if="viewMode === 'fixed'">
      <q-btn @click="linkedPan = !linkedPan" round flat icon="las la-link" class="inline-block" :class="linkedPan ? 'bg-primary text-grey-3' : 'bg-grey-3 text-primary'" />
    </div>
    <div class="absolute-top-right q-ma-sm q-btn-toggle" style="z-index: 100" v-if="viewMode === 'fixed' && settings.showScans">
      <q-btn @click="zoomScan(1.1)" round flat color="primary" icon="samepage:plus" />
      <q-btn @click="zoomScan(0)" round flat color="primary" icon="las la-sync" />
      <q-btn @click="zoomScan(0.9)" round flat color="primary" icon="samepage:minus" />
    </div>
    <div class="absolute full-width full-height" style="overflow: auto">
      <div ref="previewFixed" @mousedown="sidePan = 'fixed'" @mouseup="addAnnotation" class="preview preview-fixed" v-if="pages" :class="[viewMode === 'fixed' && !settings.hideOriginal && 'preview-show', settings.showScans ? 'preview-fixed-scans col-6' : 'col-12']">
        <panZoom :options="{ transformOrigin: { x: 0.5, y: 0.5 }, zoomDoubleClickSpeed: 1 }" ref="panZoomFixed" @panend="saveZoomFixed" @zoomend="saveZoomFixed" @zoom="linkZoomFixed" @pan="linkPanFixed" @init="initZoomFixed">
          <div style="position: relative; overflow: hidden" ref="panZoomFixedDiv" id="panZoomFixedDiv">
            <div class="preview-fixed-contents" :style="'text-align-last: ' + (settings.textAlignLast ? 'justify' : 'inherit') + '; text-align: ' + settings.textAlign + '; width: ' + settings.fixedWidth + 'rem; font-size: ' + settings.fixedFontSize + 'rem; letter-spacing: ' + settings.fixedLetterSpacing + 'em; line-height: ' + settings.fixedLineHeight + '; margin-top: ' + settings.scanPageTopMargin + 'rem'"><div class="preview-content" v-html="fixedHTML" /></div>
          </div>
        </panZoom>
      </div>
      <div @scroll="scrolled" @mouseup="addAnnotation" ref="previewReflow" class="col-12 preview preview-reflow" v-if="pages" :class="viewMode === 'reflow' && 'preview-show'">
        <div :style="'width: ' + settings.reflowWidth + 'rem; font-size: ' + settings.reflowFontSize + 'rem; line-height: ' + settings.reflowLineHeight"><div v-html="reflow" class="preview-content" :style="'font-family: ' + settings.reflowFontFamily" /></div>
      </div>
      <div ref="previewScans" @mousedown="sidePan = 'scan'" class="col-6 preview preview-scans bg-white" v-if="viewMode === 'fixed' && settings.showScans">
        <panZoom :options="{ transformOrigin: { x: 0.5, y: 0.5 }, zoomDoubleClickSpeed: 1 }" ref="panZoom" @panend="saveZoomScan" @zoomend="saveZoomScan" @zoom="linkZoomScan" @pan="linkPanScan" @init="initZoomScan">
          <div style="position: relative" ref="panZoomDiv" id="panZoomDiv">
            <img :src="pageImage" :style="scanStyle" />
            <div v-if="scanHighlight" class="scan-highlight" :style="'left: ' + scanHighlight.left + '; top: ' + scanHighlight.top + '; width: ' + scanHighlight.width + '; height: ' + scanHighlight.height"></div>
          </div>
        </panZoom>
      </div>
      <div class="col-6 preview preview-ner" v-if="settings.showNER">
        <div><div>
          <div class="text-primary q-pb-md text-weight-bold text-center">{{$t('named entity recognition')}}</div>
          <div v-for="(paragraph, index) in nerParagraphs" :key="index" class="relative-position">
            <div v-if="paragraph.uniqueNER" class="preview-ner-translated">
              <div v-if="paragraph.uniqueNER.length > 0">
                <div v-for="(entity, entityIndex) in paragraph.uniqueNER" :key="entityIndex">
                  <q-btn @click="openLink(entity.DBpediaURL)" :label="entity.text" class="bg-grey-3 text-primary q-mb-sm" flat rounded icon="las la-external-link-alt" />
                </div>
              </div>
              <div v-else>
                {{$t('no named entities found')}}
              </div>
            </div>
            <div v-else class="preview-ner-text">
              {{paragraph.text}}
            </div>
            <q-btn v-if="paragraph.showNERButton" class="absolute-center bg-grey-3 text-primary" :loading="paragraph.loading" @click="ner(paragraph)" flat rounded :label="$t('retreive ner')" />
            <q-btn v-else class="absolute-top-right q-ma-md bg-grey-3 text-primary" :loading="paragraph.loading" @click="ner(paragraph)" flat rounded :label="$t('redo ner')" />
          </div>
        </div></div>
      </div>
      <div class="col-6 preview preview-translation">
        <div v-for="translation in translations" :key="translation.id">
          <div>
            <div class="text-primary q-pb-md text-weight-bold text-center">{{translation.name}}</div>
            <div v-for="(paragraph, index) in translation.paragraphs" :key="index" class="relative-position">
              <div v-if="paragraph.translation" class="preview-translation-translated">{{paragraph.translation}}</div>
              <div v-else class="preview-translation-text">
                {{paragraph.text}}
              </div>
              <q-btn v-if="paragraph.showTranslateButton" class="absolute-center bg-grey-3 text-primary" :loading="paragraph.loading" @click="translate(translation, paragraph)" flat rounded :label="$t('translate')" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <q-footer class="bg-white text-primary" bordered style="z-index: 9400">
      <q-toolbar v-if="pages">
        <div class="full-width row items-center">
          <div class="col-auto items-center">
            <q-btn @click="prevPage" icon="samepage:arrow-left" flat dense round />
            <q-btn @click="nextPage" icon="samepage:arrow-right" flat dense round />
          </div>
          <div class="col-auto q-pl-md q-pr-lg text-dark font-size-small">
            <q-input :value="currentPage + 1" @input="(val) => { if (val > 0) currentPage = val - 1 }" debounce="500" borderless dense input-class="text-right" class="border" style="width: 2em; display: inline-block" /> / {{pages.length}}
          </div>
          <div class="col">
            <q-slider :value="currentPage" label :label-value="currentPage + 1" @change="setSliderPage" :min="0" :max="pages.length - 1" />
          </div>
        </div>
      </q-toolbar>
    </q-footer>
    <audio v-for="(audiofile, index) in audiofiles" :key="index" :id="audiofile.id" preload="auto">
      <source :src="audiofile.src" :type="audiofile.type">
    </audio>
  </q-page>
</template>

<script>
import cAddAnnotationDialog from '../components/AddAnnotationDialog'
import cHtmlEditorDialog from '../components/HtmlEditorDialog'
import cScanEditorDialog from '../components/ScanEditorDialog'
import { scroll, dom, uid } from 'quasar'
const { setScrollPosition } = scroll
const { height } = dom
var scrollTimeout = 0
var directTimeout = 0
let saveZoomTimeout = 0
let wordCoordinates = []
export default {
  name: 'PageBook',
  data () {
    return {
      bookId: this.$route.params.book,
      scrolling: false,
      direct: false,
      positions: {
        chapters: [],
        pages: [],
        screenCount: 1
      },
      book: {},
      pages: [],
      currentHTML: '',
      fixedHTML: '',
      reflow: '',
      currentParagraphs: [],
      pageImage: '',
      scale: 0.9,
      scanScale: 1,
      audiofiles: [],
      scanHighlight: false,
      linkedPan: false,
      sidePan: false,
      prevTransform: {
        fixed: {
          x: 0,
          y: 0,
          scale: 1
        },
        scan: {
          x: 0,
          y: 0,
          scale: 1
        }
      },
      initializing: true,
      enablePan: true
    }
  },
  created () {
    this.$store.commit('settings/setIntroShown')
    if (!this.bookId) {
      this.$router.replace({ name: 'home' })
    }
    this.$store.commit('books/setPage', { id: this.$route.params.book })
    this.$store.dispatch('books/setBook', { bookId: this.$route.params.book, revisionId: this.$route.params.revision }).then(() => {
      this.$store.commit('books/setTitle', this.$store.state.books.book && this.$store.state.books.book.manifest && this.$store.state.books.book.manifest.metadata.title)
      this.setChapter()
      this.direct = true
      this.setPage()
      console.log(this.book)
      let viewModeOptions = [{ label: this.$t('fixed'), value: 'fixed', icon: 'samepage:fixed' }, { label: this.$t('reflow'), value: 'reflow', icon: 'samepage:reflow' }]
      if (!this.pages || this.pages.length === 0) {
        this.viewMode = 'reflow'
        viewModeOptions = [{ label: this.$t('fixed'), value: 'fixed', disable: true }, { label: this.$t('reflow'), value: 'reflow' }]
      }
      const audiofiles = ((this.book.manifest && this.book.manifest.resources) || []).filter(resource => resource.rel === 'audio')
      this.audiofiles = []
      if (audiofiles.length > 0) {
        audiofiles.forEach(audiofile => {
          this.$store.dispatch('books/getResource', { bookId: this.book.id, href: audiofile.href }).then((blob) => {
            if (blob) {
              audiofile.src = window.URL.createObjectURL(blob)
              this.audiofiles.push(audiofile)
            }
          })
        })
      }
      if (this.$route.params.snippet) {
        this.openSnippet()
      }
      this.$store.commit('books/setButtons', [
        { label: this.$t('html editor'), active: () => { return this.$store.state.settings.htmlEditor }, click: () => { this.$store.commit('settings/updateSettings', { htmlEditor: !this.$store.state.settings.htmlEditor }) } },
        { label: this.$t('scan editor'), active: () => { return this.$store.state.settings.scanEditor }, click: () => { this.$store.commit('settings/updateSettings', { scanEditor: !this.$store.state.settings.scanEditor }) } },
        { type: 'viewMode', options: viewModeOptions, noMobile: true },
        { icon: 'samepage:marker', tooltip: this.$tc('annotations', 2), active: () => { return this.$store.state.books.drawerOpen === 'annotations' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'annotations') } },
        { icon: 'samepage:bookmark', tooltip: this.$tc('bookmarks', 2), active: () => { return this.$store.state.books.drawerOpen === 'bookmarks' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'bookmarks') } },
        { icon: 'samepage:settings', tooltip: this.$tc('typography', 2), active: () => { return this.$store.state.books.drawerOpen === 'typography' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'typography') } },
        { icon: 'samepage:chapters', tooltip: this.$tc('toc', 2), active: () => { return this.$store.state.books.drawerOpen === 'toc' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'toc') } },
        { icon: 'samepage:search', tooltip: this.$tc('search', 2), active: () => { return this.$store.state.books.drawerOpen === 'search' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'search') } },
        { icon: 'samepage:layers', tooltip: this.$tc('layers', 2), active: () => { return this.$store.state.books.drawerOpen === 'layers' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'layers') } },
        { icon: 'las la-info-circle', tooltip: this.$tc('metadata', 2), active: () => { return this.$store.state.books.drawerOpen === 'metadata' }, click: () => { this.$store.dispatch('books/toggleDrawer', 'metadata') } }
      ])
    })
  },
  mounted () {
    this.getPositions()
    window.addEventListener('resize', this.getPositions)
    window.addEventListener('mousemove', this.highlightElement)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.getPositions)
    window.removeEventListener('mousemove', this.highlightElement)
  },
  watch: {
    enablePan: function (isEnabled) {
      if (isEnabled) {
        this.$refs.panZoomFixed.$panZoomInstance.resume()
        this.$refs.panZoom.$panZoomInstance.resume()
      } else {
        this.$refs.panZoomFixed.$panZoomInstance.pause()
        this.$refs.panZoom.$panZoomInstance.pause()
      }
    },
    '$store.state.books.drawerOpen': function (drawer) {
      if (drawer === 'annotations') {
        this.$refs.panZoomFixed.$panZoomInstance.pause()
      } else {
        this.$refs.panZoomFixed.$panZoomInstance.resume()
      }
    },
    '$store.state.books.audio.time': 'setAudioSelection',
    '$store.state.settings.htmlEditor': function (val) {
      if (val) {
        this.$q.dialog({
          component: cHtmlEditorDialog,
          parent: this,
          persistent: true,
          content: this.currentHTML,
          scan: this.pageImage,
          book: this.book
        }).onOk(html => {
          var pages = this.pages
          pages[this.currentPage].html = html
          this.book.reflow = pages.map(page => page.html).join('').replace(/-<br>/ig, '')
          this.setPage()
          this.$store.dispatch('books/updateBook', { id: this.bookId, pages: pages, reflow: this.book.reflow })
        })
      }
    },
    '$store.state.settings.scanEditor': function (val) {
      if (val) {
        this.$q.dialog({
          component: cScanEditorDialog,
          parent: this,
          persistent: true,
          scan: this.pageImage,
          styling: (this.book.manifest.style && this.book.manifest.style.scan) || {}
        }).onOk(style => {
          if (!this.book.manifest.style) {
            this.book.manifest.style = { scan: '' }
          }
          this.book.manifest.style.scan = style
          this.$store.dispatch('books/updateBook', { id: this.bookId, manifest: this.book.manifest })
        })
      }
    },
    direct: function (val) {
      if (val) {
        clearTimeout(directTimeout)
        directTimeout = setTimeout(() => {
          this.direct = false
        }, 500)
      }
    },
    scrolling: function (val) {
      if (val) {
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          this.scrolling = false
        }, 500)
      }
    },
    currentPage: 'setPage',
    viewMode: function () {
      setTimeout(() => {
        this.setPage(this.viewMode)
        this.direct = true
        this.getPositions()
        this.setAnnotations()
      }, 10)
    },
    '$route.params.chapter': 'setChapter',
    '$refs.previewFixed': 'setChapter',
    '$refs.previewReflow': 'getPositions',
    '$store.state.books.annotations': 'setAnnotations',
    '$store.state.books.annotation': 'scrollToAnnotation',
    '$store.state.books.search': 'setSearch',
    '$q.screen.gt.xs': function (val) {
      if (!val) {
        this.viewMode = 'reflow'
      }
    },
    currentHTML: function () {
      this.$root.$emit('currentHTML', this.currentHTML)
    },
    pageImage: function () {
      this.$root.$emit('pageImage', this.pageImage)
    },
    currentParagraphs: function () {
      if (this.settings.showNER) {
        this.highlightNER()
      }
    },
    'settings.showNER': function () {
      this.highlightNER()
    },
    'settings.showScans': function () {
      this.setScanImage()
    },
    '$store.state.books.book': {
      handler: function (newVal, oldVal) {
        this.book = JSON.parse(JSON.stringify(this.$store.state.books.book))
      },
      immediate: true
    },
    'book.pages': {
      handler: function (newVal, oldVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.pages = JSON.parse(JSON.stringify(this.book.pages))
        }
      },
      immediate: true
    },
    'book.reflow': {
      handler: function () {
        if (this.book.manifest && this.book.manifest.id) {
          this.$getImageUrls(this.book.manifest.id, this.book.reflow).then(html => {
            console.log(html)
            this.reflow = html.innerHTML
          })
        }
      },
      immediate: true
    }
  },
  computed: {
    scanStyle () {
      const style = this.book.manifest && this.book.manifest.style && this.book.manifest.style.scan
      if (!style) return '' // 'transform: scale(' + (this.scanScale || 1) + ') translate(-50%, -50%); transform-origin: 0 0;'
      const filters = []
      for (const filter in (style || [])) {
        if (typeof style[filter].unit !== 'undefined') {
          filters.push(filter + '(' + style[filter].value + style[filter].unit + ')')
        }
      }
      return 'transform: scale(' + (this.scanScale || 1) + ') rotate(' + (style.angle || 0) + 'deg); height: ' + (10000 / (style.height || 100)) + '%; filter: ' + filters.join(' ')
    },
    settings () {
      const settings = this.$store.getters['books/getSettings']()
      settings.fixedWidth = this.scale * settings.fixedWidth
      settings.fixedFontSize = this.scale * settings.fixedFontSize
      return settings
    },
    settingsStyle () {
      let style = ''
      if (this.settings.fixedParagraphSpacing) {
        style += '[data-page] > p { margin-bottom: ' + this.settings.fixedParagraphSpacing + 'em}'
      }
      return style
    },
    nerParagraphs () {
      return this.currentParagraphs.map(paragraph => {
        const uniqueNER = {}
        const hasNER = Object.values((this.settings.ner && this.settings.ner.paragraphs) || []).find(p => p.id === paragraph.id)
        Object.values((hasNER && hasNER.ner) || []).forEach(entity => {
          uniqueNER[entity.text] = entity
        })
        return { ...paragraph, ner: (hasNER ? hasNER.ner : false), uniqueNER: Object.values(uniqueNER), showNERButton: (!hasNER) }
      })
    },
    translations () {
      console.log(this.settings.translations)
      if (!this.settings.translations) return []
      return this.settings.translations.filter(translation => translation.show).map(translation => {
        console.log(this.currentParagraphs)
        return {
          ...translation,
          paragraphs: this.currentParagraphs.map(paragraph => {
            const translated = Object.values(translation.paragraphs || []).find(p => p.id === paragraph.id)
            return { ...paragraph, translation: (translated ? translated.translation : false), showTranslateButton: (!translated || paragraph.text !== translated.text) }
          })
        }
      })
    },
    viewMode: {
      set (val) {
        this.$store.commit('books/setViewMode', val)
        this.$forceUpdate()
      },
      get () {
        return this.$store.state.books.viewMode
      }
    },
    currentPage: {
      set (val) {
        this.$store.commit('books/setPage', { id: this.bookId, page: val })
        this.$forceUpdate()
      },
      get () {
        return this.$store.getters['books/getPage']()
      }
    }
  },
  methods: {
    getWords () {
      wordCoordinates = []
      const words = document.querySelectorAll('[data-word]')
      for (let i = 0; i < words.length; i++) {
        const coordinates = words[i].getAttribute('data-word').split(/[ ,]/ig)
        wordCoordinates.push({
          l: coordinates[0] * 1,
          t: coordinates[1] * 1,
          r: coordinates[2] * 1,
          b: coordinates[3] * 1,
          element: words[i]
        })
      }
      const lines = document.querySelectorAll('[data-line]')
      for (let i = 0; i < lines.length; i++) {
        const coordinates = lines[i].getAttribute('data-line').split(/[ ,]/ig)
        lines[i].style.position = 'absolute'
        lines[i].style.left = coordinates[0] * 1 + '%'
        lines[i].style.top = coordinates[1] * 1 + '%'
        lines[i].style.whiteSpace = 'nowrap'
        const lineNumber = document.createElement('div')
        lineNumber.classList.add('line-number')
        if (coordinates[0] * 1 > 25 && coordinates[0] * 1 < 50) {
          lineNumber.classList.add('line-number-right')
        }
        lineNumber.innerHTML = i + 1
        lines[i].prepend(lineNumber)
      }
      const regions = document.querySelectorAll('[data-region]')
      for (let i = 0; i < regions.length; i++) {
        regions[i].style.position = null
      }
    },
    highlightElement (e) {
      const highlighted = document.querySelectorAll('.fixed-highlight')
      if (highlighted.length > 0) {
        for (let i = 0; i < highlighted.length; i++) {
          highlighted[i].classList.remove('fixed-highlight')
        }
      }
      this.scanHighlight = false
      if (this.viewMode !== 'fixed' || !this.settings.showScans || !this.$refs.previewScans) return false
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target) return false
      const coordinatesAttribute = target.getAttribute('data-word')
      if (coordinatesAttribute) {
        const coordinates = coordinatesAttribute.split(/[, ]/ig)
        /* const v = this.$refs.previewScans.offsetWidth
        const w = this.$refs.previewScans.querySelector('img').offsetWidth * this.scanScale
        const j = this.$refs.previewScans.offsetHeight
        const h = this.$refs.previewScans.querySelector('img').offsetHeight * this.scanScale */
        target.classList.add('fixed-highlight')
        this.scanHighlight = {
          target: target,
          left: coordinates[0] + '%', // 100 * (coordinates[0] * w / (v * 100) - w / (2 * v) + 0.5) + '%',
          top: coordinates[1] + '%', // 100 * (coordinates[1] * h / (j * 100) - h / (2 * j) + 0.5) + '%',
          width: (coordinates[2] - coordinates[0]) + '%', // 100 * (coordinates[2] * w / (v * 100) - w / (2 * v) + 0.5) - 100 * (coordinates[0] * w / (v * 100) - w / (2 * v) + 0.5) + '%',
          height: (coordinates[3] - coordinates[1]) + '%' // 100 * (coordinates[3] * h / (j * 100) - h / (2 * j) + 0.5) - 100 * (coordinates[1] * h / (j * 100) - h / (2 * j) + 0.5) + '%'
        }
      } else if (target.parentNode && target.parentNode.getAttribute('id') === 'panZoomDiv') {
        const x = (e.offsetX / target.offsetWidth * 100)
        const y = (e.offsetY / target.offsetHeight * 100)
        const word = wordCoordinates.find(word => {
          return word.l <= x && word.r >= x && word.t <= y && word.b >= y
        })
        if (word) {
          word.element.classList.add('fixed-highlight')
        }
      }
    },
    ner (paragraph) {
      paragraph.loading = true
      this.$forceUpdate()
      return this.$ner(paragraph.text, this.book.manifest.metadata.language).then(ner => {
        const settings = this.$store.getters['books/getSettings']()
        if (!settings.ner) settings.ner = {}
        if (!settings.ner.paragraphs) settings.ner.paragraphs = []
        settings.ner.paragraphs = settings.ner.paragraphs.filter(p => p.id !== paragraph.id)
        delete paragraph.loading
        settings.ner.paragraphs.push({
          ...paragraph,
          ner: ner || false,
          uniqueNER: []
        })
        this.$store.dispatch('books/setSettings', settings)
        this.highlightNER()
      })
    },
    translate (translation, paragraph) {
      paragraph.loading = true
      this.$forceUpdate()
      return this.$translate(paragraph.text, this.book.manifest.metadata.language, translation.tag).then(translated => {
        const settings = this.$store.getters['books/getSettings']()
        const selectedTranslation = settings.translations.find(t => t.id === translation.id)
        if (!selectedTranslation.paragraphs) selectedTranslation.paragraphs = []
        selectedTranslation.paragraphs = selectedTranslation.paragraphs.filter(p => p.id !== paragraph.id)
        delete paragraph.loading
        selectedTranslation.paragraphs.push({
          ...paragraph,
          translation: translated || false
        })
        this.$store.dispatch('books/setSettings', settings)
      })
    },
    zoom (factor) {
      if (!factor) {
        const dx = (this.$refs.panZoomFixedDiv.offsetWidth - this.$refs.panZoomFixedDiv.childNodes[0].offsetWidth) / 2
        const dy = (this.$refs.panZoomFixedDiv.offsetHeight - this.$refs.panZoomFixedDiv.childNodes[0].offsetHeight) / 2
        this.$refs.panZoomFixed.$panZoomInstance.zoomAbs(dx, dy, 1)
        this.$refs.panZoomFixed.$panZoomInstance.moveTo(dx, dy)
        this.prevTransform.fixed = { x: dx, y: dy, scale: 1 }
        if (this.linkedPan) {
          this.$refs.panZoom.$panZoomInstance.zoomAbs(0, 0, 1)
          this.$refs.panZoom.$panZoomInstance.moveTo(0, 0)
        }
      } else {
        this.$refs.panZoomFixed.$panZoomInstance.smoothZoom(this.$refs.panZoomFixedDiv.offsetWidth / 2, this.$refs.panZoomFixedDiv.offsetHeight / 2, factor)
        if (this.linkedPan) {
          this.$refs.panZoom.$panZoomInstance.smoothZoom(this.$refs.panZoomDiv.offsetWidth / 2, this.$refs.panZoomDiv.offsetHeight / 2, factor)
        }
      }
      /* if (factor < 0) {
        this.scale /= (1 + factor / -10)
      } else {
        this.scale *= (1 + factor / 10)
      } */
    },
    zoomScan (factor) {
      if (!factor) {
        this.$refs.panZoom.$panZoomInstance.zoomAbs(0, 0, 1)
        this.$refs.panZoom.$panZoomInstance.moveTo(0, 0)
        this.prevTransform.scan = { x: 0, y: 0, scale: 1 }
        if (this.linkedPan) {
          this.$refs.panZoomFixed.$panZoomInstance.zoomAbs(0, 0, 1)
          this.$refs.panZoomFixed.$panZoomInstance.moveTo(0, 0)
        }
      } else {
        this.$refs.panZoom.$panZoomInstance.smoothZoom(this.$refs.panZoomDiv.offsetWidth / 2, this.$refs.panZoomDiv.offsetHeight / 2, factor)
        if (this.linkedPan) {
          this.$refs.panZoomFixed.$panZoomInstance.smoothZoom(this.$refs.panZoomFixedDiv.offsetWidth / 2, this.$refs.panZoomFixedDiv.offsetHeight / 2, factor)
        }
      }
      /* console.log(factor)
      if (factor < 0) {
        this.scanScale /= (1 + factor / -10)
      } else {
        this.scanScale *= (1 + factor / 10)
      }
      console.log(this.scanScale) */
    },
    initZoomFixed (e) {
      const settings = this.$clone(this.$store.getters['books/getSettings']())
      if (settings.zoomTransformFixed) {
        e.zoomAbs(0, 0, Math.max(0.3, settings.zoomTransformFixed.scale * 1))
        e.moveTo(settings.zoomTransformFixed.x * 1, settings.zoomTransformFixed.y * 1)
        this.prevTransform.fixed = settings.zoomTransformFixed
      }
      setTimeout(() => {
        this.initializing = false
      }, 1000)
    },
    initZoomScan (e) {
      setTimeout(() => {
        const settings = this.$clone(this.$store.getters['books/getSettings']())
        if (settings.zoomTransformScan) {
          e.zoomAbs(0, 0, settings.zoomTransformScan.scale * 1)
          e.moveTo(settings.zoomTransformScan.x * 1, settings.zoomTransformScan.y * 1)
          this.prevTransform.scan = settings.zoomTransformScan
        }
      }, 500)
    },
    linkZoomScan (e) {
      this.prevTransform.scan = this.$clone(e.getTransform())
    },
    linkZoomFixed (e) {
      this.prevTransform.fixed = this.$clone(e.getTransform())
    },
    linkPanFixed (e) {
      if (this.sidePan === 'fixed' && !this.initializing) {
        if (this.linkedPan) {
          const transform = this.$clone(e.getTransform())
          transform.x -= (this.prevTransform.fixed.x || 0)
          transform.y -= (this.prevTransform.fixed.y || 0)
          transform.x += (this.prevTransform.scan.x || 0)
          transform.y += (this.prevTransform.scan.y || 0)
          this.$refs.panZoom.$panZoomInstance.moveTo(transform.x, transform.y)
          this.prevTransform.scan = transform
        }
        this.prevTransform.fixed = this.$clone(e.getTransform())
      }
    },
    linkPanScan (e) {
      if (this.sidePan === 'scan' && !this.initializing) {
        if (this.linkedPan) {
          const transform = e.getTransform()
          transform.x += (this.prevTransform.fixed.x || 0)
          transform.y += (this.prevTransform.fixed.y || 0)
          transform.x -= (this.prevTransform.scan.x || 0)
          transform.y -= (this.prevTransform.scan.y || 0)
          this.$refs.panZoomFixed.$panZoomInstance.moveTo(transform.x, transform.y)
          this.prevTransform.fixed = transform
        }
        this.prevTransform.scan = this.$clone(e.getTransform())
      }
    },
    saveZoomFixed (e) {
      clearTimeout(saveZoomTimeout)
      saveZoomTimeout = setTimeout(() => {
        const transform = e.getTransform()
        const settings = this.$clone(this.$store.getters['books/getSettings']())
        settings.zoomTransformFixed = this.$clone(transform)
        this.$store.dispatch('books/setSettings', settings)
      }, 0)
    },
    saveZoomScan (e) {
      clearTimeout(saveZoomTimeout)
      saveZoomTimeout = setTimeout(() => {
        const transform = e.getTransform()
        const settings = this.$clone(this.$store.getters['books/getSettings']())
        settings.zoomTransformScan = this.$clone(transform)
        if (settings.zoomTransformScan.y !== 0) {
          this.$store.dispatch('books/setSettings', settings)
        }
      }, 0)
    },
    resetZoom () {
      this.$refs.panZoom.$panZoomInstance.centerOn(this.$refs.panZoomDiv)
      this.$refs.panZoom.$panZoomInstance.zoomAbs(0, 0, 1)
      // this.$refs.panZoom.$el.css('transform', 'matrix(0.801435, 0, 0, 0.801435, 29.475, 52.719)')
    },
    openSnippet () {
      const snippet = JSON.parse(Buffer.from(this.$route.params.snippet, 'base64').toString('utf8').replace('_', '/'))
      const target = this.viewMode === 'fixed' ? this.$refs.previewFixed.querySelectorAll('[data-page="' + snippet.page + '"]')[0] : this.$refs.previewReflow.childNodes[0].childNodes[0]
      const currentHTML = target.innerHTML
      var start = currentHTML.indexOf(snippet.fragment)
      if (start >= 0) {
        start = Math.max(currentHTML.substr(start).indexOf(snippet.selection), 0) + start
        var left = currentHTML.substr(0, start)
        var right = currentHTML.substr(start + snippet.selection.length)
        var html = left + '<span class="snippet highlighted" style="background-color: #DDD">' + snippet.selection + '</span>' + right
        target.innerHTML = html
        this.scrollToElement('.snippet', 200, 100)
      }
    },
    setAnnotations () {
      this.direct = true
      var annotations = document.querySelectorAll('[data-annotation]')
      for (let i = 0; i < annotations.length; i++) {
        annotations[i].replaceWith(annotations[i].textContent)
      }
      if (!this.$store.state.books.annotations.length === 0) return false // or other check
      setTimeout(() => {
        Object.values(this.$store.state.books.annotations || []).forEach(annotation => {
          let currentHTML = ''
          let target
          if (this.viewMode === 'fixed') {
            this.currentPage = this.pages.sort((a, b) => (a.nr - annotation.page) - (b.nr - annotation.page)).findIndex(page => page.html.indexOf(annotation.fragment) >= 0)
          }
          setTimeout(() => {
            target = this.viewMode === 'fixed' ? this.$refs.previewFixed.querySelectorAll('[data-page="' + annotation.page + '"]')[0] : this.$refs.previewReflow.childNodes[0].childNodes[0]
            if (!target) return false
            currentHTML = target.innerHTML
            if (!annotation.selection) annotation.selection = annotation.fragment
            var start = currentHTML.indexOf(annotation.fragment)
            if (start >= 0) {
              start = Math.max(currentHTML.substr(start).indexOf(annotation.selection), 0) + start
              var left = currentHTML.substr(0, start)
              var right = currentHTML.substr(start + annotation.selection.length)
              var html = left + '<span data-annotation="' + annotation.id + '" class="highlighted" style="background-color: ' + (annotation.color || '') + '">' + annotation.selection + '</span>' + right
              target.innerHTML = html
            }
          }, 10)
        })
      }, 10)
    },
    scrollToAnnotation () {
      if (this.viewMode !== 'fixed' && this.$store.state.books.annotation && this.$store.state.books.annotation.id) {
        var annotations = document.querySelectorAll('.highlighted-active')
        for (let i = 0; i < annotations.length; i++) {
          annotations[i].classList.remove('highlighted-active')
        }
        const annotationObject = this.$refs.previewReflow.querySelector('[data-annotation="' + this.$store.state.books.annotation.id + '"]')
        if (annotationObject && (annotationObject.getBoundingClientRect().top < 0 || annotationObject.getBoundingClientRect().top > this.$q.screen.height)) {
          this.scrollToElement('[data-annotation="' + this.$store.state.books.annotation.id + '"]', 200, 100)
        }
        if (annotationObject) annotationObject.classList.add('highlighted-active')
      }
    },
    highlightNER () {
      this.direct = true
      var elements = document.querySelectorAll('.ner_7421')
      if (elements && elements.length > 0) {
        for (const element of elements) {
          const previousContent = document.createTextNode(element.innerHTML)
          element.parentNode.replaceChild(previousContent, element)
        }
      }
      if (this.settings.showNER) {
        setTimeout(() => {
          // const target = this.viewMode === 'fixed' ? this.$refs.previewFixed.querySelectorAll('[data-page="' + this.currentPage + '"]')[0] : this.$refs.previewReflow.childNodes[0]
          this.nerParagraphs.forEach(paragraph => {
            const ps = document.querySelectorAll("[id='" + paragraph.id + "']")
            for (const p of ps) {
              if (p) {
                paragraph.uniqueNER.forEach(entity => {
                  p.innerHTML = p.innerHTML.replace(entity.text, '<a href="' + (entity.DBpediaURL) + '" target="_blank" class="ner_7421">' + entity.text + '</a>')
                })
              }
            }
          })
        }, 100)
      }
    },
    setSearch () {
      this.direct = true
      var elements = document.querySelectorAll('.search_unique713')
      if (elements && elements.length > 0) {
        for (const element of elements) {
          element.parentNode.removeChild(element)
        }
      }
      if (!this.$store.state.books.search.search) return false
      setTimeout(() => {
        const target = this.viewMode === 'fixed' ? this.$refs.previewFixed.querySelectorAll('[data-page="' + this.$store.state.books.search.page + '"]')[0] : this.$refs.previewReflow.childNodes[0]
        target.innerHTML = target.innerHTML.replace(new RegExp('(' + this.$store.state.books.search.search + ')', 'ig'), '<span class="search-result">$1</span>')
      }, 100)
    },
    setChapter () {
      if (!this.$route.params.chapter || this.scrolling || this.direct) return false
      var chapter = this.book.manifest.toc.find(chapter => chapter.href.replace('#', '') === this.$route.params.chapter)
      if (chapter) {
        this.$store.commit('books/setTitle', [this.$store.state.books.book.manifest.metadata.title, chapter.title])
      } else {
        this.$store.commit('books/setTitle', this.$store.state.books.book.manifest.metadata.title)
      }
      if (this.viewMode === 'reflow') {
        if (!this.scrolling) {
          this.scrollToElement('[name="' + this.$route.params.chapter + '"]')
        }
      } else if (this.$refs.previewFixed && !this.scrolling && !this.direct) {
        var elements = this.$refs.previewFixed.querySelectorAll('[name="' + this.$route.params.chapter + '"]')
        if (elements && elements.length > 0) {
          this.currentPage = this.pages.findIndex(page => page.nr === this.$findPageNumber(elements[0]))
        }
      }
    },
    setSliderPage (page) {
      this.direct = true
      this.currentPage = page
    },
    setPage (val) {
      var chapter = ((this.book.manifest && this.book.manifest.toc) || []).sort((a, b) => b.pageIndex - a.pageIndex).find(chapter => chapter.pageIndex <= this.currentPage)
      if (chapter && chapter.href && chapter.href.replace('#', '') !== this.$route.params.chapter) {
        this.direct = true
        this.$router.replace({ name: this.$route.name, params: { ...this.$route.params, chapter: chapter.href.replace('#', '') } })
      }
      if (this.viewMode === 'fixed') {
        setTimeout(() => {
          this.$refs.previewFixed.scrollTop = 0
          this.$forceUpdate()
        }, 100)
      } else {
        var currentPage = this.positions.pages.find(page => this.pages && this.pages[this.currentPage] && page.nr === this.pages[this.currentPage].nr)
        if (currentPage) {
          setScrollPosition(this.$refs.previewReflow, currentPage.top, 0)
        }
      }
      if (this.pages && this.pages[this.currentPage]) {
        this.currentHTML = this.pages[this.currentPage].html
        this.fixedHTML = ''
        this.$getImageUrls(this.book.manifest.id, this.pages[this.currentPage].html).then(html => {
          this.fixedHTML = html.innerHTML
        })
        this.pageImage = ''
        this.$store.dispatch('books/getImage', { book: this.book, page: this.pages[this.currentPage].index + this.settings.scanPageOffset }).then((blob) => {
          if (blob) {
            this.pageImage = window.URL.createObjectURL(blob)
            this.setScanImage()
          } else this.pageImage = ''
        })
      } else {
        this.currentHTML = ''
      }
      const html = document.createElement('div')
      html.innerHTML = this.currentHTML
      const paragraphs = html.querySelectorAll('[id^=p-]')
      this.currentParagraphs = []
      for (let i = 0; i < paragraphs.length; i++) {
        const id = paragraphs[i].getAttribute('id')
        if (id) {
          if (this.currentParagraphs.length === 0) {
            this.$store.commit('books/setParagraph', id)
          }
          this.currentParagraphs.push({
            id: id,
            html: paragraphs[i].innerHTML,
            text: paragraphs[i].textContent
          })
        }
      }
      if (this.$store.state.books.audio.play) {
        this.$store.dispatch('books/audioPlay')
      }
      this.wordCoordinates = this.getWords()
      this.setScanImage()
    },
    setScanImage (attempt) {
      if (!attempt) attempt = 0
      attempt++
      if (this.$refs.panZoomDiv && this.$refs.panZoomDiv.querySelector('img').naturalWidth) {
        const imgRatio = this.$refs.panZoomDiv.querySelector('img').naturalWidth / this.$refs.panZoomDiv.querySelector('img').naturalHeight
        const divRatio = this.$refs.panZoom.$el.offsetWidth / this.$refs.panZoom.$el.offsetHeight
        if (imgRatio > divRatio) {
          this.$refs.panZoomDiv.style.height = this.$refs.panZoom.$el.offsetWidth / imgRatio + 'px'
          this.$refs.panZoomDiv.style.width = this.$refs.panZoom.$el.offsetWidth + 'px'
        } else {
          this.$refs.panZoomDiv.style.width = this.$refs.panZoom.$el.offsetWidth + 'px'
          this.$refs.panZoomDiv.style.height = this.$refs.panZoom.$el.offsetHeight * imgRatio + 'px'
        }
      } else if (attempt < 10) {
        setTimeout(() => {
          this.setScanImage(attempt)
        }, 500)
      }
    },
    getPositions () {
      if (!this.$refs.previewReflow) return false
      this.positions = {
        chapters: [],
        pages: []
      }
      Object.values((this.book.manifest && this.book.manifest.toc) || []).forEach(chapter => {
        var chapterId = chapter.href.replace('#', '')
        var chapterElement = this.$refs.previewReflow.querySelector('[name="' + chapterId + '"]')
        if (chapterElement) {
          this.positions.chapters.push({
            id: chapterId,
            top: chapterElement.offsetTop
          })
        }
      })
      for (var page of this.$refs.previewReflow.querySelectorAll('[data-page]')) {
        this.positions.pages.push({
          nr: page.getAttribute('data-page') * 1,
          top: page.offsetTop
        })
      }
      this.positions.screenCount = Math.ceil(this.$refs.previewReflow.scrollHeight / height(this.$refs.previewReflow))
      var currentPage = this.positions.pages.find(page => this.pages[this.currentPage] ? ('' + page.nr) === ('' + this.pages[this.currentPage].nr) : false)
      if (currentPage) {
        this.direct = true
        this.scrollToElement('[data-page="' + currentPage.nr + '"]')
      }
    },
    scrollToElement (selector, duration, offset) {
      setTimeout(() => {
        const target = this.$refs.previewReflow
        const element = target.querySelector(selector)
        const os = element.offsetTop + (-1 * (offset || 0))
        setScrollPosition(target, os, duration)
      }, 100)
    },
    scrolled (position) {
      this.scrolling = true
      this.direct = true
      var page = this.positions.pages.sort((a, b) => b.top - a.top).find(page => page.top <= this.$refs.previewReflow.scrollTop)
      if (page) {
        this.currentPage = Math.max(0, this.pages.findIndex(p => '' + p.nr === '' + page.nr))
      }
    },
    prevPage () {
      this.currentPage--
      if (this.currentPage < 0) this.currentPage = this.pages.length - 1
    },
    nextPage () {
      this.currentPage++
      if (this.currentPage > this.pages.length - 1) this.currentPage = 0
    },
    openLink (link) {
      window.open(link)
    },
    addAnnotation (val) {
      if (this.$store.state.books.drawerOpen !== 'annotations') return false
      const selectedText = window.getSelection()
      const selection = selectedText.anchorNode.textContent.substr(selectedText.baseOffset, selectedText.extentOffset - selectedText.baseOffset)
      const fragment = (selection.length < 50) ? selectedText.anchorNode.textContent.substr(Math.max(0, selectedText.baseOffset - 50), Math.max(0, selectedText.baseOffset - 50) + 50) : selection
      if (!selection) return false
      this.$q.dialog({
        component: cAddAnnotationDialog,
        parent: this,
        persistent: true,
        page: this.pages[this.currentPage].nr,
        fragment: fragment,
        selection: selection
      }).onOk(annotation => {
        annotation.id = uid()
        annotation.date = new Date().toISOString()
        this.$store.dispatch('books/setAnnotation', { annotation: annotation, bookId: this.bookId }).then(() => {
          this.$store.commit('books/setAnnotation', annotation)
        })
      })
    },
    setAudioSelection () {
      const parentDiv = this.viewMode === 'fixed' ? this.$refs.previewFixed : this.$refs.previewReflow
      const audio = this.$store.state.books.audio
      const previousContainers = parentDiv.querySelectorAll('.audio-container')
      if (previousContainers.length > 0) {
        for (let i = 0; i < previousContainers.length; i++) {
          const previousContainer = previousContainers[i]
          // previousContainer.classList.remove('audio-container')
          if (!previousContainer.innerHTML) {
            previousContainer.parentNode.removeChild(previousContainer)
          } else {
            const previousContent = document.createTextNode(previousContainer.innerHTML)
            previousContainer.parentNode.replaceChild(previousContent, previousContainer)
          }
        }
      }
      const paragraph = parentDiv.querySelector('#' + audio.id)
      if (!audio.lines) return false
      const line = audio.lines[0]
      let foundLine = false
      let processedText = ''
      let progress = 0
      const audioList = audio.list.filter(item => item && item.id.split('s')[0] === audio.id)
      for (let i = 0; i < paragraph.childNodes.length; i++) {
        let node = paragraph.childNodes[i]
        // console.log(node, i)
        if (node.childNodes.length > 0) node = node.firstChild
        processedText += node.textContent
        progress = processedText.length / paragraph.textContent.length
        if (progress >= 0.9 * audio.line / audioList.length && !foundLine && node.textContent.indexOf(line) >= 0) {
          foundLine = true
          const startPosition = node.textContent.indexOf(line)
          const endPosition = Math.min(node.textContent.length, startPosition + Math.ceil(line.length * audio.progress / 100))
          const startContainer = document.createElement('span')
          startContainer.classList.add('audio-container')
          startContainer.setAttribute('data-audio', audio.id + '-' + audio.line)
          startContainer.setAttribute('data-time', audio.progress)
          startContainer.setAttribute('data-duration', audio.duration)
          const startRange = new Range()
          startRange.setStart(node, startPosition)
          startRange.setEnd(node, endPosition)
          // startRange.surroundContents(startContainer)
          // console.log(startRange)
          var sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(startRange)
        }
      }
    }
  }
}
</script>
