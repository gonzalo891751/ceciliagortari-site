/**
 * Custom script for Sveltia CMS
 * Handles auto-generation of IDs for "prensa" collection.
 */

// Wait for the CMS to be initialized
window.CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
        // Only apply to 'prensa' collection
        if (entry.get('collection') !== 'prensa') return;

        const currentId = entry.getIn(['data', 'id']);

        // If ID is already set, do not overwrite it (preserves URLs)
        if (currentId && currentId.trim() !== '') return;

        // Generate ID from Date + Title
        const fecha = entry.getIn(['data', 'fecha']);
        const titulo = entry.getIn(['data', 'titulo']);

        if (fecha && titulo) {
            // Format: YYYY-MM-DD-slug-title
            const datePart = fecha.split('T')[0]; // Assumes ISO string or YYYY-MM-DD
            const titleSlug = titulo
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
                .trim()
                .replace(/\s+/g, "-"); // Replace spaces with dashes

            const newId = `${datePart}-${titleSlug}`;

            // Update the entry
            return entry.get('data').set('id', newId);
        }
    }
});
