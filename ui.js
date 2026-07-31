// ui.js - small helper functions used by all pages (window.UI)
(function () {
    'use strict';

    /* ---------- escaping ---------- */
    const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/[&<>"']/g, ch => ESCAPES[ch]);
    }

    /* ---------- formatting ---------- */
    function money(amount, currency) {
        const value = Number(amount);
        if (!isFinite(value)) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: 0
        }).format(value);
    }

    function num(value) {
        const n = Number(value);
        return isFinite(n) ? new Intl.NumberFormat('en-US').format(n) : '0';
    }

    function plural(count, one, many) {
        return `${num(count)} ${Number(count) === 1 ? one : (many || one + 's')}`;
    }

    /* ---------- dates ---------- */
    function toDate(value) {
        if (!value) return null;
        if (value instanceof Date) return isNaN(value) ? null : value;
        // Bare YYYY-MM-DD is read as UTC midnight, which can shift the day, so anchor at noon.
        const text = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
        const date = new Date(text);
        return isNaN(date) ? null : date;
    }

    function isoDate(value) {
        const date = toDate(value);
        if (!date) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function prettyDate(value) {
        const date = toDate(value);
        return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
    }

    function countNights(from, to) {
        const start = toDate(from);
        const end = toDate(to);
        if (!start || !end) return 0;
        const days = Math.round((end - start) / 86400000);
        return days > 0 ? days : 0;
    }

    function addDays(value, days) {
        const date = toDate(value) || new Date();
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    }

    /* ---------- review score ---------- */
    function ratingClass(score) {
        const value = Number(score);
        if (!isFinite(value) || value <= 0) return 'rating-low';
        if (value >= 8) return '';
        if (value >= 6.5) return 'rating-mid';
        return 'rating-low';
    }

    function ratingWord(score) {
        const value = Number(score);
        if (!isFinite(value) || value <= 0) return 'Not rated';
        if (value >= 9) return 'Excellent';
        if (value >= 8) return 'Very good';
        if (value >= 7) return 'Good';
        if (value >= 6) return 'Fair';
        return 'Rated';
    }

    /* ---------- localStorage (wrapped so private mode can't break the page) ---------- */
    function load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // storage full or blocked - nothing to do
        }
    }

    /* ---------- light / dark theme ---------- */
    function setTheme(mode) {
        document.documentElement.setAttribute('data-theme', mode);
        document.querySelectorAll('[data-theme-btn]').forEach(btn => {
            btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            const sun = btn.querySelector('[data-sun]');
            const moon = btn.querySelector('[data-moon]');
            if (sun) sun.classList.toggle('hidden', mode !== 'dark');
            if (moon) moon.classList.toggle('hidden', mode === 'dark');
        });
    }

    function startTheme() {
        setTheme(load('theme', 'light'));
        document.addEventListener('click', event => {
            if (!event.target.closest('[data-theme-btn]')) return;
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            setTheme(next);
            save('theme', next);
        });
    }

    /* ---------- messages ---------- */
    const MESSAGE_ICONS = {
        ok: '<path d="M20 6 9 17l-5-5"/>',
        error: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
    };

    function showMessage(text, options) {
        const opts = options || {};
        const kind = opts.kind || 'info';

        let holder = document.getElementById('messages');
        if (!holder) {
            holder = document.createElement('div');
            holder.id = 'messages';
            holder.className = 'messages';
            holder.setAttribute('role', 'status');
            document.body.appendChild(holder);
        }

        const box = document.createElement('div');
        box.className = `message message-${kind}`;
        box.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                 style="width:18px;height:18px;flex-shrink:0">
                ${MESSAGE_ICONS[kind] || MESSAGE_ICONS.info}
            </svg>
            <p>
                ${opts.title ? `<strong>${escapeHtml(opts.title)}</strong>` : ''}
                ${escapeHtml(text)}
            </p>
            <button class="close-btn" type="button" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>`;

        box.querySelector('.close-btn').addEventListener('click', () => box.remove());
        holder.appendChild(box);
        setTimeout(() => box.remove(), opts.duration || 4000);
    }

    /* ---------- yes / no dialog ---------- */
    function askConfirm(opts) {
        return new Promise(resolve => {
            const background = document.createElement('div');
            background.className = 'popup-bg open';
            background.innerHTML = `
                <div class="popup" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div class="popup-head">
                        <h2 id="confirm-title">${escapeHtml(opts.title || 'Are you sure?')}</h2>
                    </div>
                    <div class="popup-body"><p class="muted">${escapeHtml(opts.body || '')}</p></div>
                    <div class="popup-foot">
                        <button class="btn btn-plain" data-answer="no">${escapeHtml(opts.cancelText || 'Cancel')}</button>
                        <button class="btn btn-main" data-answer="yes">${escapeHtml(opts.confirmText || 'Confirm')}</button>
                    </div>
                </div>`;
            document.body.appendChild(background);
            background.querySelector('[data-answer="yes"]').focus();

            function finish(answer) {
                document.removeEventListener('keydown', onKey);
                background.remove();
                resolve(answer);
            }

            function onKey(event) {
                if (event.key === 'Escape') finish(false);
            }

            background.addEventListener('click', event => {
                if (event.target === background) finish(false);
                const button = event.target.closest('[data-answer]');
                if (button) finish(button.dataset.answer === 'yes');
            });
            document.addEventListener('keydown', onKey);
        });
    }

    /* ---------- saved hotels ---------- */
    // Each account gets its own key, so two people using the same browser do not
    // see each other's hotels. Logged out, everything goes under "guest".
    function userKey(name) {
        const user = window.Auth && Auth.currentUser();
        return user ? `${name}_${user.id}` : `${name}_guest`;
    }

    const savedHotels = {
        list() {
            const items = load(userKey('saved_hotels'), []);
            return Array.isArray(items) ? items : [];
        },
        has(id) {
            return this.list().some(item => String(item.id) === String(id));
        },
        toggle(hotel) {
            const items = this.list();
            const at = items.findIndex(item => String(item.id) === String(hotel.id));
            const adding = at < 0;
            if (adding) items.unshift(hotel); else items.splice(at, 1);
            save(userKey('saved_hotels'), items.slice(0, 40));
            return adding;
        },
        remove(id) {
            save(userKey('saved_hotels'), this.list().filter(item => String(item.id) !== String(id)));
            document.dispatchEvent(new CustomEvent('saved-changed'));
        }
    };

    // One click handler for every save button on the page, including ones added later.
    function startSaveButtons() {
        document.addEventListener('click', event => {
            const btn = event.target.closest('[data-save]');
            if (!btn) return;
            event.preventDefault();

            let hotel;
            try {
                hotel = JSON.parse(btn.dataset.save);
            } catch (error) {
                return;
            }

            const added = savedHotels.toggle(hotel);
            // Set the button state before announcing the change so listeners read the new value.
            btn.setAttribute('aria-pressed', String(added));
            document.dispatchEvent(new CustomEvent('saved-changed'));
            showMessage(added ? `Saved ${hotel.name || 'this hotel'}` : `Removed ${hotel.name || 'this hotel'}`, {
                kind: added ? 'ok' : 'info',
                duration: 2500
            });
        });

        document.addEventListener('saved-changed', updateSavedCount);
        // Logging in or out swaps to a different set of saved hotels.
        document.addEventListener('user-changed', () => {
            updateSavedCount();
            markSavedButtons();
        });
        updateSavedCount();
    }

    function updateSavedCount() {
        const count = savedHotels.list().length;
        document.querySelectorAll('[data-saved-count]').forEach(node => {
            node.textContent = count ? String(count) : '';
            node.classList.toggle('hidden', count === 0);
        });
    }

    // Save buttons are built from HTML strings, so their pressed state is set after rendering.
    function markSavedButtons(container) {
        (container || document).querySelectorAll('[data-save]').forEach(btn => {
            let hotel;
            try { hotel = JSON.parse(btn.dataset.save); } catch (error) { return; }
            btn.setAttribute('aria-pressed', String(savedHotels.has(hotel.id)));
        });
    }

    /* ---------- recent searches ---------- */
    const recentSearches = {
        list() {
            const items = load(userKey('recent_searches'), []);
            return Array.isArray(items) ? items : [];
        },
        add(entry) {
            if (!entry || !entry.dest_id) return;
            const items = this.list().filter(item => String(item.dest_id) !== String(entry.dest_id));
            items.unshift(entry);
            save(userKey('recent_searches'), items.slice(0, 5));
        }
    };

    /* ---------- search settings shared between pages ---------- */
    const search = {
        read() {
            const stored = load('search_settings', {}) || {};
            const checkin = stored.checkin || isoDate(addDays(new Date(), 14));
            const checkout = stored.checkout || isoDate(addDays(checkin, 3));
            return {
                checkin,
                checkout,
                adults: Math.max(1, Number(stored.adults) || 2),
                children: Math.max(0, Number(stored.children) || 0),
                rooms: Math.max(1, Number(stored.rooms) || 1)
            };
        },
        write(changes) {
            const next = Object.assign(this.read(), changes || {});
            save('search_settings', next);
            return next;
        },
        // Builds the query string every page uses to pass the search along.
        toQuery(extra) {
            const current = this.read();
            const params = new URLSearchParams({
                checkin: current.checkin,
                checkout: current.checkout,
                adults: String(current.adults),
                children: String(current.children),
                rooms: String(current.rooms)
            });
            Object.entries(extra || {}).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
            });
            return params;
        },
        // Reads the search out of the page URL. The dates and guests found there are
        // saved straight away, so links built later with toQuery() match this page.
        fromQuery() {
            const params = new URLSearchParams(window.location.search);
            const current = this.read();
            const checkin = isoDate(params.get('checkin')) || current.checkin;
            let checkout = isoDate(params.get('checkout')) || current.checkout;
            if (countNights(checkin, checkout) < 1) checkout = isoDate(addDays(checkin, 1));

            const criteria = {
                dest_id: params.get('dest_id') || '',
                destination: params.get('destination') || '',
                checkin,
                checkout,
                adults: Math.max(1, Number(params.get('adults')) || current.adults),
                children: Math.max(0, Number(params.get('children')) || 0),
                rooms: Math.max(1, Number(params.get('rooms')) || current.rooms)
            };

            this.write({
                checkin: criteria.checkin,
                checkout: criteria.checkout,
                adults: criteria.adults,
                children: criteria.children,
                rooms: criteria.rooms
            });

            return criteria;
        },
        describe(settings) {
            const s = settings || this.read();
            const nights = countNights(s.checkin, s.checkout);
            const people = [plural(s.adults, 'adult')];
            if (s.children > 0) people.push(plural(s.children, 'child', 'children'));
            people.push(plural(s.rooms, 'room'));
            return {
                nights,
                nightsText: plural(nights, 'night'),
                dates: `${prettyDate(s.checkin)} - ${prettyDate(s.checkout)}`,
                guests: people.join(', ')
            };
        }
    };

    /* ---------- images ---------- */
    const NO_PHOTO = 'data:image/svg+xml,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
            <rect width="400" height="300" fill="#e6e9ed"/>
            <g fill="none" stroke="#a8b0ba" stroke-width="6" stroke-linecap="round">
                <path d="M120 190h160M140 190v-60l60-40 60 40v60"/><path d="M180 190v-40h40v40"/>
            </g>
        </svg>`
    );

    // Set as onerror in the card templates. The flag stops a broken image looping.
    function usePlaceholder(img) {
        if (img.dataset.usedPlaceholder) return;
        img.dataset.usedPlaceholder = '1';
        img.src = NO_PHOTO;
    }

    /* ---------- dropdown open / close ---------- */
    function makeDropdown(button, panel) {
        function setOpen(open) {
            panel.classList.toggle('open', open);
            if (button) button.setAttribute('aria-expanded', String(open));
        }

        if (button) {
            button.addEventListener('click', event => {
                event.preventDefault();
                setOpen(!panel.classList.contains('open'));
            });
        }

        document.addEventListener('click', event => {
            if (panel.contains(event.target)) return;
            if (button && button.contains(event.target)) return;
            setOpen(false);
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setOpen(false);
        });

        return { close: () => setOpen(false) };
    }

    /* ---------- popup open / close ---------- */
    function makePopup(background, options) {
        const opts = options || {};

        function open() {
            background.classList.add('open');
            document.body.style.overflow = 'hidden';
            const first = background.querySelector('[data-focus]') || background.querySelector('button');
            if (first) first.focus();
        }

        function close() {
            background.classList.remove('open');
            document.body.style.overflow = '';
        }

        background.addEventListener('click', event => {
            if (event.target === background || event.target.closest('[data-close]')) close();
        });

        document.addEventListener('keydown', event => {
            if (!background.classList.contains('open')) return;
            if (event.key === 'Escape') close();
            if (opts.onKey) opts.onKey(event);
        });

        return { open, close };
    }

    /* ---------- form errors ---------- */
    function showFieldError(input, message) {
        const field = input.closest('.field') || input.parentElement;
        const slot = field && field.querySelector('.error-msg');
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (slot) {
            slot.textContent = message || '';
            slot.classList.toggle('shown', Boolean(message));
        }
    }

    /* ---------- wait before running (used for typing in search boxes) ---------- */
    function debounce(fn, wait) {
        let timer;
        return function () {
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    /* ---------- icons ---------- */
    const ICONS = {
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        city: '<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
        hotel: '<path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/><path d="M7 8h4M7 12h4M7 16h10M14 8h3M14 12h3"/>',
        calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        heart: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z"/>',
        star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        close: '<path d="M18 6 6 18M6 6l12 12"/>',
        filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
        wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0M12 20h.01"/>',
        parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h3.5a3 3 0 0 1 0 6H9"/>',
        pool: '<path d="M3 17c2 0 2-1.5 4.5-1.5S10 17 12 17s2-1.5 4.5-1.5S19 17 21 17M7 14V4M17 14V4M7 7h10M7 10.5h10"/>',
        coffee: '<path d="M17 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
        gym: '<path d="M4 6v12M8 8v8M16 8v8M20 6v12M8 12h8"/>',
        restaurant: '<path d="M5 3v8a3 3 0 0 0 6 0V3M8 11v10M16 3c-1.5 1.5-2 3-2 5s.5 3 2 3 2-1 2-3-.5-3.5-2-5Z"/><path d="M16 11v10"/>',
        ac: '<path d="M4 8h16M4 13h16"/><path d="M8 17c0 2-1 3-2 3M12 17c0 2-1 3-2 3M16 17c0 2-1 3-2 3"/>',
        pet: '<circle cx="7" cy="9" r="2"/><circle cx="17" cy="9" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><path d="M12 12c-3 0-5 2-5 4.5S9 21 12 21s5-2 5-4.5S15 12 12 12Z"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
        map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/>',
        shield: '<path d="M12 3l8 3v6c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5V6l8-3Z"/><path d="m9 12 2 2 4-4"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
        tag: '<path d="M7 7h.01"/><path d="M11 3H5a2 2 0 0 0-2 2v6l10 10 8-8L11 3Z"/>',
        bed: '<path d="M3 18v-7h18v7M3 11V7M21 18v-7"/><path d="M7 11V9h5v2"/>',
        photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-4 3 2.5L16 12l4 4"/>',
        question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'
    };

    function icon(name) {
        const path = ICONS[name];
        if (!path) return '';
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    }

    /* ---------- menu button on small screens ---------- */
    function startMenu() {
        const button = document.querySelector('[data-menu-btn]');
        const menu = document.getElementById('menu');
        if (!button || !menu) return;
        button.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            button.setAttribute('aria-expanded', String(open));
        });
    }

    /* ---------- start ---------- */
    function start() {
        startTheme();
        startMenu();
        startSaveButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.UI = {
        escapeHtml,
        money, num, plural,
        isoDate, prettyDate, countNights, addDays,
        ratingClass, ratingWord,
        load, save,
        showMessage, askConfirm,
        savedHotels, recentSearches, search,
        NO_PHOTO, usePlaceholder,
        makeDropdown, makePopup, markSavedButtons,
        showFieldError, debounce,
        icon
    };
})();
