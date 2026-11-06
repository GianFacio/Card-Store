// Sort cards by descending PSA grade, keeping raw cards at the end.
window.sortStoreCards = function (cards) {
    const gradeRank = grade => grade === 'Raw'
        ? -1
        : Number(grade.match(/^PSA (\d+)$/)?.[1] ?? 0);

    return [...cards].sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade));
};

// Escape catalog text before adding it to the collection's HTML templates.
window.escapeStoreHTML = function (value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
};

// Create the browser client from the project's public URL and public anon/publishable key.
window.getStoreSupabaseClient = function () {
    const url = window.CARD_STORE_SUPABASE_URL;
    const key = window.CARD_STORE_SUPABASE_ANON_KEY;
    const isConfigured = url && key
        && !url.startsWith('YOUR_')
        && !key.startsWith('YOUR_');

    if (!isConfigured) {
        throw new Error('Add your Supabase project URL and public anon/publishable key to supabase-config.js.');
    }

    if (!window.supabase?.createClient) {
        throw new Error('Supabase could not load. Check your internet connection and reload the page.');
    }

    window.cardStoreClient ??= window.supabase.createClient(url, key);
    return window.cardStoreClient;
};

// Load cards from Supabase as the single source of truth.
window.loadStoreCards = async function () {
    const { data, error } = await window.getStoreSupabaseClient()
        .from('cards')
        .select('id, name, detail, grade, title, photos, sales');

    if (error) throw error;
    return window.sortStoreCards(data);
};

// Show database and connection failures directly on the current page.
window.showStoreError = function (container, error) {
    const notice = document.createElement('p');
    notice.className = 'store-error';
    notice.setAttribute('role', 'alert');
    notice.textContent = `Unable to load cards: ${error.message}`;
    container.prepend(notice);
};
