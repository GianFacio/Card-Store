// Send signed-in members to their own profile when they select the site title.
(async function () {
    const siteBrand = document.querySelector('.site-brand');
    if (!siteBrand) return;

    function updateProfileLink(session) {
        siteBrand.href = session?.user
            ? `profile.html?user=${encodeURIComponent(session.user.id)}`
            : 'index.html';
    }

    try {
        const client = window.getStoreSupabaseClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        updateProfileLink(data.session);
        client.auth.onAuthStateChange((_event, session) => updateProfileLink(session));
    } catch (error) {
        console.error('Unable to set the member profile link:', error);
    }
})();
