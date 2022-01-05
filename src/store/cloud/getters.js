export const getUser = (state) => () => {
  return state.user
}
export const getBooks = (state) => () => {
  return state.books || []
}
export const uploading = (state) => (bookId) => {
  return state.uploading === bookId
}
