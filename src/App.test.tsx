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
})
