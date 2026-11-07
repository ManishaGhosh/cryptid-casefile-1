import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import FlowCanvas from './FlowCanvas'
import { useAppStore } from '@/store'
import { makeConnection } from '@/services/connectionRules'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

// React Flow only renders edges between *measured* nodes; jsdom has no layout, so report a
// non-zero size and fire ResizeObserver on observe (same approach as investigationWorkflow.test).
class MeasuringResizeObserver {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element): void {
    const entry = { target } as unknown as ResizeObserverEntry
    setTimeout(() => this.callback([entry], this as unknown as ResizeObserver), 0)
  }
  unobserve(): void {}
  disconnect(): void {}
}
const NativeResizeObserver = globalThis.ResizeObserver
const offsetWidthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
const offsetHeightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')

beforeAll(() => {
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
})
afterAll(() => {
  globalThis.ResizeObserver = NativeResizeObserver
  if (offsetWidthDesc) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidthDesc)
  if (offsetHeightDesc) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeightDesc)
})

const CASE_ID = 'case-001'
const conn = makeConnection('EV-001', 'EV-002')

function seed(connections = true): void {
  useAppStore.setState({
    collectedEvidence: { [CASE_ID]: ['EV-001', 'EV-002'] },
    observationNotes: {},
    nodePositions: {},
    connections: connections ? { [CASE_ID]: [makeConnection('EV-001', 'EV-002')] } : {},
  })
}

function renderCanvas(readOnly = false) {
  return render(
    <ReactFlowProvider>
      <div style={{ width: 800, height: 600 }}>
        <FlowCanvas caseId={CASE_ID} readOnly={readOnly} />
      </div>
    </ReactFlowProvider>,
  )
}

const storedConnections = () => useAppStore.getState().connections[CASE_ID] ?? []

beforeEach(() => {
  seed()
})

describe('FlowCanvas', () => {
  it('renders one node per collected evidence item and none for uncollected', async () => {
    renderCanvas()
    expect(await screen.findByLabelText('Evidence node: Broken Branches')).toBeInTheDocument()
    expect(screen.getByLabelText('Evidence node: Thermal Anomaly')).toBeInTheDocument()
    expect(screen.queryByLabelText('Evidence node: Missing Deer')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.react-flow__node')).toHaveLength(2)
  })

  it('renders an empty board region with no nodes when nothing is collected', () => {
    useAppStore.setState({ collectedEvidence: {}, connections: {} })
    renderCanvas()
    expect(screen.getByRole('region', { name: 'Investigation board' })).toBeInTheDocument()
    expect(document.querySelectorAll('.react-flow__node')).toHaveLength(0)
  })

  it('shows connection controls for stored edges when editable', async () => {
    renderCanvas()
    expect(await screen.findByRole('button', { name: 'Add connection note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove connection' })).toBeInTheDocument()
  })

  it('hides connection controls and disables dragging when readOnly', async () => {
    renderCanvas(true)
    const node = await screen.findByLabelText('Evidence node: Broken Branches')
    // The edge is drawn (nodes are measured) but exposes no edit controls.
    await waitFor(() => expect(document.querySelectorAll('.react-flow__edge').length).toBeGreaterThan(0))
    expect(screen.queryByRole('button', { name: 'Add connection note' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove connection' })).not.toBeInTheDocument()
    expect(node.closest('.react-flow__node')).not.toHaveClass('draggable')
  })

  it('makes nodes draggable when editable', async () => {
    renderCanvas()
    const node = await screen.findByLabelText('Evidence node: Broken Branches')
    expect(node.closest('.react-flow__node')).toHaveClass('draggable')
  })

  it('removes a connection through the Remove control', async () => {
    const user = userEvent.setup()
    renderCanvas()
    await user.click(await screen.findByRole('button', { name: 'Remove connection' }))
    expect(storedConnections()).toHaveLength(0)
  })

  it('saves a trimmed connection note on Enter', async () => {
    const user = userEvent.setup()
    renderCanvas()
    await user.click(await screen.findByRole('button', { name: 'Add connection note' }))
    const input = screen.getByRole('textbox', { name: 'Connection note' })
    await user.type(input, '  same height  {Enter}')
    expect(storedConnections()[0].data?.label).toBe('same height')
    expect(screen.queryByRole('textbox', { name: 'Connection note' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit connection note: same height' })).toBeInTheDocument()
  })

  it('discards the draft on Escape', async () => {
    const user = userEvent.setup()
    renderCanvas()
    await user.click(await screen.findByRole('button', { name: 'Add connection note' }))
    await user.type(screen.getByRole('textbox', { name: 'Connection note' }), 'draft{Escape}')
    expect(screen.queryByRole('textbox', { name: 'Connection note' })).not.toBeInTheDocument()
    expect(storedConnections()[0].data?.label).toBe('')
  })

  it('deletes the selected edge with the Delete key when editable', async () => {
    const user = userEvent.setup()
    renderCanvas()
    await screen.findByRole('button', { name: 'Remove connection' })
    const edge = document.querySelector(`.react-flow__edge[data-id="${conn.id}"]`) as HTMLElement | null
    expect(edge).not.toBeNull()
    await user.click(edge as HTMLElement)
    edge?.focus()
    await user.keyboard('{Delete}')
    await waitFor(() => expect(storedConnections()).toHaveLength(0))
  })

  it('ignores the Delete key when readOnly', async () => {
    renderCanvas(true)
    await screen.findByLabelText('Evidence node: Broken Branches')
    await waitFor(() => expect(document.querySelector(`.react-flow__edge[data-id="${conn.id}"]`)).not.toBeNull())
    fireEvent.click(document.querySelector(`.react-flow__edge[data-id="${conn.id}"]`) as Element)
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' })
      fireEvent.keyUp(document.body, { key: 'Delete', code: 'Delete' })
    })
    expect(storedConnections()).toHaveLength(1)
  })
})
