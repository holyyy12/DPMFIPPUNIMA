import { PolicyPage } from '@/components/policy-page';
export default function Page() {
  return (
    <PolicyPage
      eyebrow="KETENTUAN KOMENTAR"
      title="Ruang dialog yang aman dan relevan."
      lead="Komentar mendukung partisipasi, bukan pelecehan, spam, pembukaan data pribadi, atau ancaman."
    >
      <h2>Yang diperbolehkan</h2>
      <p>
        Tanggapan yang relevan, kritik yang beralasan, pertanyaan, pengalaman,
        dan saran perbaikan dengan bahasa yang menghormati orang lain.
      </p>
      <h2>Publikasi langsung</h2>
      <p>
        Komentar langsung tampil setelah dikirim tanpa persetujuan admin. Admin
        memantau diskusi dan dapat menghapus komentar yang mengandung spam,
        pelecehan, ancaman, data pribadi, atau pelanggaran kebijakan.
      </p>
      <h2>Penghapusan oleh admin</h2>
      <p>
        Pengguna tidak dapat menghapus komentar sendiri. Jika ada masalah,
        gunakan tombol Laporkan agar admin dapat meninjaunya. Penghapusan oleh
        admin dicatat; komentar yang memiliki balasan menyisakan penanda agar
        alur diskusi tetap dapat dipahami.
      </p>
    </PolicyPage>
  );
}
