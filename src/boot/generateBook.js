export default ({ app, store, Vue }) => {
  Vue.prototype.$addBook = (bookId) => {
    var book = {
      id: bookId
    }
    let bookType = ''
    return Vue.prototype.$getBookType(bookId).then(type => {
      bookType = type
      return Vue.prototype.$getManifest(bookId, bookType)
    }).then(manifest => {
      book = {
        ...book,
        manifest: {
          toc: manifest.toc || [],
          resources: manifest.resources || [],
          metadata: manifest.metadata || {}
        }
      }
      return Vue.prototype.$getContent(bookId, bookType)
    }).then(data => {
      if (!data) return false
      book = { ...book, ...data }
      return Vue.prototype.$parseManifest(book)
    }).then(book => {
      if (book.toc && book.pages) {
        book.toc = Vue.prototype.$getPageNumbers(book.toc, book.pages)
      }
      if (!book.manifest.id) book.manifest.id = book.id
      if (!book.manifest.toc || book.manifest.toc.length === 0) {
        book.manifest.toc = book.toc
      }
      return store.dispatch('books/addBook', book)
    })
  }
  Vue.prototype.$getBookType = (bookId) => {
    return Vue.prototype.$axios.get('books/' + bookId + '/tei.xml').then(result => {
      if (!result.data || result.data.substr(0, 15) === '<!DOCTYPE html>') {
        throw new Error('not tei')
      }
      return 'tei'
    }).catch(() => {
      return Vue.prototype.$axios.get('books/' + bookId + '/content.opf').then(result => {
        if (!result.data || result.data.substr(0, 15) === '<!DOCTYPE html>') {
          throw new Error('not epub')
        }
        return 'epub'
      }).catch(err => {
        console.error(err)
        return false
      })
    })
  }
  Vue.prototype.$getXML = (xmlString) => {
    var source = null
    if (window.DOMParser) {
      var parser = new DOMParser()
      source = parser.parseFromString(Vue.prototype.$replaceSelfClosingTags(xmlString), 'text/html')
    } else if (window.ActiveXObject) {
      // Internet Explorer
      source = new window.ActiveXObject('Microsoft.XMLDOM')
      source.async = false
      source.loadXML(xmlString)
    }
    return source
  }
  Vue.prototype.$getXMLString = (xml) => {
    var xmlString = ''
    if (window.XMLSerializer) {
      xmlString = (new window.XMLSerializer()).serializeToString(xml)
    } else if (window.ActiveXObject) {
      xmlString = xml.xml
    }
    return xmlString
  }
  Vue.prototype.$replaceSelfClosingTags = (xml) => {
    var split = xml.split('/>')
    var newXml = ''
    for (var i = 0; i < split.length - 1; i++) {
      var edsplit = split[i].split('<')
      newXml += split[i] + '></' + edsplit[edsplit.length - 1].split(' ')[0] + '>'
    }
    return newXml + split[split.length - 1]
  }
  Vue.prototype.$parseHTML = (xml, tags) => {
    var toc = []
    var source = Vue.prototype.$getXML(xml)
    var elements = source.querySelectorAll(Object.values(tags).map(tag => tag.selector).join(','))
    var page = 0
    var chapter = ''
    var notes = []
    for (var element of elements) {
      if (tags.annotation && element.matches(tags.annotation.selector)) {
        var parent = element.parentNode
        var fragment = ''
        for (const childNode of parent.childNodes) {
          if (typeof childNode.id === 'undefined') {
            fragment = childNode.textContent
          }
          if (childNode === element) {
            break
          }
        }
        var note = {
          place: element.getAttribute('place'),
          n: element.getAttribute('n') || '',
          content: element.innerHTML,
          excerpt: element.innerText.length > 200 ? element.innerText.substr(0, 197) + '...' : element.innerText,
          chapter: chapter,
          page: page,
          fragment: '' + fragment
        }
        notes.push(note)
      }
      if (tags.pagebreak && element.matches(tags.pagebreak.selector)) {
        page = element.getAttribute(tags.pagebreak.number)
        element.innerText = page
      }
      if (tags.replace) {
        for (const tag in tags.replace) {
          if (element.matches(tag)) {
            element.tagName = tags.replace[tag]
          }
        }
      }
      if (tags.chapter && element.matches(tags.chapter.selector)) {
        let slug = ''
        for (var childNode of element.childNodes) {
          if (typeof childNode.id === 'undefined' && !slug) {
            slug = Vue.prototype.$slugify(childNode.textContent)
            chapter = slug
            var bookmark = document.createElement('a')
            bookmark.setAttribute('name', slug)
            element.after(bookmark)
            toc.push({
              href: '#' + slug,
              title: childNode.textContent,
              page: page
            })
          }
        }
      }
    }
    if (tags.annotation) {
      var toDelete = source.querySelectorAll(tags.annotation.selector)
      for (let i = 0; i < toDelete.length; i++) {
        toDelete[i].parentNode.removeChild(toDelete[i])
      }
    }
    return {
      reflow: Vue.prototype.$getXMLString(source),
      toc: toc,
      notes: notes
    }
  }
  Vue.prototype.$getPageNumbers = (toc, pages) => {
    toc.forEach(chapter => {
      if (chapter.page) {
        chapter.pageIndex = pages.findIndex(page => page.nr === chapter.page)
      }
    })
    return toc
  }
  Vue.prototype.$getManifest = (bookId, type) => {
    if (type === 'epub') {
      return Vue.prototype.$getManifestEpub(bookId)
    } else if (type === 'tei') {
      return Vue.prototype.$getManifestTei(bookId)
    } else {
      return false
    }
  }
  Vue.prototype.$getManifestTei = (bookId) => {
    return Vue.prototype.$axios.get('books/' + bookId + '/manifest.json').then(result => {
      return result.data
    }).catch(() => {
      return {
        resources: []
      }
    })
  }
  Vue.prototype.$getManifestEpub = (bookId) => {
    return Vue.prototype.$getFileContents('books/' + bookId, 'content.opf', 'metadata > *, item').then(items => {
      var manifest = {
        metadata: {},
        resources: []
      }
      for (const item of items) {
        if (item.matches('item')) {
          manifest.resources.push({
            rel: item.getAttribute('rel') || item.getAttribute('properties') || item.getAttribute('media-type').split('/')[0],
            href: item.getAttribute('href'),
            type: item.getAttribute('media-type')
          })
        } else if (item.nodeName.substr(0, 2) === 'DC') {
          var attribute = item.nodeName.substr(3).toLowerCase()
          if (manifest.metadata[attribute]) {
            if (!Array.isArray(manifest.metadata[attribute])) {
              manifest.metadata[attribute] = [manifest.metadata[attribute]]
            }
            manifest.metadata[attribute].push(item.innerText)
          } else {
            manifest.metadata[attribute] = item.innerText
          }
        }
      }
      return manifest
    }).catch(() => {
      return {
        resources: []
      }
    })
  }
  Vue.prototype.$parseManifest = (book) => {
    return new Promise((resolve, reject) => {
      var images = ((book.manifest && book.manifest.resources) || []).filter(resource => resource.rel === 'scans')
      var pageImages = []
      images.forEach(image => {
        var matches = image.href.match(/{#*}/g)
        if (matches.length > 0) {
          for (let page = 1; page <= book.pages.length; page++) {
            var pageString = String(page).padStart(matches[0].length - 2, '0')
            pageImages.push({ ...image, rel: 'scan', href: image.href.replace(matches[0], pageString), page: page })
          }
        }
      })
      book.manifest.resources = book.manifest.resources.concat(pageImages)
      var promises = []
      var files = []
      book.manifest.resources.filter(resource => ['cover-image', 'scan', 'image'].indexOf(resource.rel) >= 0).forEach(resource => {
        if (resource.href.substr(0, 4) !== 'http') {
          promises.push(window.fetch('books/' + book.id + '/' + resource.href).then((response) => {
            return response.blob()
          }).then(blob => {
            files.push({ name: resource.href, blob: blob })
            return true
          }))
        }
      })
      if (!book.manifest.settings) {
        book.manifest.settings = {
          showScans: false,
          showImages: true,
          showHTML: false,
          reflowWidth: 40,
          reflowFontSize: 1,
          reflowLineHeight: 1.3,
          reflowFontFamily: 'serif',
          fixedFontSize: 0.75,
          fixedLineHeight: 1.3,
          fixedLetterSpacing: 0,
          fixedWidth: 20,
          scanScale: 100,
          scanPageOffset: 0,
          scanPageTopMargin: 4
        }
      }
      return Promise.all(promises).finally(() => {
        return store.dispatch('books/addFiles', { bookId: book.id, files: files })
      }).then(() => {
        resolve(book)
        return book
      })
    })
  }
  Vue.prototype.$getContent = (bookId, type) => {
    if (type === 'epub') {
      return Vue.prototype.$getEpub(bookId)
    } else if (type === 'tei') {
      return Vue.prototype.$getTei(bookId)
    } else {
      return false
    }
  }
  Vue.prototype.$getTei = (bookId) => {
    let book = false
    return Vue.prototype.$axios.get('books/' + bookId + '/tei.xml').then(result => {
      book = Vue.prototype.$parseHTML(result.data, { annotation: { selector: 'note' }, chapter: { selector: 'h3' }, pagebreak: { selector: 'pb', number: 'n' } }) // .replace(/<pb n="([0-9a-zA-Z-]*)"/ig, '<a name="$1"></a><pb n="$1"')
      const tei = document.createElement('div')
      tei.innerHTML = book.reflow
      return Vue.prototype.$extractPages(tei, { selector: 'pb', number: 'n' }, bookId)
    }).then(pages => {
      book.pages = pages
      return book
    })
  }
  Vue.prototype.$getFileContents = (path, file, selector) => {
    return Vue.prototype.$axios.get(path + '/' + file).then(result => {
      var element = Vue.prototype.$getXML(result.data.replace(/src="images/ig, 'src="' + path + '/images'))
      var elements = selector ? element.querySelectorAll(selector) : (element.querySelector('body') || element)
      return elements
    })
  }
  Vue.prototype.$getEpub = (bookId) => {
    let html = ''
    let book = false
    return Vue.prototype.$getFileContents('books/' + bookId, 'nav.xhtml', '[epub\\:type=toc] [href]').then(files => {
      var promises = []
      for (const file of files) {
        promises.push(Vue.prototype.$getFileContents('books/' + bookId, file.getAttribute('href')).then(body => {
          html += body.innerHTML
        }))
      }
      return Promise.all(promises)
    }).then(() => {
      book = Vue.prototype.$parseHTML(html, { chapter: { selector: 'h3' }, pagebreak: { selector: '[epub\\:type="pagebreak"]', number: 'id' } }) // .replace(/<pb n="([0-9a-zA-Z-]*)"/ig, '<a name="$1"></a><pb n="$1"')
      var epub = document.createElement('div')
      epub.innerHTML = book.reflow
      return Vue.prototype.$extractPages(epub, { selector: '[epub\\:type="pagebreak"]', number: 'id' }, bookId)
    }).then(pages => {
      book.pages = pages
      return book
    })
  }
  Vue.prototype.$getImageUrls = (bookId, html) => {
    return new Promise((resolve, reject) => {
      if (typeof html === 'string') {
        const obj = document.createElement('div')
        obj.innerHTML = html
        html = obj
      }
      const images = html.querySelectorAll('img')
      const promises = []
      for (let i = 0; i < images.length; i++) {
        promises.push(store.dispatch('books/getResource', { bookId: bookId, href: images[i].getAttribute('src') }).then(blob => {
          if (!blob) return true
          images[i].setAttribute('src', window.URL.createObjectURL(blob))
          return true
        }))
      }
      resolve(Promise.all(promises).then(() => {
        return html
      }))
    })
  }
  Vue.prototype.$extractPages = (source, pagebreak, bookId) => {
    return new Promise((resolve, reject) => {
      source = source.cloneNode(true)
      source.style.display = 'block'
      var data = Vue.prototype.$loopPages(source, { page: 0, pageList: [] }, pagebreak)
      const pages = []
      data.pageList.forEach((page, index) => {
        var pageLayer = data.element.cloneNode(true)
        pageLayer.setAttribute('p', page)
        var toDelete = pageLayer.querySelectorAll('*:not([page*=",' + page + ',"])')
        for (let i = 0; i < toDelete.length; i++) {
          toDelete[i].parentNode.removeChild(toDelete[i])
        }
        pageLayer.removeAttribute('page')
        var elements = pageLayer.querySelectorAll('[page]')
        for (let i = 0; i < elements.length; i++) {
          elements[i].removeAttribute('page')
        }
        var paragraphObjects = pageLayer.querySelectorAll('p[id]')
        const paragraphs = []
        for (let i = 0; i < paragraphObjects.length; i++) {
          paragraphs.push(paragraphObjects[i].getAttribute('id'))
        }
        pages.push({
          html: pageLayer.innerHTML.replace(/\n+/g, '\n').trim(),
          nr: page,
          paragraphs: paragraphs,
          index: index
        })
      })
      resolve(pages)
    })
  }
  Vue.prototype.$loopPages = (element, options, pagebreak) => {
    if (element.childNodes && element.childNodes.length > 0) {
      Vue.prototype.$splitElementOnPage(element, pagebreak)
      for (var i = 0; i < element.childNodes.length; i++) {
        let child = element.childNodes[i]
        if (child.matches && child.matches(pagebreak.selector)) {
          options.page = child.getAttribute(pagebreak.number)
          if (options.pageList.indexOf(options.page) < 0) options.pageList.push(options.page)
        }
        child = Vue.prototype.$loopPages(child, options, pagebreak).element
        Vue.prototype.$setPage(child, options.page)
      }
    }
    return {
      element: element,
      ...options
    }
  }
  Vue.prototype.$splitElementOnPage = (element, pagebreak) => {
    var sections = document.createElement('div')
    var section = document.createElement('div')
    for (const child of element.childNodes) {
      if (child.matches && child.matches(pagebreak.selector)) {
        if (section.childNodes && section.childNodes.length > 0) {
          sections.append(section)
        }
        sections.append(child.cloneNode(true))
        section = document.createElement('div')
      } else {
        section.append(child.cloneNode(true))
      }
    }
    if ((section.childNodes && section.childNodes.length > 0) && section.innerHTML.trim()) {
      sections.append(section)
    }
    if (sections.childNodes && sections.childNodes.length > 1 && section.innerHTML.trim()) {
      while (element.firstChild) {
        element.removeChild(element.lastChild)
      }
      for (const child of sections.childNodes) {
        element.append(child.cloneNode(true))
      }
    }
  }
  Vue.prototype.$setPage = (element, page) => {
    if (!element || !element.getAttribute) return false
    var value = (element.getAttribute('page') || '').split(',').filter(value => value)
    if (value.indexOf(page) < 0) value.push(page)
    element.setAttribute('page', ',' + value.join(',') + ',')
    Vue.prototype.$setPage(element.parentNode, page)
  }
  Vue.prototype.$findPageNumber = (element) => {
    if (element.getAttribute('page')) {
      return element.getAttribute('page')
    } else {
      return Vue.prototype.$findPageNumber(element.parentNode)
    }
  }
}
