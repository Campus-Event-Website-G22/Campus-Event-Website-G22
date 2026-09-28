import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: [
        'index.html',
        'events.html',
        'my-events.html',
        'add-event.html',
        'user-management.html',
        'pages/career.html',
        'pages/club.html',
        'pages/community.html',
        'pages/cv.html',
        'pages/English.html',
        'pages/khmer.html',
        'pages/orientatin.html',
        'pages/party.html',
        'pages/sport.html',
        'pages/workshop.html',
      ],
    },
  },
})