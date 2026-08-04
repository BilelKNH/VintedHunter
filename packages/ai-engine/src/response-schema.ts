import { z } from 'zod';

export const VISION_ANALYSIS_TOOL_NAME = 'report_vision_analysis';

// Validates the tool_use block's `input` before it's trusted anywhere downstream — Claude's
// structured output is forced via tool_choice, but the SDK doesn't validate the shape for us.
export const visionAnalysisResultSchema = z.object({
  photoQualityScore: z.number().int().min(0).max(100),
  defects: z.array(z.string()),
  extractedLabelText: z.array(z.string()),
  brandLogoConsistent: z.boolean().nullable(),
  counterfeitRiskFlags: z.array(z.string()),
});

// Raw JSON Schema handed to Anthropic as the tool's input_schema — kept in sync with
// visionAnalysisResultSchema above by hand (zod-to-json-schema isn't worth the dependency for
// one tool). `anyOf` (not a `type` array) for the nullable field, since that's the JSON-Schema
// form Anthropic's tool_use examples use for "boolean or unknown".
export const visionAnalysisInputSchema = {
  type: 'object',
  properties: {
    photoQualityScore: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description:
        'Note de qualité des photos (0-100) : netteté, luminosité, nombre de photos, diversité des angles.',
    },
    defects: {
      type: 'array',
      items: { type: 'string' },
      description:
        "Défauts visibles sur les photos (usure, taches, accrocs, pièces manquantes...), en français. Liste vide si aucun défaut visible.",
    },
    extractedLabelText: {
      type: 'array',
      items: { type: 'string' },
      description:
        "Texte visible sur les étiquettes/tags dans les photos, retranscrit tel quel (référence, taille, composition, pays de fabrication...). Liste vide si aucune étiquette lisible.",
    },
    brandLogoConsistent: {
      anyOf: [{ type: 'boolean' }, { type: 'null' }],
      description:
        "true si le logo/étiquette visible correspond à la marque annoncée, false si incohérence suspecte, null si aucun logo/étiquette n'est visible ou si la marque annoncée est inconnue. Ne pas déduire une incohérence du seul prix.",
    },
    counterfeitRiskFlags: {
      type: 'array',
      items: { type: 'string' },
      description:
        "Signaux concrets de contrefaçon observés sur les photos (police du logo incorrecte, couture de mauvaise qualité, étiquette d'authentification manquante...), en français. Liste vide si aucun signal.",
    },
  },
  required: [
    'photoQualityScore',
    'defects',
    'extractedLabelText',
    'brandLogoConsistent',
    'counterfeitRiskFlags',
  ] as string[],
} as const;
