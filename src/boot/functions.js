import { version } from '../../package.json'
import { date } from 'quasar'

import panZoom from 'vue-panzoom'
export default ({ app, store, Vue }) => {
  Vue.use(panZoom)
  Vue.prototype.$keys = (obj) => {
    var keys = []
    for (var key in obj) {
      keys.push(key)
    }
    return keys
  }
  Vue.prototype.$version = () => {
    return version
  }
  Vue.prototype.$slugify = (text, noTrim) => {
    const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
    const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
    var result = text.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w-]+/g, '') // Remove all non-word characters
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
    if (!noTrim) result = result.replace(/-+$/, '') // Trim - from end of text
    return result
  }
  Vue.prototype.$clone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
  Vue.prototype.$formatDate = (dateString, format) => {
    if (!dateString) return ''
    if (!format) format = 'D MMM YYYY'
    return date.formatDate(new Date(dateString), format)
  }
  Vue.prototype.$ellipsis = (text, length) => {
    if (text.length > length) {
      return text.substr(0, length) + '...'
    }
    return text
  }
  Vue.prototype.$translate = (q, source, target) => {
    // q = encodeURIComponent(q)
    const data = new FormData()
    data.append('json', JSON.stringify({ text: q }))
    return Vue.prototype.$axios.get('https://samepagedemo.com/translate/?from=' + source + '&to=' + target + '&q=' + encodeURI(q)).then((response) => {
      // console.log(response)
      return response.data
    }).then(text => {
      return text
    })
  }
  Vue.prototype.$translateMS = (q, source, target) => {
    // q = encodeURIComponent(q)
    return Vue.prototype.$axios({
      baseURL: 'https://api.cognitive.microsofttranslator.com/',
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': '',
        'Ocp-Apim-Subscription-Region': 'westeurope',
        'Content-type': 'application/json'
      },
      params: {
        'api-version': '3.0',
        from: source,
        to: [target]
      },
      data: [{
        text: q
      }],
      responseType: 'json'
    }).then((response) => {
      return response.data[0].translations[0].text
    })
  }
  Vue.prototype.$translate2 = (q, source, target) => {
    // q = encodeURIComponent(q)
    return Vue.prototype.$axios({
      baseURL: 'https://samepagedemo.com',
      url: '/translate',
      method: 'post',
      params: {
        from: source,
        to: target
      },
      data: {
        text: q
      },
      responseType: 'json',
      crossdomain: true
    }).then((response) => {
      return response.data[0].translations[0].text
    })
  }
  Vue.prototype.$ner = (text, language) => {
    console.log(text, language)
    const q = encodeURIComponent(text)
    return Vue.prototype.$axios({
      baseURL: 'https://babelfy.io/v1/',
      url: '/disambiguate?text=' + q + '&lang=' + language.toUpperCase() + '&annType=NAMED_ENTITIES&key=',
      method: 'get',
      responseType: 'json'
    }).then((response) => {
      console.log(response.data)
      return response.data.filter(entity => entity.DBpediaURL && entity.score > 0).map(entity => {
        return {
          ...entity,
          text: (text.substr(entity.charFragment.start, entity.charFragment.end - entity.charFragment.start + 1))
        }
      })
    })
  }
  Vue.prototype.$translateGoogle = (q, source, target) => {
    return window.fetch('https://libretranslate.de/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: q,
        source: source,
        target: target
      }),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      return res.json()
    }).then(data => {
      return data.translatedText
    })
  }
  Vue.prototype.$translateLibre = (q, source, target) => {
    return window.fetch('https://libretranslate.de/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: q,
        source: source,
        target: target
      }),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      return res.json()
    }).then(data => {
      return data.translatedText
    })
  }
}
