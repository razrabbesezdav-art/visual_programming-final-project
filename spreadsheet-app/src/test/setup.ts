import '@testing-library/jest-dom'

//мок для ResizeObserver (отсутствует в jsdom)
class ResizeObserverMock {
  observe() { }
  unobserve() { }
  disconnect() { }
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver