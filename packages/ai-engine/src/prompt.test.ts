import { describe, expect, it } from 'vitest';
import { buildVisionUserContent, MAX_VISION_IMAGES } from './prompt.js';

describe('buildVisionUserContent', () => {
  it('builds one image block per URL followed by a text instructions block', () => {
    const content = buildVisionUserContent({
      imageUrls: ['https://cdn.vinted.fr/a.jpg', 'https://cdn.vinted.fr/b.jpg'],
      brand: 'Stone Island',
      category: 'Jacket',
      condition: 'Neuf avec étiquette',
    });

    expect(content).toHaveLength(3);
    expect(content[0]).toEqual({
      type: 'image',
      source: { type: 'url', url: 'https://cdn.vinted.fr/a.jpg' },
    });
    expect(content[1]).toEqual({
      type: 'image',
      source: { type: 'url', url: 'https://cdn.vinted.fr/b.jpg' },
    });
    expect(content[2]?.type).toBe('text');
  });

  it('caps the number of image blocks at MAX_VISION_IMAGES', () => {
    const imageUrls = Array.from({ length: 10 }, (_, i) => `https://cdn.vinted.fr/${i}.jpg`);

    const content = buildVisionUserContent({
      imageUrls,
      brand: null,
      category: null,
      condition: null,
    });

    const imageBlocks = content.filter((block) => block.type === 'image');
    expect(imageBlocks).toHaveLength(MAX_VISION_IMAGES);
  });

  it('includes the declared brand/category/condition in the instructions text, or "inconnue/inconnu" when null', () => {
    const content = buildVisionUserContent({
      imageUrls: [],
      brand: null,
      category: null,
      condition: null,
    });

    const textBlock = content.find((block) => block.type === 'text');
    expect(textBlock?.type).toBe('text');
    expect((textBlock as { type: 'text'; text: string }).text).toContain('inconnue');
    expect((textBlock as { type: 'text'; text: string }).text).toContain('inconnu');
  });
});
