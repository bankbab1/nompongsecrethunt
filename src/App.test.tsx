import { fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders the garden, the board and a playable hand', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Little paws.')
    expect(screen.getByLabelText('Treasure hunt board').children).toHaveLength(40)
    expect(screen.getByText('YOUR TURN')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/Hiding spot/)).toHaveLength(3)
  })

  it('opens the setup dialog for a new adventure', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'New adventure' }))
    expect(screen.getByRole('dialog', { name: 'New adventure' })).toBeInTheDocument()
    expect(screen.getByLabelText('Your nickname')).toHaveValue('You')
  })
})
