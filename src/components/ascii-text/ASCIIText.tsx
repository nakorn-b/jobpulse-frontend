// Component ported and enhanced from https://codepen.io/JuanFuentes/pen/eYEeoyE (via React Bits).
// Adapted for JobPulse: monochrome (inherits `color`), local Geist Mono font,
// StrictMode-safe setup and static (no cursor tilt).

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ASCIIText.css'

const FONT_FAMILY = 'Geist Mono Variable'

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 5.;

    float waveFactor = uEnableWaves;

    vec3 transformed = position;

    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`

const fragmentShader = `
varying vec2 vUv;
uniform float mouse;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;

    float r = texture2D(uTexture, pos + cos(time * 2. - time + pos.x) * .01).r;
    float g = texture2D(uTexture, pos + tan(time * .5 + pos.x - time) * .01).g;
    float b = texture2D(uTexture, pos - cos(time * 2. + time + pos.y) * .01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`

interface AsciiFilterOptions {
  fontSize?: number
  fontFamily?: string
  charset?: string
  invert?: boolean
}

class AsciiFilter {
  renderer: THREE.WebGLRenderer
  domElement: HTMLDivElement
  pre: HTMLPreElement
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | null
  invert: boolean
  fontSize: number
  fontFamily: string
  charset: string
  width = 0
  height = 0
  cols = 0
  rows = 0

  constructor(renderer: THREE.WebGLRenderer, { fontSize, fontFamily, charset, invert }: AsciiFilterOptions = {}) {
    this.renderer = renderer
    this.domElement = document.createElement('div')
    // Center the <pre> with flexbox; left:50% + transform shrinks its box to half the container.
    Object.assign(this.domElement.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    })

    this.pre = document.createElement('pre')
    this.pre.setAttribute('aria-hidden', 'true')
    this.domElement.appendChild(this.pre)

    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d', { willReadFrequently: true })
    this.domElement.appendChild(this.canvas)

    this.invert = invert ?? true
    this.fontSize = fontSize ?? 12
    this.fontFamily = fontFamily ?? "'Courier New', monospace"
    this.charset = charset ?? ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'

    if (this.context) this.context.imageSmoothingEnabled = false
  }

  setSize(width: number, height: number) {
    this.width = width
    this.height = height
    this.renderer.setSize(width, height)
    this.reset()
  }

  reset() {
    if (!this.context) return
    this.context.font = `${this.fontSize}px ${this.fontFamily}`
    const charWidth = this.context.measureText('A').width

    this.cols = Math.floor(this.width / charWidth)
    this.rows = Math.floor(this.height / this.fontSize)

    this.canvas.width = this.cols
    this.canvas.height = this.rows
    Object.assign(this.pre.style, {
      fontFamily: this.fontFamily,
      fontSize: `${this.fontSize}px`,
    })
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera)

    const w = this.canvas.width
    const h = this.canvas.height
    if (this.context && w > 0 && h > 0) {
      this.context.clearRect(0, 0, w, h)
      this.context.drawImage(this.renderer.domElement, 0, 0, w, h)
      this.asciify(this.context, w, h)
    }
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const imgData = ctx.getImageData(0, 0, w, h).data
    let str = ''
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = x * 4 + y * 4 * w
        const [r, g, b, a] = [imgData[i], imgData[i + 1], imgData[i + 2], imgData[i + 3]]

        if (a === 0) {
          str += ' '
          continue
        }

        const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255
        let idx = Math.floor((1 - gray) * (this.charset.length - 1))
        if (this.invert) idx = this.charset.length - idx - 1
        str += this.charset[idx]
      }
      str += '\n'
    }
    // textContent, not innerHTML: the charset contains `&`.
    this.pre.textContent = str
  }
}

interface CanvasTxtOptions {
  fontSize?: number
  fontFamily?: string
  color?: string
}

class CanvasTxt {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D | null
  txt: string
  color: string
  font: string

  constructor(txt: string, { fontSize = 200, fontFamily = 'Arial', color = '#fdf9f3' }: CanvasTxtOptions = {}) {
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')
    this.txt = txt
    this.color = color
    this.font = `800 ${fontSize}px ${fontFamily}`
  }

  resize() {
    if (!this.context) return
    this.context.font = this.font
    const metrics = this.context.measureText(this.txt)
    this.canvas.width = Math.ceil(metrics.width) + 20
    this.canvas.height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 20
  }

  render() {
    if (!this.context) return
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.fillStyle = this.color
    this.context.font = this.font
    const metrics = this.context.measureText(this.txt)
    this.context.fillText(this.txt, 10, 10 + metrics.actualBoundingBoxAscent)
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }
}

interface CanvAsciiOptions {
  text: string
  asciiFontSize: number
  textFontSize: number
  textColor: string
  planeBaseHeight: number
  enableWaves: boolean
}

class CanvAscii {
  options: CanvAsciiOptions
  container: HTMLElement
  width: number
  height: number
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  textCanvas!: CanvasTxt
  texture!: THREE.CanvasTexture
  geometry: THREE.PlaneGeometry | undefined
  material: THREE.ShaderMaterial | undefined
  mesh!: THREE.Mesh
  renderer!: THREE.WebGLRenderer
  filter!: AsciiFilter
  animationFrameId = 0

  constructor(options: CanvAsciiOptions, containerElem: HTMLElement, width: number, height: number) {
    this.options = options
    this.container = containerElem
    this.width = width
    this.height = height

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000)
    this.camera.position.z = 30

    this.scene = new THREE.Scene()
  }

  async init() {
    try {
      await document.fonts.load(`800 200px "${FONT_FAMILY}"`)
      await document.fonts.load(`500 12px "${FONT_FAMILY}"`)
    } catch {
      /* fall back to whatever monospace is available */
    }
    await document.fonts.ready
    this.setMesh()
    this.setRenderer()
  }

  setMesh() {
    const { text, textFontSize, textColor, planeBaseHeight, enableWaves } = this.options
    this.textCanvas = new CanvasTxt(text, { fontSize: textFontSize, fontFamily: FONT_FAMILY, color: textColor })
    this.textCanvas.resize()
    this.textCanvas.render()

    this.texture = new THREE.CanvasTexture(this.textCanvas.canvas)
    this.texture.minFilter = THREE.NearestFilter

    const textAspect = this.textCanvas.width / this.textCanvas.height
    this.geometry = new THREE.PlaneGeometry(planeBaseHeight * textAspect, planeBaseHeight, 36, 36)
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        mouse: { value: 1.0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: enableWaves ? 1.0 : 0.0 },
      },
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    this.renderer.setPixelRatio(1)
    this.renderer.setClearColor(0x000000, 0)

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: `"${FONT_FAMILY}", ui-monospace, monospace`,
      fontSize: this.options.asciiFontSize,
      invert: true,
    })

    this.container.appendChild(this.filter.domElement)
    this.setSize(this.width, this.height)
  }

  setSize(w: number, h: number) {
    this.width = w
    this.height = h
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.filter.setSize(w, h)
    this.fitToView()
  }

  /** Shrink the plane so the whole word (plus wave sway) stays inside the camera's view. */
  fitToView() {
    if (!this.mesh || !this.geometry) return
    const { width: planeW, height: planeH } = this.geometry.parameters
    const visibleH = 2 * this.camera.position.z * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const visibleW = visibleH * this.camera.aspect
    const scale = Math.min(1, (visibleW * 0.88) / planeW, (visibleH * 0.8) / planeH)
    this.mesh.scale.setScalar(scale)
  }

  load() {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame)
      this.render()
    }
    animateFrame()
  }

  render() {
    const time = Date.now() * 0.001
    this.textCanvas.render()
    this.texture.needsUpdate = true
    ;(this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = Math.sin(time)
    this.filter.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.animationFrameId)
    this.filter?.domElement.remove()
    this.texture?.dispose()
    this.material?.dispose()
    this.geometry?.dispose()
    this.scene.clear()
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.forceContextLoss()
    }
  }
}

interface ASCIITextProps {
  text?: string
  asciiFontSize?: number
  textFontSize?: number
  textColor?: string
  planeBaseHeight?: number
  enableWaves?: boolean
  className?: string
}

export default function ASCIIText({
  text = 'David!',
  asciiFontSize = 8,
  textFontSize = 200,
  textColor = '#fdf9f3',
  planeBaseHeight = 8,
  enableWaves = true,
  className,
}: ASCIITextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let instance: CanvAscii | null = null
    let io: IntersectionObserver | null = null
    let ro: ResizeObserver | null = null

    const start = async (w: number, h: number) => {
      const next = new CanvAscii(
        { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves },
        container,
        w,
        h,
      )
      await next.init()
      // The effect may have been cleaned up while fonts were loading (e.g. StrictMode).
      if (cancelled) {
        next.dispose()
        return
      }
      instance = next
      instance.load()

      ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        if (instance && width > 0 && height > 0) instance.setSize(width, height)
      })
      ro.observe(container)
    }

    const { width, height } = container.getBoundingClientRect()
    if (width > 0 && height > 0) {
      void start(width, height)
    } else {
      io = new IntersectionObserver(
        ([entry]) => {
          const { width: w, height: h } = entry.boundingClientRect
          if (entry.isIntersecting && w > 0 && h > 0) {
            io?.disconnect()
            io = null
            void start(w, h)
          }
        },
        { threshold: 0.1 },
      )
      io.observe(container)
    }

    return () => {
      cancelled = true
      io?.disconnect()
      ro?.disconnect()
      instance?.dispose()
    }
  }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves])

  return <div ref={containerRef} className={['ascii-text-container', className].filter(Boolean).join(' ')} />
}
