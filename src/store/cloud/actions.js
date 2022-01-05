import Vue from 'vue'
import MD5 from 'crypto-js/md5'
import { i18n } from '../../boot/i18n'
export function init (context) {
  if (Vue.prototype.auth().currentUser) {
    context.commit('login', Vue.prototype.auth().currentUser)
  }
  return context.dispatch('getBooks')
}
export function login (context, user) {
  return Vue.prototype.auth().signInWithEmailAndPassword(user.email, user.password).then(result => {
    context.commit('login', Vue.prototype.auth().currentUser)
    return true
  }).catch(error => {
    Vue.prototype.$q.notify(i18n.t(error.message))
    return false
  })
}
export function logout (context) {
  return Vue.prototype.auth().signOut().then(() => {
    context.commit('logout')
    return true
  }).catch(error => {
    Vue.prototype.$q.notify(i18n.t(error.message))
    return false
  })
}
export function getBooks (context) {
  let books = []
  return Vue.prototype.fs().collection('books').get().then(snapshot => {
    return snapshot.docs.map(doc => { return { id: doc.id, ...doc.data() } })
  }).then(result => {
    books = result
    const promises = []
    books.forEach(book => {
      promises.push(Vue.prototype.st().ref('books/' + book.id).child('cover.jpg').getDownloadURL().then(url => {
        book.cover = url
      }).catch(error => {
        console.error(error)
        return true
      }))
      promises.push(Vue.prototype.fs().collection('books').doc(book.id).collection('revisions').orderBy('created', 'desc').limit(1).get().then(snapshot => {
        if (snapshot.docs.length > 0) book.manifest = snapshot.docs.[0].data().manifest || {}
        else {
          book.manifest = false
        }
      }).catch(error => {
        console.error(error)
        return true
      }))
    })
    return Promise.all(promises)
  }).then(() => {
    context.commit('setBooks', books.filter(book => book.cover))
    return books
  })
}
export function getRevisions (context, bookId) {
  return Vue.prototype.fs().collection('books').doc(bookId).collection('revisions').get().then(snapshot => {
    return snapshot.docs.map(doc => { return { id: doc.id, ...doc.data() } })
  })
}
export function downloadRevision (context, data) {
  return Vue.prototype.st().ref('books/' + data.bookId).child(data.revision.id + '.zip').getDownloadURL().then(url => {
    return Vue.prototype.$importBookRemote(url, data.revision)
  })
}
export function setName (context, name) {
  return Vue.prototype.auth().currentUser.updateProfile({
    displayName: name
  }).then(() => {
    context.commit('login', Vue.prototype.auth().currentUser)
    return true
  })
}
export function upload (context, book) {
  if (context.state.uploading) {
    return false
  }
  context.commit('uploading', book.id)
  const hash = MD5(book.reflow + book.style + book.manifest).toString()
  return Vue.prototype.fs().collection('books').doc(book.manifest.id).get().then(doc => {
    if (!doc.exists) {
      return Vue.prototype.fs().collection('books').doc(book.manifest.id).set({
        title: book.manifest.metadata.title
      })
    }
    return true
  }).then(() => {
    /* return Vue.prototype.fs().collection('books').doc(book.manifest.id).collection('revisions').doc(hash).get().then(doc => {
      if (doc.exists) {
        throw new Error('already uploaded')
      }
      return true
    })
  }).then(() => { */
    return Vue.prototype.fs().collection('books').doc(book.manifest.id).collection('revisions').doc(hash).set({
      manifest: book.manifest,
      uid: context.state.user.uid,
      uploader: context.state.user.displayName || '',
      created: Vue.prototype.fs.FieldValue.serverTimestamp(),
      description: book.description || '',
      reflow: book.reflow || '',
      noFiles: book.noFiles || false
    })
  }).then(() => {
    return Vue.prototype.fs().collection('books').doc(book.manifest.id).collection('revisions').doc(hash).get()
  }).then(doc => {
    if (!book.history) book.history = []
    book.history.push({
      uid: doc.data().uid,
      uploader: doc.data().uploader,
      created: doc.data().created,
      description: book.description || ''
    })
    if (book.noFiles) return false
    return Vue.prototype.$exportBook(book, false, true)
  }).then((blob) => {
    if (!blob) return false
    return Vue.prototype.st().ref('books/' + book.manifest.id).child(hash + '.zip').put(blob, { contentType: 'application/zip' })
  }).then(() => {
    return context.dispatch('books/getCoverImage', book, { root: true })
  }).then((blob) => {
    return Vue.prototype.st().ref('books/' + book.manifest.id).child('cover.jpg').put(blob, { contentType: 'image/jpeg' })
  }).then(() => {
    context.commit('uploading', false)
    return true
  }).catch(error => {
    Vue.prototype.$q.notify(i18n.t(error.message))
    context.commit('uploading', false)
  })
}
