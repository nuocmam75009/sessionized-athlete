import type { Dictionary } from './en'

// Textes de l'interface en français. Typographie : espace insécable ( )
// avant « : ; ? ! » et à l'intérieur des guillemets, pour qu'un retour à la
// ligne ne laisse jamais un signe seul en début de ligne.
//
// Vocabulaire d'entraînement aligné sur celui des montres et des plateformes
// francophones : allure, tour, FC, dénivelé, condition/fatigue/fraîcheur.

const fr: Dictionary = {
  meta: {
    description: 'Votre plan, par votre coach, chaque jour.',
  },

  pageTitles: {
    login: 'Connexion',
    calendar: 'Calendrier',
    activity: 'Activité',
    upload: 'Importer une activité',
    athleteData: 'Données athlète',
    profile: 'Profil',
    coaches: 'Coachs',
    legalNotice: 'Mentions légales',
    privacy: 'Politique de confidentialité',
  },

  common: {
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    saved: 'Enregistré.',
    saveChanges: 'Enregistrer les modifications',
    saveChangesFailed: 'Impossible d’enregistrer les modifications. Réessayez.',
    cancel: 'Annuler',
    uploading: 'Envoi…',
    back: 'Retour',
    close: 'Fermer',
    activity: 'Activité',
    viewFullBreakdown: 'Voir le détail complet',
    uploadActivity: 'Importer une activité',
    password: 'Mot de passe',
    email: 'E-mail',
    enterPassword: 'Saisissez votre mot de passe.',
  },

  language: {
    groupLabel: 'Langue',
  },

  theme: {
    switchToLight: 'Passer au thème clair',
    switchToDark: 'Passer au thème sombre',
  },

  nav: {
    calendar: 'Calendrier',
    athleteData: 'Données athlète',
    profile: 'Profil',
    uploadActivity: 'Importer une activité',
    logOut: 'Se déconnecter',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    expandSidebar: 'Déplier la barre latérale',
    collapseSidebar: 'Replier la barre latérale',
    skipToContent: 'Aller au contenu',
  },

  legalLinks: {
    navLabel: 'Informations légales',
    legalNotice: 'Mentions légales',
    privacyPolicy: 'Politique de confidentialité',
  },

  appError: {
    title: 'Une erreur est survenue',
    body: 'Cette page n’a pas pu s’afficher. Réessayez, ou revenez à votre calendrier.',
    tryAgain: 'Réessayer',
    backToCalendar: 'Retour au calendrier',
    reference: (digest: string) => `Référence : ${digest}`,
  },

  notFound: {
    title: 'Page introuvable',
    body: 'Cette page n’existe pas, ou vous n’y avez pas accès.',
    backToCalendar: 'Retour au calendrier',
  },

  auth: {
    tagline: 'Votre plan et vos données d’entraînement, au même endroit.',
    sessionExpired: 'Votre session a expiré. Reconnectez-vous pour reprendre là où vous en étiez.',
    accountDeleted: 'Votre compte et toutes ses données ont été supprimés.',
    modeLabel: 'Connexion ou inscription',
    logIn: 'Se connecter',
    register: 'S’inscrire',
    createAccount: 'Créer mon compte',
    fullName: 'Nom complet (facultatif)',
    namePlaceholder: 'Jakob Ingebrigtsen',
    emailPlaceholder: 'vous@exemple.fr',
    inviteCode: 'Code d’invitation du coach (facultatif)',
    invitePlaceholder: 'ex. RUN-2C4F',
    newHere: 'Pas encore de compte ?',
    createAnAccount: 'Créer un compte',
    alreadyHaveAccount: 'Déjà un compte ?',
    errors: {
      enterEmail: 'Saisissez votre e-mail.',
      passwordTooShort: (min: number) => `Utilisez au moins ${min} caractères.`,
      consentRequired:
        'Cochez cette case pour créer votre compte : Sessionized a besoin de vos données de santé pour fonctionner.',
      coachAppMissing: 'L’application coach n’est pas configurée dans cet environnement.',
      loginFailed: 'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.',
      registerFailed: 'Impossible de créer votre compte. Vérifiez vos informations et réessayez.',
    },
    api: {
      tooManyAttempts: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
      tooManyAttemptsRetryIn: (minutes: number) => `Trop de tentatives. Réessayez dans ${minutes} min.`,
      invalidCredentials: 'Identifiants invalides',
      registrationFailed: 'Inscription impossible',
      choosePassword: 'Choisissez un autre mot de passe.',
      passwordTooWeak:
        'Trop faible : au moins 8 caractères mêlant 3 types parmi majuscules, minuscules, chiffres et symboles, ou une phrase de passe d’au moins 5 mots, ou au moins 16 chiffres.',
      passwordTooCommon:
        'Trop courant ou prévisible (un mot courant suivi de chiffres, une suite ou une répétition).',
      passwordPersonal: 'Il ne doit contenir ni votre nom, ni votre adresse e-mail, ni le nom du service.',
    },
  },

  consent: {
    labelBefore:
      'J’accepte que Sessionized traite mes données de santé (fréquence cardiaque, poids, activités d’entraînement) pour fournir le service, comme le décrit la',
    labelLink: 'politique de confidentialité',
    labelLinkNewTab: 'politique de confidentialité (s’ouvre dans un nouvel onglet)',
    labelAfter: '.',
    gate: {
      eyebrow: 'Confidentialité',
      title: 'Vos données de santé',
      intro:
        'Sessionized utilise votre fréquence cardiaque, votre poids et vos activités d’entraînement pour planifier et analyser vos séances. Ce sont des données de santé, et la loi exige votre consentement explicite pour les traiter.',
      whyNow: 'Votre compte a été créé avant que nous le demandions. Répondez une fois pour retrouver votre entraînement.',
      required: 'Cochez cette case pour continuer à utiliser Sessionized.',
      saveFailed: 'Impossible d’enregistrer votre réponse. Réessayez.',
      continue: 'Continuer',
      disagreeTitle: 'Vous n’êtes pas d’accord ?',
      disagreeBody:
        'Sessionized ne peut pas fonctionner sans ces données. Vous pouvez télécharger une copie de tout ce que nous détenons sur vous, puis supprimer votre compte.',
    },
  },

  accountData: {
    preparing: 'Préparation de vos données…',
    download: 'Télécharger mes données',
    deleteAccount: 'Supprimer mon compte',
    downloadHint:
      'Le téléchargement est un fichier JSON avec votre compte, votre profil, vos plans, vos activités, vos traces GPS et vos fichiers .fit et .gpx d’origine.',
    exportFailed: 'Impossible de préparer vos données. Réessayez.',
    deleteDialog: {
      label: 'Supprimer votre compte',
      eyebrow: 'Suppression du compte',
      title: 'Supprimer votre compte ?',
      warning:
        'Cette action efface définitivement votre compte et tout son contenu : activités, traces GPS, fichiers d’origine, plans d’entraînement et notes. Votre coach n’y aura plus accès non plus. Elle est irréversible.',
      copyHint: 'Besoin d’une copie ? Téléchargez vos données avant de supprimer votre compte.',
      incorrectPassword: 'Mot de passe incorrect.',
      tooManyAttempts: 'Trop de tentatives. Patientez une minute, puis réessayez.',
      failed: 'Impossible de supprimer votre compte. Réessayez.',
      deleting: 'Suppression…',
    },
  },

  dashboard: {
    eyebrow: 'Calendrier',
    previous: '‹ Précédent',
    thisMonth: 'Ce mois-ci',
    next: 'Suivant ›',
    loadFailed:
      'Impossible de charger toutes vos séances et activités : le calendrier est peut-être incomplet. Actualisez la page pour réessayer.',
  },

  stats: {
    distance: 'Distance',
    time: 'Temps',
    duration: 'Durée',
    activities: 'Activités',
    pace: 'Allure',
    avgPace: 'Allure moy.',
    longest: 'Plus longue',
    elevation: 'Dénivelé',
    heartRate: 'Fréquence cardiaque',
    avgHr: 'FC moy.',
    maxHr: 'FC max',
    calories: 'Calories',
  },

  calendar: {
    weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    status: {
      done: 'Réalisée',
      missed: 'Manquée',
      pending: 'Aujourd’hui',
      upcoming: 'À venir',
      unplanned: 'Hors plan',
    },
    weekSummaryOf: (range: string) => `Récapitulatif de la semaine du ${range} : `,
    nothingPlanned: 'Rien de prévu ce jour-là.',
    logRun: 'Enregistrer une sortie',
  },

  weekSummary: {
    eyebrow: 'Récapitulatif de la semaine',
    thisWeek: 'Cette semaine',
    activeDays: (count: number) =>
      `${count} jour${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''} sur 7`,
    empty: 'Aucune séance ni activité cette semaine.',
    volume: 'Volume',
    physio: 'Physio',
    heartRateZones: 'Zones de fréquence cardiaque',
    plan: 'Plan',
    bySport: 'Par sport',
    dayByDay: 'Jour par jour',
    planned: 'Prévues',
    done: 'Réalisées',
    missed: 'Manquées',
    toCome: 'À venir',
    unplanned: (count: number) =>
      `${count} activité${count > 1 ? 's' : ''} hors plan, non liée${count > 1 ? 's' : ''} à une séance.`,
    noActivity: 'Aucune activité enregistrée',
  },

  heartRateZones: {
    loading: 'Chargement…',
    loadFailed: (status: number) => `Impossible de charger les zones de fréquence cardiaque (HTTP ${status}).`,
    loadFailedGeneric: 'Impossible de charger les zones de fréquence cardiaque.',
    notSyncedBefore: 'Aucune zone de fréquence cardiaque synchronisée pour l’instant :',
    notSyncedLink: 'connectez Strava',
    notSyncedAfter: 'pour les obtenir.',
    noHeartRate: 'Aucune fréquence cardiaque enregistrée cette semaine.',
    easyShare: (duration: string) => `en endurance (Z1–Z2) · ${duration} avec FC`,
    withoutSensor: (duration: string) =>
      `Temps enregistré sans capteur cardiaque : ${duration}, exclu de la répartition.`,
  },

  sportBreakdown: {
    title: 'Heures par sport',
    sport: 'Sport',
    sessions: 'Séances',
    total: 'total',
    sessionCount: (count: number) => `${count} séance${count > 1 ? 's' : ''}`,
  },

  sports: {
    run: 'Course',
    trail_run: 'Trail',
    ride: 'Vélo',
    swim: 'Natation',
    walk: 'Marche',
    hike: 'Randonnée',
    strength: 'Renforcement',
    row: 'Aviron',
    ski: 'Ski',
    other: 'Autre',
  },

  trainingLoad: {
    title: 'Charge d’entraînement',
    empty:
      'Condition, fatigue et fraîcheur apparaissent dès que vous avez importé quelques activités : connectez Strava ou importez un fichier .fit pour commencer.',
    estimated: (count: number) => `Estimation · ${count} activité${count > 1 ? 's' : ''}`,
    fitness: 'Condition (CTL)',
    fatigue: 'Fatigue (ATL)',
    form: 'Fraîcheur (TSB)',
    weeklyLoad: 'Charge sur 7 jours',
    rampRate: 'Progression',
    explanation: (bandHint: string) =>
      `${bandHint}. La condition est la moyenne sur 42 jours de la charge de vos séances, la fatigue celle sur 7 jours, et la fraîcheur l’écart entre les deux.`,
    notSettled:
      ' Votre historique couvre moins de 42 jours : la condition n’est pas encore entièrement construite et paraît basse.',
    provenance: (estimated: number, total: number) =>
      ` ${estimated} activité${estimated > 1 ? 's' : ''} sur ${total} n’${estimated > 1 ? 'ont' : 'a'} pas de trace cardiaque exploitable : leur charge est estimée à partir de la seule durée.`,
    bands: {
      veryFresh: { label: 'Très frais', hint: 'Reposé, mais la condition commence à baisser' },
      fresh: { label: 'Frais', hint: 'Prêt pour une compétition' },
      neutral: { label: 'Neutre', hint: 'Charge et récupération s’équilibrent' },
      building: { label: 'En construction', hint: 'Fatigue productive, celle qui fait progresser' },
      deepFatigue: { label: 'Fatigue profonde', hint: 'Surcharge prolongée, surveillez la récupération' },
    },
    chart: {
      fitness: 'Condition',
      fatigue: 'Fatigue',
      form: 'Fraîcheur',
      sessionLoad: 'Charge de la séance',
    },
  },

  plan: {
    lapCount: (count: number) => `${count} tour${count > 1 ? 's' : ''}`,
    metric: 'Mesure',
    planned: 'Prévu',
    actual: 'Réalisé',
    avgPaceTarget: 'Allure moy. / cible',
  },

  activity: {
    route: 'Parcours',
    plannedVsCompleted: 'Prévu et réalisé',
    labels: {
      RACE: 'Compétition',
      LONG_RUN: 'Sortie longue',
      WORKOUT: 'Séance',
      RECOVERY: 'Récupération',
    },
  },

  laps: {
    paceTitle: 'Allure',
    captionWithLaps:
      'Sélectionnez des tours dans le tableau ci-dessous, ou cliquez sur le graphe, pour les mettre en évidence. Faites glisser la bande sous le graphe pour zoomer.',
    captionNoLaps: 'Faites glisser la bande sous le graphe pour zoomer.',
    estimatedPositions:
      ' La position des tours est estimée : cette activité a été importée avant qu’elle ne soit enregistrée.',
    title: 'Tours',
    selectWork: 'Sélectionner les tours d’effort',
    clearSelection: 'Effacer la sélection',
    selectedCount: (count: number) => `${count} tour${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`,
    selectHint: 'Sélectionnez des tours pour voir leurs totaux cumulés.',
    selectedColumn: 'Sélectionné',
    lap: 'Tour',
    type: 'Type',
    selectLap: (number: number) => `Sélectionner le tour ${number}`,
    lapNumber: (number: number) => `Tour ${number}`,
    zoomLabel: 'Zoomer sur une partie de la séance',
    intensity: {
      work: 'Effort',
      recovery: 'Récup',
      rest: 'Repos',
      warmup: 'Échauffement',
      cooldown: 'Retour au calme',
    },
  },

  aerobic: {
    title: 'Réponse aérobie',
    noAnalysis: (reason: string) => `Pas d’analyse aérobie pour cette séance : ${reason}.`,
    rejections: {
      NO_HEART_RATE: 'aucune trace cardiaque exploitable sur cette activité',
      NO_SPEED: 'aucune donnée de vitesse sur cette activité',
      TOO_SHORT: 'trop courte, il faut 20 minutes de course régulière une fois l’échauffement retiré',
      VARIABLE_EFFORT: 'l’effort n’est pas régulier, la dérive n’a de sens que sur une course continue',
    },
    ratings: {
      GOOD: {
        label: 'Solide',
        hint: 'Allure et fréquence cardiaque sont restées liées : votre base aérobie a porté cet effort.',
      },
      MODERATE: {
        label: 'Légère dérive',
        hint: 'La fréquence cardiaque a monté par rapport à l’allure en seconde moitié : normal un jour d’effort dur ou long.',
      },
      HIGH: {
        label: 'Forte dérive',
        hint: 'La seconde moitié a coûté nettement plus pour la même allure : chaleur, fatigue, alimentation, ou un effort au-dessus de votre base actuelle.',
      },
    },
    efficiencyFactor: 'Facteur d’efficacité',
    decoupling: 'Découplage',
    analysed: 'Analysé',
    split: 'Moitié',
    ef: 'FE',
    firstHalf: 'Première moitié',
    secondHalf: 'Seconde moitié',
    explanation: (warmUp: string) =>
      `Le facteur d’efficacité est la distance parcourue en mètres par minute et par battement : il augmente quand vous allez plus vite à fréquence cardiaque égale. Le début de la séance (${warmUp}) est exclu comme échauffement.`,
    hillyTerrain: (metresPerKm: number) =>
      ` Ce parcours monte d’environ ${metresPerKm} m par km : l’allure brute ne reflète plus l’effort, lisez la dérive avec prudence tant que l’allure n’est pas corrigée de la pente.`,
  },

  note: {
    title: 'Votre note',
    difficulty: 'Difficulté : ',
    note: 'Note : ',
    edit: 'Modifier la note',
    athleteNote: 'Note de l’athlète',
    difficultyField: 'Difficulté (1–10)',
    difficultyInvalid: 'La difficulté doit être un nombre entier de 1 à 10.',
    saveFailed: 'Impossible d’enregistrer votre note. Réessayez.',
  },

  fitAttach: {
    intro:
      'Les tours importés de Strava ne distinguent pas l’effort de la récupération. Joignez le fichier .fit de votre montre pour les obtenir.',
    attach: 'Joindre le fichier .fit',
    alreadyAttached: 'Ce fichier .fit est déjà rattaché, à cette activité ou à une autre.',
    invalid:
      'Ce fichier .fit ne peut pas être rattaché : il est illisible, ne contient aucun tour, ou ne correspond pas à l’heure de départ de cette activité.',
    failed: 'Impossible de joindre le fichier .fit. Réessayez.',
    reloadFailed: 'Fichier rattaché, mais l’activité n’a pas pu être rechargée. Actualisez la page.',
  },

  gpxAttach: {
    attach: 'Joindre le tracé .gpx',
    replace: 'Remplacer le tracé .gpx',
    failed: 'Impossible d’envoyer le tracé .gpx. Réessayez.',
  },

  assignStrava: {
    open: 'Associer une activité Strava',
    title: 'Associer une activité Strava',
    assign: 'Associer',
    assigning: 'Association…',
    failed: 'Impossible d’associer l’activité. Réessayez.',
  },

  stravaSync: {
    synced: 'Synchronisé avec Strava.',
    upToDate: 'Déjà à jour.',
    imported: (count: number) =>
      count === 1 ? '1 nouvelle activité importée.' : `${count} nouvelles activités importées.`,
    rateLimitedRetryIn: (minutes: number) =>
      `La limite de requêtes de Strava est atteinte. Réessayez dans ${minutes} min.`,
    rateLimited: 'La limite de requêtes de Strava est atteinte. Réessayez plus tard.',
    failed: 'Impossible de synchroniser Strava. Réessayez.',
    syncing: 'Synchronisation…',
    sync: 'Synchroniser Strava',
  },

  upload: {
    title: 'Importer une activité',
    intro:
      'Joignez le fichier .fit de votre montre et, si vous le souhaitez, un .gpx pour le parcours : déposez les deux à la fois.',
    dropTitle: 'Glissez vos fichiers .fit et .gpx ici, ou cliquez pour parcourir',
    dropHint: 'Déposez le .fit et le .gpx ensemble pour joindre le parcours, ou le .fit seul.',
    previewHint: 'Ajoutez un .gpx pour prévisualiser le parcours, sinon la carte est construite après l’envoi.',
    ready:
      'prêt à être envoyé. Distance, durée, fréquence cardiaque et dénivelé sont calculés par le serveur après l’envoi.',
    athleteNote: 'Note de l’athlète (facultatif)',
    notePlaceholder: 'Jambes lourdes, mais de bonnes sensations…',
    difficulty: 'Difficulté (1–10, facultatif)',
    match: 'Associer à une séance prévue',
    noMatch: 'Aucune, enregistrer hors plan',
    savedWithoutRoute: 'Activité enregistrée, mais le tracé .gpx n’a pas pu être joint.',
    addFromActivity: 'Ajoutez-le depuis la page de l’activité →',
    confirm: 'Confirmer et enregistrer',
    discard: 'Abandonner',
    errors: {
      tooManyFiles: 'Déposez au plus deux fichiers : un .fit et un .gpx.',
      oneFit: 'Un seul fichier .fit à la fois.',
      oneGpx: 'Un seul fichier .gpx à la fois.',
      format: 'Formats acceptés : .fit et .gpx.',
      gpxAlone: 'Un fichier .fit est nécessaire pour créer l’activité : un .gpx seul ne suffit pas ici.',
      duplicate: 'Cette activité a déjà été importée.',
      invalidFit: 'Ce fichier .fit est invalide ou corrompu.',
      failed: 'L’envoi a échoué. Réessayez.',
    },
  },

  athleteData: {
    title: 'Données athlète',
    intro:
      'Ces données physiologiques aident votre coach à ajuster vos séances : zones cibles, charge, récupération.',
    loadFailed: 'Impossible de charger vos données athlète. Actualisez la page pour réessayer.',
    age: 'Âge',
    weight: 'Poids (kg)',
    height: 'Taille (cm)',
    bmr: 'Métabolisme de base (kcal)',
    specialty: 'Spécialité',
    specialties: {
      TRAIL: 'Trail',
      ULTRA_TRAIL: 'Ultra-trail',
      MIDDLE_DISTANCE_TRACK: 'Demi-fond (piste)',
      LONG_DISTANCE_TRACK: 'Fond (piste)',
      MIDDLE_DISTANCE_ROAD: 'Demi-fond (route)',
      LONG_DISTANCE_ROAD: 'Fond (route)',
    },
    syncedFromStrava: 'Synchronisé depuis Strava',
    heartRateZones: 'Zones de fréquence cardiaque (bpm)',
    paceZones: 'Zones d’allure',
  },

  profile: {
    title: 'Profil',
    loadFailed: 'Impossible de charger votre profil. Actualisez la page pour réessayer.',
    account: 'Compte',
    firstName: 'Prénom',
    lastName: 'Nom',
    coach: 'Coach',
    assignedSince: (date: string) => ` · suivi depuis ${date}`,
    noCoach: 'Aucun coach attribué.',
    findCoach: 'Trouver un coach →',
    preferences: 'Préférences',
    language: 'Langue',
    units: 'Unités',
    kilometers: 'Kilomètres',
    miles: 'Miles',
    notifyNewPlan: 'Me prévenir quand un nouveau plan est publié',
    notifyWeekly: 'Récapitulatif hebdomadaire uniquement',
    notifyNone: 'Aucune notification',
    integrations: 'Intégrations',
    garminConnected: 'Garmin Connect · Connecté',
    stravaStatus: (status: string) => `Strava · ${status}`,
    stravaExpired: 'Expiré',
    stravaConnected: 'Connecté',
    stravaNotConnected: 'Non connecté',
    redirecting: 'Redirection…',
    reconnectStrava: 'Reconnecter Strava',
    disconnecting: 'Déconnexion…',
    disconnect: 'Déconnecter',
    connect: 'Connecter',
    stravaExpiredWarning:
      'Votre connexion Strava a expiré : les nouvelles activités Strava ne sont plus importées. Reconnectez Strava pour reprendre, ou déconnectez-le.',
    stravaConnectFailed: 'Impossible de lancer la connexion à Strava. Réessayez.',
    stravaDisconnectFailed: 'Impossible de déconnecter Strava. Réessayez.',
    stravaImporting: 'Import de vos activités Strava… cela peut prendre un moment.',
    stravaImported: 'Activités Strava importées.',
    viewCalendar: 'Voir mon calendrier →',
    stravaImportFailed: 'Compte connecté, mais l’import de vos activités a échoué. Réessayez depuis le calendrier.',
    stravaConnectionFailed: 'Impossible de connecter Strava. Réessayez.',
    yourData: 'Vos données',
    consentedOn: (date: string) => `Vous avez accepté le traitement de vos données de santé le ${date}. `,
    dataUsageBefore: 'L’usage que nous faisons de vos données, et pour combien de temps : voir la',
    dataUsageLink: 'politique de confidentialité',
    dataUsageAfter: '.',
  },

  coaches: {
    eyebrow: 'Coachs',
    title: 'Trouvez votre coach',
    loadFailed: 'Impossible de charger les coachs. Actualisez la page pour réessayer.',
    available: (count: number) =>
      `${count} coach${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''} : parcourez-les et choisissez celui qui correspond à votre objectif.`,
    coachSince: (date: string) => `Coach depuis ${date}`,
  },

  legal: {
    lastUpdated: (date: string) => `Dernière mise à jour : ${date}`,
  },
}

export default fr
