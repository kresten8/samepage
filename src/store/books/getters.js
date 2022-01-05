export const getPage = (state) => () => {
  return state.page || 0
}
export const getTitle = (state) => () => {
  return state.title || 'Books'
}
export const getBookImage = (state) => (book, page) => {
  const cover = ((book.resources) || []).find(resource => typeof page !== 'undefined' ? (resource.rel === 'scan' && resource.page === page) : resource.rel === 'cover-image')
  if (!cover) return false
  return cover.href.indexOf('://') >= 0 ? cover.href : 'books/' + book.id + '/' + cover.href
}
export const getBookTitle = (state) => (book) => {
  return (book.manifest && book.manifest.metadata && book.manifest.metadata.title) || book.id || ''
}
export const getSettings = (state) => () => {
  return JSON.parse(JSON.stringify({ ...((state.book && state.book.manifest && state.book.manifest.settings) || {}) }))
}
