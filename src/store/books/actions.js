import localforage from 'localforage'
import { extendPrototype as startsWithPrototype } from 'localforage-startswith'
import { extendPrototype as setItemsPrototype } from 'localforage-setitems'
startsWithPrototype(localforage)
setItemsPrototype(localforage)
import { extend } from 'quasar'
import { i18n } from '../../boot/i18n'
import MD5 from 'crypto-js/md5'
import Vue from 'vue'
export function toggleDrawer (context, id) {
  if (!context.state.drawerOpen || context.state.drawerOpen !== id) {
    setTimeout(() => {
      context.commit('openDrawer', id)
    }, 10)
  }
  context.commit('openDrawer', false)
}
export function addBook (context, book) {
  console.log(book)
  return localforage.setItem('books/' + book.id, book).then(() => {
    // context.commit('addBook', book)
    return true
  })
}
export function addFiles (context, data) {
  return localforage.setItems(data.files.map(file => { return { key: 'files/' + data.bookId + '/' + file.name, value: file.blob } }))
}
export function getCoverImage (context, book) {
  var coverImage = (book.manifest.resources || []).find(resource => resource.rel === 'cover-image')
  if (!coverImage) return false
  return localforage.getItem('files/' + book.manifest.id + '/' + coverImage.href).then((blob) => {
    return blob
  })
}
export function getImage (context, data) {
  var coverImage = data.book.manifest.resources.find(resource => resource.page - data.page === 0)
  if (!coverImage) return false
  console.log('files/' + data.book.manifest.id + '/' + coverImage.href)
  return localforage.getItem('files/' + data.book.manifest.id + '/' + coverImage.href).then((blob) => {
    return blob
  })
}
export function getResource (context, data) {
  return localforage.getItem('files/' + data.bookId + '/' + data.href).then((blob) => {
    if (data.type === 'json') {
      return blob.text().then(text => {
        return JSON.parse(text)
      })
    }
    return blob
  })
}
export function updateBook (context, book) {
  if (!book.id) return false
  return localforage.getItem('books/' + book.id).then(existingBook => {
    const newBook = extend(true, existingBook, book)
    console.log(newBook)
    for (const key in book) {
      if (typeof book[key] === 'object') {
        for (const subkey in book[key]) {
          newBook[key][subkey] = book[key][subkey]
        }
      }
    }
    context.commit('setBook', newBook)
    return localforage.setItem('books/' + book.id, newBook)
  })
}
export function updateMetadata (context, metadata) {
  if (!context.state.book.id) return false
  return localforage.getItem('books/' + context.state.book.id).then(existingBook => {
    const newBook = { ...existingBook }
    newBook.manifest.metadata = metadata
    context.commit('setBook', newBook)
    return localforage.setItem('books/' + context.state.book.id, newBook)
  })
}
export function setAnnotation (context, data) {
  if (!data.bookId) return false
  console.log(data)
  return localforage.getItem('books/' + data.bookId).then(book => {
    if (!book.manifest.annotations) book.manifest.annotations = []
    const annotation = book.manifest.annotations.find(annotation => annotation.id === data.annotation.id)
    console.log(annotation)
    if (annotation) {
      for (const key in data.annotation) {
        annotation[key] = data.annotation[key]
      }
      data.annotation = annotation
    } else {
      book.manifest.annotations.push(data.annotation)
    }
    context.commit('setBook', book)
    return localforage.setItem('books/' + book.id, book)
  }).then(() => {
    context.commit('showAnnotations', data.annotation)
    return true
  })
}
export function deleteAnnotation (context, data) {
  console.log(data, context.state.book.id)
  return localforage.getItem('books/' + context.state.book.id).then(book => {
    if (!book.manifest.annotations) book.manifest.annotations = []
    console.log(data, book)
    book.manifest.annotations = book.manifest.annotations.filter(annotation => annotation.id !== data.annotation.id)
    console.log(book)
    context.commit('setBook', book)
    return localforage.setItem('books/' + book.id, book)
  })
}
export function shareAnnotation (context, data) {
  console.log(data, context.state.book)
  const revisionId = MD5(context.state.book.reflow + context.state.book.style + context.state.book.manifest).toString()
  return Vue.prototype.fs().collection('books').doc(context.state.book.manifest.id).collection('revisions').doc(revisionId).get().then((doc) => {
    if (!doc.exists) {
      return context.dispatch('cloud/upload', { ...context.state.book, noFiles: true }, { root: true })
    }
    return true
  }).then(() => {
    const b64 = Buffer.from(JSON.stringify({
      fragment: data.annotation.fragment,
      selection: data.annotation.selection,
      page: data.annotation.page
    })).toString('base64').replace('/', '_')
    const link = 'https://samepage-123.web.app/direct/' + context.state.book.manifest.id + '/' + revisionId + '/' + b64
    return {
      ...data.annotation,
      link: link
    }
  })
}
export function setBookmark (context, data) {
  if (!data.bookId) return false
  return localforage.getItem('books/' + data.bookId).then(book => {
    if (!book.manifest.bookmarks) book.manifest.bookmarks = []
    const bookmark = book.manifest.bookmarks.find(bookmark => bookmark.id === data.bookmark.id)
    if (bookmark) {
      for (const key in data.bookmark) {
        bookmark[key] = data.bookmark[key]
      }
      data.bookmark = bookmark
    } else {
      book.manifest.bookmarks.push(data.bookmark)
    }
    context.commit('setBook', book)
    return localforage.setItem('books/' + book.id, book)
  }).then(() => {
    context.commit('showBookmarks', data.bookmark)
    return true
  })
}
export function deleteBookmark (context, data) {
  return localforage.getItem('books/' + context.state.book.id).then(book => {
    if (!book.manifest.bookmarks) book.manifest.bookmarks = []
    book.manifest.bookmarks = book.manifest.bookmarks.filter(bookmark => bookmark.id !== data.bookmark.id)
    context.commit('setBook', book)
    return localforage.setItem('books/' + book.id, book)
  })
}
export function getBook (context, bookId) {
  return localforage.getItem('books/' + bookId).then(book => {
    return book
  })
}
export function setBook (context, data) {
  if (data.revisionId) {
    return Vue.prototype.fs().collection('books').doc(data.bookId).collection('revisions').doc(data.revisionId).get().then(doc => {
      context.commit('setBook', { ...doc.data(), pages: [] })
      return { ...doc.data(), pages: [] }
    })
  } else {
    return localforage.getItem('books/' + data.bookId).then(book => {
      context.commit('setBook', book)
      return book
    })
  }
}
export function deleteBook (context, bookId) {
  return localforage.removeItem('books/' + bookId).finally(() => {
    console.log('delete')
    // context.commit('deleteBook', bookId)
  })
}
export function getBooks (context) {
  return localforage.startsWith('books/').then(books => {
    return books
  })
}
export function setSettings (context, settings) {
  context.commit('setSettings', settings)
  return context.dispatch('updateBook', { id: context.state.book.id, manifest: { settings: settings } })
}
export function setStyle (context, style) {
  return context.dispatch('updateBook', { id: context.state.book.id, style: style })
}
export function updateSettings (context, settings) {
  const existingSettings = context.getters.getSettings()
  for (const key in settings) {
    existingSettings[key] = settings[key]
  }
  context.commit('setSettings', existingSettings)
  return context.dispatch('updateBook', { id: context.state.book.id, manifest: { settings: existingSettings } })
}
export function audioToggle (context) {
  if (context.state.audio.play) {
    context.dispatch('audioPause')
  } else {
    context.dispatch('audioPlay')
  }
}
export function audioPause (context) {
  const audioObjects = document.querySelectorAll('audio')
  for (let i = 0; i < audioObjects.length; i++) {
    audioObjects[i].pause()
  }
  context.commit('audioPlay', false)
}
export function audioNext (context, direction) {
  if (!direction) direction = 1
  context.dispatch('audioPlay', direction)
}
export function audioPlay (context, reset) {
  if (!context.state.paragraph || !context.state.book.audio) return false
  context.commit('setAudioList')
  const audioList = context.state.audio.list
  let line = 0
  if (reset === true) {
  } else {
    line = context.state.audio.line || 0
  }
  let currentIndex = audioList.findIndex(a => a && a.id === context.state.paragraph) + line
  if (reset === -1 || reset === 1) {
    currentIndex += reset
    line += reset
    if (!audioList[currentIndex]) return false
    const nextParagraph = audioList[currentIndex].id
    const nextPageIndex = context.state.book.pages.findIndex(page => page.paragraphs.find(paragraph => paragraph === nextParagraph))
    if (context.state.page !== nextPageIndex) {
      context.commit('setPage', { book: context.state.book, page: nextPageIndex })
    }
    context.commit('setParagraph', nextParagraph)
  }
  if (currentIndex < 0) {
    context.dispatch('audioPause')
    Vue.prototype.$q.notify(i18n.t('no audio available for this paragraph'))
    return false
  }
  const currentAudio = audioList[currentIndex]
  context.commit('setAudio', {
    ...audioList[currentIndex],
    line: line,
    lines: audioList[currentIndex].lines,
    duration: audioList[currentIndex].end - audioList[currentIndex].begin,
    progress: 0,
    time: audioList[currentIndex].begin
  })
  const audioObject = document.getElementById(currentAudio.resource)
  if (audioObject) {
    audioObject.currentTime = context.state.audio.time
    audioObject.play()
    audioObject.onpause = () => {
      context.commit('setAudio', { time: audioObject.currentTime })
    }
    audioObject.ontimeupdate = () => {
      context.commit('setAudio', { time: audioObject.currentTime })
      const currentTime = audioObject.currentTime
      // console.log(currentTime, audioObject.currentTime, audioObject.duration, context.state.audio.end)
      if (currentTime >= context.state.audio.end * 1) {
        // audioObject.pause()
        const lineIndex = audioList.findIndex(a => a && a.resource === audioObject.id && a.begin <= currentTime && a.end >= currentTime)
        // console.log(lineIndex, audioObject.id, currentTime)
        if (lineIndex >= 0) {
          const paragraphIndex = audioList.findIndex(a => a && a.id === audioList[lineIndex].id)
          context.commit('setAudio', {
            ...audioList[lineIndex],
            line: lineIndex - paragraphIndex,
            lines: audioList[lineIndex].lines,
            duration: audioList[lineIndex].end - audioList[lineIndex].begin,
            progress: 0
          })
        }
      } else {
        const progress = 100 * (currentTime - context.state.audio.begin) / (context.state.audio.end - context.state.audio.begin)
        // context.commit('setAudio', { style: '.preview-content #' + context.state.audio.id + ' { position: relative; } \n.preview-content #' + context.state.audio.id + '::before { content: \'\'; background-color: ' + colors.getBrand('accent') + '; border-radius: 5px; left: -5px; top: -5px; right: -5px; bottom: -5px; position: absolute } \n.preview-content #' + context.state.audio.id + '::after { content: \'\'; background-color: ' + colors.getBrand('secondary') + '; position: absolute; top: 0; right: -8px; border-radius: 3px; width: 5px; height: ' + progress + '%; }' })
        // console.log(context.state.audio.id, line)
        context.commit('setAudio', {
          progress: progress
        })
      }
    }
    context.commit('audioPlay', true)
  }
}
export function audioNext2 (context, direction) {
  console.log('next')
  if (!direction) direction = 1
  context.commit('setAudioList')
  const audio = context.state.audio.list
  const lines = audio.filter(a => a && a.id.split('s')[0] === context.state.paragraph)
  let line = context.state.audio.line || 0
  const currentIndex = audio.findIndex(a => a.id.split('s')[0] === context.state.paragraph) + line
  if (currentIndex < 0) {
    context.dispatch('audioPause')
    return false
  }
  const nextIndex = currentIndex + direction
  if (nextIndex >= audio.length || nextIndex < 0) return false
  if (lines.length <= line + 1) {
    line = 0
  } else {
    line++
  }
  const nextParagraph = audio[nextIndex].id.split('s')[0]
  const nextPageIndex = context.state.book.pages.findIndex(page => page.paragraphs.find(paragraph => paragraph === nextParagraph))
  if (context.state.page !== nextPageIndex) {
    context.commit('setPage', { book: context.state.book, page: nextPageIndex })
  }
  context.commit('setParagraph', nextParagraph)
  console.log(audio[nextIndex], line)
  context.commit('setAudio', { id: audio[nextIndex].id, paragraph: context.state.paragraph, time: audio[nextIndex].begin, audio: audio[nextIndex], line: line })
  if (!context.state.audio.play) {
    context.dispatch('audioPlay', line)
  }
}
export function audioPlay2 (context, line) {
  if (!line) line = context.state.audio.line || 0
  console.log('play', context.state.audio.play, line)
  if (!context.state.audio.play) {
    context.dispatch('audioPause')
  }
  if (!context.state.paragraph || !context.state.book.audio) return false
  context.commit('setAudioList')
  const audioLines = context.state.audio.list
  const currentIndex = audioLines.findIndex(a => a.id.split('s')[0] === context.state.paragraph) + (line || 0)
  const audio = audioLines[currentIndex]
  audio.id = audio.id.split('s')[0]
  if (!audio) {
    context.dispatch('audioPause')
    Vue.prototype.$q.notify(i18n.t('no audio available for this paragraph'))
    return false
  }
  console.log(audio.id, context.state.audio.id, line, context.state.audio.line)
  if (audio && (context.state.audio.id !== audio.id || context.state.audio.line !== line)) {
    context.commit('setAudio', { id: audio.id, paragraph: context.state.paragraph, time: audio.begin, audio: audio, line: line })
  }
  const audioObject = document.getElementById(audio.resource)
  if (audioObject) {
    audioObject.currentTime = context.state.audio.time
    audioObject.play()
    audioObject.onpause = () => {
      context.commit('setAudio', { time: audioObject.currentTime })
    }
    audioObject.ontimeupdate = () => {
      context.commit('setAudio', { time: audioObject.currentTime })
      console.log(audioObject.currentTime, context.state.audio.audio.end)
      if (audioObject.currentTime >= context.state.audio.audio.end * 1) {
        // audioObject.pause()
        if (context.state.audio.play) {
          context.dispatch('audioNext')
        }
      } else {
        const progress = 100 * (audioObject.currentTime - context.state.audio.audio.begin) / (context.state.audio.audio.end - context.state.audio.audio.begin)
        // context.commit('setAudio', { style: '.preview-content #' + context.state.audio.id + ' { position: relative; } \n.preview-content #' + context.state.audio.id + '::before { content: \'\'; background-color: ' + colors.getBrand('accent') + '; border-radius: 5px; left: -5px; top: -5px; right: -5px; bottom: -5px; position: absolute } \n.preview-content #' + context.state.audio.id + '::after { content: \'\'; background-color: ' + colors.getBrand('secondary') + '; position: absolute; top: 0; right: -8px; border-radius: 3px; width: 5px; height: ' + progress + '%; }' })
        console.log(audio.id, line)
        context.commit('setAudio', {
          selection: {
            id: audio.id,
            line: line || 0,
            lines: audio.lines,
            duration: audio.end - audio.begin,
            progress: progress
          }
        })
      }
    }
    context.commit('audioPlay', true)
  }
}
