import './style.css'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 192
const IMAGE_PATH = '/sequence/ezgif-frame-'
const CANVAS_W = 1280
const CANVAS_H = 720


const canvas = document.getElementById('sequence-canvas')
const context = canvas.getContext('2d', { alpha: false })
const loadingScreen = document.getElementById('loading-screen')
const progressBar = document.getElementById('progress-bar')
const progressText = document.getElementById('progress-text')

canvas.width = CANVAS_W
canvas.height = CANVAS_H
context.imageSmoothingEnabled = false

const bitmaps = []
let targetFrame = 0
let renderedFrame = -1
let rafId = null

function getFramePath(index) {
  const num = String(index + 1).padStart(3, '0')
  return `${IMAGE_PATH}${num}.webp`
}

async function preloadImages() {
  let loadedCount = 0

  const BATCH_SIZE = 12

  for (let start = 0; start < FRAME_COUNT; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, FRAME_COUNT)
    const batch = []

    for (let i = start; i < end; i++) {
      batch.push(
        fetch(getFramePath(i))
          .then((res) => res.blob())
          .then((blob) => createImageBitmap(blob, {
            resizeWidth: CANVAS_W,
            resizeHeight: CANVAS_H,
            resizeQuality: 'medium',
          }))
          .then((bitmap) => {
            bitmaps[i] = bitmap
            loadedCount++
            const progress = Math.round((loadedCount / FRAME_COUNT) * 100)
            progressBar.style.width = `${progress}%`
            progressText.textContent = `${progress}%`
          })
          .catch((err) => {
            console.warn(`Failed to load frame ${i}:`, err)
            loadedCount++
          })
      )
    }

    await Promise.all(batch)
  }
}

function renderLoop() {
  if (targetFrame !== renderedFrame) {
    const bitmap = bitmaps[targetFrame]
    if (bitmap) {
      context.drawImage(bitmap, 0, 0, CANVAS_W, CANVAS_H)
      renderedFrame = targetFrame
    }
  }
  rafId = requestAnimationFrame(renderLoop)
}

function initScrollAnimation() {
  const frameObj = { frame: 0 }

  gsap.to(frameObj, {
    frame: FRAME_COUNT - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: '#animation-section',
      pin: true,
      start: 'top top',
      end: '+=4000',
      scrub: true,     // Direct 1:1 mapping, no delay
    },
    onUpdate: () => {
      targetFrame = Math.round(frameObj.frame)
    },
  })

  // Fade out the hero text as scroll begins
  gsap.to('.hero-overlay', {
    opacity: 0,
    scrollTrigger: {
      trigger: '#animation-section',
      start: 'top top',
      end: '+=800',
      scrub: true,
    },
  })
}

function initTextAnimations() {
  gsap.utils.toArray('.feature-section').forEach((section) => {
    const panel = section.querySelector('.glass-panel')
    const isLeft = section.classList.contains('left')

    gsap.from(panel, {
      opacity: 0,
      x: isLeft ? -100 : 100,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        end: 'top 30%',
        toggleActions: 'play none none reverse',
      },
    })
  })

  document.querySelectorAll('.hero-section').forEach((hero) => {
    gsap.from(hero.querySelector('h1'), {
      opacity: 0,
      scale: 0.8,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: hero,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    })
    gsap.from(hero.querySelector('p'), {
      opacity: 0,
      y: 30,
      duration: 1,
      delay: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: hero,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    })
  })
}

function hideLoadingScreen() {
  gsap.to(loadingScreen, {
    opacity: 0,
    duration: 0.6,
    ease: 'power2.inOut',
    onComplete: () => {
      loadingScreen.style.display = 'none'
    },
  })
}

let lenis = null

function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  })

  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)
}

const paginationNav = document.getElementById('pagination')
const nextBtn = document.getElementById('next-section-btn')
const dots = document.querySelectorAll('.dot')
const stopSections = document.querySelectorAll('[data-stop]')
let currentStop = 0

function initPagination() {
  // Show pagination after loading
  paginationNav.classList.add('visible')

  // --- Next button ---
  nextBtn.addEventListener('click', () => {
    if (currentStop >= stopSections.length - 1) {
      // At the last section → scroll back to top
      lenis.scrollTo(0, { duration: 2 })
    } else {
      scrollToStop(currentStop + 1)
    }
  })

  // --- Dot clicks ---
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.target, 10)
      scrollToStop(target)
    })
  })

  // --- Track active section on scroll ---
  stopSections.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveDot(index),
      onEnterBack: () => setActiveDot(index),
    })
  })
}

function scrollToStop(index) {
  if (index < 0 || index >= stopSections.length) return
  const target = stopSections[index]

  // For the pinned animation section (index 0), scroll to top
  if (index === 0) {
    lenis.scrollTo(0, { duration: 1.5 })
    return
  }

  lenis.scrollTo(target, {
    duration: 2,
    offset: 0,
  })
}

function setActiveDot(index) {
  currentStop = index
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === index)
  })

  // Rotate chevron to "up" arrow at the last section
  if (index >= stopSections.length - 1) {
    nextBtn.classList.add('rotate-up')
  } else {
    nextBtn.classList.remove('rotate-up')
  }
}

async function init() {
  await preloadImages()
  hideLoadingScreen()

  // Render loop
  targetFrame = 0
  renderedFrame = -1
  renderLoop()

  // Lenis FIRST
  initLenis()
  initScrollAnimation()
  initTextAnimations()
  initPagination()
}

init()
