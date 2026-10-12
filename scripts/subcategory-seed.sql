-- Idempotent default subcategories per category, matched by category slug.
-- Safe to run more than once: ON CONFLICT on (category_id, slug) does nothing,
-- so renamed or admin-added subcategories are never touched or duplicated.
INSERT INTO subcategories (category_id, name, slug, position)
SELECT c.id, v.name, v.slug, v.position
FROM categories c
JOIN (
  VALUES
    ('sofas', '3 Seater Sofas', '3-seater-sofas', 0),
    ('sofas', '2 Seater Sofas', '2-seater-sofas', 1),
    ('sofas', '1 Seater Sofas', '1-seater-sofas', 2),
    ('sofas', 'L-Shaped Sofas', 'l-shaped-sofas', 3),
    ('sofas', 'Sofa Sets', 'sofa-sets', 4),
    ('sofas', 'Sofa cum Beds', 'sofa-cum-beds', 5),
    ('sofas', 'Recliners', 'recliners', 6),
    ('beds', 'King Beds', 'king-beds', 0),
    ('beds', 'Queen Beds', 'queen-beds', 1),
    ('beds', 'Single Beds', 'single-beds', 2),
    ('beds', 'Bunk Beds', 'bunk-beds', 3),
    ('beds', 'Upholstered Beds', 'upholstered-beds', 4),
    ('dining', '2 Seater Dining Sets', '2-seater-dining-sets', 0),
    ('dining', '4 Seater Dining Sets', '4-seater-dining-sets', 1),
    ('dining', '6 Seater Dining Sets', '6-seater-dining-sets', 2),
    ('dining', '8 Seater Dining Sets', '8-seater-dining-sets', 3),
    ('dining', 'Dining Tables', 'dining-tables', 4),
    ('dining', 'Dining Benches', 'dining-benches', 5),
    ('chairs', 'Accent Chairs', 'accent-chairs', 0),
    ('chairs', 'Lounge Chairs', 'lounge-chairs', 1),
    ('chairs', 'Rocking Chairs', 'rocking-chairs', 2),
    ('chairs', 'Dining Chairs', 'dining-chairs', 3),
    ('chairs', 'Study Chairs', 'study-chairs', 4),
    ('chairs', 'Stools', 'stools', 5),
    ('storage', 'Wardrobes', 'wardrobes', 0),
    ('storage', 'Sideboards & Cabinets', 'sideboards-and-cabinets', 1),
    ('storage', 'Bookshelves', 'bookshelves', 2),
    ('storage', 'Shoe Racks', 'shoe-racks', 3),
    ('storage', 'TV Units', 'tv-units', 4),
    ('storage', 'Chest of Drawers', 'chest-of-drawers', 5),
    ('tables', 'Coffee Tables', 'coffee-tables', 0),
    ('tables', 'Side Tables', 'side-tables', 1),
    ('tables', 'Console Tables', 'console-tables', 2),
    ('tables', 'Study Tables', 'study-tables', 3),
    ('tables', 'Nesting Tables', 'nesting-tables', 4)
) AS v(category_slug, name, slug, position) ON v.category_slug = c.slug
ON CONFLICT (category_id, slug) DO NOTHING;
