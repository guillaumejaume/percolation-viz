## percolation-viz – Visualisation de la percolation

Ce projet est une petite application web permettant de **visualiser la percolation de sites sur une grille** (pour l’instant : grille carrée).  L’interface est en français et fonctionne entièrement dans le navigateur, sans installation compliquée. 
---

## 1. Prérequis (niveau débutant)

Vous n’avez pas besoin d’être développeur ou expert Git/GitHub, mais il faut :

- **Un navigateur moderne** : Chrome, Firefox, Edge, Safari, etc.
- **Python installé** (version 3.x) pour lancer un petit serveur local très simple.  
  - Sur macOS, Python 3 est souvent disponible via la commande `python3`.  
  - Sur Windows, il peut être nécessaire de l’installer depuis le site officiel de Python.

Si vous ne savez pas si Python est installé, vous pouvez ouvrir un **terminal** (ou PowerShell sur Windows) et taper :

```bash
python --version
```

ou

```bash
python3 --version
```

Si une version s’affiche (par exemple `Python 3.11.2`), c’est bon.

---

## 2. Installation du projet

1. **Récupérer les fichiers du projet**
   - Soit vous avez déjà ce dossier sur votre machine (par exemple après un `git clone`).
   - Soit vous pouvez télécharger le code sous forme de fichier `.zip` depuis GitHub :
     - Aller sur la page GitHub du projet.
     - Cliquer sur **Code** > **Download ZIP**.
     - Décompresser le `.zip` dans un dossier de votre choix (par exemple `percolation-viz`).

2. **Ouvrir un terminal dans le dossier du projet**
   - Sur macOS / Linux :
     - Ouvrir **Terminal**.
     - Taper `cd` suivi du chemin vers le dossier, par exemple :

       ```bash
       cd /chemin/vers/percolation-viz
       ```

   - Sur Windows :
     - Ouvrir **PowerShell**.
     - Aller dans le dossier avec `cd`, par exemple :

       ```powershell
       cd C:\Users\votre_nom\percolation-viz
       ```

---

## 3. Lancer l’application en local

> **Important :** il ne faut pas ouvrir `index.html` directement avec `Fichier > Ouvrir` dans le navigateur.  
> Il faut passer par un **petit serveur web local**, sinon le JavaScript moderne (modules) ne fonctionnera pas.

### Étape 1 – Démarrer un serveur web local

Dans le terminal (placé dans le dossier du projet `percolation-viz`), tapez **UNE** des commandes suivantes selon ce qui fonctionne chez vous :

- Si la commande `python` fonctionne :

  ```bash
  python -m http.server 8000
  ```

- Sinon, essayez avec `python3` :

  ```bash
  python3 -m http.server 8000
  ```

Vous devriez voir un message du type :

```text
Serving HTTP on :: port 8000 ...
```

**Laissez ce terminal ouvert** pendant que vous utilisez l’application.

### Étape 2 – Ouvrir l’application dans le navigateur

1. Ouvrez votre navigateur web.
2. Dans la barre d’adresse, tapez :

   ```text
   http://localhost:8000/
   ```

3. Vous devriez voir le projet apparaître (une page avec le panneau de contrôle à gauche et la grille à droite).

Pour arrêter le serveur, retournez dans le terminal et faites `Ctrl + C`.

---

## 4. Déployer sur GitHub Pages

L’objectif est de rendre la visualisation accessible à partir d’une URL publique, par exemple  
`https://votre-nom.github.io/percolation-viz/`.

### Étape 1 – Créer (ou utiliser) un dépôt GitHub

1. Créez un compte GitHub si ce n’est pas déjà fait.
2. Sur GitHub, créez un **nouveau dépôt** appelé par exemple `percolation-viz`.
3. Sur votre ordinateur :
   - Initialisez Git dans le dossier (si ce n’est pas déjà fait) :

     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     ```

   - Connectez le dépôt local au dépôt GitHub (remplacez `VOTRE_NOM` par votre pseudo GitHub) :

     ```bash
     git remote add origin https://github.com/VOTRE_NOM/percolation-viz.git
     git push -u origin main
     ```

   (Selon votre configuration, la branche par défaut peut s’appeler `master` au lieu de `main`.)

### Étape 2 – Activer GitHub Pages

1. Sur la page GitHub du dépôt, allez dans **Settings** (Paramètres).
2. Dans le menu de gauche, choisissez **Pages**.
3. Dans la section **Source**, choisissez :
   - **Branch** : `main` (ou `master`),  
   - **Folder** : `/root` (ou `/`).
4. Cliquez sur **Save**.

Après quelques minutes, GitHub vous fournira une URL du type :

```text
https://VOTRE_NOM.github.io/percolation-viz/
```

En ouvrant cette URL dans votre navigateur, vous verrez l’application en ligne.

---

## 5. Utilisation de l’outil (interface)

La page se compose de deux parties :

- **À gauche** : le panneau de contrôle (sélection de la grille, sliders, boutons, état).
- **À droite** : la grille de percolation dessinée sur un canvas.

### 5.1. Contrôles principaux

- **Type de grille**
  - Pour l’instant : **Grille carrée** (les autres types apparaissent comme “bientôt”).
  - Le texte sous le panneau indique le **seuil théorique de percolation** \(p_c\) pour le type de grille choisi.

- **Taille de la grille**
  - Slider qui contrôle le nombre de cases \(N \times N\).
  - Plus \(N\) est grand, plus la grille est fine et détaillée.

- **Probabilité d’occupation \(p\)**
  - Slider entre 0 et 1.
  - Quand vous cliquez sur **Aléatoire**, chaque site (case) est ouvert avec probabilité \(p\).

### 5.2. Boutons

- **Aléatoire**
  - Génère une nouvelle configuration de la grille :
    - Chaque site est **ouvert** avec probabilité \(p\).
    - Les sites ouverts sont en **bleu**, les fermés en **gris sombre**, et le cluster percolant (s’il existe) en **vert**.

- **Ouvrir un site**
  - Ouvre un seul site fermé choisi au hasard.
  - Pratique pour **voir la percolation apparaître progressivement** en partant d’une grille vide.

- **Réinitialiser**
  - Ferme tous les sites (grille vide).
  - Réinitialise les compteurs, mais conserve la taille de la grille et le type de grille sélectionné.

### 5.3. Zone d’état

- **Percole :**  
  - Affiche **Oui** si un cluster de sites ouverts relie le **haut** de la grille au **bas**.  
  - Sinon, affiche **Non**.

- **Sites ouverts :**  
  - Nombre total de sites actuellement ouverts dans la grille.

- **Seuil de percolation (théorique) :**  
  - Valeur \(p_c\) approximative connue pour le type de grille :
    - Grille carrée : environ **0,593**.
    - Grille triangulaire : **0,5**.
    - Grille hexagonale : environ **0,697**.

---

## 6. Détails de la visualisation

Même si ce n’est pas nécessaire pour l’utiliser, voici ce qui se passe « sous le capot » :

- La grille est un tableau \(N \times N\) de **sites** (cases).
- Chaque site peut être :
  - **Fermé** (non occupé).
  - **Ouvert** (occupé).
- Le programme détecte s’il existe un **chemin de sites ouverts** qui relie le **haut** de la grille au **bas** :
  - C’est ce chemin (et les sites du même cluster) qui est coloré en **vert**.
  - Les autres sites ouverts non connectés à ce chemin restent en **bleu**.

---

## 7. Problèmes fréquents

- **Rien ne se passe quand je clique sur “Aléatoire” ou “Ouvrir un site”**
  - Vérifiez que vous avez bien ouvert la page via  
    `http://localhost:8000/` (serveur Python) ou via GitHub Pages.
  - Si vous ouvrez directement `index.html` avec `Fichier > Ouvrir`, les modules JavaScript ne se chargent pas.

- **La page ne s’ouvre pas / erreur 404 sur GitHub Pages**
  - Vérifiez dans les **Settings > Pages** que la source est bien `main` (ou `master`) et le dossier `/root`.

Si vous bloquez à une étape, il peut être utile de faire une capture d’écran du message d’erreur ou du terminal pour diagnostiquer le problème.

---

## 8. Contribution et idées d’amélioration

- Ajouter la **grille triangulaire** et la **grille hexagonale** de façon interactive.
- Visualiser aussi la **percolation par liens** (percolation des arêtes au lieu des sites).
- Tracer des **courbes statistiques** (probabilité de percolation en fonction de \(p\), moyennes sur plusieurs réalisations, etc.).

Les contributions sont les bienvenues, même sous forme de suggestions ou d’issues sur GitHub.

