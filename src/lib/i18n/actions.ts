'use server'

import { cookies } from 'next/headers'
import { isLocale, LOCALE_COOKIE_MAX_AGE_SEC, LOCALE_COOKIE_NAME, type Locale } from './config'

/**
 * Mémorise la langue choisie par le bouton de langue.
 *
 * Server Function plutôt qu'un cookie écrit en JavaScript : poser un cookie
 * depuis une Server Function invalide tout le cache du routeur côté client, et
 * Next renvoie la page re-rendue dans la même réponse. Avec un simple
 * router.refresh(), seule la page courante serait relue ; les pages déjà
 * préchargées (liens de la barre latérale) s'afficheraient encore dans
 * l'ancienne langue.
 */
export async function setLocale(locale: Locale): Promise<void> {
  // Une Server Function est un point d'entrée HTTP public : le type ne
  // garantit rien sur ce que le client envoie vraiment.
  if (!isLocale(locale)) return

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    // Aucun script n'a besoin de le lire : la langue arrive déjà résolue dans
    // le HTML et dans le contexte React.
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE_SEC,
  })
}
