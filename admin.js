// Authenticate the store admin, then save new cards through the protected Supabase API.
const loginSection = document.querySelector('#admin-login');
const dashboard = document.querySelector('#admin-dashboard');
const loginForm = document.querySelector('#login-form');
const cardForm = document.querySelector('#card-form');
const message = document.querySelector('#admin-message');
const passwordInput = document.querySelector('#login-password');
const returnTo = getSafeReturnTarget();
let supabaseClient;

function getSafeReturnTarget() {
    const requested = new URLSearchParams(window.location.search).get('returnTo');
    if (!requested || requested.startsWith('//') || !requested.startsWith('/')) return 'index.html';
    const path = requested.split(/[?#]/, 1)[0];
    if (path.split('/').includes('..') || !/\/(?:index|collection)\.html$/.test(path)) return 'index.html';
    return requested;
}

document.querySelector('#cancel-add-card').href = returnTo;

document.querySelector('#toggle-password-visibility').addEventListener('click', event => {
    const button = event.currentTarget;
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    button.title = isVisible ? 'Show password' : 'Hide password';
    button.setAttribute('aria-pressed', String(!isVisible));
});

window.setupCardPhotoSlotInputs(document.querySelector('#card-form'));

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('store-error', isError);
}

async function verifyStoreAdmin(user) {
    const { data, error } = await supabaseClient.rpc('is_store_admin');
    if (error) throw error;
    if (!data) {
        await supabaseClient.auth.signOut();
        window.setStoreAdminAccess(false);
        throw new Error('This account is signed in but is not on the store admin allowlist.');
    }

    loginSection.hidden = true;
    dashboard.hidden = false;
    window.setStoreAdminAccess(true);
    if (user?.email) dashboard.querySelector('h1').title = `Signed in as ${user.email}`;
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    showMessage('Signing in…');
    try {
        supabaseClient = window.getStoreSupabaseClient();
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: window.getStoreAdminEmail(document.querySelector('#login-username').value),
            password: passwordInput.value
        });
        if (error) throw error;
        await verifyStoreAdmin(data.user);
    } catch (error) {
        showMessage(`Unable to sign in: ${error.message}`, true);
    }
});

cardForm.addEventListener('submit', async event => {
    event.preventDefault();
    showMessage('Saving card…');
    const cardId = document.querySelector('#card-id').value.trim();
    if (!/^[a-z0-9-]+$/.test(cardId)) {
        showMessage('Use only lowercase letters, numbers, and hyphens for the card ID.', true);
        return;
    }

    const frontFile = document.querySelector('#card-front-photo').files[0];
    const backFile = document.querySelector('#card-back-photo').files[0];
    if (!frontFile) {
        showMessage('Choose a front photo for the new card.', true);
        return;
    }

    let uploadedPhotos = [];
    let cardSaved = false;
    try {
        const detail = document.querySelector('#card-detail').value.trim();
        uploadedPhotos.push(await window.uploadCardPhoto(cardId, frontFile, 'Front', detail));
        if (backFile) uploadedPhotos.push(await window.uploadCardPhoto(cardId, backFile, 'Back', detail));
        const rotationEnabled = document.querySelector('#card-rotation-enabled').checked;
        if (rotationEnabled) {
            uploadedPhotos = uploadedPhotos.map(photo => ({ ...photo, rotationEnabled: true }));
        }
        const { error } = await supabaseClient.from('cards').insert({
            id: cardId,
            name: document.querySelector('#card-name').value.trim(),
            detail,
            grade: document.querySelector('#card-grade').value,
            title: document.querySelector('#card-title').value.trim(),
            photos: uploadedPhotos,
            sales: []
        });
        if (error) throw error;
        cardSaved = true;
        showMessage('Card added. Returning to your collection…');
        window.location.assign(returnTo);
    } catch (error) {
        if (!cardSaved && uploadedPhotos.length) {
            try {
                await window.removeManagedCardPhotos(uploadedPhotos);
            } catch (cleanupError) {
                console.error('Unable to clean up uploaded card photos:', cleanupError);
            }
        }
        showMessage(`Unable to add card: ${error.message}`, true);
    }
});

(async function restoreAdminSession() {
    try {
        supabaseClient = window.getStoreSupabaseClient();
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        if (data.session) await verifyStoreAdmin(data.session.user);
    } catch (error) {
        showMessage(error.message, true);
    }
})();
