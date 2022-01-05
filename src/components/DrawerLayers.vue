<template>
  <q-drawer
    v-model="drawerOpen"
    bordered
    side="right"
    content-class="bg-grey-1"
  >
    <q-list>
      <q-expansion-item switch-toggle-side :label="$tc('texts', 1)" :value="!settings.hideTranslations" @input="settings.hideTranslations = !settings.hideTranslations; setSettings()">
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label class="q-pl-md">
                {{$tc('original')}}
              </q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-toggle :value="!settings.hideOriginal" @input="settings.hideOriginal = !settings.hideOriginal; setSettings()" />
            </q-item-section>
          </q-item>
          <q-item v-for="translation in settings.translations" :key="translation.id">
            <q-item-section>
              <q-item-label class="q-pl-md">
                {{translation.name}}
              </q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-toggle :value="translation.show || false" @input="translation.show = !translation.show; setSettings()" />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label class="q-pl-md">
                <q-btn :label="$t('add translation')" flat dense rounded class="bg-grey-3 text-primary q-mb-sm" @click="addTranslation" />
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>
      <q-separator />
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('scans', 2)}}
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle :disabled="$store.state.books.viewMode !== 'fixed'" v-model="settings.showScans" @input="setSettings" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('audio', 2)}}
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle :value="$store.state.settings.showAudio || false" @input="$store.commit('settings/updateSettings', { showAudio: !$store.state.settings.showAudio })" />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item>
        <q-item-section>
          <q-item-label>
            {{$tc('named entity recognition')}}
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle v-model="settings.showNER" @input="setSettings" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
import cAddTranslationDialog from './AddTranslationDialog'
export default {
  name: 'DrawerLayers',
  data () {
    return {
      settings: this.$store.getters['books/getSettings']()
    }
  },
  watch: {
    '$store.state.books.book': {
      handler: function () {
        this.settings = this.$store.getters['books/getSettings']()
      },
      deep: true
    }
  },
  computed: {
    drawerOpen: {
      get () {
        return this.$store.state.books.drawerOpen === 'layers'
      },
      set (val) {
        this.$store.commit('books/openDrawer', val && 'layers')
      }
    }
  },
  methods: {
    addTranslation () {
      this.$q.dialog({
        component: cAddTranslationDialog,
        parent: this,
        persistent: true
      }).onOk(translation => {
        if (!this.settings.translations) {
          this.settings.translations = []
        }
        this.settings.translations.push(translation)
        this.setSettings()
      })
    },
    setSettings () {
      this.$store.dispatch('books/setSettings', this.settings)
    }
  }
}
</script>
