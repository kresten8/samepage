<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'App',
  created () {
    this.$store.commit('settings/setLanguage')
    this.$q.iconMapFn = (iconName) => {
      if (iconName.startsWith('samepage:') === true) {
        const name = iconName.substring(9)
        return {
          cls: 'samepage-' + name
        }
      }
    }
  }
}
</script>
