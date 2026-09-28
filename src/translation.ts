const languageKey = 'campus-event-language'
const translationCacheKey = 'campus-event-khmer-translations'
let selectedLanguage = localStorage.getItem(languageKey) === 'km' ? 'km' : 'en'
const textOriginals = new WeakMap<Text, string>()
const lastTranslatedTexts = new WeakMap<Text, string>()
const knownTextNodes = new Set<Text>()
const attributeOriginals = new WeakMap<Element, Map<string, string>>()
const lastTranslatedAttributes = new WeakMap<Element, Map<string, string>>()
const knownAttributeNodes = new Map<Element, Set<string>>()
const translationCache = new Map<string, string>()
let translationRun = 0
let mutationTimer: number | undefined

try {
  const cachedTranslations = JSON.parse(sessionStorage.getItem(translationCacheKey) ?? '{}') as Record<string, string>
  Object.entries(cachedTranslations).forEach(([source, translated]) => translationCache.set(source, translated))
} catch {
  sessionStorage.removeItem(translationCacheKey)
}

type TranslationTarget = {
  source: string
  apply: (translation: string) => void
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function translateRequestUrl(source: string) {
  const parameters = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'km', dt: 't', q: source })
  return `https://translate.googleapis.com/translate_a/single?${parameters.toString()}`
}

function collectTextTargets() {
  const targets: TranslationTarget[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()

  while (node) {
    const textNode = node as Text
    const parent = textNode.parentElement
    if (parent && !parent.closest('script,style,noscript,svg,textarea,select,.khmer,.notranslate,#google_translate_element,[aria-hidden="true"]')) {
      const current = textNode.nodeValue ?? ''
      const lastTranslated = lastTranslatedTexts.get(textNode)
      if (lastTranslated !== undefined && current !== lastTranslated) {
        textOriginals.set(textNode, current)
        lastTranslatedTexts.delete(textNode)
      }
      const original = textOriginals.get(textNode) ?? current
      if (!textOriginals.has(textNode)) textOriginals.set(textNode, original)
      knownTextNodes.add(textNode)
      const source = normalizeText(original)
      if (/[A-Za-z]/.test(source)) {
        const leading = original.match(/^\s*/)?.[0] ?? ''
        const trailing = original.match(/\s*$/)?.[0] ?? ''
        targets.push({
          source,
          apply: (translation) => {
            const value = `${leading}${translation.trim()}${trailing}`
            textNode.nodeValue = value
            lastTranslatedTexts.set(textNode, value)
          },
        })
      }
    }
    node = walker.nextNode()
  }

  const attributeNames = ['alt', 'placeholder', 'title', 'aria-label']
  document.querySelectorAll<HTMLElement>('img[alt],input[placeholder],textarea[placeholder],[title],[aria-label]').forEach((element) => {
    if (element.closest('#google_translate_element,[data-language-control],.notranslate')) return
    attributeNames.forEach((attribute) => {
      const current = element.getAttribute(attribute)
      if (current === null) return
      let originals = attributeOriginals.get(element)
      if (!originals) {
        originals = new Map()
        attributeOriginals.set(element, originals)
      }
      let lastValues = lastTranslatedAttributes.get(element)
      if (!lastValues) {
        lastValues = new Map()
        lastTranslatedAttributes.set(element, lastValues)
      }
      const lastTranslated = lastValues.get(attribute)
      if (lastTranslated !== undefined && current !== lastTranslated) {
        originals.set(attribute, current)
        lastValues.delete(attribute)
      }
      const original = originals.get(attribute) ?? current
      if (!originals.has(attribute)) originals.set(attribute, original)
      let known = knownAttributeNodes.get(element)
      if (!known) {
        known = new Set()
        knownAttributeNodes.set(element, known)
      }
      known.add(attribute)
      const source = normalizeText(original)
      if (!/[A-Za-z]/.test(source)) return
      const leading = original.match(/^\s*/)?.[0] ?? ''
      const trailing = original.match(/\s*$/)?.[0] ?? ''
      targets.push({
        source,
        apply: (translation) => {
          const value = `${leading}${translation.trim()}${trailing}`
          element.setAttribute(attribute, value)
          lastValues.set(attribute, value)
        },
      })
    })
  })

  return targets
}

function restoreEnglish() {
  knownTextNodes.forEach((node) => {
    if (node.isConnected) node.nodeValue = textOriginals.get(node) ?? node.nodeValue
    lastTranslatedTexts.delete(node)
  })
  knownAttributeNodes.forEach((attributes, element) => {
    if (!element.isConnected) return
    attributes.forEach((attribute) => {
      const original = attributeOriginals.get(element)?.get(attribute)
      if (original !== undefined) element.setAttribute(attribute, original)
    })
    lastTranslatedAttributes.delete(element)
  })
}

function saveTranslationCache() {
  try {
    sessionStorage.setItem(translationCacheKey, JSON.stringify(Object.fromEntries(translationCache)))
  } catch {
    // Translation still works for the current page if session storage is unavailable.
  }
}

async function translateText(source: string) {
  const response = await fetch(translateRequestUrl(source))
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`)
  const payload = await response.json() as unknown[]
  const segments = Array.isArray(payload[0]) ? payload[0] as unknown[][] : []
  return segments.map((segment) => {
    return typeof segment[0] === 'string' ? segment[0] : ''
  }).join('').trim()
}

async function translatePageToKhmer() {
  const run = ++translationRun
  const targetsBySource = new Map<string, TranslationTarget[]>()
  collectTextTargets().forEach((target) => {
    const targets = targetsBySource.get(target.source) ?? []
    targets.push(target)
    targetsBySource.set(target.source, targets)
  })

  const uncached = Array.from(targetsBySource.keys()).filter((source) => !translationCache.has(source))
  targetsBySource.forEach((targets, source) => {
    const translated = translationCache.get(source)
    if (translated !== undefined) targets.forEach((target) => target.apply(translated))
  })

  for (let index = 0; index < uncached.length; index += 6) {
    const results = await Promise.allSettled(uncached.slice(index, index + 6).map(async (source) => {
      const translated = await translateText(source)
      translationCache.set(source, translated)
      if (selectedLanguage === 'km' && run === translationRun) {
        targetsBySource.get(source)?.forEach((target) => target.apply(translated))
      }
    }))
    saveTranslationCache()
    if (results.some((result) => result.status === 'rejected')) {
      console.warn('Some page text could not be translated. Check the network connection and retry Khmer.')
    }
  }
}

function setLanguage(language: string) {
  selectedLanguage = language === 'km' ? 'km' : 'en'
  localStorage.setItem(languageKey, selectedLanguage)
  document.documentElement.lang = selectedLanguage

  const englishRadio = document.querySelector<HTMLInputElement>('#english')
  const khmerRadio = document.querySelector<HTMLInputElement>('#khmer')
  if (englishRadio && khmerRadio) {
    englishRadio.checked = selectedLanguage === 'en'
    khmerRadio.checked = selectedLanguage === 'km'
  }

  const currentLabel = document.querySelector<HTMLElement>('[data-language-current]')
  if (currentLabel) currentLabel.textContent = selectedLanguage === 'km' ? '🇰🇭 Khmer' : '🇬🇧 English'
  document.body.classList.toggle('translated-ltr', selectedLanguage === 'km')
  if (selectedLanguage === 'km') void translatePageToKhmer()
  else {
    translationRun += 1
    restoreEnglish()
  }
}

function addLanguageControl() {
  const header = document.querySelector<HTMLElement>('#detail-site-header') ?? document.querySelector<HTMLElement>('body > div > header')
  if (!header || header.querySelector('[data-language-control]')) return

  const control = document.createElement('details')
  control.className = 'relative ml-auto shrink-0'
  control.setAttribute('data-language-control', '')
  control.innerHTML = `<summary class="list-none cursor-pointer flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-full text-xs font-semibold text-slate-700"><span data-language-current></span><span aria-hidden="true" class="text-gray-400">▼</span></summary><div class="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50"><button type="button" data-language="en" class="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">🇬🇧 English</button><button type="button" data-language="km" class="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">🇰🇭 Khmer</button></div>`
  const loginLink = header.querySelector('#auth-login-link, #detail-login-link')
  if (loginLink) loginLink.before(control)
  else header.querySelector('div')?.append(control)

  control.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      setLanguage(button.dataset.language ?? 'en')
      control.open = false
    })
  })
}

export function initializeTranslation() {
  document.documentElement.lang = selectedLanguage
  const englishRadio = document.querySelector<HTMLInputElement>('#english')
  const khmerRadio = document.querySelector<HTMLInputElement>('#khmer')

  if (englishRadio && khmerRadio) {
    englishRadio.checked = selectedLanguage === 'en'
    khmerRadio.checked = selectedLanguage === 'km'
    englishRadio.addEventListener('change', () => englishRadio.checked && setLanguage('en'))
    khmerRadio.addEventListener('change', () => khmerRadio.checked && setLanguage('km'))
  } else {
    addLanguageControl()
  }

  const currentLabel = document.querySelector<HTMLElement>('[data-language-current]')
  if (currentLabel) currentLabel.textContent = selectedLanguage === 'km' ? '🇰🇭 Khmer' : '🇬🇧 English'

  const translationStyles = document.createElement('style')
  translationStyles.textContent = 'body.translated-ltr :is(p,h1,h2,h3,h4,h5,h6,a,button,label,span,li,td,th,input,textarea){font-family:"Kantumruy Pro",sans-serif!important}'
  document.head.append(translationStyles)

  const observer = new MutationObserver(() => {
    if (selectedLanguage === 'km') {
      if (mutationTimer !== undefined) window.clearTimeout(mutationTimer)
      mutationTimer = window.setTimeout(() => void translatePageToKhmer(), 150)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  document.body.classList.toggle('translated-ltr', selectedLanguage === 'km')
  if (selectedLanguage === 'km') void translatePageToKhmer()
}
