<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <q-list separator>
      <q-item-label header>{{$tc('fixed')}}</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('fontsize', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'fixed'" :step="0.5" :min="6" :max="20" v-model="settings.fixedFontSize" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.fixedFontSize" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('letter spacing', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'fixed'" :step="0.01" :min="-1" :max="1" v-model="settings.fixedLetterSpacing" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.fixedLetterSpacing" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('line height', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'fixed'" :step="0.05" :min="0.5" :max="3" v-model="settings.fixedLineHeight" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.fixedLineHeight" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('text alignment')}}
          </q-item-label>
          <q-item-section caption>
            <q-btn-toggle class="q-mt-sm" dense unelevated v-model="settings.textAlign" @input="setSettings" :options="[{ value: 'left', label: $t('left') }, { value: 'right', label: $t('right') }, { value: 'justify', label: $t('justify') }]" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>{{$tc('last line')}}</q-item-label>
          <q-item-section caption>
            <q-toggle v-model="settings.textAlignLast" debounce="500" @input="setSettings" borderless dense />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('page width', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'fixed'" :min="10" :max="100" v-model="settings.fixedWidth" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.fixedWidth" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('paragraph spacing')}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'fixed'" :step="0.1" :min="0" :max="3" v-model="settings.fixedParagraphSpacing" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.fixedParagraphSpacing" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$t('scan page top margin')}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="!settings.showScans" :min="0" :max="20" v-model="settings.scanPageTopMargin" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.scanPageTopMargin" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('scan scale', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'fixed'" :min="10" :max="400" v-model="settings.scanScale" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.scanScale" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item-label header>{{$tc('reflow')}}</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('fontsize', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'reflow'" :step="0.5" :min="6" :max="20" v-model="settings.reflowFontSize" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.reflowFontSize" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('line height', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'reflow'" :step="0.05" :min="0.5" :max="3" v-model="settings.reflowLineHeight" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.reflowLineHeight" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('font family')}}
          </q-item-label>
          <q-item-section caption>
            <q-select :disabled="$store.state.books.viewMode !== 'reflow'" class="q-mt-sm" borderless dense v-model="settings.reflowFontFamily" map-options emit-value :options="fontFamilies" @input="setSettings" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('page width', 2)}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="$store.state.books.viewMode !== 'reflow'" :min="10" :max="100" v-model="settings.reflowWidth" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.reflowWidth" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item-label header>{{$tc('scans', 2)}}</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$t('scan page offset')}}
          </q-item-label>
          <q-item-section caption>
            <q-slider :disabled="!settings.showScans" :min="-20" :max="100" v-model="settings.scanPageOffset" @input="setSettings" />
          </q-item-section>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label>&nbsp;</q-item-label>
          <q-item-section caption>
            <q-input v-model.number="settings.scanPageOffset" debounce="500" @input="setSettings" borderless dense input-class="text-center" class="border" style="width: 2.5em; display: inline-block" />
          </q-item-section>
        </q-item-section>
      </q-item>
      <q-item-label header>{{$tc('other')}}</q-item-label>
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('css')}}
          </q-item-label>
          <q-item-section caption>
            <q-input type="textarea" autogrow :rows="6" class="q-mt-sm" borderless dense v-model="style">
              <template v-slot:append>
                <q-btn @click="setStyle" :label="$t('save')" flat class="bg-primary text-white" />
              </template>
            </q-input>
          </q-item-section>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
export default {
  name: 'DrawerTypography',
  data () {
    return {
      settings: this.getSettings(),
      style: this.$store.state.books.book.style || ''
    }
  },
  watch: {
    '$store.state.books.book': {
      handler: function () {
        this.settings = this.getSettings()
        this.style = this.$store.state.books.book.style || ''
      },
      deep: true
    }
  },
  computed: {
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'typography'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'typography')
      }
    },
    fontFamilies () {
      return this.$store.getters['settings/getFontFamilies']().map(font => {
        return {
          value: font,
          label: this.$t('fonts.' + font)
        }
      })
    }
  },
  methods: {
    getSettings () {
      var settings = this.$store.getters['books/getSettings']()
      settings.reflowFontSize *= 14
      settings.fixedFontSize *= 14
      if (!settings.textAlignLast) settings.textAlignLast = false
      return settings
    },
    setSettings () {
      var settings = JSON.parse(JSON.stringify(this.settings))
      settings.reflowFontSize /= 14
      settings.fixedFontSize /= 14
      this.$store.dispatch('books/setSettings', settings)
    },
    setStyle () {
      this.$store.dispatch('books/setStyle', this.style)
    }
  }
}
</script>
