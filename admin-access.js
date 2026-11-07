// Keep the lock control in sync with the authenticated admin session on every page.
const adminAccessToggle = document.querySelector('#admin-access-toggle');
const adminPageIsOpen = window.location.pathname.endsWith('/admin.html');
const storeAdminAccounts = {
    gianfacio: 'gianfaciofilms@gmail.com'
};

window.getStoreAdminEmail = username => {
    const normalizedUsername = username.trim().toLowerCase();
    const email = storeAdminAccounts[normalizedUsername];
    if (!email) throw new Error('Unknown admin username.');
    return email;
};

const signOutDialog = document.createElement('dialog');
// Share the destructive-action styling used by the card-delete confirmation.
signOutDialog.className = 'store-modal store-destructive-dialog';
signOutDialog.setAttribute('aria-labelledby', 'sign-out-title');
signOutDialog.setAttribute('aria-describedby', 'sign-out-message');
signOutDialog.innerHTML = `
    <div class="store-modal-content">
        <div class="store-modal-header">
            <h2 id="sign-out-title"><i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sign out?</h2>
            <button type="button" class="store-modal-close" aria-label="Close dialog">&times;</button>
        </div>
        <p id="sign-out-message">Do you want to sign out of admin mode? Choose Cancel to stay signed in and keep card management available.</p>
        <form method="dialog" class="store-modal-actions">
            <button type="submit" class="store-modal-button store-modal-cancel" value="cancel">Cancel</button>
            <button type="submit" class="store-modal-button store-modal-confirm" value="sign-out">Sign out</button>
        </form>
    </div>`;
document.body.append(signOutDialog);

signOutDialog.querySelector('.store-modal-close').addEventListener('click', () => signOutDialog.close('cancel'));

const signInDialog = document.createElement('dialog');
signInDialog.className = 'store-modal';
signInDialog.setAttribute('aria-labelledby', 'sign-in-title');
signInDialog.innerHTML = `
    <div class="store-modal-content">
        <div class="store-modal-header">
            <h2 id="sign-in-title">Admin sign in</h2>
        </div>
        <form class="admin-form store-modal-login-form">
            <label>Username
                <input name="username" type="text" autocomplete="username" required>
            </label>
            <label>Password
                <span class="password-field">
                    <input name="password" type="password" autocomplete="current-password" required>
                    <button class="filter password-toggle" type="button" aria-label="Show password" title="Show password" aria-pressed="false">
                        <svg class="password-eye" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                        </svg>
                        <svg class="password-eye-slash" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                            <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                        </svg>
                    </button>
                </span>
            </label>
            <p class="store-modal-login-message" role="status" aria-live="polite" hidden></p>
            <div class="store-modal-actions">
                <button type="button" class="store-modal-button store-modal-cancel" data-close>Cancel</button>
                <button type="submit" class="store-modal-button store-modal-confirm">Sign in</button>
            </div>
        </form>
    </div>`;
document.body.append(signInDialog);

const signInForm = signInDialog.querySelector('form');
const signInPassword = signInForm.elements.password;
const signInMessage = signInDialog.querySelector('.store-modal-login-message');

signInDialog.querySelector('[data-close]').addEventListener('click', () => signInDialog.close('cancel'));
signInForm.querySelector('.password-toggle').addEventListener('click', event => {
    const button = event.currentTarget;
    const isVisible = signInPassword.type === 'text';
    signInPassword.type = isVisible ? 'password' : 'text';
    button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    button.title = isVisible ? 'Show password' : 'Hide password';
    button.setAttribute('aria-pressed', String(!isVisible));
});
signInForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = signInForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in…';
    signInMessage.hidden = true;
    signInMessage.classList.remove('store-error');

    try {
        const client = window.getStoreSupabaseClient();
        const { error } = await client.auth.signInWithPassword({
            email: window.getStoreAdminEmail(signInForm.elements.username.value),
            password: signInPassword.value
        });
        if (error) throw error;

        const { data: isAdmin, error: accessError } = await client.rpc('is_store_admin');
        if (accessError) throw accessError;
        if (isAdmin !== true) {
            const { error: signOutError } = await client.auth.signOut();
            if (signOutError) throw signOutError;
            setStoreAdminAccess(false);
            throw new Error('This account is signed in but is not on the store admin allowlist.');
        }

        setStoreAdminAccess(true);
        signInDialog.close('signed-in');
        adminAccessToggle.focus();
        if (adminPageIsOpen) {
            document.querySelector('#admin-login').hidden = true;
            document.querySelector('#admin-dashboard').hidden = false;
        }
    } catch (error) {
        signInMessage.textContent = `Unable to sign in: ${error.message}`;
        signInMessage.classList.add('store-error');
        signInMessage.hidden = false;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign in';
    }
});

function confirmStoreSignOut() {
    signOutDialog.showModal();
    return new Promise(resolve => {
        signOutDialog.addEventListener('close', () => resolve(signOutDialog.returnValue === 'sign-out'), { once: true });
    });
}

function openStoreSignIn() {
    signInForm.reset();
    signInMessage.hidden = true;
    signInMessage.textContent = '';
    signInPassword.type = 'password';
    const passwordToggle = signInForm.querySelector('.password-toggle');
    passwordToggle.setAttribute('aria-label', 'Show password');
    passwordToggle.title = 'Show password';
    passwordToggle.setAttribute('aria-pressed', 'false');
    signInDialog.showModal();
    signInForm.elements.username.focus();
}

function setStoreAdminAccess(isAdmin) {
    const icon = adminAccessToggle.querySelector('.header-icon');
    if (isAdmin) {
        const unlockIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        unlockIcon.setAttribute('class', 'header-icon header-unlock-icon');
        unlockIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        unlockIcon.setAttribute('width', '16');
        unlockIcon.setAttribute('height', '16');
        unlockIcon.setAttribute('fill', 'currentColor');
        unlockIcon.setAttribute('viewBox', '0 0 16 16');
        unlockIcon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill-rule', 'evenodd');
        path.setAttribute('d', 'M12 0a4 4 0 0 1 4 4v2.5h-1V4a3 3 0 1 0-6 0v2h.5A2.5 2.5 0 0 1 12 8.5v5A2.5 2.5 0 0 1 9.5 16h-7A2.5 2.5 0 0 1 0 13.5v-5A2.5 2.5 0 0 1 2.5 6H8V4a4 4 0 0 1 4-4M2.5 7A1.5 1.5 0 0 0 1 8.5v5A1.5 1.5 0 0 0 2.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 9.5 7z');
        unlockIcon.append(path);
        icon.replaceWith(unlockIcon);
    } else if (!icon.classList.contains('header-lock-icon')) {
        const lockIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        lockIcon.setAttribute('class', 'header-icon header-lock-icon');
        lockIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        lockIcon.setAttribute('width', '16');
        lockIcon.setAttribute('height', '16');
        lockIcon.setAttribute('fill', 'currentColor');
        lockIcon.setAttribute('viewBox', '0 0 16 16');
        lockIcon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill-rule', 'evenodd');
        path.setAttribute('d', 'M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4M4.5 7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7zM8 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3');
        lockIcon.append(path);
        icon.replaceWith(lockIcon);
    }
    adminAccessToggle.setAttribute('aria-label', isAdmin ? 'Sign out of admin mode' : 'Admin sign in');
    adminAccessToggle.title = isAdmin ? 'Sign out of admin mode' : 'Admin sign in';
    adminAccessToggle.dataset.admin = String(isAdmin);
    window.storeAdminIsVerified = isAdmin;
    const addCardToggle = document.querySelector('#add-card-toggle');
    if (addCardToggle) addCardToggle.hidden = !isAdmin;
    window.dispatchEvent(new CustomEvent('store-admin-access-changed', { detail: { isAdmin } }));
}

window.setStoreAdminAccess = setStoreAdminAccess;

const addCardToggle = document.querySelector('#add-card-toggle');
if (addCardToggle) {
    addCardToggle.addEventListener('click', () => {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(`admin.html?returnTo=${encodeURIComponent(returnTo)}`);
    });
}

adminAccessToggle.addEventListener('click', async () => {
    if (adminAccessToggle.dataset.admin !== 'true') {
        openStoreSignIn();
        return;
    }

    const shouldSignOut = await confirmStoreSignOut();
    if (!shouldSignOut) return;

    try {
        const { error } = await window.getStoreSupabaseClient().auth.signOut();
        if (error) throw error;

        setStoreAdminAccess(false);
        if (adminPageIsOpen) window.location.assign('index.html');
    } catch (error) {
        window.alert(`Unable to sign out: ${error.message}`);
    }
});

const adminClient = window.getStoreSupabaseClient();
adminClient.auth.onAuthStateChange((_event, session) => {
    if (!session) {
        setStoreAdminAccess(false);
        return;
    }

    window.setTimeout(async () => {
        try {
            const { data, error } = await adminClient.rpc('is_store_admin');
            if (error) throw error;
            setStoreAdminAccess(data === true);
        } catch (error) {
            setStoreAdminAccess(false);
            adminAccessToggle.title = `Unable to verify admin access: ${error.message}`;
            console.error('Unable to verify admin access:', error);
        }
    }, 0);
});

(async function restoreAdminAccess() {
    try {
        const client = window.getStoreSupabaseClient();
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) return;

        const { data, error } = await client.rpc('is_store_admin');
        if (error) throw error;
        setStoreAdminAccess(data === true);
    } catch (error) {
        adminAccessToggle.title = `Unable to verify admin access: ${error.message}`;
        console.error('Unable to verify admin access:', error);
    }
})();
