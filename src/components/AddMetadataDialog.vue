<template>
  <q-dialog content-class="add-metadata-dialog" ref="dialog" @hide="onDialogHide">
    <div class="bg-white">
      <q-toolbar class="text-weight-bold justify-between q-pr-sm">
        <div>{{$t('add metadata')}}</div>
        <q-btn icon="samepage:cross" class="text-primary" flat round @click="hide" />
      </q-toolbar>
      <div class="q-pb-md q-px-md">
        <q-input stack-label :label="$t('key')" type="text" v-model="metadata.key" />
      </div>
      <div class="q-pb-md q-px-md">
        <q-input stack-label :label="$t('value')" type="text" v-model="metadata.value" />
      </div>
      <div class="q-pb-md q-px-md">
        <q-btn :label="$t('save')" :loading="loading" @click="save" unelevated color="primary" />
      </div>
    </div>
  </q-dialog>
</template>

<script>
export default {
  data () {
    return {
      loading: false,
      metadata: {
        key: '',
        value: ''
      }
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
        this.$emit('ok', this.metadata)
      }, 100)
    }
  }
}
</script>
<style lang="scss">
  .metadata {
  }
</style>
