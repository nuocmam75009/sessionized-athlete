import { fireEvent, render, screen } from '@testing-library/react'
import Link from 'next/link'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

// Une page minimale : un bouton qui ouvre la modale, comme un jour du
// calendrier, et une modale avec un lien et un bouton en plus de « Close ».
function Page({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open workout
      </button>
      {open && (
        <Modal
          label="Workout"
          eyebrow="Tue, Aug 4"
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        >
          <Link href="/activities/act-1">View activity</Link>
          <button type="button">Upload</button>
        </Modal>
      )}
    </>
  )
}

function openModal() {
  const opener = screen.getByRole('button', { name: 'Open workout' })
  // fireEvent.click ne déplace pas le focus sous jsdom, contrairement à un vrai clic.
  opener.focus()
  fireEvent.click(opener)
  return opener
}

function tab(shiftKey = false) {
  fireEvent.keyDown(document, { key: 'Tab', shiftKey })
}

describe('Modal', () => {
  it('place le focus sur le bouton de fermeture à l’ouverture', () => {
    render(<Page />)
    openModal()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('Tab sur le dernier élément revient au premier', () => {
    render(<Page />)
    openModal()
    screen.getByRole('button', { name: 'Upload' }).focus()
    tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('Maj+Tab sur le premier élément va au dernier', () => {
    render(<Page />)
    openModal()
    tab(true)
    expect(screen.getByRole('button', { name: 'Upload' })).toHaveFocus()
  })

  it('Tab entre deux éléments de la modale suit l’ordre normal', () => {
    render(<Page />)
    openModal()
    screen.getByRole('link', { name: 'View activity' }).focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    document.dispatchEvent(event)
    // Le navigateur déplace lui-même le focus : la modale n'intervient pas.
    expect(event.defaultPrevented).toBe(false)
  })

  it('ramène dans la modale un focus parti sur la page derrière', () => {
    render(<Page />)
    const opener = openModal()
    opener.focus()
    tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('Échap ferme la modale et rend le focus à l’élément qui l’a ouverte', () => {
    const onClose = vi.fn()
    render(<Page onClose={onClose} />)
    const opener = openModal()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('le bouton Close rend aussi le focus à l’élément d’origine', () => {
    render(<Page />)
    const opener = openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(opener).toHaveFocus()
  })
})
