import './style.css'
import sidebarMarkup from './sidebar.html?raw'
import siteFooterMarkup from './site-footer.html?raw'
import { initializeTranslation } from './translation'

const sidebarMount = document.querySelector<HTMLElement>('#sidebar-mount')
if (sidebarMount) sidebarMount.innerHTML = sidebarMarkup
const siteFooterMount = document.querySelector<HTMLElement>('#site-footer-mount')
if (siteFooterMount) siteFooterMount.innerHTML = siteFooterMarkup

const searchInputs = document.querySelectorAll<HTMLInputElement>('.search-box')
const eventsGrid = document.querySelector<HTMLElement>('#all-events-grid')
const addEventForm = document.querySelector<HTMLFormElement>('#add-event-form')
const imageInput = document.querySelector<HTMLInputElement>('#event-image')
const imagePreview = document.querySelector<HTMLImageElement>('#event-image-preview')
const eventSubmitButton = document.querySelector<HTMLButtonElement>('#event-submit-button')
const loginForm = document.querySelector<HTMLFormElement>('#login-form')
const registerForm = document.querySelector<HTMLFormElement>('#register-form')
const showRegisterButton = document.querySelector<HTMLButtonElement>('#show-register-button')
const loginMessage = document.querySelector<HTMLParagraphElement>('#login-message')
const loginLink = document.querySelector<HTMLAnchorElement>('#auth-login-link')
const logoutLink = document.querySelector<HTMLAnchorElement>('#auth-logout-link')
const addEventLink = document.querySelector<HTMLAnchorElement>('#add-event-link')
const adminUsersLink = document.querySelector<HTMLAnchorElement>('#admin-users-link')
const myEventsLink = document.querySelector<HTMLAnchorElement>('#my-events-link')
const myEventsSection = document.querySelector<HTMLElement>('#view-myevents')
const myEventsGrid = document.querySelector<HTMLElement>('#my-events-grid')
const myEventsEmpty = document.querySelector<HTMLElement>('#my-events-empty')
const heroCarousel = document.querySelector<HTMLElement>('#hero-carousel')
const heroSlideTrack = document.querySelector<HTMLElement>('#hero-slide-track')
const heroPrevious = document.querySelector<HTMLButtonElement>('#hero-previous')
const heroNext = document.querySelector<HTMLButtonElement>('#hero-next')
const heroIndicators = document.querySelector<HTMLElement>('#hero-indicators')
const registeredUserCount = document.querySelector<HTMLElement>('#registered-user-count')
const registeredUsersList = document.querySelector<HTMLElement>('#registered-users-list')
const registeredUsersEmpty = document.querySelector<HTMLElement>('#registered-users-empty')

type CreatedEvent = {
	id: string
	title: string
	date: string
	time: string
	location: string
	description: string
	image: string
	detailsUrl?: string
}

const storedEventsKey = 'campus-event-created-events'
const authStorageKey = 'campus-event-authenticated'
const roleStorageKey = 'campus-event-role'
const accountsStorageKey = 'campus-event-accounts'
const userEmailStorageKey = 'campus-event-user-email'
const adminAccounts = new Map([
	['admin1@campus.edu', 'admin123'],
	['admin2@campus.edu', 'admin123'],
])
const archiveEventDetails: Record<string, Omit<CreatedEvent, 'id' | 'title' | 'image'>> = {
	orientation: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Welcome new students with campus introductions, tours, and student community activities.', detailsUrl: 'pages/orientatin.html' },
	workshop: { date: '2025-04-28', time: '10:00', location: 'Central Campus Quad & Great Lawn', description: 'Explore technology topics and practice practical skills in this campus workshop.', detailsUrl: 'pages/workshop.html' },
	sport: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Join campus sports activities focused on teamwork, competition, and school spirit.', detailsUrl: 'pages/sport.html' },
	club: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Explore student clubs, meet members, and learn about campus activities.', detailsUrl: 'pages/club.html' },
	career: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Meet employers and explore career and internship opportunities.', detailsUrl: 'pages/career.html' },
	community: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Take part in campus community activities and connect with fellow students.', detailsUrl: 'pages/community.html' },
	cv: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Get practical help preparing a CV and practicing interview skills.', detailsUrl: 'pages/cv.html' },
	english: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Practice English conversation and build confidence with other students.', detailsUrl: 'pages/English.html' },
	khmer: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Celebrate Khmer New Year with cultural activities and the campus community.', detailsUrl: 'pages/khmer.html' },
	party: { date: '2026-04-25', time: '08:00', location: 'Central Campus Quad & Great Lawn', description: 'Enjoy a relaxed gathering with classmates and campus friends.', detailsUrl: 'pages/party.html' },
}
const defaultEventDetailUrls: Record<string, string> = {
	'event-1': 'pages/orientatin.html',
	'event-2': 'pages/workshop.html',
	'event-3': 'pages/sport.html',
	'event-4': 'pages/club.html',
}
type RegisteredAccount = {
	email: string
	passwordHash: string
}
let editingEventId: string | null = null
let refreshHeroCarousel = () => {}

function getUserRole() {
	return localStorage.getItem(roleStorageKey) === 'admin' ? 'admin' : 'viewer'
}

function isAdmin() {
	return localStorage.getItem(authStorageKey) === 'true' && getUserRole() === 'admin'
}

function requireAdminAction() {
	if (!isAdmin()) {
		location.href = 'events.html'
		return false
	}
	return true
}

function isAuthenticated() {
	return localStorage.getItem(authStorageKey) === 'true' && Boolean(getCurrentUserEmail())
}

function getCurrentUserEmail() {
	return localStorage.getItem(userEmailStorageKey)
}

function getFavorites() {
	const email = getCurrentUserEmail()
	if (!email) return [] as CreatedEvent[]
	return JSON.parse(localStorage.getItem(`campus-event-favorites-${email}`) ?? '[]') as CreatedEvent[]
}

function saveFavorites(favorites: CreatedEvent[]) {
	const email = getCurrentUserEmail()
	if (email) localStorage.setItem(`campus-event-favorites-${email}`, JSON.stringify(favorites))
}

function isFavorite(eventId: string) {
	return getFavorites().some((event) => event.id === eventId)
}

function addToMyEvents(event: CreatedEvent) {
	if (!isAuthenticated()) {
		location.href = 'index.html#view-login'
		return false
	}

	const favorites = getFavorites()
	if (!favorites.some((savedEvent) => savedEvent.id === event.id)) {
		saveFavorites([...favorites, event])
	}
	renderMyEvents()
	return true
}

function removeFromMyEvents(eventId: string) {
	saveFavorites(getFavorites().filter((event) => event.id !== eventId))
	renderMyEvents()
}

function createEventBookmarkButton(event: CreatedEvent) {
	const button = document.createElement('button')
	button.type = 'button'
	button.className = 'event-bookmark-button'
	button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4.75C6 4.34 6.34 4 6.75 4h10.5c.41 0 .75.34.75.75V21l-6-3.75L6 21V4.75Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
	button.setAttribute('aria-pressed', String(isFavorite(event.id)))

	const updateSavedState = () => {
		const saved = isFavorite(event.id)
		button.classList.toggle('is-saved', saved)
		button.setAttribute('aria-pressed', String(saved))
		button.setAttribute('aria-label', saved ? `Remove ${event.title} from My Events` : `Save ${event.title} to My Events`)
		button.title = saved ? 'Remove from My Events' : 'Save to My Events'
		button.querySelector('path')?.setAttribute('fill', saved ? 'currentColor' : 'none')
	}

	button.addEventListener('click', (clickEvent) => {
		clickEvent.stopPropagation()
		if (!isAuthenticated()) {
			location.href = 'index.html#view-login'
			return
		}

		if (isFavorite(event.id)) removeFromMyEvents(event.id)
		else addToMyEvents(event)
		updateSavedState()
	})

	updateSavedState()
	return button
}

function getSearchableEvents() {
	return document.querySelectorAll<HTMLElement>('.event-card, .upcoming-event')
}

function filterEvents(searchTerm: string) {
	const normalizedTerm = searchTerm.trim().toLowerCase()

	getSearchableEvents().forEach((event) => {
		const eventText = event.textContent?.toLowerCase() ?? ''
		event.style.display = eventText.includes(normalizedTerm) ? '' : 'none'
	})
}

function formatEventDate(date: string) {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(`${date}T00:00:00`))
}

function formatEventTime(time: string) {
	return new Intl.DateTimeFormat('en-US', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(`1970-01-01T${time}`))
}

function showEventDetails(event: CreatedEvent) {
	const modal = document.createElement('div')
	modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto'

	const panel = document.createElement('div')
	panel.className = 'bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 relative shadow-2xl my-8'

	const closeButton = document.createElement('button')
	closeButton.type = 'button'
	closeButton.className = 'absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold'
	closeButton.textContent = '✕'
	closeButton.setAttribute('aria-label', 'Close event details')

	const image = document.createElement('img')
	image.src = event.image
	image.alt = event.title
	image.className = 'w-full h-40 sm:h-48 object-cover rounded-xl mb-4'

	const title = document.createElement('h2')
	title.className = 'text-lg sm:text-xl font-bold mb-2'
	title.textContent = event.title

	const meta = document.createElement('p')
	meta.className = 'text-xs text-blue-600 font-semibold mb-3'
	meta.textContent = `📅 ${formatEventDate(event.date)} • ${formatEventTime(event.time)} | 📍 ${event.location}`

	const description = document.createElement('p')
	description.className = 'text-sm text-gray-600 mb-6'
	description.textContent = event.description || `Join us for ${event.title} at ${event.location}. We look forward to seeing you there!`

	const actions = document.createElement('div')
	actions.className = 'flex flex-col sm:flex-row gap-3'

	if (!isFavorite(event.id)) {
		const joinButton = document.createElement('a')
		joinButton.href = isAuthenticated() ? 'my-events.html' : 'index.html#view-login'
		joinButton.className = 'flex-1 blue-button text-white text-center py-2.5 rounded-lg text-sm font-semibold'
		joinButton.textContent = 'Add to My Events'
		joinButton.addEventListener('click', (clickEvent) => {
			clickEvent.preventDefault()
			if (addToMyEvents(event)) modal.remove()
		})
		actions.append(joinButton)
	}

	const detailsUrl = event.detailsUrl ?? defaultEventDetailUrls[event.id]
	if (detailsUrl) {
		const fullDetailsLink = document.createElement('a')
		fullDetailsLink.href = detailsUrl
		fullDetailsLink.className = 'flex-1 px-4 py-2.5 border border-blue-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 text-center'
		fullDetailsLink.textContent = 'Full Event Details'
		actions.append(fullDetailsLink)
	}

	const closeLink = document.createElement('button')
	closeLink.type = 'button'
	closeLink.className = 'px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 text-center'
	closeLink.textContent = 'Close'

	const close = () => modal.remove()
	closeButton.addEventListener('click', close)
	closeLink.addEventListener('click', close)
	modal.addEventListener('click', (clickEvent) => {
		if (clickEvent.target === modal) close()
	})

	actions.append(closeLink)
	panel.append(closeButton, image, title, meta, description, actions)
	modal.append(panel)
	document.body.append(modal)
}

function createMyEventCard(event: CreatedEvent) {
	const card = document.createElement('article')
	card.className = 'bg-white border border-gray-200 rounded-xl overflow-hidden'

	const image = document.createElement('img')
	image.src = event.image
	image.alt = event.title
	image.className = 'w-full h-40 object-cover'

	const content = document.createElement('div')
	content.className = 'p-5'

	const status = document.createElement('span')
	status.className = 'inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2'
	status.textContent = 'Saved'

	const title = document.createElement('h3')
	title.className = 'font-bold text-lg'
	title.textContent = event.title

	const date = document.createElement('p')
	date.className = 'text-xs text-gray-500 mt-1'
	date.textContent = `📅 ${formatEventDate(event.date)} • ${formatEventTime(event.time)}`

	const location = document.createElement('p')
	location.className = 'text-xs text-gray-500 mt-1'
	location.textContent = `📍 ${event.location}`

	const actions = document.createElement('div')
	actions.className = 'flex gap-2 mt-4'

	const details = document.createElement('button')
	details.type = 'button'
	details.className = 'flex-1 blue-button text-white py-2.5 rounded-lg text-xs font-semibold'
	details.textContent = 'View Details'
	details.addEventListener('click', () => showEventDetails(event))

	const remove = document.createElement('button')
	remove.type = 'button'
	remove.className = 'flex-1 rounded-lg border border-red-200 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50'
	remove.textContent = 'Remove'
	remove.addEventListener('click', () => removeFromMyEvents(event.id))

	actions.append(details, remove)
	content.append(status, title, date, location, actions)
	card.append(image, content)
	return card
}

function renderMyEvents() {
	if (!myEventsGrid || !myEventsEmpty) return
	myEventsGrid.replaceChildren(...getFavorites().map(createMyEventCard))
	myEventsEmpty.classList.toggle('hidden', getFavorites().length > 0)
}

function setupHeroCarousel() {
	if (!heroCarousel || !heroSlideTrack || !heroIndicators) return

	let images: string[] = []
	let activeSlide = 0
	let autoPlayTimer: number | undefined

	const renderSlide = (slide: number) => {
		if (!images.length) return
		activeSlide = (slide + images.length) % images.length
		heroSlideTrack.style.transform = `translateX(-${activeSlide * 100}%)`
		heroIndicators.querySelectorAll('button').forEach((indicator, index) => {
			indicator.classList.toggle('bg-white', index === activeSlide)
			indicator.classList.toggle('bg-white/50', index !== activeSlide)
		})
	}

	refreshHeroCarousel = () => {
		const currentImage = images[activeSlide]
		const defaultHeroImages = [
			'./img/Rectangle 87.png',
			'./img/Rectangle 9.png',
			'./img/Rectangle 12.png',
			'./img/Rectangle 15.png',
			'./img/Rectangle 18.png',
		]
		const cardImages = Array.from(document.querySelectorAll<HTMLImageElement>('.event-card img')).map((image) => image.src)
		images = [...new Set([...defaultHeroImages, ...cardImages])]
		heroSlideTrack.replaceChildren(...images.map((image) => {
			const slide = document.createElement('div')
			slide.className = 'hero-slide-image min-w-full h-full bg-cover bg-center'
			slide.style.backgroundImage = `linear-gradient(90deg, rgba(2, 47, 112, 0.92), rgba(2, 66, 145, 0.65), rgba(2, 66, 145, 0.18)), url("${image}")`
			return slide
		}))
		heroIndicators.replaceChildren()
		images.forEach((_, index) => {
			const indicator = document.createElement('button')
			indicator.type = 'button'
			indicator.className = 'w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white'
			indicator.setAttribute('aria-label', `Show hero image ${index + 1}`)
			indicator.addEventListener('click', () => {
				renderSlide(index)
				startAutoPlay()
			})
			heroIndicators.append(indicator)
		})
		const matchingIndex = currentImage ? images.indexOf(currentImage) : 0
		activeSlide = matchingIndex >= 0 ? matchingIndex : Math.min(activeSlide, images.length - 1)
		renderSlide(activeSlide)
	}

	const startAutoPlay = () => {
		if (autoPlayTimer) window.clearInterval(autoPlayTimer)
		autoPlayTimer = window.setInterval(() => renderSlide(activeSlide + 1), 5000)
	}

	heroPrevious?.addEventListener('click', () => {
		renderSlide(activeSlide - 1)
		startAutoPlay()
	})
	heroNext?.addEventListener('click', () => {
		renderSlide(activeSlide + 1)
		startAutoPlay()
	})

	refreshHeroCarousel()
	startAutoPlay()
}

function editEvent(event: CreatedEvent) {
	if (!requireAdminAction()) return
	if (!addEventForm) {
		location.href = `add-event.html?edit=${encodeURIComponent(event.id)}`
		return
	}

	editingEventId = event.id
	;(addEventForm.elements.namedItem('title') as HTMLInputElement).value = event.title
	;(addEventForm.elements.namedItem('date') as HTMLInputElement).value = event.date
	;(addEventForm.elements.namedItem('time') as HTMLInputElement).value = event.time
	;(addEventForm.elements.namedItem('location') as HTMLInputElement).value = event.location
	;(addEventForm.elements.namedItem('description') as HTMLTextAreaElement).value = event.description
	if (imagePreview) {
		imagePreview.src = event.image
		imagePreview.classList.remove('hidden')
	}
	if (eventSubmitButton) eventSubmitButton.textContent = 'Update Event'
}

function createEventCard(event: CreatedEvent) {
	const card = document.createElement('article')
	card.className = 'event-card bg-white border border-gray-200 rounded-xl overflow-hidden'
	card.dataset.eventId = event.id

	const image = document.createElement('img')
	image.src = event.image
	image.alt = event.title
	image.className = 'w-full h-44 object-cover'

	const content = document.createElement('div')
	content.className = 'p-4'

	const title = document.createElement('h3')
	title.className = 'font-bold text-base'
	title.textContent = event.title

	const date = document.createElement('p')
	date.className = 'text-xs text-gray-500 mt-2'
	date.textContent = `📅 ${formatEventDate(event.date)} • ${formatEventTime(event.time)}`

	const location = document.createElement('p')
	location.className = 'text-xs text-gray-500 mt-1'
	location.textContent = `📍 ${event.location}`

	const description = document.createElement('p')
	description.className = 'text-sm text-gray-600 mt-3 line-clamp-2'
	description.textContent = event.description

	const details = document.createElement('a')
	details.href = 'events.html'
	details.className = 'flex-1 block text-center blue-button text-white rounded-lg py-2.5 text-xs font-semibold'
	details.textContent = 'View Details'
	details.addEventListener('click', (clickEvent) => {
		clickEvent.preventDefault()
		showEventDetails(event)
	})

	const editButton = document.createElement('button')
	editButton.type = 'button'
	editButton.className = 'flex-1 rounded-lg border border-blue-200 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50'
	editButton.textContent = 'Edit Event'
	editButton.addEventListener('click', () => editEvent(event))

	const deleteButton = document.createElement('button')
	deleteButton.type = 'button'
	deleteButton.className = 'flex-1 rounded-lg border border-red-200 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50'
	deleteButton.textContent = 'Delete Event'
	deleteButton.addEventListener('click', () => {
		if (!requireAdminAction()) return
		if (!confirm(`Delete "${event.title}"?`)) return

		const savedEvents = JSON.parse(localStorage.getItem(storedEventsKey) ?? '[]') as CreatedEvent[]
		localStorage.setItem(storedEventsKey, JSON.stringify(savedEvents.filter((savedEvent) => savedEvent.id !== event.id)))
		card.remove()
		refreshHeroCarousel()
	})

	const actions = document.createElement('div')
	actions.className = 'flex gap-2 mt-4'
	actions.append(details)
	if (isAdmin()) actions.append(editButton, deleteButton)
	content.append(title, date, location, description, actions)
	card.append(image, content, createEventBookmarkButton(event))
	return card
}

function getStaticCardEvent(card: HTMLElement): CreatedEvent | null {
	const image = card.querySelector<HTMLImageElement>('img')
	const heading = card.querySelector('h2, h3')
	if (!image || !heading) return null

	const archiveLink = card.querySelector<HTMLAnchorElement>('.archive-event-detail')
	if (archiveLink) {
		const archiveId = archiveLink.dataset.eventId ?? ''
		const details = archiveEventDetails[archiveId]
		if (!details) return null
		return {
			id: `archive-${archiveId}`,
			title: heading.textContent?.trim() ?? 'Campus Event',
			image: image.src,
			...details,
		}
	}

	const modalLink = card.querySelector<HTMLAnchorElement>('a[href^="#modal-event-"]')
	const modalId = modalLink?.getAttribute('href')?.slice(1)
	const favoriteLink = modalId ? document.getElementById(modalId)?.querySelector<HTMLAnchorElement>('.favorite-event') : null
	if (!favoriteLink) return null

	const data = favoriteLink.dataset
	const eventId = data.eventId
	if (!eventId || !data.date || !data.time) return null

	return {
		id: eventId,
		title: data.title ?? heading.textContent?.trim() ?? 'Campus Event',
		date: data.date,
		time: data.time,
		location: data.location ?? '',
		description: document.getElementById(modalId!)?.querySelector('p.text-gray-600')?.textContent?.trim() ?? '',
		image: image.src,
		detailsUrl: defaultEventDetailUrls[eventId],
	}
}

function setupStaticEventBookmarks() {
	document.querySelectorAll<HTMLElement>('.event-card').forEach((card) => {
		if (card.querySelector('.event-bookmark-button')) return
		const event = getStaticCardEvent(card)
		if (event) card.append(createEventBookmarkButton(event))
	})
}

function loadCreatedEvents() {
	if (!eventsGrid) return

	try {
		const savedEvents = JSON.parse(localStorage.getItem(storedEventsKey) ?? '[]') as CreatedEvent[]
		const normalizedEvents = savedEvents.map((event) => ({
			...event,
			id: event.id ?? crypto.randomUUID(),
			description: event.description ?? `Join us for ${event.title} at ${event.location}. We look forward to seeing you there!`,
		}))
		localStorage.setItem(storedEventsKey, JSON.stringify(normalizedEvents))
		normalizedEvents.forEach((event) => eventsGrid.append(createEventCard(event)))
	} catch {
		localStorage.removeItem(storedEventsKey)
	}
}

function saveCreatedEvent(event: CreatedEvent) {
	const savedEvents = JSON.parse(localStorage.getItem(storedEventsKey) ?? '[]') as CreatedEvent[]
	localStorage.setItem(storedEventsKey, JSON.stringify([...savedEvents, event]))
}

function updateActiveSidebarLink() {
	const currentPage = location.pathname.split('/').pop() || 'index.html'
	document.querySelectorAll<HTMLAnchorElement>('.sidebar-link').forEach((link) => {
		const linkPage = new URL(link.href, location.href).pathname.split('/').pop() || 'index.html'
		if (linkPage === currentPage) link.setAttribute('aria-current', 'page')
		else link.removeAttribute('aria-current')
	})
}

function updateAuthUI() {
	const authenticated = isAuthenticated()
	const admin = isAdmin()
	updateActiveSidebarLink()
	document.querySelectorAll<HTMLElement>('[data-footer-authenticated]').forEach((link) => {
		link.classList.toggle('hidden', !authenticated)
		link.classList.toggle('block', authenticated)
	})
	document.querySelectorAll<HTMLElement>('[data-footer-admin]').forEach((link) => {
		link.classList.toggle('hidden', !admin)
		link.classList.toggle('block', admin)
	})
	loginLink?.classList.toggle('hidden', authenticated)
	logoutLink?.classList.toggle('hidden', !authenticated)
	myEventsLink?.classList.toggle('hidden', !authenticated)
	addEventLink?.classList.toggle('hidden', !admin)
	adminUsersLink?.classList.toggle('hidden', !admin)
	if (myEventsSection) myEventsSection.style.display = authenticated ? '' : 'none'
	renderMyEvents()
	const currentPage = location.pathname.split('/').pop()
	if (!admin && (currentPage === 'add-event.html' || currentPage === 'user-management.html')) location.replace('events.html')
	if (!authenticated && currentPage === 'my-events.html') location.replace('index.html#view-login')
	renderRegisteredUsers()
}

function setLoginMessage(message: string, isError = false) {
	if (!loginMessage) return
	loginMessage.textContent = message
	loginMessage.className = `text-sm text-center mt-3 ${isError ? 'text-red-600' : 'text-green-600'}`
}

async function hashPassword(password: string) {
	const bytes = new TextEncoder().encode(password)
	const hash = await crypto.subtle.digest('SHA-256', bytes)
	return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getRegisteredAccounts() {
	return JSON.parse(localStorage.getItem(accountsStorageKey) ?? '[]') as RegisteredAccount[]
}

function renderRegisteredUsers() {
	if (!registeredUserCount || !registeredUsersList || !registeredUsersEmpty) return

	const accounts = getRegisteredAccounts()
	registeredUserCount.textContent = String(accounts.length)
	registeredUsersList.replaceChildren(...accounts.map((account) => {
		const row = document.createElement('div')
		row.className = 'border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3'

		const email = document.createElement('p')
		email.className = 'text-sm font-semibold text-gray-700'
		email.textContent = account.email

		const resetButton = document.createElement('button')
		resetButton.type = 'button'
		resetButton.className = 'border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-2 text-xs font-semibold'
		resetButton.textContent = 'Reset Password'
		resetButton.addEventListener('click', async () => {
			const resetPanel = document.createElement('div')
			resetPanel.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
			resetPanel.innerHTML = `<form class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4"><div><h2 class="font-bold text-lg">Reset Password</h2><p class="text-sm text-gray-500 mt-1">Set a new password for ${account.email}.</p></div><input name="newPassword" type="password" minlength="6" required class="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" placeholder="New password"><input name="confirmPassword" type="password" minlength="6" required class="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" placeholder="Confirm new password"><p class="reset-error hidden text-sm text-red-600"></p><div class="flex gap-2 justify-end"><button type="button" class="reset-cancel px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600">Cancel</button><button type="submit" class="blue-button text-white px-4 py-2 rounded-lg text-sm font-semibold">Save Password</button></div></form>`
			document.body.append(resetPanel)
			const resetForm = resetPanel.querySelector<HTMLFormElement>('form')
			const error = resetPanel.querySelector<HTMLParagraphElement>('.reset-error')
			resetPanel.querySelector<HTMLButtonElement>('.reset-cancel')?.addEventListener('click', () => resetPanel.remove())
			resetForm?.addEventListener('submit', async (submitEvent) => {
				submitEvent.preventDefault()
				const formData = new FormData(resetForm)
				const newPassword = String(formData.get('newPassword'))
				const confirmPassword = String(formData.get('confirmPassword'))
				if (newPassword !== confirmPassword || newPassword.length < 6) {
					if (error) {
						error.textContent = newPassword !== confirmPassword ? 'Passwords do not match.' : 'Password must be at least 6 characters.'
						error.classList.remove('hidden')
					}
					return
				}
				const updatedAccounts = await Promise.all(getRegisteredAccounts().map(async (savedAccount) => savedAccount.email === account.email
					? { ...savedAccount, passwordHash: await hashPassword(newPassword) }
					: savedAccount))
				localStorage.setItem(accountsStorageKey, JSON.stringify(updatedAccounts))
				resetPanel.remove()
			})
		})

		row.append(email, resetButton)
		return row
	}))
	registeredUsersEmpty.classList.toggle('hidden', accounts.length > 0)
}

function readImage(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader()
		reader.addEventListener('load', () => resolve(String(reader.result)))
		reader.addEventListener('error', () => reject(new Error('Unable to read image')))
		reader.readAsDataURL(file)
	})
}

imageInput?.addEventListener('change', () => {
	const file = imageInput.files?.[0]
	if (!file || !imagePreview) return

	imagePreview.src = URL.createObjectURL(file)
	imagePreview.classList.remove('hidden')
})

loginForm?.addEventListener('submit', async (event) => {
	event.preventDefault()

	const formData = new FormData(loginForm)
	const email = String(formData.get('email')).trim().toLowerCase()
	const password = String(formData.get('password'))
	if (!email || !password) return

	const isAdminAccount = adminAccounts.get(email) === password
	const registeredAccount = getRegisteredAccounts().find((account) => account.email === email)
	const isRegisteredUser = registeredAccount ? registeredAccount.passwordHash === await hashPassword(password) : false
	if (!isAdminAccount && !isRegisteredUser) {
		setLoginMessage('Account not found or password is incorrect.', true)
		return
	}

	localStorage.setItem(authStorageKey, 'true')
	localStorage.setItem(roleStorageKey, isAdminAccount ? 'admin' : 'viewer')
	localStorage.setItem(userEmailStorageKey, email)
	loginForm.reset()
	setLoginMessage('Login successful.')
	updateAuthUI()
	location.hash = '#'
})

showRegisterButton?.addEventListener('click', () => {
	registerForm?.classList.toggle('hidden')
})

registerForm?.addEventListener('submit', async (event) => {
	event.preventDefault()
	const formData = new FormData(registerForm)
	const email = String(formData.get('email')).trim().toLowerCase()
	const password = String(formData.get('password'))
	const confirmPassword = String(formData.get('confirmPassword'))

	if (adminAccounts.has(email)) {
		setLoginMessage('That email is reserved for an administrator.', true)
		return
	}
	if (password !== confirmPassword) {
		setLoginMessage('Passwords do not match.', true)
		return
	}

	const accounts = getRegisteredAccounts()
	if (accounts.some((account) => account.email === email)) {
		setLoginMessage('An account with that email already exists.', true)
		return
	}

	accounts.push({ email, passwordHash: await hashPassword(password) })
	localStorage.setItem(accountsStorageKey, JSON.stringify(accounts))
	registerForm.reset()
	registerForm.classList.add('hidden')
	const loginEmail = loginForm?.elements.namedItem('email') as HTMLInputElement | null
	if (loginEmail) loginEmail.value = email
	setLoginMessage('Account created. You can now log in.')
})

logoutLink?.addEventListener('click', (event) => {
	event.preventDefault()
	localStorage.removeItem(authStorageKey)
	localStorage.removeItem(roleStorageKey)
	localStorage.removeItem(userEmailStorageKey)
	updateAuthUI()
	location.hash = '#'
})

addEventForm?.addEventListener('submit', async (event) => {
	event.preventDefault()
	if (!addEventForm || !isAdmin()) {
		location.href = 'events.html'
		return
	}

	const formData = new FormData(addEventForm)
	const imageFile = imageInput?.files?.[0]
	if (imageFile && imageFile.size > 2 * 1024 * 1024) {
		alert('Please choose an image smaller than 2 MB.')
		return
	}

	const savedEvents = JSON.parse(localStorage.getItem(storedEventsKey) ?? '[]') as CreatedEvent[]
	const existingEvent = savedEvents.find((savedEvent) => savedEvent.id === editingEventId)
	const updatedEvent: CreatedEvent = {
		id: editingEventId ?? crypto.randomUUID(),
		title: String(formData.get('title')),
		date: String(formData.get('date')),
		time: String(formData.get('time')),
		location: String(formData.get('location')),
		description: String(formData.get('description')),
		image: imageFile ? await readImage(imageFile) : existingEvent?.image ?? './img/Rectangle 87.png',
	}

	if (editingEventId) {
		const updatedEvents = savedEvents.map((savedEvent) => savedEvent.id === editingEventId ? updatedEvent : savedEvent)
		localStorage.setItem(storedEventsKey, JSON.stringify(updatedEvents))
		if (eventsGrid) {
			const existingCard = Array.from(eventsGrid.querySelectorAll<HTMLElement>('.event-card')).find((card) => card.dataset.eventId === editingEventId)
			existingCard?.replaceWith(createEventCard(updatedEvent))
		}
	} else {
		saveCreatedEvent(updatedEvent)
		if (eventsGrid) {
			eventsGrid.prepend(createEventCard(updatedEvent))
		}
	}
	refreshHeroCarousel()

	editingEventId = null
	if (eventSubmitButton) eventSubmitButton.textContent = 'Publish Event'
	addEventForm.reset()
	imagePreview?.classList.add('hidden')
	imagePreview?.removeAttribute('src')
	location.href = 'events.html'
	filterEvents(searchInputs[0]?.value ?? '')
})

loadCreatedEvents()
setupStaticEventBookmarks()
const initialSearch = new URLSearchParams(location.search).get('search') ?? ''
if (initialSearch) {
	searchInputs.forEach((input) => { input.value = initialSearch })
	filterEvents(initialSearch)
}
updateAuthUI()
if (addEventForm && isAdmin()) {
	const editId = new URLSearchParams(location.search).get('edit')
	if (editId) {
		const event = (JSON.parse(localStorage.getItem(storedEventsKey) ?? '[]') as CreatedEvent[]).find((savedEvent) => savedEvent.id === editId)
		if (event) editEvent(event)
	}
}
setupHeroCarousel()
window.addEventListener('hashchange', updateAuthUI)

document.querySelectorAll<HTMLAnchorElement>('.archive-event-detail').forEach((detailsLink) => {
	detailsLink.addEventListener('click', (event) => {
		event.preventDefault()
		const card = detailsLink.closest<HTMLElement>('.event-card')
		const details = archiveEventDetails[detailsLink.dataset.eventId ?? '']
		const image = card?.querySelector<HTMLImageElement>('img')
		if (!card || !details || !image) return

		showEventDetails({
			id: `archive-${detailsLink.dataset.eventId}`,
			title: card.querySelector('h2')?.textContent?.trim() ?? 'Campus Event',
			image: image.src,
			...details,
		})
	})
})

document.querySelectorAll<HTMLAnchorElement>('.favorite-event').forEach((favoriteButton) => {
	favoriteButton.textContent = isFavorite(favoriteButton.dataset.eventId ?? '') ? 'Saved to My Events' : 'Add to My Events'
	favoriteButton.addEventListener('click', (event) => {
		event.preventDefault()
		const favoriteEvent: CreatedEvent = {
			id: favoriteButton.dataset.eventId ?? crypto.randomUUID(),
			title: favoriteButton.dataset.title ?? 'Campus Event',
			date: favoriteButton.dataset.date ?? '',
			time: favoriteButton.dataset.time ?? '',
			location: favoriteButton.dataset.location ?? '',
			description: `Join us for ${favoriteButton.dataset.title ?? 'this event'} at ${favoriteButton.dataset.location ?? 'campus'}. We look forward to seeing you there!`,
			image: favoriteButton.dataset.image ?? './img/Rectangle 87.png',
		}

		if (!addToMyEvents(favoriteEvent)) return
		favoriteButton.textContent = 'Saved to My Events'
		location.href = 'my-events.html'
	})
})

searchInputs.forEach((searchInput) => {
	searchInput.addEventListener('input', () => {
		const searchTerm = searchInput.value

		searchInputs.forEach((input) => {
			if (input !== searchInput) {
				input.value = searchTerm
			}
		})

		filterEvents(searchTerm)
	})
	searchInput.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter') return
		event.preventDefault()
		const query = searchInput.value.trim()
		if (query) location.href = `/events.html?search=${encodeURIComponent(query)}`
	})
})

initializeTranslation()
