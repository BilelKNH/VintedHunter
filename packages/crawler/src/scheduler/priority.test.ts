import { describe, expect, it } from 'vitest';
import { CRAWL_PRIORITY, priorityForBrands } from './priority.js';

describe('priorityForBrands', () => {
  it('returns HIGH for Nike Tech Fleece', () => {
    expect(priorityForBrands(['Nike Tech Fleece'])).toBe(CRAWL_PRIORITY.HIGH);
  });

  it('returns HIGH for Stone Island regardless of case', () => {
    expect(priorityForBrands(['stone island'])).toBe(CRAWL_PRIORITY.HIGH);
  });

  it("returns HIGH for Arc'teryx", () => {
    expect(priorityForBrands(["Arc'teryx"])).toBe(CRAWL_PRIORITY.HIGH);
  });

  it('returns MEDIUM for Carhartt', () => {
    expect(priorityForBrands(['Carhartt'])).toBe(CRAWL_PRIORITY.MEDIUM);
  });

  it('returns MEDIUM for Patagonia', () => {
    expect(priorityForBrands(['Patagonia'])).toBe(CRAWL_PRIORITY.MEDIUM);
  });

  it('returns LOW for unrecognized brands', () => {
    expect(priorityForBrands(['Zara'])).toBe(CRAWL_PRIORITY.LOW);
  });

  it('returns LOW when there are no brands', () => {
    expect(priorityForBrands([])).toBe(CRAWL_PRIORITY.LOW);
  });

  it('prefers the highest priority match across multiple brands', () => {
    expect(priorityForBrands(['Zara', 'Carhartt', 'Nike Tech'])).toBe(CRAWL_PRIORITY.HIGH);
  });
});
