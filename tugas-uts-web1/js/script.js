// js/script.js

/**
 * Catatan:
 * File ini mengasumsikan bahwa 'data.js' sudah dimuat sebelumnya
 * dan menyediakan variabel global: dataPengguna, dataKatalogBuku, dataTracking, keranjangPemesanan.
 * Path checkout sudah dikoreksi menjadi 'checkout.html'.
 */

// ====================================================================
// GLOBAL UTILITY
// ====================================================================

// Fungsi pembantu untuk memformat angka menjadi Rupiah (diperlukan untuk Stok, Checkout, Tracking)
const formatRupiah = (angka) => {
    // Pastikan input adalah angka (misal, string harga dari data.js)
    if (typeof angka === 'string') {
        angka = parseInt(angka.replace(/[^0-9]/g, ''));
    }
    
    // Handle kasus NaN
    if (isNaN(angka)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};


document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================================================
    // A. Halaman Login (index.html)
    // ====================================================================

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Logika Modal
        document.getElementById('lupaPasswordButton').addEventListener('click', () => toggleModal('lupaPasswordModal', true));
        document.getElementById('daftarButton').addEventListener('click', () => toggleModal('daftarModal', true));
        document.querySelectorAll('.modal .close-button').forEach(button => {
            button.addEventListener('click', (e) => toggleModal(e.target.closest('.modal').id, false));
        });
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    function toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = show ? 'block' : 'none';
    }

    function handleLogin(event) {
        event.preventDefault();
        const emailInput = document.getElementById('email').value;
        const passwordInput = document.getElementById('password').value;

        const user = dataPengguna.find(
            u => u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput
        );

        if (user) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userName', user.nama);
            sessionStorage.setItem('userRole', user.role);
            alert(`Login Berhasil! Selamat datang, ${user.nama}.`);
            window.location.href = 'dashboard.html'; 
        } else {
            alert('email/password yang anda masukkan salah'); 
        }
    }

    // ====================================================================
    // B. Dashboard Menu (dashboard.html) - Greeting
    // ====================================================================

    const greetingMessage = document.getElementById('greetingMessage');
    if (greetingMessage) {
        updateGreeting();
    }

    function updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        const userName = sessionStorage.getItem('userName') || 'Pengguna';
        let greeting;

        if (hour >= 4 && hour < 11) {
            greeting = "Selamat Pagi";
        } else if (hour >= 11 && hour < 15) {
            greeting = "Selamat Siang";
        } else if (hour >= 15 && hour < 18) {
            greeting = "Selamat Sore";
        } else {
            greeting = "Selamat Malam";
        }
        
        greetingMessage.textContent = `${greeting}, ${userName}! Dashboard Aplikasi`;
        document.querySelector('.dashboard-header .greeting-text').textContent = 'Akses cepat menu utama.';
    }

    // ====================================================================
    // C. Informasi Stok/Katalog (stok.html)
    // ====================================================================

    const katalogTableBody = document.querySelector('#katalogTable tbody');
    const tambahStokButton = document.getElementById('tambahStokButton');

    if (katalogTableBody) {
        tampilkanKatalog();
    }

    if (tambahStokButton) {
        tambahStokButton.addEventListener('click', tambahBarisStokBaru); 
    }

    function tampilkanKatalog() {
        if (!katalogTableBody) return;
        katalogTableBody.innerHTML = '';
        
        dataKatalogBuku.forEach((buku) => {
            const row = katalogTableBody.insertRow();
            
            row.insertCell().textContent = buku.kodeBarang;
            
            // Kolom Buku (Cover & Nama)
            row.insertCell().innerHTML = `
                <div class="book-info">
                    <img src="${buku.cover}" alt="${buku.namaBarang}" class="book-cover">
                    <span>${buku.namaBarang}</span>
                </div>
            `;
            
            row.insertCell().textContent = buku.jenisBarang;
            row.insertCell().textContent = buku.edisi;
            row.insertCell().textContent = buku.stok;
            
            // Kolom Harga (Diformat Rupiah)
            row.insertCell().textContent = formatRupiah(buku.harga); 
            
            // Kolom Aksi (Hanya Beli Sekarang)
            const actionCell = row.insertCell();
            actionCell.innerHTML = `
                <button class="action-btn beli-btn" 
                        onclick="beliSekarang('${buku.kodeBarang}')"
                        ${buku.stok <= 0 ? 'disabled' : ''}>
                    ${buku.stok > 0 ? 'Beli Sekarang' : 'Stok Habis'}
                </button>
            `;
        });
    }

    // LOGIKA TAMBAH BARIS STOK BARU
    function tambahBarisStokBaru() {
        if (!katalogTableBody) return;

        const newIndex = dataKatalogBuku.length;
        const row = katalogTableBody.insertRow();
        row.id = `buku-new-row-${newIndex}`; 
        row.classList.add('new-row'); 

        row.innerHTML = `
            <td><input type="text" value="TEMP-${newIndex}" disabled></td>
            <td><input type="text" placeholder="Nama Barang" id="input-nama-${newIndex}" required></td>
            <td><input type="text" placeholder="Jenis Barang" id="input-jenis-${newIndex}"></td>
            <td><input type="text" placeholder="Edisi" id="input-edisi-${newIndex}"></td>
            <td><input type="number" value="0" min="0" id="input-stok-${newIndex}" required></td>
            <td><input type="number" placeholder="Harga (Angka)" id="input-harga-${newIndex}" required></td>
            <td><button class="action-btn admin-btn" onclick="simpanBarisStok(${newIndex})">Simpan</button></td>
        `;
        katalogTableBody.parentElement.scrollTop = katalogTableBody.parentElement.scrollHeight;
    }

    // Fungsi Global untuk Menyimpan Stok Baru
    window.simpanBarisStok = function(index) {
        const nama = document.getElementById(`input-nama-${index}`).value;
        const jenis = document.getElementById(`input-jenis-${index}`).value;
        const edisi = document.getElementById(`input-edisi-${index}`).value;
        const stok = parseInt(document.getElementById(`input-stok-${index}`).value);
        const harga = parseInt(document.getElementById(`input-harga-${index}`).value);

        if (!nama || !stok || isNaN(stok) || !harga || isNaN(harga)) {
            alert("Nama barang, Stok, dan Harga harus diisi dengan benar!");
            return;
        }

        const newBook = {
            kodeBarang: `NEW-${dataKatalogBuku.length + 1}`,
            namaBarang: nama,
            jenisBarang: jenis,
            edisi: edisi,
            stok: stok,
            harga: harga,
            cover: "img/default.jpg" // Default cover
        };

        dataKatalogBuku.push(newBook);
        alert(`Buku "${nama}" berhasil ditambahkan ke katalog.`);
        tampilkanKatalog(); 
    }

    // Fungsi Global untuk Tombol Beli Sekarang (DENGAN KOREKSI PATH)
   // Dalam script.js, di bawah LOGIKA TAMBAH BARIS STOK BARU

// Fungsi Global untuk Tombol Beli Sekarang (UBAH JADI MODAL POP-UP)
window.beliSekarang = function(kodeBarang) {
    const buku = dataKatalogBuku.find(b => b.kodeBarang === kodeBarang);
    
    if (!buku || buku.stok <= 0) {
        alert('Stok buku ini sudah habis atau data tidak valid!');
        return;
    }
    
    // -----------------------------------------------------------
    // KODE BARU UNTUK MENAMPILKAN POP-UP / MODAL
    // -----------------------------------------------------------
    
    // 1. Tampilkan konfirmasi menggunakan fungsi bawaan browser (Simpel)
    const konfirmasi = confirm(`Tambahkan "${buku.namaBarang}" ke keranjang?`);
    
    if (konfirmasi) {
        const existingItem = window.keranjangPemesanan.find(item => item.kodeBarang === kodeBarang);
        
        if (existingItem) {
            existingItem.jumlah += 1;
        } else {
            window.keranjangPemesanan.push({ kodeBarang: kodeBarang, jumlah: 1 });
        }

        alert(`"${buku.namaBarang}" berhasil ditambahkan ke keranjang. Lanjutkan ke Pemesanan.`);
        // Tidak lagi redirect, user tetap di halaman stok.html
        // Jika ingin langsung ke checkout setelah konfirmasi:
        // window.location.href = 'checkout.html'; 
    }
    // -----------------------------------------------------------
    
    // CATATAN: Jika Anda ingin menggunakan elemen modal (pop-up HTML) kustom
    // seperti pada bagian Login, Anda harus membuat elemen modal tersebut di stok.html
    // dan menggunakan fungsi toggleModal(modalId, true) untuk menampilkannya.
}


    // ====================================================================
    // D. Informasi Pengiriman (tracking.html)
    // ====================================================================

    const cariButton = document.getElementById('cariButton');
    if (cariButton) {
        cariButton.addEventListener('click', handleTracking);
    }

    function handleTracking() {
        const doNumber = document.getElementById('doNumber').value.trim();
        const resultDiv = document.getElementById('trackingResult');
        const errorDiv = document.getElementById('errorMessage');

        const data = dataTracking[doNumber]; // Menggunakan dataTracking dari data.js

        if (data) {
            document.getElementById('namaPemesanTrack').textContent = data.nama;
            document.getElementById('ekspedisiTrack').textContent = data.ekspedisi;
            document.getElementById('tanggalKirimTrack').textContent = data.tanggalKirim;
            document.getElementById('jenisPaketTrack').textContent = data.jenisPaket;
            document.getElementById('totalBayarTrack').textContent = formatRupiah(data.totalPembayaran);
            
            updateTrackingStatus(data);

            resultDiv.style.display = 'block';
            errorDiv.style.display = 'none';
        } else {
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    }

    function updateTrackingStatus(data) {
        const statusDiv = document.getElementById('statusProgressBar');
        
        // Menentukan status aktif
        let closestIndex = -1;
        if (data.status.includes("Telah Diterima") || data.status.includes("Selesai Antar")) {
            closestIndex = 2;
        } else if (data.status.includes("Dalam Perjalanan") || data.status.includes("Dikirim")) {
            closestIndex = 1;
        } else if (data.status.includes("Diproses")) {
            closestIndex = 0;
        }

        // Tampilkan Progress Bar
        const statuses = ["Pesanan Diproses", "Dalam Perjalanan", "Telah Diterima"];
        const progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('progress-bar-container');
        
        statuses.forEach((status, index) => {
            const step = document.createElement('div');
            step.classList.add('progress-step');
            
            // Tandai sebagai selesai jika tahapnya sudah dilewati
            if (index < closestIndex) {
                 step.classList.add('completed');
            }
             // Tandai sebagai saat ini (current)
             if (index === closestIndex) {
                step.classList.add('current');
            }

            step.textContent = status;
            progressBarContainer.appendChild(step);
        });

        // Tampilkan Detail Perjalanan/Histori
        const detailHtml = `
            <h4 style="margin-top: 20px;">Status Saat Ini: ${data.status}</h4>
            <h4 style="margin-top: 5px;">Riwayat Perjalanan (Ekspedisi ${data.ekspedisi})</h4>
            <table class="tracking-detail-table">
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.perjalanan.map(log => `
                        <tr>
                            <td>${log.waktu}</td>
                            <td>${log.keterangan}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        statusDiv.innerHTML = ''; // Kosongkan
        statusDiv.appendChild(progressBarContainer);
        statusDiv.innerHTML += detailHtml;
    }
    
    // ====================================================================
    // E. Halaman Pemesanan (checkout.html)
    // ====================================================================
    
    const checkoutForm = document.getElementById('checkoutForm');
    const cartItemsBody = document.getElementById('cartItems');

    if (cartItemsBody) {
        renderCart(window.keranjangPemesanan); 
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckout);
        }
         document.getElementById('tambahItemButton').addEventListener('click', () => {
             alert('Anda akan diarahkan kembali ke halaman Katalog untuk menambah item.');
             window.location.href = 'stok.html'; 
         });
    }
    
    function renderCart(cartData) {
        if (!cartItemsBody) return;
        cartItemsBody.innerHTML = '';
        let grandTotal = 0;

        if (cartData.length === 0) {
            cartItemsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Keranjang belanja Anda kosong.</td></tr>';
            document.getElementById('totalPembayaran').textContent = formatRupiah(0);
            document.getElementById('prosesPemesanan').disabled = true;
            return;
        }
        
        document.getElementById('prosesPemesanan').disabled = false; // Aktifkan jika ada item

        cartData.forEach((item) => {
            const buku = dataKatalogBuku.find(b => b.kodeBarang === item.kodeBarang);
            if (!buku) return;

            const hargaBuku = typeof buku.harga === 'string' ? parseInt(buku.harga.replace(/[^0-9]/g, '')) : buku.harga;
            const subtotalNum = hargaBuku * item.jumlah;
            grandTotal += subtotalNum;

            const row = cartItemsBody.insertRow();
            row.innerHTML = `
                <td>${buku.namaBarang}</td>
                <td><input type="number" value="${item.jumlah}" min="1" data-kode="${item.kodeBarang}" onchange="updateCartItem('${item.kodeBarang}', this.value)"></td>
                <td>${formatRupiah(hargaBuku)}</td>
                <td id="subtotal-${item.kodeBarang}">${formatRupiah(subtotalNum)}</td>
                <td><button onclick="removeItemFromCart('${item.kodeBarang}')" class="logout">Hapus</button></td>
            `;
        });

        document.getElementById('totalPembayaran').textContent = formatRupiah(grandTotal);
    }
    
    // Fungsi Global untuk update jumlah item di keranjang (dipanggil dari onchange input)
    window.updateCartItem = function(kodeBarang, newJumlah) {
        const jumlah = parseInt(newJumlah);
        if (jumlah < 1 || isNaN(jumlah)) {
            alert("Jumlah minimal adalah 1. Gunakan tombol hapus untuk menghilangkan item.");
            const item = window.keranjangPemesanan.find(i => i.kodeBarang === kodeBarang);
            document.querySelector(`input[data-kode="${kodeBarang}"]`).value = item ? item.jumlah : 1;
            return;
        }

        const itemIndex = window.keranjangPemesanan.findIndex(item => item.kodeBarang === kodeBarang);
        if (itemIndex > -1) {
            window.keranjangPemesanan[itemIndex].jumlah = jumlah; 
            renderCart(window.keranjangPemesanan); 
        }
    }

    // Fungsi Global untuk menghapus item dari keranjang (dipanggil dari onclick tombol Hapus)
    window.removeItemFromCart = function(kodeBarang) {
        const initialLength = window.keranjangPemesanan.length;
        window.keranjangPemesanan = window.keranjangPemesanan.filter(item => item.kodeBarang !== kodeBarang);
        if (window.keranjangPemesanan.length < initialLength) {
            alert(`Item berhasil dihapus dari keranjang.`);
            renderCart(window.keranjangPemesanan); 
        }
    }
    
    function handleCheckout(event) {
        event.preventDefault();

        if (window.keranjangPemesanan.length === 0) {
            alert("Keranjang belanja kosong! Silakan tambahkan buku terlebih dahulu.");
            return;
        }

        const namaPemesan = document.getElementById('namaPemesan').value;
        const alamatKirim = document.getElementById('alamatKirim').value;
        const metodePembayaran = document.getElementById('metodePembayaran').value;
        const totalBayar = document.getElementById('totalPembayaran').textContent;

        if (!namaPemesan || !alamatKirim || !metodePembayaran) {
             alert("Harap lengkapi semua data Pemesan dan Pembayaran.");
             return;
        }

        alert(`Pemesanan berhasil diproses! 
        Total Pembayaran: ${totalBayar}
        Tujuan: ${namaPemesan}, ${alamatKirim}
        Metode Pembayaran: ${metodePembayaran}
        
        (Simulasi: Data sudah tersimpan dan pesanan Anda sedang dikirim!)`);

        // Kosongkan keranjang setelah checkout sukses
        window.keranjangPemesanan = [];
        renderCart(window.keranjangPemesanan);
        
        // Redirect setelah alert ditutup
        window.location.href = 'dashboard.html';
    }

});