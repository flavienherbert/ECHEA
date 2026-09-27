#!/usr/bin/env node
// Génère les pages légales HTML (mentions, CGV, confidentialité, merci) à partir d'un gabarit commun.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../app/', import.meta.url));
const logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="3" width="28" height="27" rx="7" fill="var(--brand)"/><path d="M8.5 17.2l4.4 4.4 9.6-10" fill="none" stroke="var(--on-brand)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26.5" cy="5.5" r="4.5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"/></svg>';
const draft = '<p class="notice notice-warn draft-banner small"><b>Modèle à faire relire par un professionnel du droit avant publication définitive.</b> Les mentions entre crochets sont à compléter par l’éditeur.</p>';
const todo = (t) => `<span class="todo">[${t}]</span>`;

function page(file, title, description, body, { noindex = false } = {}) {
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Échéa</title>
  <meta name="description" content="${description}">
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#0f5b53">${noindex ? '\n  <meta name="robots" content="noindex">' : ''}
  <link rel="stylesheet" href="./src/styles/site.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="./" aria-label="Échéa, accueil">${logo} Échéa</a>
      <nav class="site-nav" aria-label="Navigation"><a href="./#tarifs">Tarifs</a><a href="./#faq">FAQ</a><a class="btn btn-primary btn-small" href="./app.html">Ouvrir l’application</a></nav>
    </div>
  </header>
  <main class="page"><div class="wrap prose">
${body}
  </div></main>
  <footer class="site-footer">
    <div class="wrap">
      <nav aria-label="Liens légaux"><a href="./mentions-legales.html">Mentions légales</a><a href="./cgv.html">CGV</a><a href="./confidentialite.html">Confidentialité</a><a href="" data-contact>Contact</a></nav>
      <p>Échéa est un outil indépendant, sans lien avec le ministère du Travail ni la Caisse des Dépôts.</p>
    </div>
  </footer>
  <script type="module" src="./src/ui/site.js"></script>
</body>
</html>
`;
  writeFileSync(`${dir}${file}`, html);
}

page('mentions-legales.html', 'Mentions légales', 'Mentions légales du site Échéa.', `${draft}
<h1>Mentions légales</h1>
<p>Dernière mise à jour : 27 septembre 2026.</p>
<h2>Éditeur</h2>
<p>Le site et l’application Échéa sont édités par Flavien Herbert, ${todo('statut : entrepreneur individuel / micro-entreprise')}, SIRET ${todo('à compléter')}, dont l’adresse professionnelle est ${todo('adresse à compléter')}, Vire Normandie (Calvados).<br>
TVA : ${todo('« TVA non applicable, art. 293 B du CGI » en franchise en base, sinon n° de TVA intracommunautaire')}.<br>
Contact : <a href="" data-contact="text">email</a> · téléphone ${todo('à compléter')}.</p>
<h2>Directeur de la publication</h2>
<p>Flavien Herbert.</p>
<h2>Hébergement</h2>
<p>Le site est hébergé par GitHub Pages, service de GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (<a href="https://github.com" target="_blank" rel="noopener">github.com</a>).</p>
<h2>Fonctionnement de l’application</h2>
<p>L’application s’exécute dans le navigateur de l’utilisateur. Les fichiers importés et les données des stagiaires ne sont transmis ni à l’éditeur ni à l’hébergeur. Échéa est un outil d’aide indépendant, sans lien avec le ministère du Travail, la Caisse des Dépôts ou le portail du Passeport de prévention.</p>
<h2>Propriété intellectuelle</h2>
<p>La marque, le logo, les textes et le code d’Échéa sont la propriété de l’éditeur. Le code source est consultable publiquement à des fins de transparence ; sa consultation ne vaut pas licence d’exploitation. Les guides et référentiels officiels cités restent la propriété de leurs auteurs.</p>
<h2>Données personnelles</h2>
<p>Voir la <a href="./confidentialite.html">politique de confidentialité</a>.</p>
`);

page('cgv.html', 'Conditions générales', 'Conditions générales de vente et d’utilisation d’Échéa (clients professionnels).', `${draft}
<h1>Conditions générales de vente et d’utilisation</h1>
<p>Dernière mise à jour : 27 septembre 2026. Ces conditions s’appliquent entre l’éditeur d’Échéa (voir les <a href="./mentions-legales.html">mentions légales</a>) et tout client professionnel (« le Client »). Échéa est réservé aux professionnels.</p>
<h2>1. Objet</h2>
<p>Échéa est une application web qui aide les organismes de formation à préparer leurs fichiers d’import en masse pour le Passeport de prévention (attestations de formation et justificatifs de réussite) et à suivre les recyclages de leurs stagiaires.</p>
<h2>2. Nature du service et limites</h2>
<ul>
<li>Échéa est un <b>outil d’aide</b>. Le Client reste seul responsable de l’exactitude des données qu’il importe, du choix des codes (compétences, Formacodes, NSF, RS), du dépôt de ses déclarations sur le portail officiel et du respect des délais.</li>
<li>Échéa ne dépose aucune déclaration à la place du Client et ne garantit pas l’acceptation d’un fichier par le portail. Les fichiers suivent la trame officielle publiée à la date de la version utilisée ; le portail contrôle notamment l’existence des codes, du SIRET et du couple NIR / nom de naissance.</li>
<li>Les durées de validité et de recyclage proposées par défaut sont des repères (référentiels, recommandations) que le Client vérifie et adapte.</li>
</ul>
<h2>3. Accès, version gratuite et abonnement Pro</h2>
<p>L’application est accessible sans compte. La version gratuite permet les contrôles et l’export de sessions complètes jusqu’à 25 stagiaires par fichier, ainsi que la préparation d’emails de relance pour 3 entreprises. L’abonnement Pro lève ces limites. Il est activé par une clé de licence personnelle, envoyée par email après le paiement, que le Client s’engage à ne pas diffuser hors de son organisme. La clé d’un abonnement annuel couvre 13 mois ; celle d’un abonnement mensuel, offre pilote comprise, couvre 4 mois et une nouvelle clé est envoyée chaque trimestre tant que l’abonnement est actif.</p>
<h2>4. Prix et paiement</h2>
<p>Pro : 29 € HT par mois sans engagement, ou 290 € HT par an. ${todo('Mention TVA selon le régime de l’éditeur')}. Le paiement est effectué par carte via Stripe ; une facture est émise pour chaque échéance. Les prix peuvent évoluer ; tout changement est annoncé au moins 30 jours avant la prochaine échéance.</p>
<h2>5. Durée et résiliation</h2>
<p>L’abonnement se renouvelle automatiquement à chaque échéance. Le Client peut le résilier à tout moment par email ; la résiliation prend effet à la fin de la période en cours, sans remboursement de la période entamée. La clé de licence reste valable jusqu’à sa date d’expiration.</p>
<h2>6. Données</h2>
<p>Le traitement des fichiers a lieu dans le navigateur du Client : l’éditeur n’a accès ni aux fichiers ni aux données des stagiaires. Le Client est responsable de traitement des données de ses stagiaires et de leur conservation sur ses postes. Voir la <a href="./confidentialite.html">politique de confidentialité</a>.</p>
<h2>7. Disponibilité et évolutions</h2>
<p>L’éditeur s’efforce d’assurer l’accès au site sans garantie de disponibilité permanente. Il peut faire évoluer l’application, notamment pour suivre les évolutions de la trame officielle.</p>
<h2>8. Responsabilité</h2>
<p>La responsabilité de l’éditeur est limitée aux dommages directs et prouvés, dans la limite des sommes payées par le Client au cours des 12 derniers mois. Elle ne couvre pas les dommages indirects (perte de chiffre d’affaires, sanction administrative liée à une déclaration, perte de données conservées sur le poste du Client).</p>
<h2>9. Propriété intellectuelle</h2>
<p>Échéa reste la propriété de l’éditeur. L’abonnement confère un droit d’utilisation personnel, non exclusif et non transférable, pour les besoins internes du Client.</p>
<h2>10. Droit applicable</h2>
<p>Les présentes conditions sont soumises au droit français. À défaut d’accord amiable, tout litige relève des tribunaux compétents de Caen.</p>
`);

page('confidentialite.html', 'Confidentialité', 'Politique de confidentialité d’Échéa : les données des stagiaires ne quittent pas votre navigateur.', `${draft}
<h1>Politique de confidentialité</h1>
<p>Dernière mise à jour : 27 septembre 2026.</p>
<h2>L’essentiel</h2>
<ul>
<li><b>Les données de vos stagiaires ne nous sont jamais transmises.</b> Le fichier que vous importez est lu et transformé dans votre navigateur. Aucun envoi n’a lieu vers un serveur, y compris vers l’éditeur.</li>
<li><b>Les NIR ne sont jamais enregistrés.</b> Ils servent à produire le fichier d’export, puis disparaissent à la fermeture de la page.</li>
<li><b>Ce qui reste sur votre poste :</b> le suivi des recyclages (nom, prénom, entreprise, SIRET, email de l’entreprise, formation, dates, résultat), votre catalogue de formations, vos réglages et votre clé de licence, dans le stockage local de votre navigateur. Le bouton « Tout effacer » (Réglages) les supprime.</li>
<li>Aucun cookie publicitaire ni traceur n’est utilisé.</li>
</ul>
<h2>Données traitées par l’éditeur</h2>
<table>
<tr><th>Données</th><th>Finalité et base légale</th><th>Durée</th></tr>
<tr><td>Échanges par email (nom, email, contenu)</td><td>Répondre à vos demandes, support (intérêt légitime ; exécution du contrat pour les clients)</td><td>3 ans après le dernier échange</td></tr>
<tr><td>Données de paiement et de facturation (via Stripe)</td><td>Encaissement, facturation, émission de la clé de licence (exécution du contrat ; obligations comptables)</td><td>Factures : 10 ans (Code de commerce)</td></tr>
<tr><td>Prospection (nom de l’organisme, email et téléphone professionnels, nom du dirigeant, tels qu’affichés sur le site de l’organisme ; historique des échanges)</td><td>Présenter Échéa aux organismes de formation (intérêt légitime : prospection entre professionnels, en rapport avec l’activité du destinataire)</td><td>3 ans à compter de la collecte ou du dernier contact émanant de l’organisme ; suppression sur simple demande</td></tr>
<tr><td>Journaux techniques de l’hébergeur (adresse IP, pages demandées)</td><td>Sécurité et fonctionnement du site (intérêt légitime), traités par GitHub</td><td>Selon la politique de GitHub</td></tr>
</table>
<p>L’éditeur ne voit jamais les numéros de carte, traités directement par Stripe.</p>
<h2 id="prospection">Prospection</h2>
<p>Les coordonnées utilisées pour présenter Échéa sont celles que les organismes de formation publient sur leur site internet. Aucun message n’est envoyé en masse : chaque email est relu puis envoyé par l’éditeur. Pour ne plus être contacté, il suffit de répondre à un message ou d’écrire à <a href="" data-contact="text">l’adresse de contact</a> : les coordonnées sont supprimées, seule une mention « ne plus contacter » étant conservée pour respecter ce choix.</p>
<h2>Destinataires et transferts</h2>
<p>Stripe (paiement), GitHub, Inc. (hébergement du site), Google (messagerie) et Anthropic (assistant Claude, utilisé pour préparer les messages et tenir le suivi des prospects) interviennent comme prestataires. Ces sociétés peuvent traiter des données hors de l’Union européenne, notamment aux États-Unis, dans le cadre des garanties prévues par le RGPD (clauses contractuelles types ou cadre de protection des données UE–États-Unis selon leurs engagements). ${todo('Vérifier l’entité Stripe indiquée dans votre contrat')}</p>
<h2>Mesure d’audience</h2>
<p>Si elle est activée, la mesure d’audience utilise un outil sans cookie qui ne collecte que des pages vues et des évènements anonymes (par exemple « export effectué »), jamais le contenu de vos fichiers.</p>
<h2>Vos droits</h2>
<p>Vous disposez des droits d’accès, de rectification, d’effacement, d’opposition, de limitation et de portabilité sur les données que l’éditeur traite. Écrivez à <a href="" data-contact="text">l’adresse de contact</a>. Vous pouvez aussi saisir la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).</p>
<h2>Vos obligations envers vos stagiaires</h2>
<p>En tant qu’organisme de formation, vous restez responsable de traitement des données de vos stagiaires, y compris de leur NIR, que la réglementation du Passeport de prévention vous demande de déclarer.</p>
`);

page('merci.html', 'Merci', 'Confirmation de votre abonnement Échéa Pro.', `
<h1>Merci, votre abonnement est enregistré.</h1>
<p class="lead">Votre clé de licence Échéa Pro vous est envoyée par email sous 24 h ouvrées, à l’adresse saisie lors du paiement.</p>
<div class="notice notice-brand"><p style="margin:0"><b id="plan-line">Et ensuite ?</b></p>
<ol style="margin:.5em 0 0">
<li>Ouvrez l’application et préparez vos fichiers : les contrôles fonctionnent déjà.</li>
<li>Dès réception de l’email, collez la clé dans <b>Réglages → Licence</b>.</li>
<li>Une question ? Répondez simplement à l’email, ou écrivez à <a href="" data-contact="text">l’adresse de contact</a>.</li>
</ol></div>
<p style="margin-top:24px"><a class="btn btn-primary" href="./app.html?tab=reglages">Ouvrir l’application</a></p>
<script type="module">
  const plan = new URLSearchParams(location.search).get('plan');
  const labels = { mensuel: 'Abonnement mensuel', annuel: 'Abonnement annuel', pilote: 'Offre pilote : 3 mois offerts' };
  if (labels[plan]) document.getElementById('plan-line').textContent = labels[plan] + ' — et ensuite ?';
</script>
`, { noindex: true });
console.log('pages légales générées');
