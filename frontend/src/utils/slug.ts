export const toSlug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const fromSlug = <T extends { display_name: string }>(items: T[], slug: string): T | undefined =>
  items.find(item => toSlug(item.display_name) === slug);
