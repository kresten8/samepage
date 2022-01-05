<template>
  <div class="c-metadata">
    <q-list :dense="summary" :separator="!summary">
      <q-item v-for="item in items" :key="item.key">
        <q-item-section>
          <q-item-label caption>{{item.value}}</q-item-label>
          <q-item-label>{{item.label}}<q-popup-edit v-model="item.label" buttons @save="(val) => save(val, item)"><q-input type="text" v-model="item.label" autofocus @input="$forceUpdate()" clearable /></q-popup-edit></q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="!summary">
        <q-item-section>
          <q-item-label><q-btn @click="add" flat rounded class="text-white bg-primary" icon="las la-plus" :label="$t('add metadata')" /></q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import cAddMetadataDialog from './AddMetadataDialog'
export default {
  props: ['metadata', 'summary'],
  data () {
    return {
      inSummary: ['author', 'identifier'],
      newItem: {
        value: '',
        label: ''
      }
    }
  },
  computed: {
    items: {
      get () {
        const items = []
        for (const key in this.metadata) {
          if ((!this.summary || this.inSummary.indexOf(key.toLowerCase()) >= 0) && this.metadata[key]) {
            items.push({
              key: key,
              value: this.$t(key),
              label: this.metadata[key]
            })
          }
        }
        return items
      },
      set (val) {
        console.log(val)
      }
    }
  },
  methods: {
    add () {
      this.$q.dialog({
        component: cAddMetadataDialog,
        parent: this,
        persistent: true
      }).onOk((metadata) => {
        return this.save(metadata.value, metadata)
      })
    },
    save (val, item) {
      const metadata = { ...this.metadata }
      metadata[item.key] = val
      if (!val) delete metadata[item.key]
      this.$store.dispatch('books/updateMetadata', metadata)
    }
  }
}
</script>
<style lang="scss">
  .c-metadata {
    .q-item {
      padding-left: 0;
    }
  }
</style>
