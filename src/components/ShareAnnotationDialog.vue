<template>
  <q-dialog content-class="share-annotation-dialog" ref="dialog" @hide="onDialogHide">
    <div class="bg-white">
      <q-toolbar class="text-weight-bold justify-between q-pr-sm">
        <div>{{$t('share annotation')}}</div>
        <q-btn icon="samepage:cross" class="text-primary" flat round @click="hide" />
      </q-toolbar>
      <q-list class="q-mx-md q-mb-md bg-grey-3 rounded-borders">
        <q-item>
          <q-item-section>
            <q-item-label caption>{{$t('text')}}</q-item-label>
            <q-item-label>{{annotation.selection}}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <div class="q-pb-md q-px-md">
        <q-btn :label="$t('open link')" @click="open(annotation.link)" unelevated color="primary" />
      </div>
    </div>
  </q-dialog>
</template>

<script>
export default {
  props: ['annotation'],
  data () {
    return {
      loading: false
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
    open (link) {
      window.open(link)
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
  .share-annotation-dialog {
  }
</style>
