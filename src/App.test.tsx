import { act, fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import { useGameStore } from './store/gameStore'

describe('App', () => {
  it('starts on the setup dialog, then shows the classic 11×7 garden', () => {
    render(<App />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ไปตามกลิ่น|follow the scent/i }))
    expect(screen.getByLabelText(/กระดานล่าสมบัติ|Treasure hunt board/).children).toHaveLength(77)
    expect(screen.getAllByLabelText(/จุดซ่อนที่|Hiding spot/)).toHaveLength(3)
  })

  it('switches between Thai and English', () => {
    render(<App />)
    act(() => useGameStore.getState().setLang('th'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('อุ้งเท้าเล็ก ๆ')
    act(() => useGameStore.getState().setLang('en'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Little paws.')
  })

  it('closes a dialog by tapping outside it or on the close button', () => {
    render(<App />)
    act(() => useGameStore.getState().openModal({ kind: 'help' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog.parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => useGameStore.getState().openModal({ kind: 'help' }))
    fireEvent.click(screen.getByRole('button', { name: /^(ปิด|Close)$/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps must-answer dialogs open when tapping outside', () => {
    render(<App />)
    act(() => useGameStore.getState().openModal({ kind: 'peek', goal: 0 }))
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(ปิด|Close)$/ })).not.toBeInTheDocument()
  })
})
