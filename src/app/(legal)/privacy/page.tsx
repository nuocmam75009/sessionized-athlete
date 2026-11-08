import type { Metadata } from 'next'
import { tdClass, thClass } from '@/components/ui/table'
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie'
import { HOSTS, LEGAL_LAST_UPDATED, PUBLISHER } from '@/lib/legal'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import { formatLegalDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Privacy policy · Sessionized',
}

// Ce que l'app athlète collecte réellement, d'après le schéma de l'API. À tenir
// à jour avec lui : une donnée ajoutée sans être déclarée ici rend la
// politique inexacte.
const DATA_CATEGORIES = [
  { category: 'Account', data: 'Email address, first and last name, password (stored only as a hash)' },
  {
    category: 'Training profile',
    data: 'Age, weight, height, basal metabolic rate, heart rate zones, pace zones, main discipline',
  },
  {
    category: 'Activities',
    data: '.fit and .gpx files, GPS track, heart rate, cadence, power, calories, laps, distance, duration',
  },
  { category: 'Your notes', data: 'How a session felt, how hard it was' },
  { category: 'Strava connection', data: 'Activities imported from Strava, Strava access tokens (encrypted)' },
]

export default function PrivacyPolicyPage() {
  return (
    <article className="leading-relaxed">
      <h1>Privacy policy</h1>
      <p className="text-sm text-text/60 mt-2">Last updated: {formatLegalDate(LEGAL_LAST_UPDATED)}</p>

      <h2 className="mt-10 mb-3">Who is responsible for your data</h2>
      <p>
        {PUBLISHER.name}, {PUBLISHER.address}, is the controller of the personal data processed by Sessionized.
        Contact: {PUBLISHER.email}.
      </p>

      <h2 className="mt-10 mb-3">What we collect</h2>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th scope="col" className={thClass}>
              Category
            </th>
            <th scope="col" className={thClass}>
              Data
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
        Heart rate, weight and training data are <strong>health data</strong>. GPS tracks reveal where you run,
        and often where you live.
      </p>

      <h2 className="mt-10 mb-3">Why, and on what legal basis</h2>
      <ul className="list-disc pl-5 grid gap-2">
        <li>
          <strong>Running the service</strong> (your calendar, activity analysis, the link with your coach):
          performance of the contract you accept when you create your account.
        </li>
        <li>
          <strong>Processing your health data</strong>: your explicit consent, given when you create your account.
          We record the date you gave it. Sessionized can&apos;t plan or analyse your training without these data,
          so you withdraw your consent by deleting your account from your profile. Withdrawing it doesn&apos;t make
          the processing done before unlawful.
        </li>
        <li>
          <strong>Importing your Strava activities</strong>: your request, when you connect Strava. You can
          disconnect it at any time from your profile.
        </li>
        <li>
          <strong>Keeping the service secure</strong> (technical logs of requests and errors): our legitimate
          interest in protecting your account and our servers.
        </li>
      </ul>
      <p className="mt-4">We don&apos;t sell your data, show ads, or use analytics or tracking tools.</p>

      <h2 className="mt-10 mb-3">Who can see it</h2>
      <ul className="list-disc pl-5 grid gap-2">
        <li>
          <strong>Your coach</strong>: your profile, activities and notes, so they can plan and adjust your
          training. No other athlete or coach can see them.
        </li>
        <li>
          <strong>Our hosting providers</strong>, who store and process data on our behalf only: {HOSTS.frontend.name}{' '}
          (website, United States), {HOSTS.api.name} (application server, Germany) and {HOSTS.database.name}{' '}
          (database, {HOSTS.database.location}). Transfers to the United States are covered by the European
          Commission&apos;s standard contractual clauses; the United Kingdom benefits from an adequacy decision.
        </li>
        <li>
          <strong>Strava</strong> only sends us data, and only if you connect your account. Strava handles the data
          you keep there under its own privacy policy.
        </li>
      </ul>

      <h2 className="mt-10 mb-3">How long we keep it</h2>
      <p>
        Your data is kept while your account is active. When you delete your account from your profile, all your
        data (profile, activities, files, GPS tracks, notes, training plans, Strava tokens) is erased at once. If
        you write to us instead, we delete it within one month.
      </p>
      <p className="mt-4">
        Our database host keeps a short restore history to recover from an incident. Erased data disappears from
        it once that history window has passed.
      </p>

      <h2 className="mt-10 mb-3">Cookies and local storage</h2>
      <ul className="list-disc pl-5 grid gap-2">
        <li>
          <code>{SESSION_COOKIE_NAME}</code>: keeps you logged in. It can&apos;t be read by scripts and expires with
          your session.
        </li>
        <li>
          <code>{THEME_STORAGE_KEY}</code>, in your browser&apos;s local storage: remembers whether you chose the
          light or dark theme.
        </li>
      </ul>
      <p className="mt-4">
        Both are strictly necessary for features you use, so they don&apos;t need your consent. We use no other
        cookies.
      </p>

      <h2 className="mt-10 mb-3">How we protect it</h2>
      <p>
        All traffic is encrypted (HTTPS). Passwords are stored as hashes, never in readable form. Your session is
        kept in a cookie that page scripts can&apos;t read. Strava tokens are encrypted in the database. Access to
        your data is limited to you and your coach.
      </p>

      <h2 className="mt-10 mb-3">Your rights</h2>
      <p>
        You can access, correct, delete or export your data, object to or limit its processing, and withdraw your
        consent. Three of these rights work directly in the app, from <strong>Your data</strong> in your profile:
      </p>
      <ul className="list-disc pl-5 grid gap-2 mt-3">
        <li>
          <strong>Access and portability</strong>: <em>Download my data</em> gives you a copy of everything we hold
          about you, in a machine-readable file (JSON) that includes your original .fit and .gpx files.
        </li>
        <li>
          <strong>Erasure</strong>: <em>Delete my account</em> erases your account and all its data. We ask for
          your password first.
        </li>
        <li>
          <strong>Correction</strong>: your name, email and training profile can be edited in the app.
        </li>
      </ul>
      <p className="mt-4">For anything else, write to {PUBLISHER.email}: we answer within one month.</p>
      <p className="mt-4">
        If you think your rights aren&apos;t respected, you can lodge a complaint with the CNIL, the French data
        protection authority (cnil.fr).
      </p>
    </article>
  )
}
