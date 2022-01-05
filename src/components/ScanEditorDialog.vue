<template>
  <q-dialog persistent content-class="scan-editor-dialog editor-dialog" ref="dialog" @hide="onDialogHide">
    <q-layout view="hHh Lpr fFf" container class="bg-white">
      <q-header class="bg-transparent q-px-sm text-dark">
        <q-toolbar class="text-weight-bold justify-between">
          <div>{{$t('scan editor')}}</div>
          <q-toolbar-title>
            <q-btn :label="$t('edit')" class="q-mr-sm" :class="showDrawer === 'edit' ? 'bg-primary text-white' : 'bg-grey-3 text-primary'" flat rounded @click="setDrawer('edit')" />
            <q-btn :label="$t('crop')" class="q-mr-sm" :class="showDrawer === 'crop' ? 'bg-primary text-white' : 'bg-grey-3 text-primary'" flat rounded @click="setDrawer('crop')" />
          </q-toolbar-title>
          <div>
            <q-btn :label="$t('save')" class="text-primary bg-grey-3 q-mr-sm" flat rounded @click="save" />
            <q-btn icon="samepage:cross" class="text-primary bg-grey-3" flat round @click="hide" />
          </div>
        </q-toolbar>
      </q-header>
      <q-drawer
        :value="showDrawer === 'edit'"
        bordered
        side="left"
        :overlay="false"
        behavior="desktop"
        content-class="bg-grey-1"

      >
        <q-scroll-area class="fit">
          <q-list>
            <q-item v-for="(filter, name) in filters" :key="name">
              <q-item-section>
                <q-item-label>
                  {{$tc(name, 1)}}
                </q-item-label>
                <q-item-section caption class="q-pl-sm">
                  <q-slider :step="filters[name].max / 100" :min="filters[name].min" :max="filters[name].max" v-model="filters[name].value" />
                </q-item-section>
              </q-item-section>
              <q-item-section avatar>
                <q-item-label>&nbsp;</q-item-label>
                <q-item-section caption>
                  <q-input v-model.number="filters[name].value" debounce="500" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
                </q-item-section>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-drawer>
      <q-drawer
        :value="showDrawer === 'crop'"
        bordered
        side="left"
        :overlay="false"
        behavior="desktop"
        content-class="bg-grey-1"
      >
        <q-scroll-area class="fit">
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label>
                  {{$tc('width', 2)}}
                </q-item-label>
                <q-item-section caption class="q-pl-sm">
                  <q-slider :step="1" :min="20" :max="100" v-model="crop.width" />
                </q-item-section>
              </q-item-section>
              <q-item-section avatar>
                <q-item-label>&nbsp;</q-item-label>
                <q-item-section caption>
                  <q-input v-model.number="crop.width" debounce="500" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
                </q-item-section>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>
                  {{$tc('height', 2)}}
                </q-item-label>
                <q-item-section caption class="q-pl-sm">
                  <q-slider :step="1" :min="20" :max="100" v-model="crop.height" />
                </q-item-section>
              </q-item-section>
              <q-item-section avatar>
                <q-item-label>&nbsp;</q-item-label>
                <q-item-section caption>
                  <q-input v-model.number="crop.height" debounce="500" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
                </q-item-section>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>
                  {{$tc('left correction', 2)}}
                </q-item-label>
                <q-item-section caption class="q-pl-sm">
                  <q-slider :step="1" :min="-20" :max="20" v-model="crop.left" />
                </q-item-section>
              </q-item-section>
              <q-item-section avatar>
                <q-item-label>&nbsp;</q-item-label>
                <q-item-section caption>
                  <q-input v-model.number="crop.left" debounce="500" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
                </q-item-section>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>
                  {{$tc('top correction', 2)}}
                </q-item-label>
                <q-item-section caption class="q-pl-sm">
                  <q-slider :step="1" :min="-20" :max="20" v-model="crop.top" />
                </q-item-section>
              </q-item-section>
              <q-item-section avatar>
                <q-item-label>&nbsp;</q-item-label>
                <q-item-section caption>
                  <q-input v-model.number="crop.top" debounce="500" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
                </q-item-section>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>
                  {{$tc('rotate', 2)}}
                </q-item-label>
                <q-item-section caption class="q-pl-sm">
                  <q-slider :step="0.1" :min="-5" :max="5" v-model="crop.angle" />
                </q-item-section>
              </q-item-section>
              <q-item-section avatar>
                <q-item-label>&nbsp;</q-item-label>
                <q-item-section caption>
                  <q-input v-model.number="crop.angle" debounce="500" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
                </q-item-section>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-drawer>
      <q-page-container>
        <q-page class="q-pa-md">
          <div ref="previewScans" class="preview preview-scans">
            <div :style="style.container">
              <img :src="image" :style="style.page" v-if="image" />
              <div></div>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script>
export default {
  props: ['scan', 'styling'],
  data () {
    return {
      loading: false,
      showDrawer: false,
      filters: {
        contrast: {
          value: (this.styling && this.styling.contrast && this.styling.contrast.value) || 100,
          min: 0,
          max: 300,
          unit: '%'
        },
        grayscale: {
          value: (this.styling && this.styling.grayscale && this.styling.grayscale.value) || 0,
          min: 0,
          max: 100,
          unit: '%'
        },
        brightness: {
          value: (this.styling && this.styling.brightness && this.styling.brightness.value) || 1,
          min: 0,
          max: 3,
          unit: ''
        },
        blur: {
          value: (this.styling && this.styling.blur && this.styling.blur.value) || 0,
          min: 0,
          max: 10,
          unit: 'px'
        },
        'hue-rotate': {
          value: (this.styling && this.styling['hue-rotate'] && this.styling['hue-rotate'].value) || 0,
          min: 0,
          max: 360,
          unit: 'deg'
        },
        invert: {
          value: (this.styling && this.styling.invert && this.styling.invert.value) || 0,
          min: 0,
          max: 100,
          unit: '%'
        },
        saturate: {
          value: (this.styling && this.styling.saturate && this.styling.saturate.value) || 0,
          min: 0,
          max: 100,
          unit: '%'
        }
      },
      crop: {
        width: (this.styling && this.styling.width) || 100,
        height: (this.styling && this.styling.height) || 100,
        left: (this.styling && this.styling.left) || 0,
        top: (this.styling && this.styling.top) || 0,
        angle: (this.styling && this.styling.angle) || 0
      },
      image: ''
    }
  },
  created () {
    this.loadScan(this.scan)
    this.$root.$on('pageImage', pageImage => {
      this.loadScan('' + pageImage)
    })
  },
  beforeDestroy () {
    this.$root.$off('pageImage', pageImage => {
      this.loadScan('' + pageImage)
    })
  },
  computed: {
    settings () {
      const settings = this.$store.getters['books/getSettings']()
      return settings
    },
    style () {
      const filters = []
      for (const filter in this.filters) {
        filters.push(filter + '(' + this.filters[filter].value + this.filters[filter].unit + ')')
      }
      return {
        container: 'clip-path: inset(' + ((100 - this.crop.height) / 2 - this.crop.top) + '% ' + ((100 - this.crop.width) / 2 - this.crop.left) + '% ' + ((100 - this.crop.height) / 2 + this.crop.top) + '% ' + ((100 - this.crop.width) / 2 + this.crop.left) + '%)',
        page: 'transform: rotate(' + this.crop.angle + 'deg); filter: ' + filters.join(' ')
      }
    }
  },
  methods: {
    loadScan (image) {
      this.image = image
    },
    show () {
      this.$refs.dialog.show()
    },
    hide () {
      this.$refs.dialog.hide()
    },
    onDialogHide () {
      this.$store.commit('settings/updateSettings', { scanEditor: false })
      this.$emit('hide')
    },
    setDrawer (drawer) {
      if (this.showDrawer !== drawer) {
        setTimeout(() => {
          this.showDrawer = drawer
        }, 0)
      }
      this.showDrawer = false
    },
    save () {
      this.loading = true
      setTimeout(() => {
        this.hide()
        this.$emit('ok', { ...this.crop, ...this.filters })
      }, 100)
    }
  }
}
</script>
<style lang="scss">
  .scan-editor-dialog {
    .preview-scans {
      width: 100%;
      background-color: $grey-3;
      margin: auto;
      left: 0;
      > div {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
      }
      img {
        position: relative;
        z-index: 2;
        left: 0;
        top: 0;
        height: calc(90vh - #{$space-base} - #{$toolbar-min-height} - 1px);
        object-fit: contain;
        + div {
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: white;
          top: 0;
          left: 0;
        }
      }
    }
  }
</style>
