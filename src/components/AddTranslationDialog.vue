<template>
  <q-dialog content-class="add-translation-dialog" ref="dialog" @hide="onDialogHide">
    <div class="bg-white">
      <q-toolbar class="text-weight-bold justify-between q-pr-sm">
        <div>{{$t('add translation')}}</div>
        <q-btn icon="samepage:cross" class="text-primary" flat round @click="hide" />
      </q-toolbar>
      <div class="q-pb-md q-px-md">
        <q-input stack-label :label="$t('translation name')" v-model="translation.name" />
      </div>
      <div class="q-pb-md q-px-md">
        <q-select stack-label :label="$t('language code')" v-model="translation.tag" :options="tags" maxlength="5" />
      </div>
      <div class="q-pb-md q-px-md">
        <q-btn :label="$t('save')" :loading="loading" @click="save" unelevated color="primary" />
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { uid } from 'quasar'
export default {
  props: ['fragment', 'page', 'selection'],
  data () {
    return {
      loading: false,
      translation: {
        name: '',
        tag: ''
      },
      tags: ['en', 'nl', 'de', 'fr']
    }
  },
  methods: {
    show () {
      this.$refs.dialog.show()
    },
    hide () {
      this.$refs.dialog.hide()
    },
    onDialogHide () {
      this.$emit('hide')
    },
    save () {
      this.loading = true
      setTimeout(() => {
        this.hide()
        this.$emit('ok', { id: uid(), ...this.translation })
      }, 100)
    }
  }
}
</script>
<style lang="scss">
  .add-annotation-dialog {
  }
</style>
