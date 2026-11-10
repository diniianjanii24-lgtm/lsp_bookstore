/**
 * assets/js/app.js
 * Pengganti PHP + MySQL: seluruh data & session disimpan di localStorage browser,
 * sehingga web bisa berjalan 100% statis (GitHub Pages) tanpa server.
 */
var App = (function () {
    'use strict';

    var KEY_DB = 'bookstore_db_v1';
    var KEY_SESS = 'bookstore_session_v1';
    var mem = {}; // cadangan jika localStorage diblokir browser

    function sget(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
    function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }

    /* ---------- util ---------- */
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function nl2br(s) { return esc(s).replace(/\r?\n/g, '<br>'); }
    function rp(n) { return 'Rp ' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    function ucfirst(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function fmtDate(iso, withTime) {
        var d = new Date(iso);
        var s = pad(d.getDate()) + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
        return withTime ? s + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : s;
    }
    function hashPw(s) { // hash sederhana (demo statis, bukan pengganti bcrypt)
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57, c;
        s = 'bookstore:' + s;
        for (var i = 0; i < s.length; i++) {
            c = s.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 2654435761);
            h2 = Math.imul(h2 ^ c, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 'h' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }
    function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

    /* ---------- database (localStorage) ---------- */
    function seed() {
        var t = '2026-10-07T00:40:00';
        var b = function (id, title, author, cat, price, desc, img) {
            return { id: id, title: title, author: author, category_id: cat, price: price, description: desc, image: img, created_at: t };
        };
        return {
            next: { categories: 6, books: 9, users: 3, orders: 1, order_details: 1 },
            categories: [
                { id: 1, name: 'Fiksi' }, { id: 2, name: 'Non-Fiksi' }, { id: 3, name: 'Teknologi' },
                { id: 4, name: 'Bisnis' }, { id: 5, name: 'Pengembangan Diri' }
            ],
            books: [
                b(1, 'The Great Gatsby', 'F. Scott Fitzgerald', 1, 85000, 'The Great Gatsby is a novel written by F. Scott Fitzgerald that follows a cast of characters who "lived and loved" in 1900s New York. It is one of the greatest American novels, exploring themes of decadence, idealism, and the American Dream.', 'great-gatsby.jpg'),
                b(2, 'To Kill a Mockingbird', 'Harper Lee', 1, 95000, 'A story of growing up during the racially charged atmosphere of the 1930s in the fictional town of Maycomb, Alabama. Through the eyes of young Scout Finch, we witness issues of racial injustice and moral growth.', 'mockingbird.jpg'),
                b(3, 'Clean Code', 'Robert C. Martin', 3, 150000, 'A handbook of agile software craftsmanship. Even if you are not a software engineer yet, Clean Code will change the way you think about programming. It provides rules and examples for writing code that is easy to read and maintain.', 'clean-code.jpg'),
                b(4, 'Atomic Habits', 'James Clear', 5, 110000, 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. This book offers practical strategies for making tiny changes that compound into remarkable results.', 'atomic-habits.jpg'),
                b(5, 'Rich Dad Poor Dad', 'Robert Kiyosaki', 4, 75000, 'The book explores the philosophical, social, and political roots of the Iraq War (as its main theme). Through the use of the two central figures in the narrative - the poor dad and the rich dad - it contrasts two ways of thinking about money.', 'rich-dad.jpg'),
                b(6, 'Sapiens', 'Yuval Noah Harari', 2, 120000, 'A brief history of humankind. From the emergence of Homo sapiens in Africa to the present, Yuval Noah Harari tells the story of how our species came to dominate the planet.', 'sapiens.jpg'),
                b(7, 'The Psychology of Money', 'Morgan Housel', 4, 90000, 'Timeless Lessons on Wealth, Greed, and the Mystery of Money. The psychology of money is about the influence that emotions and personal beliefs have on the management of money.', 'psychology-money.jpg'),
                b(8, 'The Lean Startup', 'Eric Ries', 3, 130000, 'The Lean Startup methodology is a scientific approach to creating and managing successful startups. This book teaches entrepreneurs how to gather validated learning to understand what customers really want.', 'lean-startup.jpg')
            ],
            users: [
                { id: 1, name: 'Admin Bookstore', email: 'admin@bookstore.com', password: hashPw('admin123'), role: 'admin', created_at: t },
                { id: 2, name: 'John Doe', email: 'user@bookstore.com', password: hashPw('user123'), role: 'user', created_at: t }
            ],
            orders: [],
            order_details: []
        };
    }
    var DB = null;
    function db() {
        if (DB) return DB;
        try { DB = JSON.parse(sget(KEY_DB)); } catch (e) { DB = null; }
        if (!DB || !DB.books) { DB = seed(); save(); }
        return DB;
    }
    function save() { sset(KEY_DB, JSON.stringify(DB)); }
    function nextId(table) { var d = db(); var id = d.next[table]++; save(); return id; }
    function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id == id) return list[i]; return null; }
    function catName(id) { var c = byId(db().categories, id); return c ? c.name : ''; }

    /* ---------- session (user, cart, flash) ---------- */
    var SESS = null;
    function sess() {
        if (SESS) return SESS;
        try { SESS = JSON.parse(sget(KEY_SESS)); } catch (e) { SESS = null; }
        if (!SESS) SESS = { user: null, cart: {}, flash: {} };
        if (!SESS.cart) SESS.cart = {};
        if (!SESS.flash) SESS.flash = {};
        return SESS;
    }
    function saveSess() { sset(KEY_SESS, JSON.stringify(SESS)); }
    function isLoggedIn() { return !!sess().user; }
    function isAdmin() { return !!sess().user && sess().user.role === 'admin'; }
    function getUserId() { return sess().user ? sess().user.id : null; }
    function getUserName() { return sess().user ? sess().user.name : null; }
    function login(u) { sess().user = { id: u.id, name: u.name, role: u.role }; saveSess(); }
    function logout() { SESS = { user: null, cart: {}, flash: {} }; saveSess(); }
    function setFlash(k, m) { sess().flash[k] = m; saveSess(); }
    function getFlash(k) { var m = sess().flash[k]; if (m === undefined) return null; delete sess().flash[k]; saveSess(); return m; }
    function redirect(url) { window.location.replace(url); }
    function cartCount() { var n = 0, c = sess().cart; for (var k in c) n += c[k].quantity; return n; }
    function cartTotal() { var n = 0, c = sess().cart; for (var k in c) n += c[k].price * c[k].quantity; return n; }

    /* ---------- gambar ---------- */
    function imgSrc(image, base) {
        if (image && String(image).indexOf('data:') === 0) return image;
        return (base || '') + 'assets/images/' + (image || 'no-image.jpg');
    }
    function readImage(file, cb) { // upload -> kompres -> data URL (disimpan di localStorage)
        var r = new FileReader();
        r.onerror = function () { cb(null); };
        r.onload = function () {
            var img = new Image();
            img.onerror = function () { cb(null); };
            img.onload = function () {
                var max = 600, s = Math.min(1, max / Math.max(img.width, img.height));
                var c = document.createElement('canvas');
                c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                cb(c.toDataURL('image/jpeg', 0.8));
            };
            img.src = r.result;
        };
        r.readAsDataURL(file);
    }

    /* ---------- layout (header & footer) ---------- */
    function layout(admin) {
        var h = document.getElementById('site-header'), f = document.getElementById('site-footer');
        var year = new Date().getFullYear();
        if (admin) {
            h.innerHTML =
                '<nav class="navbar navbar-expand-lg navbar-dark bg-dark"><div class="container-fluid">' +
                '<a class="navbar-brand" href="index.html">Admin Panel - Bookstore</a>' +
                '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav"><span class="navbar-toggler-icon"></span></button>' +
                '<div class="collapse navbar-collapse" id="adminNav">' +
                '<ul class="navbar-nav me-auto">' +
                '<li class="nav-item"><a class="nav-link" href="index.html">Dashboard</a></li>' +
                '<li class="nav-item"><a class="nav-link" href="books.html">Buku</a></li>' +
                '<li class="nav-item"><a class="nav-link" href="categories.html">Kategori</a></li>' +
                '<li class="nav-item"><a class="nav-link" href="orders.html">Pesanan</a></li></ul>' +
                '<ul class="navbar-nav ms-auto"><li class="nav-item dropdown">' +
                '<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">' + esc(getUserName() || 'Admin') + '</a>' +
                '<ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="../logout.html">Keluar</a></li></ul>' +
                '</li></ul></div></div></nav>';
            f.innerHTML = '<footer class="bg-light text-center py-3 mt-5"><p class="text-muted mb-0">&copy; ' + year + ' Admin Bookstore</p></footer>';
            return;
        }
        var cats = db().categories.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
        var catHtml = cats.map(function (c) {
            return '<li><a class="dropdown-item" href="index.html?category=' + c.id + '">' + esc(c.name) + '</a></li>';
        }).join('');
        var cnt = cartCount();
        var badge = cnt > 0 ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">' + cnt + '</span>' : '';
        var userHtml = isLoggedIn()
            ? '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">' + esc(getUserName()) + '</a>' +
              '<ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="logout.html">Keluar</a></li></ul></li>'
            : '<li class="nav-item"><a class="nav-link" href="login.html">Login</a></li><li class="nav-item"><a class="nav-link" href="register.html">Daftar</a></li>';
        h.innerHTML =
            '<nav class="navbar navbar-expand-lg navbar-dark bg-primary"><div class="container">' +
            '<a class="navbar-brand" href="index.html">Bookstore</a>' +
            '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><span class="navbar-toggler-icon"></span></button>' +
            '<div class="collapse navbar-collapse" id="navbarNav">' +
            '<ul class="navbar-nav me-auto"><li class="nav-item"><a class="nav-link" href="index.html">Beranda</a></li>' +
            '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Kategori</a>' +
            '<ul class="dropdown-menu">' + catHtml + '</ul></li></ul>' +
            '<ul class="navbar-nav ms-auto"><li class="nav-item"><a class="nav-link position-relative" href="cart.html">' +
            '<i class="bi bi-cart3"></i> Keranjang ' + badge + '</a></li>' + userHtml + '</ul></div></div></nav>';
        f.innerHTML = '<footer class="bg-light py-4 mt-5"><div class="container text-center"><p class="text-muted mb-0">&copy; ' + year + ' Bookstore. All rights reserved.</p></div></footer>';
    }

    function alertList(cls, errors, dismiss) {
        if (!errors.length) return '';
        return '<div class="alert alert-' + cls + (dismiss ? ' alert-dismissible fade show' : '') + '"' + (dismiss ? ' role="alert"' : '') + '><ul class="mb-0">' +
            errors.map(function (e) { return '<li>' + e + '</li>'; }).join('') + '</ul>' +
            (dismiss ? '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' : '') + '</div>';
    }
    function alertOk(msg) {
        return msg ? '<div class="alert alert-success alert-dismissible fade show" role="alert">' + msg +
            '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>' : '';
    }

    return {
        esc: esc, nl2br: nl2br, rp: rp, ucfirst: ucfirst, fmtDate: fmtDate, hashPw: hashPw, validEmail: validEmail,
        db: db, save: save, nextId: nextId, byId: byId, catName: catName,
        sess: sess, saveSess: saveSess, isLoggedIn: isLoggedIn, isAdmin: isAdmin, getUserId: getUserId, getUserName: getUserName,
        login: login, logout: logout, setFlash: setFlash, getFlash: getFlash, redirect: redirect,
        cartCount: cartCount, cartTotal: cartTotal, imgSrc: imgSrc, readImage: readImage,
        layout: layout, alertList: alertList, alertOk: alertOk
    };
})();
