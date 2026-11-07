/**
 * Shared jsdom shims for tests that drive the real router + React Flow board.
 * Call installFlowTestEnv() in beforeAll and uninstallFlowTestEnv() in afterAll.
 */

// jsdom's AbortSignal is rejected by Node's native Request, which React Router's data router
// uses for every navigation. Drop the (unneeded) signal so real route loaders can run in jsdom.
const NativeRequest = globalThis.Request
class JsdomSafeRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init && init.signal) {
      const rest: RequestInit = { ...init }
      delete rest.signal
      super(input, rest)
    } else {
      super(input, init)
    }
  }
}

// React Flow only renders edges between *measured* nodes. jsdom has no layout, so (per the
// React Flow testing guide) report a non-zero size and fire ResizeObserver on observe.
class MeasuringResizeObserver {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    const entry = { target } as unknown as ResizeObserverEntry
    // Asynchronous like the real API (React Flow's container ref is set after node effects).
    setTimeout(() => this.callback([entry], this as unknown as ResizeObserver), 0)
  }
  unobserve(): void {}
  disconnect(): void {}
}

const NativeResizeObserver = globalThis.ResizeObserver
const offsetWidthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
const offsetHeightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

export function installFlowTestEnv(): void {
  globalThis.Request = JsdomSafeRequest
  globalThis.ResizeObserver = MeasuringResizeObserver as unknown as typeof ResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return parseFloat(this.style.width) || 220
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return parseFloat(this.style.height) || 120
    },
  })
}

export function uninstallFlowTestEnv(): void {
  globalThis.Request = NativeRequest
  globalThis.ResizeObserver = NativeResizeObserver
  if (offsetWidthDesc) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidthDesc)
  if (offsetHeightDesc) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeightDesc)
}
