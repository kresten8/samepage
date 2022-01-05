export function setBooks (state, books) {
  state.books = books
}
export function login (state, user) {
  state.user = JSON.parse(JSON.stringify(user))
}
export function logout (state) {
  state.books = []
  state.user = false
}
export function uploading (state, uploading) {
  state.uploading = uploading
}
