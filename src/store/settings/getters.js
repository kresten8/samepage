export const language = (state) => () => {
  return state.languages.find(language => language.id === state.language).label
}
export const languages = (state) => () => {
  return state.languages
}
export const getFontFamilies = (state) => () => {
  return state.fontFamilies
}
