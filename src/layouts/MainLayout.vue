<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="bg-white text-primary" bordered v-if="$route.name !== 'intro'">
      <q-toolbar class="text-weight-bold">
        <q-btn
          flat
          dense
          round
          icon="samepage:arrow-left-full"
          aria-label="Back"
          :to="{ name: 'home' }"
          v-if="$route.name !== 'home'"
          class="q-mr-sm"
        />
        <div v-if="title === 'title'">
          <c-logo />
        </div>
        <div class="ellipsis inline-block" v-else-if="typeof title ==='string'">
          {{$store.getters['books/getTitle']()}}
        </div>
        <div v-else class="ellipsis inline-block">
          <span :class="index > 0 && 'text-dark'" v-for="(part, index) in title" :key="index">
            <q-icon name="samepage:arrow-right" v-if="index > 0" />
            {{part}}
          </span>
        </div>
        <q-toolbar-title>

        </q-toolbar-title>

        <div class="buttons q-pr-xs">
          <div v-if="$store.state.settings.showAudio && $route.name === 'book'" style="white-space: nowrap">
            <q-btn flat dense round icon="las la-step-backward" @click="$store.dispatch('books/audioNext', -1)" class="q-mr-sm bg-grey-3 text-primary" />
            <q-btn flat dense round :icon="$store.state.books.audio.play ? 'las la-pause' : 'las la-play'" @click="$store.dispatch('books/audioToggle')" class="q-mr-sm" :class="$store.state.books.audio.play ? 'bg-primary text-white' : 'bg-grey-3 text-primary'" />
            <q-btn flat dense round icon="las la-step-forward" @click="$store.dispatch('books/audioNext')" class="q-mr-sm bg-grey-3 text-primary" />
          </div>
          <div v-for="(button, index) in buttons" :key="index" class="flex center q-pr-xs" :class="button.type !== 'viewMode' && ''">
            <q-btn-toggle
              v-if="button.type === 'viewMode'"
              unelevated
              rounded
              text-color="primary"
              color="grey-3"
              @input="(val) => $store.commit('books/setViewMode', val)"
              :value="$store.state.books.viewMode"
              :options="parseOptions(button.options) || [{ label: $t('fixed'), value: 'fixed' }, { label: $t('reflow'), value: 'reflow' }]"
            />
            <q-btn
              v-else-if="$q.screen.gt.xs"
              flat
              dense
              :round="button.icon && !button.label"
              :rounded="!!button.label"
              :icon="button.icon"
              :label="button.label || null"
              @click="button.click"
              :class="button.active && button.active() ? 'bg-primary text-white' : 'bg-grey-3 text-primary'"
            />
          </div>
          <q-btn
            v-if="!$q.screen.gt.xs"
            flat
            dense
            round
            icon="samepage:menu"
            @click="$store.commit('books/openDrawer', 'mobilemenu')"
            :class="$store.state.books.drawerOpen === 'mobilemenu' ? 'bg-primary text-white' : 'bg-grey-3 text-primary'"
          />
        </div>
      </q-toolbar>
    </q-header>
    <c-drawer-toc />
    <c-drawer-menu />
    <c-drawer-mobile-menu :menu="buttons.filter(button => button.type !== 'viewMode')" />
    <c-drawer-annotations />
    <c-drawer-layers />
    <c-drawer-search />
    <c-drawer-typography />
    <c-drawer-bookmarks />
    <c-drawer-metadata />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import cDrawerMenu from '../components/DrawerMenu'
import cDrawerMobileMenu from '../components/DrawerMobileMenu'
import cDrawerToc from '../components/DrawerToc'
import cDrawerAnnotations from '../components/DrawerAnnotations'
import cDrawerLayers from '../components/DrawerLayers'
import cDrawerSearch from '../components/DrawerSearch'
import cDrawerTypography from '../components/DrawerTypography'
import cDrawerBookmarks from '../components/DrawerBookmarks'
import cDrawerMetadata from '../components/DrawerMetadata'
import cLogo from '../components/Logo'
export default {
  name: 'MainLayout',
  components: { cLogo, cDrawerToc, cDrawerMobileMenu, cDrawerMenu, cDrawerAnnotations, cDrawerLayers, cDrawerSearch, cDrawerTypography, cDrawerBookmarks, cDrawerMetadata },
  computed: {
    title () {
      var title = this.$store.getters['books/getTitle']()
      if (typeof title !== 'string' && title.join(' ').length > 70) {
        if (title[0].length > 53) {
          title[0] = title[0].substr(0, 50) + '...'
        }
      }
      return title
    },
    buttons () {
      return this.$store.state.books.buttons.filter(button => !button.noMobile || this.$q.screen.gt.xs)
    }
  },
  methods: {
    parseOptions (options) {
      return this.$clone(options).map(option => {
        if (!this.$q.screen.gt.xs) {
          delete option.label
        }
        return { ...option }
      })
    }
  }
}
</script>
