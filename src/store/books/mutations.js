import Vue from 'vue'
/* export function addBook (state, book) {
  console.log(book)
  const books = Vue.prototype.$clone(state.books)
  books[book.id] = book.manifest
  state.books = books
}
export function deleteBook (state, bookId) {
  const books = Vue.prototype.$clone(state.books)
  delete books.undefined
  delete books[bookId]
  state.books = books
} */
export function setBook (state, book) {
  state.book = book
  state.audio = {
    play: false,
    paragraph: false,
    id: false,
    time: 0,
    style: '',
    list: [],
    begin: 0,
    end: 0
  }
}
export function setViewMode (state, viewMode) {
  state.viewMode = viewMode
}
export function setPageWidth (state, pageWidth) {
  state.pageWidth = pageWidth
}
export function setIntroShown (state) {
  state.introShown = true
}
export function setPage (state, book) {
  if (typeof book.page !== 'undefined') {
    state.currentPages[book.id] = book.page
  } else if (typeof book.pageNr !== 'undefined') {
    state.currentPages[book.id] = state.book.pages.findIndex(page => page.nr === book.pageNr)
  }
  state.page = state.currentPages[book.id] || 0
}
export function setParagraph (state, paragraph) {
  state.paragraph = paragraph
}
export function showAnnotations (state, annotations) {
  console.log(annotations)
  if (!Array.isArray(annotations)) {
    const existingAnnotations = Vue.prototype.$clone(state.annotations).filter(annotation => annotation.id !== annotations.id)
    existingAnnotations.push(annotations)
    state.annotations = existingAnnotations
  } else {
    state.annotations = Vue.prototype.$clone(annotations)
  }
}
export function setAnnotation (state, annotation) {
  console.log(annotation)
  if (annotation.page) {
    state.page = state.book.pages.findIndex(page => page.nr === annotation.page)
    state.annotation = annotation
  }
}
export function showBookmarks (state, bookmarks) {
  console.log(bookmarks)
  if (!Array.isArray(bookmarks)) {
    const existingBookmarks = Vue.prototype.$clone(state.bookmarks).filter(bookmark => bookmark.id !== bookmarks.id)
    existingBookmarks.push(bookmarks)
    state.bookmarks = existingBookmarks
  } else {
    state.bookmarks = Vue.prototype.$clone(bookmarks)
  }
}
export function setBookmark (state, bookmark) {
  console.log(bookmark)
  if (bookmark.page) {
    state.page = state.book.pages.findIndex(page => page.nr === bookmark.page)
    state.bookmark = bookmark
  }
}
export function setSearch (state, search) {
  console.log(search)
  state.search = Vue.prototype.$clone(search)
  if (search.page) {
    state.page = state.book.pages.findIndex(page => page.nr === search.page)
  }
}
export function setTitle (state, title) {
  state.title = title
}
export function setButtons (state, buttons) {
  state.buttons = buttons
}
export function openDrawer (state, id) {
  state.drawerOpen = id
}
export function setSettings (state, settings) {
  state.book.manifest.settings = Vue.prototype.$clone(settings)
}
export function audioPlay (state, play) {
  state.audio.play = play
  if (play) {
  } else {
    state.audio.style = ''
  }
}
export function setAudio (state, data) {
  for (const key in data) {
    state.audio[key] = data[key]
  }
}
export function setAudioList (state) {
  if (state.audio.list.length > 0) return false
  const audio = JSON.parse(JSON.stringify(state.book.audio)).map(item => {
    const pageIndex = state.book.pages.findIndex(page => page.paragraphs.find(paragraph => paragraph === item.id.split('s')[0]))
    if (pageIndex >= 0) {
      return {
        ...item,
        id: item.id.split('s')[0],
        scoreParts: [10000000 * pageIndex, 1000 * state.book.pages[pageIndex].paragraphs.findIndex(paragraph => paragraph === item.id.split('s')[0]), item.begin / 1000],
        score: 10000000 * pageIndex + 1000 * state.book.pages[pageIndex].paragraphs.findIndex(paragraph => paragraph === item.id.split('s')[0]) + item.begin / 1000
      }
    }
  })
  state.audio.list = audio.filter(a => a).sort((a, b) => a.score - b.score)
}
