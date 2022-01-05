import JSZip from 'jszip'
import { saveAs } from 'file-saver'
export default ({ app, store, Vue }) => {
  Vue.prototype.$importBook = (e) => {
    if (typeof e === 'string') {
      return Vue.prototype.$importBookRemote(e)
    } else {
      return Vue.prototype.$importBookFile(e)
    }
  }
  Vue.prototype.$importBookRemote = (url, revision) => {
    return new Promise((resolve, reject) => {
      return Vue.prototype.$axios.get(url, { responseType: 'blob' }).then(response => {
        var reader = new FileReader()
        reader.onload = (e) => {
          resolve(Vue.prototype.$extractBook(reader.result, revision))
        }
        reader.readAsBinaryString(response.data)
      })
    })
  }
  Vue.prototype.$importBookFile = (e) => {
    return new Promise((resolve, reject) => {
      console.log(e.files)
      for (var file of e.files) {
        var reader = new FileReader()
        reader.onload = (e) => {
          resolve(Vue.prototype.$extractBook(reader.result))
        }
        reader.readAsBinaryString(file)
      }
    })
  }
  Vue.prototype.$extractBook = (data, revision) => {
    const book = {
      manifest: {
        resources: []
      },
      content: ''
    }
    if (revision && revision.id) {
      book.manifest.revision = revision.id
      book.revision = revision
    }
    const contentFiles = []
    let root = ''
    return JSZip.loadAsync(data).then(zip => {
      return new Promise((resolve, reject) => {
        zip.forEach((path, entry) => {
          const destination = path.split('/')[path.split('/').length - 1]
          if (destination === 'manifest.json') {
            root = path.substr(0, path.length - destination.length)
            resolve(entry.async('text').then(text => {
              book.manifest = JSON.parse(text)
              book.id = book.manifest.id
              console.log(revision)
              if (revision && revision.id) {
                book.manifest.revision = revision.id
                book.revision = revision
                book.id += '-' + book.manifest.revision
              }
              console.log(book.id)
            }))
            return true
          }
          if (destination.split('.').pop() === 'opf') {
            root = path.substr(0, path.length - destination.length)
            resolve(entry.async('text').then(text => {
              return Vue.prototype.$getXML(text)
            }).then(dom => {
              book.manifest = {
                resources: [],
                metadata: {},
                type: 'epub'
              }
              let metadata = dom.querySelector('metadata')
              if (!metadata) metadata = dom.querySelector('opf\\3Ametadata')
              metadata.childNodes.forEach(child => {
                if (child.tagName) {
                  const tag = child.tagName.split(':')[child.tagName.split(':').length - 1].toLowerCase()
                  book.manifest.metadata[tag] = child.textContent
                }
              })
              dom.querySelector('manifest').childNodes.forEach(child => {
                if (child.tagName) {
                  if (child.getAttribute('media-type').substr(0, 5) === 'image') {
                    book.manifest.resources.push({
                      rel: Vue.prototype.$isCoverImage(child) ? 'cover-image' : 'image',
                      href: child.getAttribute('href'),
                      type: child.getAttribute('media-type')
                    })
                  }
                  if (child.getAttribute('media-type') === 'application/xhtml+xml') {
                    contentFiles.push({
                      href: child.getAttribute('href'),
                      text: ''
                    })
                  }
                }
              })
              book.id = Vue.prototype.$slugify(book.manifest.metadata.title)
              book.manifest.id = book.id
              if (book.manifest.revision) book.id += '-' + book.manifest.revision
            }))
            return true
          } else if (destination === 'pcgts.xml') {
            root = path.substr(0, path.length - destination.length)
            resolve(entry.async('text').then(text => {
              return Vue.prototype.$getXML(text)
            }).then(dom => {
              const pages = dom.querySelectorAll('Page')
              const content = document.createElement('div')
              for (let i = 0; i < pages.length; i++) {
                if (pages[i].tagName) {
                  const pageDimensions = [pages[i].getAttribute('imageWidth') * 1, pages[i].getAttribute('imageHeight') * 1]
                  const regions = pages[i].querySelectorAll('TextRegion')
                  const page = document.createElement('div')
                  page.setAttribute('data-page', i + 1)
                  if (!book.manifest.resources) {
                    book.manifest.resources = []
                  }
                  book.manifest.resources.push({
                    href: 'scans/' + pages[i].getAttribute('imageFilename'),
                    rel: 'scan',
                    type: 'image/jpeg',
                    page: i + 1
                  })
                  for (let j = 0; j < regions.length; j++) {
                    const regionCoordinatesOriginal = regions[j].querySelector('Coords').getAttribute('points').split(' ')
                    const regionCoordinates = []
                    regionCoordinates.push(regionCoordinatesOriginal[0].split(',').map((coordinate, index) => Math.round(10000 * coordinate / pageDimensions[index]) / 100).join(','))
                    regionCoordinates.push(regionCoordinatesOriginal[3].split(',').map((coordinate, index) => Math.round(10000 * coordinate / pageDimensions[index]) / 100).join(','))
                    regionCoordinates.push(regionCoordinatesOriginal[1].split(',').map((coordinate, index) => Math.round(10000 * coordinate / pageDimensions[index]) / 100).join(','))
                    regionCoordinates.push(regionCoordinatesOriginal[2].split(',').map((coordinate, index) => Math.round(10000 * coordinate / pageDimensions[index]) / 100).join(','))
                    const region = document.createElement('div')
                    region.setAttribute('data-region', regionCoordinates)
                    region.style.position = 'absolute'
                    region.style.left = regionCoordinates[0].split(',')[0] + '%'
                    region.style.top = regionCoordinates[0].split(',')[1] + '%'
                    region.style.width = regionCoordinates[3].split(',')[0] - regionCoordinates[0].split(',')[0] + '%'
                    region.style.height = regionCoordinates[3].split(',')[1] - regionCoordinates[0].split(',')[1] + '%'
                    let fontSize = 0
                    const lines = regions[j].querySelectorAll('TextLine')
                    for (let k = 0; k < lines.length; k++) {
                      const line = document.createElement('div')
                      const words = lines[k].querySelectorAll('Word')
                      const boundaries = []
                      const coordinates = { minX: 1000000, minY: 1000000, maxX: 0, maxY: 0 }
                      for (let l = 0; l < words.length; l++) {
                        const word = document.createElement('span')
                        word.innerText = words[l].querySelector(':scope > TextEquiv > Unicode').innerText + ' '
                        const wordCoordinates = words[l].querySelector('Coords').getAttribute('points').split(' ')
                        boundaries.push(wordCoordinates[0].split(',').map((coordinate, index) => Math.round(10000 * coordinate / pageDimensions[index]) / 100).join(','))
                        boundaries.push(wordCoordinates[2].split(',').map((coordinate, index) => Math.round(10000 * coordinate / pageDimensions[index]) / 100).join(','))
                        coordinates.minX = wordCoordinates.reduce((a, b) => Math.min(a, b.split(',')[0] / pageDimensions[0] * 1), coordinates.minX)
                        coordinates.maxX = wordCoordinates.reduce((a, b) => Math.max(a, b.split(',')[0] / pageDimensions[0] * 1), coordinates.maxX)
                        coordinates.minY = wordCoordinates.reduce((a, b) => Math.min(a, b.split(',')[1] / pageDimensions[1] * 1), coordinates.minY)
                        coordinates.maxY = wordCoordinates.reduce((a, b) => Math.max(a, b.split(',')[1] / pageDimensions[1] * 1), coordinates.maxY)
                        fontSize = Math.max(fontSize, Math.round(10000 * (wordCoordinates[2].split(',')[1] - wordCoordinates[0].split(',')[1]) / pageDimensions[0]) / 100)
                        word.setAttribute('data-word', (Math.round(10000 * wordCoordinates[0].split(',')[0] / pageDimensions[0]) / 100) + ',' + (Math.round(10000 * wordCoordinates[0].split(',')[1] / pageDimensions[1]) / 100) + ' ' + (Math.round(10000 * wordCoordinates[2].split(',')[0] / pageDimensions[0]) / 100) + ',' + (Math.round(10000 * wordCoordinates[2].split(',')[1] / pageDimensions[1]) / 100))
                        line.append(word)
                      }
                      line.setAttribute('data-words', boundaries.join(' '))
                      line.setAttribute('data-line', (Math.round(10000 * coordinates.minX) / 100) + ',' + (Math.round(10000 * coordinates.minY) / 100) + ' ' + (Math.round(10000 * coordinates.maxX) / 100) + ',' + (Math.round(10000 * coordinates.maxY) / 100))
                      // line.innerText = lines[k].querySelector(':scope > TextEquiv > Unicode').innerText // use when not per word, but per line
                      region.append(line)
                    }
                    region.style.fontSize = Math.max(1, fontSize) * 40 / 100 + 'em'
                    page.append(region)
                  }
                  content.append(page)
                }
              }
              book.content = content.innerHTML
            }))
            return true
          }
        })
        reject('no manifest')
      }).then(() => {
        var promises = []
        // var counter = 0
        var files = []
        zip.forEach((path, entry) => {
          let destination = path.replace(root, '')
          if (destination !== 'manifest.json' && destination !== 'content.html') {
            const manifestEntry = (book.manifest.resources || []).find(resource => resource.href === destination || (resource.json && resource.json.href === destination))
            console.log(destination, manifestEntry)
            if (manifestEntry) {
              if (manifestEntry.href === destination) {
                destination = destination.split('/').slice(-2).join('/')
              }
              promises.push(entry.async('blob').then(blob => {
                files.push({ name: destination, blob: blob })
                console.log(destination, blob)
                // counter++
                return true
              }))
            }
            const jsonResource = (book.manifest.resources || []).find(resource => resource.json && resource.json.href === destination)
            if (jsonResource) {
              promises.push(entry.async('text').then(text => {
                let json = JSON.parse(text)
                if (Array.isArray(json)) {
                  json = json.map(item => { return { ...item, resource: jsonResource.id } })
                }
                if (book[jsonResource.json.key] && Array.isArray(book[jsonResource.json.key])) {
                  book[jsonResource.json.key] = book[jsonResource.json.key].concat(json)
                } else if (book[jsonResource.json.key] && typeof book[jsonResource.json.key] === 'object') {
                  book[jsonResource.json.key] = { ...book[jsonResource.json.key], ...json }
                } else {
                  book[jsonResource.json.key] = json
                }
                return true
              }))
            }
          }
        })
        return Promise.all(promises).then(() => {
          console.log(book, files)
          return store.dispatch('books/addFiles', { bookId: book.manifest.id, files: files })
        }).then(() => {
          const promises = []
          if (typeof book.content === 'undefined') book.content = ''
          return new Promise((resolve, reject) => {
            zip.forEach((path, entry) => {
              const destination = path.replace(root, '')
              if (destination === 'content.html') {
                promises.push(entry.async('text').then(text => {
                  book.content = text
                }))
              } else if (destination === 'style.css') {
                promises.push(entry.async('text').then(text => {
                  book.style = text
                }))
              } else if (contentFiles.find(file => file.href === destination)) {
                const contentFile = contentFiles.find(file => file.href === destination)
                promises.push(entry.async('text').then(text => {
                  contentFile.text = text
                  return true
                }))
              }
            })
            if (promises.length === 0 && !book.content) {
              reject('no content')
            }
            return Promise.all(promises).then(() => {
              if (contentFiles.length > 0) {
                book.content = contentFiles.map((contentFile, index) => {
                  const html = document.createElement('div')
                  html.innerHTML = contentFile.text
                  let body = html.querySelector('body')
                  if (!body) body = html.querySelector('[epub\\:type="pagebreak"]')
                  return '<div data-page="' + (index + 1) + '">' + (body ? body.innerHTML : contentFile.text) + '</div>'
                }).join('')
              }
              resolve(true)
            })
          })
        }).then(() => {
          var html = document.createElement('div')
          html.innerHTML = book.content
          var pageNumbers = html.querySelectorAll('[data-page]')
          for (let i = 0; i < pageNumbers.length; i++) {
            if (pageNumbers[i].querySelectorAll('.pagenumber').length === 0) {
              const pageNumber = document.createElement('div')
              pageNumber.classList.add('pagenumber')
              pageNumber.textContent = pageNumbers[i].getAttribute('data-page')
              pageNumbers[i].prepend(pageNumber)
            }
          }
          const paragraphs = html.querySelectorAll('.pagenumber + div > *')
          const paragraphsWithId = html.querySelectorAll('p[id^=p-]')
          let id = 0
          for (let i = 0; i < paragraphsWithId.length; i++) {
            const pid = paragraphsWithId[i].getAttribute('id').replace('p-', '')
            if (!isNaN(pid)) {
              id = Math.max(id, pid)
            }
          }
          id++
          for (let i = 0; i < paragraphs.length; i++) {
            if (!paragraphs[i].getAttribute('id')) {
              paragraphs[i].setAttribute('id', 'p-' + (id))
              id++
            }
          }
          const options = book.manifest.type === 'epub' && book.content.indexOf('data-page=') < 0 ? { selector: '[epub\\:type="pagebreak"]', number: 'id' } : { selector: '[data-page]', number: 'data-page' }
          return Vue.prototype.$extractPages(html, options, book.id).then((pages) => {
            book.pages = pages
            return html // Vue.prototype.$getImageUrls(book.id, html.innerHTML)
          }).then((html) => {
            const divs = html.querySelectorAll('[data-words]')
            for (let i = 0; i < divs.length; i++) {
              divs[i].innerHTML = divs[i].innerText
              divs[i].removeAttribute('data-words')
            }
            const all = html.querySelectorAll('*')
            for (let i = 0; i < all.length; i++) {
              all[i].removeAttribute('data-region')
              all[i].removeAttribute('data-words')
              all[i].removeAttribute('data-line')
              all[i].removeAttribute('data-word')
              all[i].style.position = null
              all[i].style.left = null
              all[i].style.top = null
              all[i].style.width = null
              all[i].style.height = null
              all[i].style.fontSize = null
            }
            book.reflow = html.innerHTML
            return true
          })
        }).then(() => {
          return store.dispatch('books/addBook', book)
        }).then(() => {
          console.log(book)
          return book
        })
      })
    })
  }
  Vue.prototype.$isCoverImage = (element) => {
    return ['omslag', 'cover'].find(tag => {
      return element.getAttribute('id').indexOf(tag) >= 0
    })
  }
  Vue.prototype.$exportBook = (book, excludeScans, returnBlob) => {
    return new Promise((resolve, reject) => {
      console.log(book)
      const filename = book.manifest.metadata.title
      var zip = new JSZip()
      zip.file(filename + '/manifest.json', JSON.stringify(book.manifest, null, '\t'))
      if (book.history) zip.file(filename + '/history.json', JSON.stringify(book.history, null, '\t'))
      if (book.style) zip.file(filename + '/style.css', book.style)
      const content = book.pages ? book.pages.map(page => page.html).join('') : (book.content || '')
      zip.file(filename + '/content.html', content)
      zip.file(filename + '/audio.html', Vue.prototype.$generateAudioHTML(content))
      var promises = []
      book.manifest.resources.forEach(resource => {
        const local = resource.href.substr(0, 10).indexOf('//') < 0 && resource.rel !== 'scans' && (resource.rel !== 'scan' || !excludeScans)
        if (local) {
          if (resource.json && resource.json.href) {
            promises.push(store.dispatch('books/getResource', { bookId: book.id, href: resource.json.href }).then(blob => {
              if (blob) {
                zip.file(filename + '/' + resource.json.href, blob)
              }
            }).catch(() => {
              console.log('books/' + book.id + '/' + resource.json.href)
            }))
          }
          promises.push(store.dispatch('books/getResource', { bookId: book.id, href: resource.href }).then(blob => {
            if (blob) {
              zip.file(filename + '/' + resource.href, blob)
            }
          }).catch(() => {
            console.log('books/' + book.id + '/' + resource.href)
          }))
        }
      })
      return Promise.all(promises).then(() => {
        return zip.generateAsync({ type: 'blob' }).then((blob) => {
          if (returnBlob) {
            resolve(blob)
            return blob
          } else {
            saveAs(blob, Vue.prototype.$slugify(filename) + '.zip')
            resolve(true)
            return true
          }
        })
      })
    })
  }
  Vue.prototype.$generateAudioHTML = (content) => {
    const source = document.createElement('div')
    let result = '<div>'
    source.innerHTML = content
    let chapter = 0
    const pages = source.querySelectorAll('[data-page]')
    for (let i = 0; i < pages.length; i++) {
      const paragraphs = pages[i].querySelectorAll(':scope > *')
      for (let j = 0; j < paragraphs.length; j++) {
        if (paragraphs[j].tagName && paragraphs[j].tagName.toLowerCase() === 'h3') {
          // result += '</div>'
          chapter++
          result += '<span id="h-' + chapter + 's0">' + paragraphs[j].innerText.trim() + '</span>\n'
        } else if (paragraphs[j].tagName && paragraphs[j].tagName.toLowerCase() === 'p') {
          const id = paragraphs[j].getAttribute('id')
          if (id) {
            let counter = 1
            for (let l = 0; l < paragraphs[j].childNodes.length; l++) {
              const node = paragraphs[j].childNodes[l]
              const lines = node.textContent.split(/([,.;?][ \n])/ig)
              for (let k = 0; k < lines.length; k++) {
                if (k % 2 === 0) {
                  const text = (lines[k] + (lines.length > k + 1 ? lines[k + 1] : '')).trim()
                  if (text.match(/[a-z0-9]/ig)) {
                    result += '<span id="' + id + 's' + counter + '">' + text + '</span>\n'
                    counter++
                  }
                }
              }
            }
          }
        }
      }
    }
    return result
  }
}
