// Textes de l'interface en anglais. Ce dictionnaire fixe la forme de tous les
// autres (type Dictionary) : une clé ajoutée ici sans sa traduction, ou une
// traduction sans clé, fait échouer la compilation.
//
// Les textes qui dépendent d'un nombre ou d'une valeur sont des fonctions : le
// pluriel ne suit pas les mêmes règles d'une langue à l'autre (« 0 activities »
// en anglais, « 0 activité » en français), une simple interpolation ne suffit
// pas.

const en = {
  meta: {
    description: 'Your plan, from your coach, every day.',
  },

  // Titres d'onglet (modèle « %s · Sessionized »).
  pageTitles: {
    login: 'Log in',
    calendar: 'Calendar',
    activity: 'Activity',
    upload: 'Upload activity',
    athleteData: 'Athlete data',
    profile: 'Profile',
    coaches: 'Coaches',
    legalNotice: 'Legal notice',
    privacy: 'Privacy policy',
  },

  common: {
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved.',
    saveChanges: 'Save changes',
    saveChangesFailed: "Couldn't save changes. Try again.",
    cancel: 'Cancel',
    uploading: 'Uploading…',
    back: 'Back',
    close: 'Close',
    activity: 'Activity',
    viewFullBreakdown: 'View full breakdown',
    uploadActivity: 'Upload activity',
    password: 'Password',
    email: 'Email',
    enterPassword: 'Enter your password.',
  },

  language: {
    groupLabel: 'Language',
  },

  theme: {
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
  },

  nav: {
    calendar: 'Calendar',
    athleteData: 'Athlete Data',
    profile: 'Profile',
    uploadActivity: 'Upload activity',
    logOut: 'Log out',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    skipToContent: 'Skip to content',
  },

  legalLinks: {
    navLabel: 'Legal',
    legalNotice: 'Legal notice',
    privacyPolicy: 'Privacy policy',
  },

  appError: {
    title: 'Something went wrong',
    body: "This page couldn't be displayed. Try again, or go back to your calendar.",
    tryAgain: 'Try again',
    backToCalendar: 'Back to calendar',
    reference: (digest: string) => `Reference: ${digest}`,
  },

  notFound: {
    title: 'Page not found',
    body: "This page doesn't exist, or you don't have access to it.",
    backToCalendar: 'Back to calendar',
  },

  auth: {
    tagline: 'Your workouts plan and data, in one place.',
    sessionExpired: 'Your session has expired. Log in again to pick up where you left off.',
    accountDeleted: 'Your account and all its data have been deleted.',
    modeLabel: 'Login or register',
    logIn: 'Log in',
    register: 'Register',
    createAccount: 'Create account',
    fullName: 'Full name (optional)',
    namePlaceholder: 'Jakob Ingebrigtsen',
    emailPlaceholder: 'you@example.com',
    inviteCode: 'Coach invite code (optional)',
    invitePlaceholder: 'e.g. RUN-2C4F',
    newHere: 'New here?',
    createAnAccount: 'Create an account',
    alreadyHaveAccount: 'Already have an account?',
    errors: {
      enterEmail: 'Enter your email.',
      passwordTooShort: (min: number) => `Use at least ${min} characters.`,
      consentRequired: 'Tick this box to create your account: Sessionized needs your health data to work.',
      coachAppMissing: "The coach app isn't configured in this environment.",
      loginFailed: "Couldn't log in. Check your email and password.",
      registerFailed: "Couldn't create your account. Check your details and try again.",
    },
    // Messages composés par les routes /api/auth/* à partir des refus de l'API.
    api: {
      tooManyAttempts: 'Too many attempts. Wait a few minutes before trying again.',
      tooManyAttemptsRetryIn: (minutes: number) => `Too many attempts. Try again in ${minutes} min.`,
      invalidCredentials: 'Invalid credentials',
      registrationFailed: 'Registration failed',
      choosePassword: 'Choose another password.',
      passwordTooWeak:
        'Too weak: use at least 8 characters mixing 3 of uppercase, lowercase, digits and symbols, or a passphrase of at least 5 words, or at least 16 digits.',
      passwordTooCommon: 'Too common or predictable (a common word followed by digits, a sequence or a repetition).',
      passwordPersonal: 'It must not contain your name, your email address or the name of the service.',
    },
  },

  consent: {
    labelBefore:
      'I agree that Sessionized processes my health data (heart rate, weight, training activities) to run the service, as described in the',
    labelLink: 'privacy policy',
    labelLinkNewTab: 'privacy policy (opens in a new tab)',
    labelAfter: '.',
    gate: {
      eyebrow: 'Privacy',
      title: 'Your health data',
      intro:
        'Sessionized uses your heart rate, weight and training activities to plan and analyse your workouts. These are health data, and the law requires your explicit consent to process them.',
      whyNow: 'Your account was created before we asked for it. Answer once to get back to your training.',
      required: 'Tick this box to keep using Sessionized.',
      saveFailed: "Couldn't save your answer. Try again.",
      continue: 'Continue',
      disagreeTitle: "You don't agree?",
      disagreeBody:
        "Sessionized can't work without these data. You can download a copy of everything we hold about you, then delete your account.",
    },
  },

  accountData: {
    preparing: 'Preparing your data…',
    download: 'Download my data',
    deleteAccount: 'Delete my account',
    downloadHint:
      'The download is a JSON file with your account, profile, plans, activities, GPS tracks and original .fit and .gpx files.',
    exportFailed: "Couldn't prepare your data. Try again.",
    deleteDialog: {
      label: 'Delete your account',
      eyebrow: 'Delete account',
      title: 'Delete your account?',
      warning:
        "This permanently erases your account and everything in it: activities, GPS tracks, original files, training plans and notes. Your coach loses access to them too. This can't be undone.",
      copyHint: 'Want a copy? Download your data before deleting your account.',
      incorrectPassword: 'Incorrect password.',
      tooManyAttempts: 'Too many attempts. Wait a minute, then try again.',
      failed: "Couldn't delete your account. Try again.",
      deleting: 'Deleting…',
    },
  },

  dashboard: {
    eyebrow: 'Calendar',
    previous: '‹ Previous',
    thisMonth: 'This month',
    next: 'Next ›',
    loadFailed:
      "Couldn't load all your workouts and activities — the calendar may be incomplete. Refresh the page to try again.",
  },

  stats: {
    distance: 'Distance',
    time: 'Time',
    duration: 'Duration',
    activities: 'Activities',
    pace: 'Pace',
    avgPace: 'Avg pace',
    longest: 'Longest',
    elevation: 'Elevation',
    heartRate: 'Heart rate',
    avgHr: 'Avg HR',
    maxHr: 'Max HR',
    calories: 'Calories',
  },

  calendar: {
    // Du lundi au dimanche, comme la grille.
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    status: {
      done: 'Done',
      missed: 'Missed',
      pending: 'Today',
      upcoming: 'Upcoming',
      unplanned: 'Unplanned',
    },
    // Début du nom accessible d'une case de semaine (lu avant le texte visible).
    weekSummaryOf: (range: string) => `Week summary ${range}: `,
    nothingPlanned: 'Nothing planned for this day.',
    logRun: 'Log a run',
  },

  weekSummary: {
    eyebrow: 'Week summary',
    thisWeek: 'This week',
    activeDays: (count: number) => `${count} active day${count === 1 ? '' : 's'} out of 7`,
    empty: 'No workouts or activities this week.',
    volume: 'Volume',
    physio: 'Physio',
    heartRateZones: 'Heart rate zones',
    plan: 'Plan',
    bySport: 'By sport',
    dayByDay: 'Day by day',
    planned: 'Planned',
    done: 'Done',
    missed: 'Missed',
    toCome: 'To come',
    unplanned: (count: number) =>
      `${count} unplanned activit${count === 1 ? 'y' : 'ies'} — not linked to a workout.`,
    noActivity: 'No activity recorded',
  },

  heartRateZones: {
    loading: 'Loading…',
    loadFailed: (status: number) => `Couldn't load heart rate zones (HTTP ${status}).`,
    loadFailedGeneric: "Couldn't load heart rate zones.",
    notSyncedBefore: 'No heart rate zones synced yet —',
    notSyncedLink: 'connect Strava',
    notSyncedAfter: 'to get them.',
    noHeartRate: 'No heart rate recorded this week.',
    easyShare: (duration: string) => `easy (Z1–Z2) · ${duration} with HR`,
    withoutSensor: (duration: string) =>
      `${duration} recorded without a heart rate sensor — excluded from the split.`,
  },

  sportBreakdown: {
    title: 'Hours by sport',
    sport: 'Sport',
    sessions: 'Sessions',
    total: 'total',
    sessionCount: (count: number) => `${count} session${count === 1 ? '' : 's'}`,
  },

  sports: {
    run: 'Run',
    trail_run: 'Trail run',
    ride: 'Ride',
    swim: 'Swim',
    walk: 'Walk',
    hike: 'Hike',
    strength: 'Strength',
    row: 'Rowing',
    ski: 'Ski',
    other: 'Other',
  },

  trainingLoad: {
    title: 'Training load',
    empty:
      'Fitness, fatigue and form appear once you have imported a few activities — connect Strava or upload a .fit file to get started.',
    estimated: (count: number) => `Estimated · ${count} activit${count === 1 ? 'y' : 'ies'}`,
    fitness: 'Fitness (CTL)',
    fatigue: 'Fatigue (ATL)',
    form: 'Form (TSB)',
    weeklyLoad: '7-day load',
    rampRate: 'Ramp rate',
    explanation: (bandHint: string) =>
      `${bandHint}. Fitness is a 42-day average of your session load, fatigue a 7-day one, and form the gap between them.`,
    notSettled: ' Your history is still shorter than 42 days, so fitness is not yet fully built up and reads low.',
    provenance: (estimated: number, total: number) =>
      ` ${estimated} of ${total} activities have no usable heart-rate trace — their load is estimated from duration alone.`,
    bands: {
      veryFresh: { label: 'Very fresh', hint: 'Rested — but fitness is starting to slip' },
      fresh: { label: 'Fresh', hint: 'Race-ready territory' },
      neutral: { label: 'Neutral', hint: 'Load and recovery are balanced' },
      building: { label: 'Building', hint: 'Productive fatigue — where progress is made' },
      deepFatigue: { label: 'Deep fatigue', hint: 'Sustained overload — watch recovery' },
    },
    chart: {
      fitness: 'Fitness',
      fatigue: 'Fatigue',
      form: 'Form',
      sessionLoad: 'Session load',
    },
  },

  plan: {
    lapCount: (count: number) => `${count} lap${count === 1 ? '' : 's'}`,
    metric: 'Metric',
    planned: 'Planned',
    actual: 'Actual',
    avgPaceTarget: 'Avg pace / target',
  },

  activity: {
    route: 'Route',
    plannedVsCompleted: 'Planned vs. completed',
    labels: {
      RACE: 'Race',
      LONG_RUN: 'Long run',
      WORKOUT: 'Workout',
      RECOVERY: 'Recovery',
    },
  },

  laps: {
    paceTitle: 'Pace',
    captionWithLaps:
      'Select laps in the table below, or click the chart, to highlight them. Drag the strip under the chart to zoom.',
    captionNoLaps: 'Drag the strip under the chart to zoom.',
    estimatedPositions: ' Lap positions are estimated: this activity was imported before they were recorded.',
    title: 'Laps',
    selectWork: 'Select work laps',
    clearSelection: 'Clear selection',
    selectedCount: (count: number) => `${count} ${count === 1 ? 'lap' : 'laps'} selected`,
    selectHint: 'Select laps to see their combined totals.',
    selectedColumn: 'Selected',
    lap: 'Lap',
    type: 'Type',
    selectLap: (number: number) => `Select lap ${number}`,
    lapNumber: (number: number) => `Lap ${number}`,
    zoomLabel: 'Zoom on part of the session',
    intensity: {
      work: 'Work',
      recovery: 'Recovery',
      rest: 'Rest',
      warmup: 'Warm-up',
      cooldown: 'Cool-down',
    },
  },

  aerobic: {
    title: 'Aerobic response',
    noAnalysis: (reason: string) => `No aerobic analysis for this session — ${reason}.`,
    rejections: {
      NO_HEART_RATE: 'no usable heart-rate trace on this activity',
      NO_SPEED: 'no speed data on this activity',
      TOO_SHORT: 'too short — it needs 20 minutes of steady running once the warm-up is cut',
      VARIABLE_EFFORT: 'the effort is not steady — drift only means something on a continuous run',
    },
    ratings: {
      GOOD: {
        label: 'Solid',
        hint: 'Pace and heart rate held together — your aerobic base carried this effort.',
      },
      MODERATE: {
        label: 'Some drift',
        hint: 'Heart rate climbed relative to pace in the back half — normal on a hard or long day.',
      },
      HIGH: {
        label: 'Heavy drift',
        hint: 'The second half cost noticeably more for the same pace — heat, fatigue, fuelling, or an effort above your current base.',
      },
    },
    efficiencyFactor: 'Efficiency factor',
    decoupling: 'Decoupling',
    analysed: 'Analysed',
    split: 'Split',
    ef: 'EF',
    firstHalf: 'First half',
    secondHalf: 'Second half',
    explanation: (warmUp: string) =>
      `Efficiency factor is metres covered per minute per heartbeat — it rises as you get faster at the same heart rate. The first ${warmUp} are excluded as warm-up.`,
    hillyTerrain: (metresPerKm: number) =>
      ` This run climbs about ${metresPerKm} m per km, so raw pace no longer reflects the effort — read the drift with caution until pace is grade-adjusted.`,
  },

  note: {
    title: 'Your note',
    difficulty: 'Difficulty: ',
    note: 'Note: ',
    edit: 'Edit note',
    athleteNote: 'Athlete note',
    difficultyField: 'Difficulty (1–10)',
    difficultyInvalid: 'Difficulty must be a whole number from 1 to 10.',
    saveFailed: "Couldn't save your note. Try again.",
  },

  fitAttach: {
    intro: "Laps imported from Strava don't tell work from recovery. Attach the .fit file from your watch to get them.",
    attach: 'Attach .fit file',
    alreadyAttached: 'This .fit file is already attached, to this activity or another one.',
    invalid:
      "This .fit file can't be attached: it is unreadable, has no laps, or doesn't match this activity's start time.",
    failed: "Couldn't attach the .fit file. Try again.",
    reloadFailed: "File attached, but the activity couldn't be reloaded. Refresh the page.",
  },

  gpxAttach: {
    attach: 'Attach .gpx route',
    replace: 'Replace .gpx route',
    failed: "Couldn't upload the .gpx route. Try again.",
  },

  assignStrava: {
    open: 'Assign Strava activity',
    title: 'Assign a Strava activity',
    assign: 'Assign',
    assigning: 'Assigning…',
    failed: "Couldn't assign the activity. Try again.",
  },

  stravaSync: {
    synced: 'Synced with Strava.',
    upToDate: 'Already up to date.',
    imported: (count: number) => (count === 1 ? '1 new activity imported.' : `${count} new activities imported.`),
    rateLimitedRetryIn: (minutes: number) => `Strava's request limit is reached. Try again in ${minutes} min.`,
    rateLimited: "Strava's request limit is reached. Try again later.",
    failed: "Couldn't sync with Strava. Try again.",
    syncing: 'Syncing…',
    sync: 'Sync Strava',
  },

  upload: {
    title: 'Upload activity',
    intro: 'Attach the .fit file from your watch, and optionally a .gpx for the route — drop both at once.',
    dropTitle: 'Drag your .fit and .gpx files here, or click to browse',
    dropHint: 'Drop the .fit and .gpx together to attach the route, or the .fit on its own.',
    previewHint: 'Add a .gpx to preview the route — otherwise the map is built after upload.',
    ready:
      'ready to upload. Distance, duration, heart rate and elevation are calculated by the server once uploaded.',
    athleteNote: 'Athlete note (optional)',
    notePlaceholder: 'Heavy legs, but felt good…',
    difficulty: 'Difficulty (1–10, optional)',
    match: 'Match to planned workout',
    noMatch: 'No match — log as unplanned',
    savedWithoutRoute: "Activity saved, but the .gpx route couldn't be attached.",
    addFromActivity: 'Add it from the activity page →',
    confirm: 'Confirm & save',
    discard: 'Discard',
    errors: {
      tooManyFiles: 'Drop at most two files: one .fit and one .gpx.',
      oneFit: 'Only one .fit file at a time.',
      oneGpx: 'Only one .gpx file at a time.',
      format: 'Accepted formats: .fit and .gpx.',
      gpxAlone: 'A .fit file is required to create the activity — a .gpx alone is not enough here.',
      duplicate: 'This activity has already been uploaded.',
      invalidFit: 'This .fit file is invalid or corrupted.',
      failed: 'Upload failed. Try again.',
    },
  },

  athleteData: {
    title: 'Athlete Data',
    intro: 'These physiological details help your coach fine-tune your sessions — target zones, load, recovery.',
    loadFailed: "Couldn't load your athlete data. Refresh the page to try again.",
    age: 'Age',
    weight: 'Weight (kg)',
    height: 'Height (cm)',
    bmr: 'Basal metabolic rate (kcal)',
    specialty: 'Specialty',
    specialties: {
      TRAIL: 'Trail',
      ULTRA_TRAIL: 'Ultra-trail',
      MIDDLE_DISTANCE_TRACK: 'Middle distance (track)',
      LONG_DISTANCE_TRACK: 'Long distance (track)',
      MIDDLE_DISTANCE_ROAD: 'Middle distance (road)',
      LONG_DISTANCE_ROAD: 'Long distance (road)',
    },
    syncedFromStrava: 'Synced from Strava',
    heartRateZones: 'Heart rate zones (bpm)',
    paceZones: 'Pace zones',
  },

  profile: {
    title: 'Profile',
    loadFailed: "Couldn't load your profile. Refresh the page to try again.",
    account: 'Account',
    firstName: 'First name',
    lastName: 'Last name',
    coach: 'Coach',
    assignedSince: (date: string) => ` · assigned since ${date}`,
    noCoach: 'No coach assigned.',
    findCoach: 'Find a coach →',
    preferences: 'Preferences',
    language: 'Language',
    units: 'Units',
    kilometers: 'Kilometers',
    miles: 'Miles',
    notifyNewPlan: 'Notify me when a new plan is posted',
    notifyWeekly: 'Weekly summary only',
    notifyNone: 'No notifications',
    integrations: 'Integrations',
    garminConnected: 'Garmin Connect · Connected',
    stravaStatus: (status: string) => `Strava · ${status}`,
    stravaExpired: 'Expired',
    stravaConnected: 'Connected',
    stravaNotConnected: 'Not connected',
    redirecting: 'Redirecting…',
    reconnectStrava: 'Reconnect Strava',
    disconnecting: 'Disconnecting…',
    disconnect: 'Disconnect',
    connect: 'Connect',
    stravaExpiredWarning:
      "Your Strava connection has expired — new Strava activities aren't being imported. Reconnect Strava to resume, or disconnect it.",
    stravaConnectFailed: "Couldn't start the Strava connection. Try again.",
    stravaDisconnectFailed: "Couldn't disconnect Strava. Try again.",
    stravaImporting: 'Importing your Strava activities… this may take a moment.',
    stravaImported: 'Strava activities imported.',
    viewCalendar: 'View my calendar →',
    stravaImportFailed: 'Account connected, but importing your activities failed. Try again from the calendar.',
    stravaConnectionFailed: "Couldn't connect Strava. Try again.",
    yourData: 'Your data',
    consentedOn: (date: string) => `You agreed to the processing of your health data on ${date}. `,
    dataUsageBefore: 'How we use your data and for how long: see the',
    dataUsageLink: 'privacy policy',
    dataUsageAfter: '.',
  },

  coaches: {
    eyebrow: 'Marketplace',
    title: 'Find your coach',
    loadFailed: "Couldn't load coaches. Refresh the page to try again.",
    available: (count: number) =>
      `${count} ${count === 1 ? 'coach' : 'coaches'} available — browse and pick the one that fits your goal.`,
    coachSince: (date: string) => `Coach since ${date}`,
  },

  legal: {
    lastUpdated: (date: string) => `Last updated: ${date}`,
  },
}

export type Dictionary = typeof en

export default en
