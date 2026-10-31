# TP4 — Réponses

**Nom Prénom :** Ismail Makhloufi

## Partie 1 — Les dépôts npm

**Q1.**
- `npm-proxy` est un dépôt proxy qui récupère et met en cache les paquets depuis npmjs.org.
- `npm-hosted` est un dépôt hébergé dans Nexus permettant de publier et stocker nos paquets internes.
- `npm-group` regroupe plusieurs dépôts, notamment le hosted et le proxy, derrière une seule adresse.
- Les clients npm et le build Docker utilisent `npm-group` pour télécharger les paquets. Pour publier, on utilise directement `npm-hosted`.

**Q2.**

L'ordre des membres de `npm-group` compte car Nexus recherche les paquets selon cet ordre. En plaçant `npm-hosted` avant `npm-proxy`, nos paquets internes sont prioritaires. Si `@devops2/cours-utils` existait également sur npmjs.org, Nexus utiliserait d'abord la version présente dans notre dépôt hosted.

**Q3.**

On utilise l'utilisateur `deployer` plutôt que `admin` pour respecter le principe du moindre privilège. L'utilisateur `deployer` possède uniquement les permissions nécessaires à la publication et à la lecture des paquets. La lecture anonyme permet aux utilisateurs et aux builds de télécharger les paquets sans avoir besoin de fournir des identifiants.

## Partie 2 — Consommer via le group

**Q4.**

Après le `npm ci`, le dépôt `npm-proxy` contient les paquets téléchargés depuis npmjs.org, par exemple `lodash`, `react` et `vitest`. Le fichier `package-lock.json` n'a pas changé parce que les versions et les intégrités des paquets restent identiques. Seule la source de téléchargement a changé : les paquets passent désormais par Nexus.

**Q5.**

Si npmjs.org devient indisponible, les paquets déjà présents dans le cache de `npm-proxy` peuvent toujours être téléchargés depuis Nexus. En revanche, un paquet qui n'a jamais été téléchargé et qui n'est pas présent dans le cache ne pourra pas être récupéré tant que npmjs.org reste indisponible.

**Q6.**

Le fichier `frontend/.npmrc` est commité car il contient uniquement l'adresse du registre Nexus, qui n'est pas un secret. Le build Docker n'a besoin d'aucun secret car la lecture anonyme est activée sur le dépôt npm-group.

## Partie 3 — Publier un paquet interne

**Q7.**

Le champ `files` dans `package.json` permet de définir les fichiers qui seront inclus dans le paquet publié. Le champ `publishConfig` permet de préciser le registre utilisé lors de la publication. Sans `publishConfig`, npm pourrait utiliser le registre configuré par défaut, notamment `npm-group`, qui est destiné à la lecture et non à la publication. La publication pourrait donc échouer.

**Q8.**

Lors de la deuxième publication de la version `0.1.0`, Nexus a refusé la publication car l'option `Disable redeploy` est activée.

Message obtenu : `E409 (Conflict) — publication refusée car cette version existe déjà.`

Nexus empêche ainsi de remplacer une version déjà publiée par un contenu différent. Cela protège les utilisateurs qui ont déjà installé la version `0.1.0` et dont le `package-lock.json` référence cette version et son intégrité. Ils peuvent donc être certains de retrouver le même contenu lors des installations suivantes.

**Q9.**

La version `0.2.0` correspond à l'ajout d'une nouvelle fonctionnalité compatible avec les versions précédentes, conformément au versionnement sémantique. La version `0.1.1` serait plutôt adaptée à une correction sans ajout de fonctionnalité. La version `1.0.0` indique une version stable avec une API considérée comme prête pour une utilisation majeure.

**Q10.**

La plage `^0.2.0` accepte les versions supérieures ou égales à `0.2.0` et inférieures à `0.3.0`.

- Au prochain `npm install`, npm peut installer `0.2.1` si cette version est disponible et que le lockfile est mis à jour. Il ne prendra pas `0.3.0`.
- Au prochain `npm ci`, npm installe exactement les versions indiquées dans `package-lock.json`, sans recalculer les dépendances. Il faut donc mettre à jour le lockfile avec `npm install` pour prendre une nouvelle version.

**Q11.**

La variable `NPM_AUTH` se trouve dans le fichier `.env`, qui est ignoré par Git grâce au `.gitignore`. Elle contient le jeton d'authentification nécessaire à la publication. Si un jeton est commité par erreur, il faut immédiatement le révoquer ou le renouveler, supprimer le secret de l'historique Git et vérifier qu'il n'est plus accessible.

## Partie 4 — L'image Docker

**Q12.**

Dans `localhost:8082/cours-frontend:1.0.0` :

- `localhost:8082` : adresse du registre Docker hosted dans Nexus.
- `cours-frontend` : nom du dépôt ou de l'image.
- `1.0.0` : tag de l'image.

On pousse l'image sur le port `8082` car il correspond au dépôt `docker-hosted`, destiné à la publication. On tire l'image depuis le port `8083`, qui correspond à `docker-group` et regroupe le dépôt hosted et le proxy.

**Q13.**

Digest obtenu au push :

`sha256:45bd3b2e66d5edb21ca9ebfb859b3a89f10d9136ee12e3c7f4abfa1330da9f15`

Digest obtenu au pull :

`sha256:45bd3b2e66d5edb21ca9ebfb859b3a89f10d9136ee12e3c7f4abfa1330da9f15`

Les deux digests sont identiques. Le digest est une empreinte liée au contenu de l'image. Il garantit l'identification précise du contenu, contrairement au tag qui peut être déplacé vers une autre image.

**Q14.**

On évite d'utiliser uniquement le tag `latest` car il est mutable : il peut désigner différentes versions de l'image au fil du temps. Cela peut rendre les déploiements imprévisibles. Il est préférable d'utiliser un tag explicite, comme `1.0.0`, ou un digest pour garantir une version précise.

**Q15.**

Docker accepte ici la communication HTTP car `localhost` est considéré comme un registre local non sécurisé et a été configuré pour cet usage. Pour un Nexus partagé par toute une équipe, il faudrait mettre en place HTTPS avec un certificat TLS valide, un nom de domaine et une authentification adaptée.

## Partie 5 — Synthèse

**Q16.**

Dans le principe « Build once, deploy many », l'image Docker du frontend est construite une seule fois à partir du code source. Elle est ensuite publiée dans le dépôt `docker-hosted` de Nexus sous le nom `cours-frontend:1.0.0`.

Le fichier `docker-compose.yml` utilise ensuite cette image depuis `localhost:8083/cours-frontend:1.0.0`, au lieu de reconstruire l'application à chaque déploiement.

Deux étapes que le serveur d'intégration continue pourrait automatiser sont :

1. L'exécution des tests et la vérification de la qualité du code avant la publication.
2. La construction, le taggage et la publication automatique de l'image Docker dans Nexus après validation.