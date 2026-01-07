/**
 * Custom script for Sveltia CMS
 * Handles auto-generation of IDs for "prensa" collection.
 */

// Verify CMS global exists
if (typeof CMS !== 'undefined') {
    CMS.registerEventListener({
        name: 'preSave',
        handler: ({ entry }) => {
            // Only apply to 'prensa' collection items file
            if (entry.get('collection') !== 'prensa') return;

            // Get the data object (Immutable Map)
            const data = entry.get('data');
            if (!data) return;

            // Get the items list (Immutable List)
            const items = data.get('items');
            if (!items || !items.size) return;

            // 1. Collect existing IDs to check for duplicates
            const existingIds = new Set();
            items.forEach(item => {
                const id = item.get('id');
                if (id && typeof id === 'string') {
                    existingIds.add(id);
                }
            });

            // 2. Iterate and update items missing IDs
            const newItems = items.map(item => {
                const currentId = item.get('id');

                // If ID exists and is not empty, keep it (preserve legacy/link)
                if (currentId && currentId.trim() !== '') {
                    return item;
                }

                // Generate ID from Fecha + Título
                const fecha = item.get('fecha');
                const titulo = item.get('titulo');

                // If missing required fields, skip (can't generate)
                if (!fecha || !titulo) return item;

                // Format: YYYY-MM-DD
                let datePart = '0000-00-00';
                if (typeof fecha === 'string') {
                    datePart = fecha.split('T')[0];
                } else if (fecha instanceof Date) {
                    datePart = fecha.toISOString().split('T')[0];
                }

                // Slugify Title
                const titleSlug = titulo
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9\s-]/g, "") // Remove encoded chars and symbols
                    .trim()
                    .replace(/\s+/g, "-"); // Replace spaces with dashes

                let baseId = `${datePart}-${titleSlug}`;
                let finalId = baseId;
                let counter = 2;

                // Ensure Uniqueness
                while (existingIds.has(finalId)) {
                    finalId = `${baseId}-${counter}`;
                    counter++;
                }

                // Add to set so subsequent items in same list respect it
                existingIds.add(finalId);

                // Return new item with ID set
                return item.set('id', finalId);
            });

            // Return the modified entry
            return entry.setIn(['data', 'items'], newItems);
        }
    });
}
