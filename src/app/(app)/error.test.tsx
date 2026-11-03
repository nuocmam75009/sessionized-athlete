import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AppError from './error'

describe('error.tsx de (app)', () => {
  it('annonce l’erreur, propose de réessayer et affiche la référence des logs', () => {
    const retry = vi.fn()
    render(<AppError error={Object.assign(new Error('masqué en production'), { digest: '1234567' })} retry={retry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByText('Reference: 1234567')).toBeInTheDocument()
    // Le message d'origine peut contenir des détails internes : jamais affiché.
    expect(screen.queryByText(/masqué en production/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to calendar' })).toHaveAttribute('href', '/dashboard')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
