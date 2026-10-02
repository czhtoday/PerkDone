import data from "./data/cards.json";
import type { Card, Product } from "./model";
export const catalog = data.products as Product[];
// Existing cards retain stable IDs, custom perks, hidden state and manually configured dates.
export function hydrateCard(card: Card): Card {
  const product = catalog.find((p) => p.productId === card.productId);
  if (!product) return card;
  const benefits = product.benefits.map((b) => {
    const old = card.benefits.find((x) => x.id === b.id);
    return { ...b, hidden: old?.hidden, schedule: old?.schedule };
  });
  const custom = card.benefits.filter(
    (b) => !product.benefits.some((x) => x.id === b.id),
  );
  return {
    ...card,
    name: product.name,
    bank: product.bank,
    source: product.source,
    verified: product.verified,
    description: product.description,
    benefits: [...benefits, ...custom],
  };
}
