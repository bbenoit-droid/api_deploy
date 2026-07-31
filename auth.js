// auth.js - sign up, log in and log out for the demo accounts
//
// NOTE: accounts are kept in localStorage, which means everything lives in the
// browser. Passwords are hashed with SHA-256 and a random salt so they are not
// stored as plain text, but anyone with the browser can still read the file and
// try guesses offline. A real site must check the password on a server. This is
// a student project without a backend, so the login page says so on screen.
(function () {
    'use strict';

    const USERS_KEY = 'users';
    const SESSION_KEY = 'logged_in_user';

    function loadUsers() {
        const users = UI.load(USERS_KEY, []);
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        UI.save(USERS_KEY, users);
    }

    function tidyEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function findUser(email) {
        const wanted = tidyEmail(email);
        return loadUsers().find(user => user.email === wanted) || null;
    }

    /* ---------- password hashing ---------- */
    // crypto.subtle is only exposed in a secure context, so accounts do not work
    // over plain http:// or when the site is opened by IP address. Rather than
    // fall back to a weaker hash, say what is wrong and how to fix it.
    function cryptoProblem() {
        if (window.crypto && window.crypto.subtle) return '';
        return window.isSecureContext
            ? 'This browser does not support the security features needed for accounts.'
            : 'Accounts need a secure connection. Open the site over https:// instead of http:// and try again.';
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function hashPassword(password, salt) {
        const data = new TextEncoder().encode(salt + password);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /* ---------- checks used by the forms ---------- */
    function emailProblem(email) {
        const value = tidyEmail(email);
        if (!value) return 'Please enter your email.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'That email address looks wrong.';
        return '';
    }

    function passwordProblem(password) {
        const value = String(password || '');
        if (!value) return 'Please enter a password.';
        if (value.length < 8) return 'Use at least 8 characters.';
        if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return 'Use both letters and numbers.';
        return '';
    }

    /* ---------- the three actions ---------- */
    async function signUp(name, email, password) {
        const cryptoError = cryptoProblem();
        if (cryptoError) throw new Error(cryptoError);

        const cleanName = String(name || '').trim();
        if (!cleanName) throw new Error('Please enter your name.');

        const emailError = emailProblem(email);
        if (emailError) throw new Error(emailError);

        const passwordError = passwordProblem(password);
        if (passwordError) throw new Error(passwordError);

        if (findUser(email)) throw new Error('An account with that email already exists.');

        const salt = randomSalt();
        const user = {
            id: 'u' + Date.now(),
            name: cleanName,
            email: tidyEmail(email),
            salt: salt,
            passwordHash: await hashPassword(password, salt)
        };

        const users = loadUsers();
        users.push(user);
        saveUsers(users);

        UI.save(SESSION_KEY, user.id);
        return user;
    }

    async function logIn(email, password) {
        const cryptoError = cryptoProblem();
        if (cryptoError) throw new Error(cryptoError);

        const user = findUser(email);

        // Hash even when there is no such account, so a wrong email and a wrong
        // password take about the same time and give the same message.
        const salt = user ? user.salt : 'no-such-user';
        const attempt = await hashPassword(password, salt);

        if (!user || attempt !== user.passwordHash) {
            throw new Error('That email and password do not match.');
        }

        UI.save(SESSION_KEY, user.id);
        return user;
    }

    function logOut() {
        UI.save(SESSION_KEY, null);
        document.dispatchEvent(new CustomEvent('user-changed'));
    }

    function currentUser() {
        const id = UI.load(SESSION_KEY, null);
        if (!id) return null;
        return loadUsers().find(user => user.id === id) || null;
    }

    /* ---------- header account area ---------- */
    // Every page has an empty <div data-account></div> in its header that this fills in.
    function drawAccountArea() {
        const user = currentUser();

        document.querySelectorAll('[data-account]').forEach(box => {
            if (!user) {
                box.innerHTML = `<a class="btn btn-outline btn-small" href="login.html">Log in</a>`;
                return;
            }

            box.innerHTML = `
                <div class="account">
                    <button class="btn btn-outline btn-small" type="button" data-account-btn
                            aria-expanded="false" aria-controls="account-menu">
                        <span class="account-letter" aria-hidden="true">${UI.escapeHtml(user.name[0].toUpperCase())}</span>
                        ${UI.escapeHtml(user.name.split(' ')[0])}
                    </button>
                    <div class="dropdown dropdown-right" id="account-menu">
                        <div class="dropdown-title">${UI.escapeHtml(user.email)}</div>
                        <div class="dropdown-foot" style="text-align:left">
                            <button class="btn btn-plain btn-small" type="button" data-log-out>Log out</button>
                        </div>
                    </div>
                </div>`;

            UI.makeDropdown(box.querySelector('[data-account-btn]'), box.querySelector('#account-menu'));
        });
    }

    function start() {
        drawAccountArea();

        document.addEventListener('click', event => {
            if (!event.target.closest('[data-log-out]')) return;
            const name = currentUser();
            logOut();
            UI.showMessage(name ? `Logged out. See you, ${name.name.split(' ')[0]}.` : 'Logged out.', { kind: 'ok' });
        });

        document.addEventListener('user-changed', drawAccountArea);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.Auth = {
        signUp, logIn, logOut, currentUser,
        emailProblem, passwordProblem,
        drawAccountArea
    };
})();
