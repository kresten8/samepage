<template>
  <q-dialog content-class="add-annotation-dialog" ref="dialog" @hide="onDialogHide">
    <div class="bg-white">
      <q-toolbar class="text-weight-bold justify-between q-pr-sm">
        <div>{{$t('add annotation')}}</div>
        <q-btn icon="samepage:cross" class="text-primary" flat round @click="hide" />
      </q-toolbar>
      <div class="q-pb-md q-px-md">
        <div class="label">{{$t('selected text')}}:</div>
        <div class="highlighted inline-block">{{selection}}</div>
      </div>
      <div class="q-pb-md q-px-md">
        <q-input stack-label :label="$t('annotation text')" type="textarea" autogrow :rows="2" v-model="annotation.text" />
      </div>
      <div class="q-pb-md q-px-md">
        <q-select stack-label :label="$tc('colors', 1)" v-model="annotation.color" use-input map-options emit-value @new-value="addColor" :options="colors">
          <template v-slot:option="scope">
            <q-item
              v-bind="scope.itemProps"
              v-on="scope.itemEvents"
            >
              <q-item-section>
                <q-item-label>{{scope.opt.label}}</q-item-label>
              </q-item-section>
              <q-item-section avatar>
                <q-icon name="samepage:trash" class="text-negative" @click.stop="$store.commit('settings/deleteColor', scope.opt)" round flat dense />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="q-pb-md q-px-md">
        <q-btn :label="$t('save')" :loading="loading" @click="save" unelevated color="primary" />
      </div>
    </div>
  </q-dialog>
</template>

<script>
export default {
  props: ['fragment', 'page', 'selection'],
  data () {
    return {
      loading: false,
      annotation: {
        text: '',
        fragment: this.fragment,
        selection: this.selection,
        page: this.page,
        color: '',
        category: ''
      }
    }
  },
  computed: {
    colors () {
      return this.$store.state.settings.colors.map(color => {
        return {
          label: this.$tc(color),
          value: color
        }
      })
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
        this.$emit('ok', this.annotation)
      }, 100)
    },
    addColor (color, done) {
      console.log(color)
      this.$store.commit('settings/addColor', color)
      this.color = color
      done(color, 'add-unique')
    }
  }
}
</script>
<style lang="scss">
  .add-annotation-dialog {
  }
</style>
