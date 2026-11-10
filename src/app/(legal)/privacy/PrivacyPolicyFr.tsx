import { tdClass, thClass } from '@/components/ui/table'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { LOCALE_COOKIE_NAME } from '@/lib/i18n/config'
import { HOSTS, PUBLISHER } from '@/lib/legal'
import { THEME_STORAGE_KEY } from '@/lib/theme'

// Ce que l'app athlète collecte réellement, d'après le schéma de l'API. À tenir
// à jour avec lui, dans les deux langues (PrivacyPolicyEn) : une donnée
// ajoutée sans être déclarée ici rend la politique inexacte.
const DATA_CATEGORIES = [
  {
    category: 'Compte',
    data: 'Adresse e-mail, prénom et nom, mot de passe (conservé uniquement sous forme d’empreinte)',
  },
  {
    category: 'Profil d’entraînement',
    data: 'Âge, poids, taille, métabolisme de base, zones de fréquence cardiaque, zones d’allure, discipline principale',
  },
  {
    category: 'Activités',
    data: 'Fichiers .fit et .gpx, trace GPS, fréquence cardiaque, cadence, puissance, calories, tours, distance, durée',
  },
  { category: 'Vos notes', data: 'Vos sensations sur une séance, sa difficulté' },
  {
    category: 'Connexion Strava',
    data: 'Activités importées de Strava, jetons d’accès Strava (chiffrés)',
  },
]

// Politique de confidentialité, version française.
export function PrivacyPolicyFr({ lastUpdated }: { lastUpdated: string }) {
  return (
    <article className="leading-relaxed">
      <h1>Politique de confidentialité</h1>
      <p className="text-sm text-text/60 mt-2">{lastUpdated}</p>

      <h2 className="mt-10 mb-3">Qui est responsable de vos données</h2>
      <p>
        {PUBLISHER.name}, {PUBLISHER.address}, est responsable du traitement des données personnelles traitées par
        Sessionized. Contact&nbsp;: {PUBLISHER.email}.
      </p>

      <h2 className="mt-10 mb-3">Ce que nous collectons</h2>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th scope="col" className={thClass}>
              Catégorie
            </th>
            <th scope="col" className={thClass}>
              Données
            </th>
          </tr>
        </thead>
        <tbody>
          {DATA_CATEGORIES.map(({ category, data }) => (
            <tr key={category}>
              <th scope="row" className={`${tdClass} text-left font-medium pr-4 align-top`}>
                {category}
              </th>
              <td className={tdClass}>{data}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4">
        La fréquence cardiaque, le poids et les données d’entraînement sont des <strong>données de santé</strong>.
        Les traces GPS révèlent où vous courez, et souvent où vous habitez.
      </p>

      <h2 className="mt-10 mb-3">Pourquoi, et sur quelle base légale</h2>
      <ul className="list-disc pl-5 grid gap-2">
        <li>
          <strong>Fournir le service</strong> (votre calendrier, l’analyse de vos activités, le lien avec votre
          coach)&nbsp;: exécution du contrat que vous acceptez en créant votre compte.
        </li>
        <li>
          <strong>Traiter vos données de santé</strong>&nbsp;: votre consentement explicite, donné à la création de
          votre compte. Nous en conservons la date. Sessionized ne peut ni planifier ni analyser votre entraînement
          sans ces données&nbsp;: vous retirez donc votre consentement en supprimant votre compte depuis votre
          profil. Ce retrait ne rend pas illicite le traitement effectué auparavant.
        </li>
        <li>
          <strong>Importer vos activités Strava</strong>&nbsp;: votre demande, quand vous connectez Strava. Vous
          pouvez le déconnecter à tout moment depuis votre profil.
        </li>
        <li>
          <strong>Assurer la sécurité du service</strong> (journaux techniques des requêtes et des erreurs)&nbsp;:
          notre intérêt légitime à protéger votre compte et nos serveurs.
        </li>
      </ul>
      <p className="mt-4">
        Nous ne vendons pas vos données, n’affichons pas de publicité et n’utilisons aucun outil de mesure
        d’audience ni de pistage.
      </p>

      <h2 className="mt-10 mb-3">Qui peut les voir</h2>
      <ul className="list-disc pl-5 grid gap-2">
        <li>
          <strong>Votre coach</strong>&nbsp;: votre profil, vos activités et vos notes, pour planifier et ajuster
          votre entraînement. Aucun autre athlète ni aucun autre coach ne peut les voir.
        </li>
        <li>
          <strong>Nos hébergeurs</strong>, qui stockent et traitent les données pour notre seul compte&nbsp;:{' '}
          {HOSTS.frontend.name} (site web, États-Unis), {HOSTS.api.name} (serveur applicatif, Allemagne) et{' '}
          {HOSTS.database.name} (base de données, {HOSTS.database.location.fr}). Les transferts vers les États-Unis
          sont encadrés par les clauses contractuelles types de la Commission européenne&nbsp;; le Royaume-Uni
          bénéficie d’une décision d’adéquation.
        </li>
        <li>
          <strong>Strava</strong> ne fait que nous envoyer des données, et seulement si vous connectez votre compte.
          Strava traite les données que vous conservez chez lui selon sa propre politique de confidentialité.
        </li>
      </ul>

      <h2 className="mt-10 mb-3">Combien de temps nous les conservons</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Quand vous supprimez votre compte depuis votre
        profil, toutes vos données (profil, activités, fichiers, traces GPS, notes, plans d’entraînement, jetons
        Strava) sont effacées immédiatement. Si vous nous écrivez plutôt, nous les supprimons dans un délai d’un
        mois.
      </p>
      <p className="mt-4">
        Notre hébergeur de base de données conserve un court historique de restauration pour se remettre d’un
        incident. Les données effacées en disparaissent une fois ce délai écoulé.
      </p>

      <h2 className="mt-10 mb-3">Cookies et stockage local</h2>
      <ul className="list-disc pl-5 grid gap-2">
        <li>
          <code>{SESSION_COOKIE_NAME}</code>&nbsp;: vous garde connecté. Il ne peut pas être lu par les scripts et
          expire avec votre session.
        </li>
        <li>
          <code>{LOCALE_COOKIE_NAME}</code>&nbsp;: retient la langue choisie pour l’interface (anglais ou
          français). Il ne peut pas être lu par les scripts et est conservé un an.
        </li>
        <li>
          <code>{THEME_STORAGE_KEY}</code>, dans le stockage local de votre navigateur&nbsp;: retient si vous avez
          choisi le thème clair ou sombre.
        </li>
      </ul>
      <p className="mt-4">
        Tous trois sont strictement nécessaires à des fonctions que vous utilisez&nbsp;: ils ne requièrent donc pas
        votre consentement. Nous n’utilisons aucun autre cookie.
      </p>

      <h2 className="mt-10 mb-3">Comment nous les protégeons</h2>
      <p>
        Tous les échanges sont chiffrés (HTTPS). Les mots de passe sont conservés sous forme d’empreinte, jamais en
        clair. Votre session est conservée dans un cookie que les scripts des pages ne peuvent pas lire. Les jetons
        Strava sont chiffrés en base de données. L’accès à vos données est limité à vous et à votre coach.
      </p>

      <h2 className="mt-10 mb-3">Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les rectifier, les effacer ou les exporter, vous opposer à leur
        traitement ou le limiter, et retirer votre consentement. Trois de ces droits s’exercent directement dans
        l’application, depuis <strong>Vos données</strong> dans votre profil&nbsp;:
      </p>
      <ul className="list-disc pl-5 grid gap-2 mt-3">
        <li>
          <strong>Accès et portabilité</strong>&nbsp;: <em>Télécharger mes données</em> vous remet une copie de tout
          ce que nous détenons sur vous, dans un fichier lisible par une machine (JSON) qui inclut vos fichiers .fit
          et .gpx d’origine.
        </li>
        <li>
          <strong>Effacement</strong>&nbsp;: <em>Supprimer mon compte</em> efface votre compte et toutes ses
          données. Votre mot de passe vous est d’abord demandé.
        </li>
        <li>
          <strong>Rectification</strong>&nbsp;: votre nom, votre e-mail et votre profil d’entraînement se modifient
          dans l’application.
        </li>
      </ul>
      <p className="mt-4">
        Pour toute autre demande, écrivez à {PUBLISHER.email}&nbsp;: nous répondons dans un délai d’un mois.
      </p>
      <p className="mt-4">
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL,
        l’autorité française de protection des données (cnil.fr).
      </p>
    </article>
  )
}
