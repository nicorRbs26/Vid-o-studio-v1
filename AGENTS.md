# Instructions et Règles de l'Agent de Développement (Video Studio)

Ce fichier regroupe l'analyse critique de l'architecture, les optimisations appliquées, les scénarios de test robustes, et les consignes pour toute modification future du projet.

## 1. Analyse Critique de l'Architecture & Bugs Corrigés

### 🚀 Optimisation Majeure : Rendu des Images sur le Canvas
- **Problème détecté (vibe : fuite mémoire & race conditions) :** Lors de la lecture d'une timeline, la tête de lecture met à jour l'état `currentTime` à 60 Hz. L'ancienne implémentation instanciait un nouvel objet `new Image()` à chaque rendu et rechargeait l'URL de l'actif média. Cela créait des goulots d'étranglement majeurs au niveau du processeur et du réseau, provoquant des saccades et des clignotements (flickering) en raison de callbacks asynchrones (`onload`) s'exécutant dans le mauvais ordre.
- **Solution (vibe : cache d'éléments) :** Ajout de `imageRefs` (un `useRef<Record<string, HTMLImageElement>>`) pour mettre en cache les objets images de manière persistante par clip ID. L'asynchronisme de `onload` a été résolu en déclenchant un nouveau rendu global de rafraîchissement au lieu de peindre directement, ce qui garantit la cohérence des calques.

### 🌐 Gestion de la Synchro Vidéo et Mode Hors Ligne
- **Edge case géré :** La synchronisation des clips vidéo utilise un contrôle de décalage (`Math.abs(video.currentTime - assetTime) > 0.1`) pour éviter de saturer le décodeur du navigateur avec des requêtes de recherche (seek operations) répétitives à chaque cycle de rafraîchissement.
- **Support Hors Ligne pour Thumbnails :** Si le client est déconnecté (`navigator.onLine === false`) ou si le chargement distant de FFmpeg échoue, un extracteur d'image natif HTML5 basé sur un élément `<video>` et un `<canvas>` temporaires génère instantanément la miniature de la vidéo de façon 100% locale et fluide sans aucun appel réseau.
- **Alertes Non-Bloquantes (iFrame proof) :** Remplacement des fonctions bloquantes de type `window.alert` par un système de notifications Toast hautement poli et animé de façon non-bloquante avec `framer-motion` (`AnimatePresence`).

---

## 2. Scénarios de Test Unitaires et d'Intégration

Pour valider le fonctionnement de l'application et éviter toute régression sur les fonctionnalités critiques :

### Test 1 : Calcul des Snap Points (Magnétisme)
```typescript
// test: Valide que les points d'attache incluent la position actuelle et les limites des clips exclus.
const clips = [
  { id: 'clip-1', startOffset: 0, duration: 5, layer: 1, type: 'video', assetId: 'a1' },
  { id: 'clip-2', startOffset: 10, duration: 3, layer: 1, type: 'video', assetId: 'a2' }
];
const currentTime = 2.5;

// Scénario de calcul des points pour clip-2:
const getSnapPoints = (excludeId: string) => {
  const points = [currentTime, 0];
  clips.forEach(c => {
    if (c.id !== excludeId) {
      points.push(c.startOffset);
      points.push(c.startOffset + c.duration);
    }
  });
  return Array.from(new Set(points));
};

const result = getSnapPoints('clip-2');
// Assertions attendues : result doit contenir [2.5, 0, 5]
```

### Test 2 : Ratio d'Aspect et Couverture Visuelle du Canvas
```typescript
// test: Vérifie que les calculs de redimensionnement conservent le ratio et couvrent le canvas sans écraser l'image.
const videoWidth = 1920;
const videoHeight = 1080;
const canvasWidth = 1080;
const canvasHeight = 1920; // 9:16 vertical format

const imgRatio = videoWidth / videoHeight; // 1.77
const canvasRatio = canvasWidth / canvasHeight; // 0.5625

let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;
if (imgRatio > canvasRatio) {
  sWidth = videoHeight * canvasRatio;
  sx = (videoWidth - sWidth) / 2;
} else {
  sHeight = videoWidth / canvasRatio;
  sy = (videoHeight - sHeight) / 2;
}

// Assertions attendues:
// sWidth doit être 607.5, sx doit être 656.25 (l'image de 16:9 est centrée et rognée verticalement pour remplir le format 9:16)
```

---

## 3. Directives pour l'Évolution Continue du Projet

1. **Règle d'Or de l'État Local :** Pour éviter les boucles infinies de rendu, ne mettez jamais à jour l'état React directement dans le corps d'un composant ou d'une fonction de rendu synchrone (ex: dans la boucle de rendu Canvas).
2. **Utilisation sélective de Framer Motion :** Privilégiez `framer-motion` (importé depuis `motion/react`) pour les transitions d'onglets de la barre latérale et les animations fluides, sans saturer le processeur lors du glissement de clips.
3. **Maintien de la compatibilité des exports :** Lors de l'ajout de nouvelles fonctionnalités de rendu (comme des filtres ou des formats), assurez-vous de mettre à jour le système de simulation d'export afin qu'il affiche des métadonnées précises au client final.
