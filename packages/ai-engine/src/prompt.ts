import type { VisionAnalysisInput } from './types.js';

// Bounds cost/latency per listing — a single Haiku call with more than a handful of images
// stops adding useful signal for a resale photo set (typically front/back/label/detail shots).
export const MAX_VISION_IMAGES = 4;

export const VISION_SYSTEM_PROMPT = `Tu inspectes les photos d'une annonce de mode d'occasion pour un assistant d'achat automatisé (marketplace Vinted).
Analyse uniquement ce qui est visible sur les photos fournies — ne suppose rien à partir du prix ou du texte de l'annonce.
Sois factuel et conservateur : si un élément n'est pas visible ou pas clair sur les photos, indique-le comme inconnu/non visible plutôt que de deviner.
Réponds exclusivement via l'outil fourni.`;

interface ImageContentBlock {
  type: 'image';
  source: { type: 'url'; url: string };
}

interface TextContentBlock {
  type: 'text';
  text: string;
}

export function buildVisionUserContent(
  input: VisionAnalysisInput,
): Array<ImageContentBlock | TextContentBlock> {
  const images: ImageContentBlock[] = input.imageUrls.slice(0, MAX_VISION_IMAGES).map((url) => ({
    type: 'image',
    source: { type: 'url', url },
  }));

  const instructions = [
    `Marque annoncée par le vendeur : ${input.brand ?? 'inconnue'}`,
    `Catégorie annoncée : ${input.category ?? 'inconnue'}`,
    `État annoncé par le vendeur : ${input.condition ?? 'inconnu'}`,
    '',
    'Examine les photos ci-dessus et rapporte, via l\'outil fourni :',
    '1. La qualité globale des photos (netteté, luminosité, nombre, diversité des angles).',
    '2. Les défauts visibles sur le produit.',
    "3. Le texte lisible sur toute étiquette/tag visible (référence, taille, composition...).",
    "4. Si le logo/étiquette visible est cohérent avec la marque annoncée.",
    '5. Tout signal concret de contrefaçon observé sur les photos.',
  ].join('\n');

  return [...images, { type: 'text', text: instructions }];
}
