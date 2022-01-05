export default function () {
  return {
    viewMode: 'fixed',
    pageWidth: '40em',
    book: {
      settings: {}
    },
    currentPages: {},
    page: 0,
    paragraph: false,
    annotations: {},
    annotation: {},
    bookmark: {},
    bookmarks: {},
    search: {},
    title: '',
    buttons: [],
    drawerOpen: false,
    introShown: false,
    audio: {
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
}
