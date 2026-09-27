// Configuration publique d'Échéa (aucun secret ici : ce fichier est servi aux visiteurs).

export const PRODUCT_NAME = 'Échéa';
export const SITE_URL = 'https://flavienherbert.github.io/ECHEA/';
export const REPO_URL = 'https://github.com/flavienherbert/ECHEA';

// Contact affiché sur le site et dans les pages légales (à confirmer par l'éditeur).
export const CONTACT_EMAIL = 'herbertflavien@outlook.fr';

// Offre
export const FREE_EXPORT_LIMIT = 25; // stagiaires par fichier exporté en version gratuite
export const FREE_REMINDER_LIMIT = 3; // entreprises relançables par email en version gratuite
export const PRICE_MONTHLY_HT = 29;
export const PRICE_YEARLY_HT = 290;

// Stripe Payment Links — MODE TEST (remplacer par les liens live avant le lancement).
export const STRIPE_MODE = 'test';
export const PAYMENT_LINK_MONTHLY = 'https://buy.stripe.com/test_9B600j2rogO38yC7dHbfO00';
export const PAYMENT_LINK_YEARLY = 'https://buy.stripe.com/test_8x25kD9TQfJZ5mqcy1bfO01';
export const PAYMENT_LINK_PILOT = 'https://buy.stripe.com/test_7sYfZhea6gO38yCapTbfO02';

// Clé publique Ed25519 de vérification des licences (la clé privée n'est jamais dans le dépôt).
export const LICENSE_PUBLIC_KEY = '5552a123c700981eef7a724d203250a332543ffe85fb318861a998d0fc96d918';

// Mesure d'audience sans cookie (GoatCounter). Vide = désactivée : aucune requête externe.
export const GOATCOUNTER_CODE = '';

// Sources officielles citées dans l'interface.
export const SOURCES = {
  obligations: 'https://passeport-prevention.travail-emploi.gouv.fr/aide/quelles-sont-mes-obligations-en-tant-quorganisme-de-formation',
  guideAdf: 'https://passeport-prevention.travail-emploi.gouv.fr/espace-public/sites/pp/files/2026-02/Guide%20import%20en%20masse_OF_ADF.pdf',
  guideJdr: 'https://passeport-prevention.travail-emploi.gouv.fr/espace-public/sites/pp/files/2026-02/Guide%20import%20en%20masse_OF_JDR.pdf',
  fiches: 'https://passeport-prevention.travail-emploi.gouv.fr/espace-public/node/106',
  portail: 'https://passeport-prevention.travail-emploi.gouv.fr/organismes',
  sanction: 'https://code.travail.gouv.fr/code-du-travail/l6356-2',
  nir: 'https://passeport-prevention.travail-emploi.gouv.fr/aide/je-ne-dispose-pas-du-numero-de-securite-sociale-dun-titulaire-que-faire',
  types: 'https://passeport-prevention.travail-emploi.gouv.fr/aide/quelle-est-la-difference-entre-une-attestation-de-formation-et-un-justificatif-de-reussite',
  calendrier: 'https://passeport-prevention.travail-emploi.gouv.fr/actualites/actualites-dans-le-deploiement-du-passeport-de-prevention',
};
