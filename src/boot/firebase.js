import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
import 'firebase/compat/storage'
import 'firebase/compat/auth'

import { config } from './firebaseConfig.js'

firebase.initializeApp(config)

export default async ({ Vue, store }) => {
  Vue.prototype.auth = firebase.auth
  Vue.prototype.db = firebase.database
  Vue.prototype.fs = firebase.firestore
  Vue.prototype.st = firebase.storage
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log(user)
      store.dispatch('cloud/init')
    }
  })
}
