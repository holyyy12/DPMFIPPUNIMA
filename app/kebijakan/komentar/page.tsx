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
      <h2>Penyaringan</h2>
      <p>
        Komentar dapat ditahan atau dihapus karena spam, harassment, hate,
        threat, data pribadi, impersonation, atau pelanggaran hukum/kebijakan.
        Keputusan penting memiliki alasan dan jejak penyaringan.
      </p>
      <h2>Penghapusan oleh pengirim</h2>
      <p>
        Pengirim menerima credential privat satu kali untuk menghapus komentar
        sendiri. Komentar yang memiliki balasan menjadi tombstone agar alur
        diskusi tetap dapat dipahami. Pengeditan setelah kirim tidak tersedia.
      </p>
    </PolicyPage>
  );
}
