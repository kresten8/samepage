<template>
  <q-dialog content-class="remote-book-info-dialog" ref="dialog" @hide="onDialogHide">
    <div class="bg-white" style="min-height: 20vh">
      <q-toolbar class="text-weight-bold justify-between q-pr-sm">
        <div>{{$t('online versions')}}</div>
        <q-btn icon="samepage:cross" class="text-primary" flat round @click="hide" />
      </q-toolbar>
      <q-spinner v-if="retreiving" class="absolute-center" />
      <q-list class="q-px-sm" v-else>
        <q-item v-for="revision in revisions" :key="revision.id">
          <q-item-section>
            <q-item-label>{{revision.uploader}}</q-item-label>
            <q-item-label caption>{{$formatDate(revision.created.seconds * 1000, 'ddd D MMM, HH:mm, YYYY')}} ({{revision.id.substr(0, 6)}})</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{revision.manifest && revision.manifest.metadata && revision.manifest.metadata.title}}</q-item-label>
            <q-item-label caption>{{revision.description}}</q-item-label>
          </q-item-section>
          <q-item-section avatar style="width: 20em">
            <q-btn v-if="!revision.noFiles" :loading="revision.id === loading" :label="$t('download')" class="bg-grey-3 text-primary" flat @click="downloadRevision(revision)" />
            <div v-else>{{$t('no download available')}}</div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-dialog>
</template>

<script>
export default {
  props: ['book'],
  data () {
    return {
      loading: false,
      revisions: [],
      retreiving: true
    }
  },
  created () {
    this.$store.dispatch('cloud/getRevisions', this.book.id).then(revisions => {
      this.revisions = revisions.sort((a, b) => b.created - a.created)
      this.retreiving = false
    })
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
    downloadRevision (revision) {
      this.loading = revision.id
      this.$store.dispatch('cloud/downloadRevision', { bookId: this.book.id, revision: revision }).then(book => {
        this.loading = false
        this.hide()
        this.$emit('ok', book)
      })
    }
  }
}
</script>
<style lang="scss">
  .remote-book-info-dialog {
    .q-dialog__inner > div {
      width: 80vw;
      max-width: 80vw;
    }
  }
</style>
