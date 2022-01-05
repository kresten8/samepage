import Vue from 'vue'
import { i18n } from '../../boot/i18n'
export function setIntroShown (state) {
  state.introShown = true
}
export function addCategory (state, category) {
  const categories = Vue.prototype.$clone(state.categories)
  categories.push(category)
  state.categories = categories
}
export function deleteCategory (state, category) {
  state.categories = state.categories.filter(c => c !== category)
}
export function addColor (state, color) {
  const colors = Vue.prototype.$clone(state.colors)
  colors.push(color)
  state.colors = colors
}
export function deleteColor (state, color) {
  state.colors = state.colors.filter(c => c !== color)
}
export function updateSettings (state, settings) {
  console.log(settings)
  for (const key in settings) {
    state[key] = settings[key]
  }
}
export function setLanguage (state, language) {
  if (language) {
    state.language = language
  }
  i18n.locale = state.language
}
