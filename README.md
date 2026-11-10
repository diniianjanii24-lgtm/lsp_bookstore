# Bookstore (Static HTML)

Versi 100% HTML + CSS + JavaScript dari aplikasi Bookstore (PHP + MySQL).
Tampilan (Bootstrap 5 + style.css) tidak diubah. Tidak butuh PHP, XAMPP, atau database.

## Cara online di GitHub Pages
1. Buat repository baru di GitHub, upload **seluruh isi folder ini** (bukan folder pembungkusnya).
2. Buka **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Pilih branch `main` dan folder `/ (root)`, klik **Save**.
4. Tunggu 1-2 menit, situs ada di `https://USERNAME.github.io/NAMA-REPO/`.

## Akun demo
| Role  | Email               | Password |
|-------|---------------------|----------|
| Admin | admin@bookstore.com | admin123 |
| User  | user@bookstore.com  | user123  |

Admin login: `admin/login.html`

## Catatan teknis
- Data (buku, kategori, user, pesanan) dan session/keranjang disimpan di **localStorage** browser,
  jadi data bersifat per-browser (cocok untuk demo/tugas, bukan produksi).
- Untuk mengembalikan data awal: DevTools → Application → Local Storage → hapus
  `bookstore_db_v1` dan `bookstore_session_v1`, lalu refresh.
- Semua link memakai path relatif, aman di subfolder repo GitHub Pages.
- Upload gambar sampul di admin otomatis dikompres lalu disimpan di localStorage.
