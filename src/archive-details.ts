import siteFooterMarkup from './site-footer.html?raw'
import pageHeaderMarkup from './page-header.html?raw'
import sidebarMarkup from './sidebar.html?raw'
import { initializeTranslation } from './translation'

type SavedEvent = {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  image: string
  detailsUrl?: string
}

const authenticated = localStorage.getItem('campus-event-authenticated') === 'true'
const email = localStorage.getItem('campus-event-user-email')
const admin = authenticated && localStorage.getItem('campus-event-role') === 'admin'
const eventSlug = location.pathname.split('/').pop()?.replace(/\.html$/, '') ?? 'event'
const main = document.querySelector<HTMLElement>('main')
const fontPreconnect = document.createElement('link')
fontPreconnect.rel = 'preconnect'
fontPreconnect.href = 'https://fonts.googleapis.com'
document.head.append(fontPreconnect)
const fontAssetsPreconnect = document.createElement('link')
fontAssetsPreconnect.rel = 'preconnect'
fontAssetsPreconnect.href = 'https://fonts.gstatic.com'
fontAssetsPreconnect.crossOrigin = 'anonymous'
document.head.append(fontAssetsPreconnect)
const fontStylesheet = document.createElement('link')
fontStylesheet.rel = 'stylesheet'
fontStylesheet.href = 'https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&display=swap'
document.head.append(fontStylesheet)
const languageStyles = document.createElement('style')
languageStyles.textContent = '.khmer { display: none; font-family: "Kantumruy Pro", sans-serif; }'
document.head.append(languageStyles)
const oldMobileHeader = Array.from(document.body.children).find((child) => child instanceof HTMLElement && child.classList.contains('sm:hidden') && child.classList.contains('flex'))
oldMobileHeader?.remove()
main?.querySelector('header')?.remove()
const headerMount = document.createElement('div')
headerMount.innerHTML = pageHeaderMarkup
document.body.prepend(...Array.from(headerMount.childNodes))
const headerStyles = document.createElement('style')
headerStyles.textContent = 'body{padding-top:68px!important}@media(min-width:640px){body{padding-top:76px!important}}'
document.head.append(headerStyles)
const menuControl = document.createElement('input')
menuControl.type = 'checkbox'
menuControl.id = 'menu'
document.body.prepend(menuControl)
const oldSidebar = document.querySelector('body > aside')
const sidebarMount = document.createElement('div')
sidebarMount.id = 'sidebar-mount'
sidebarMount.innerHTML = sidebarMarkup
oldSidebar?.replaceWith(sidebarMount)
const sidebarStyles = document.createElement('style')
sidebarStyles.textContent = '#menu{position:absolute;opacity:0;pointer-events:none}#sidebar{transform:translateX(-110%);transition:transform .25s ease}body:has(#menu:checked) #sidebar,body.event-sidebar-open #sidebar{transform:translateX(0)!important}#overlay{display:none}body:has(#menu:checked) #overlay,body.event-sidebar-open #overlay{display:block}@media(min-width:768px){#sidebar{transform:translateX(0);position:sticky}#overlay{display:none!important}}'
document.head.append(sidebarStyles)
const updateMobileMenu = () => {
  const isDesktop = window.matchMedia('(min-width: 768px)').matches
  const isOpen = menuControl.checked
  const sidebar = document.querySelector<HTMLElement>('#sidebar')
  const overlay = document.querySelector<HTMLElement>('#overlay')
  document.body.classList.toggle('event-sidebar-open', isOpen)
  if (sidebar) sidebar.style.transform = isDesktop || isOpen ? 'translateX(0)' : 'translateX(-110%)'
  if (overlay) overlay.style.display = !isDesktop && isOpen ? 'block' : 'none'
}
menuControl.addEventListener('change', updateMobileMenu)
document.querySelector<HTMLLabelElement>('#overlay')?.addEventListener('click', (event) => {
  event.preventDefault()
  menuControl.checked = false
  updateMobileMenu()
})
const mobileMenuButton = document.querySelector<HTMLButtonElement>('button[aria-label="More"]')
  ?? document.querySelector<HTMLButtonElement>('.flex.sm\\:hidden button')
if (mobileMenuButton) {
  mobileMenuButton.setAttribute('aria-label', 'Open navigation menu')
  mobileMenuButton.innerHTML = '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  mobileMenuButton.addEventListener('click', () => {
    menuControl.checked = !menuControl.checked
    updateMobileMenu()
  })
}
updateMobileMenu()
document.querySelector('#detail-login-link')?.classList.toggle('hidden', authenticated)
const activePage = '/events.html'
document.querySelectorAll<HTMLAnchorElement>('.sidebar-link').forEach((link) => {
  if (new URL(link.href).pathname === activePage) link.setAttribute('aria-current', 'page')
})
document.querySelector('#my-events-link')?.classList.toggle('hidden', !authenticated)
document.querySelector('#add-event-link')?.classList.toggle('hidden', !admin)
document.querySelector('#admin-users-link')?.classList.toggle('hidden', !admin)
document.querySelector('#auth-logout-link')?.classList.toggle('hidden', !authenticated)
main?.querySelector('footer')?.remove()
if (main) {
  const footerMount = document.createElement('div')
  footerMount.innerHTML = siteFooterMarkup
  main.append(...Array.from(footerMount.childNodes))
}
document.querySelectorAll<HTMLElement>('[data-footer-authenticated]').forEach((link) => {
  link.classList.toggle('hidden', !authenticated)
  link.classList.toggle('block', authenticated)
})
document.querySelectorAll<HTMLElement>('[data-footer-admin]').forEach((link) => {
  link.classList.toggle('hidden', !admin)
  link.classList.toggle('block', admin)
})
const detailSearch = document.querySelector<HTMLInputElement>('#event-detail-search')
detailSearch?.addEventListener('input', () => {
  const query = detailSearch.value.trim().toLowerCase()
  const relatedHeading = Array.from(main?.querySelectorAll('h2') ?? []).find((heading) => heading.textContent?.trim() === 'Other Campus Events')
  const relatedSection = relatedHeading?.closest('section')
  relatedSection?.querySelectorAll<HTMLAnchorElement>('a[href$=".html"]').forEach((link) => {
    const card = link.closest<HTMLElement>('.card') ?? link.closest<HTMLElement>('.bg-white.rounded-2xl.transition')
    if (card) card.style.display = card.textContent?.toLowerCase().includes(query) ? '' : 'none'
  })
})
detailSearch?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  const query = detailSearch.value.trim()
  if (query) location.href = `/events.html?search=${encodeURIComponent(query)}`
})
const title = main?.querySelector('h1')?.textContent?.trim() ?? 'Campus Event'
const image = main?.querySelector<HTMLImageElement>('img')
const aboutHeading = Array.from(main?.querySelectorAll('h2') ?? []).find((heading) => heading.textContent?.trim() === 'About the Event')
const aboutSection = aboutHeading?.closest('section')
const description = aboutSection?.querySelector('p')?.textContent?.trim() ?? `Join us for ${title} at the campus.`
const date = eventSlug === 'workshop' ? '2025-04-28' : '2026-04-25'
const time = eventSlug === 'workshop' ? '10:00' : '08:00'

function saveToMyEvents() {
  if (!authenticated || !email) {
    location.href = '../index.html#view-login'
    return
  }

  const storageKey = `campus-event-favorites-${email}`
  const savedEvents = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as SavedEvent[]
  const savedEvent: SavedEvent = {
    id: `archive-${eventSlug}`,
    title,
    date,
    time,
    location: 'Central Campus Quad & Great Lawn',
    description,
    image: image ? new URL(image.getAttribute('src') ?? image.src, location.href).pathname : '/img/Rectangle 87.png',
    detailsUrl: location.pathname,
  }

  if (!savedEvents.some((event) => event.id === savedEvent.id)) {
    localStorage.setItem(storageKey, JSON.stringify([...savedEvents, savedEvent]))
  }
  location.href = '../my-events.html'
}

document.querySelectorAll<HTMLAnchorElement>('a[href="register.html"]').forEach((registerLink) => {
  registerLink.addEventListener('click', (event) => {
    event.preventDefault()
    saveToMyEvents()
  })
})

document.querySelectorAll<HTMLButtonElement>('button[aria-label="Back"]').forEach((backButton) => {
  backButton.addEventListener('click', () => {
    location.href = '../events.html'
  })
})

function getRelatedEvent(button: HTMLButtonElement) {
  let card = button.parentElement
  while (card && card !== main) {
    if (card.querySelector('img') && card.querySelector('h1, h2, h3') && card.querySelector('a[href$=".html"]')) break
    card = card.parentElement
  }
  if (!card) return null

  const heading = card.querySelector('h1, h2, h3')
  const eventImage = card.querySelector<HTMLImageElement>('img')
  const detailLink = card.querySelector<HTMLAnchorElement>('a[href$=".html"]')
  if (!heading || !eventImage || !detailLink) return null

  const detailUrl = new URL(detailLink.getAttribute('href') ?? '', location.href)
  const slug = detailUrl.pathname.split('/').pop()?.replace(/\.html$/, '') ?? 'event'
  const paragraphs = Array.from(card.querySelectorAll('p')).map((paragraph) => paragraph.textContent?.trim().replace(/\s+/g, ' ') ?? '')
  const dateMatch = paragraphs[0]?.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*[•·]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  const month = dateMatch ? new Date(`${dateMatch[1]} 1, 2000`).getMonth() + 1 : 4
  let hour = dateMatch ? Number(dateMatch[4]) : 8
  if (dateMatch?.[6].toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (dateMatch?.[6].toUpperCase() === 'AM' && hour === 12) hour = 0
  const date = dateMatch
    ? `${dateMatch[3]}-${String(month).padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
    : '2026-04-25'
  const time = dateMatch ? `${String(hour).padStart(2, '0')}:${dateMatch[5]}` : '08:00'
  const eventTitle = heading.textContent?.trim() ?? 'Campus Event'
  const eventLocation = paragraphs[1] || 'Campus Hall'

  return {
    id: `archive-${slug}`,
    title: eventTitle,
    date,
    time,
    location: eventLocation,
    description: `Join us for ${eventTitle} at ${eventLocation}. See the full event details for more information.`,
    image: new URL(eventImage.getAttribute('src') ?? eventImage.src, location.href).pathname,
    detailsUrl: detailUrl.pathname,
  } satisfies SavedEvent
}

document.querySelectorAll<HTMLButtonElement>('main button').forEach((bookmarkButton) => {
  if (!bookmarkButton.querySelector('i.fa-bookmark')) return
  const event = getRelatedEvent(bookmarkButton)
  if (!event) return

  const updateBookmark = () => {
    const isSaved = Boolean(email) && (JSON.parse(localStorage.getItem(`campus-event-favorites-${email}`) ?? '[]') as SavedEvent[]).some((savedEvent) => savedEvent.id === event.id)
    bookmarkButton.style.backgroundColor = isSaved ? '#0052cc' : '#d1d5db'
    bookmarkButton.setAttribute('aria-pressed', String(isSaved))
    bookmarkButton.setAttribute('aria-label', isSaved ? `Remove ${event.title} from My Events` : `Save ${event.title} to My Events`)
    bookmarkButton.title = isSaved ? 'Remove from My Events' : 'Save to My Events'
  }

  bookmarkButton.type = 'button'
  updateBookmark()
  bookmarkButton.addEventListener('click', (clickEvent) => {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    if (!authenticated || !email) {
      location.href = '../index.html#view-login'
      return
    }

    const storageKey = `campus-event-favorites-${email}`
    const savedEvents = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as SavedEvent[]
    const updatedEvents = savedEvents.some((savedEvent) => savedEvent.id === event.id)
      ? savedEvents.filter((savedEvent) => savedEvent.id !== event.id)
      : [...savedEvents, event]
    localStorage.setItem(storageKey, JSON.stringify(updatedEvents))
    updateBookmark()
  })
})

initializeTranslation()
