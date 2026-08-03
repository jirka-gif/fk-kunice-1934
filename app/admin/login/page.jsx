'use client';
import { useState } from 'react';
import Image from 'next/image';

const RED = '#C1121F';

export default function AdminLogin() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get('from') || '/admin';
      } else {
        setErr('Nesprávné heslo. Zkus to prosím znovu.');
      }
    } catch {
      setErr('Přihlášení se nezdařilo. Zkontroluj připojení.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F7F9', padding: 24 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 2px rgba(18,18,18,.04),0 20px 50px rgba(18,18,18,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #ECEEF1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
            <Image src="/logo.webp" alt="FK Kunice" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: '#121212', letterSpacing: '.3px' }}>FK KUNICE</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: '#9AA1AC' }}>ADMINISTRACE</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>Zadej heslo pro přístup do správy webu.</div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Heslo"
          autoFocus
          style={{ width: '100%', border: '1px solid #ECEEF1', background: '#FAFBFC', borderRadius: 10, padding: '13px 15px', fontSize: 15, fontFamily: 'inherit', color: '#1E1E1E', outline: 'none', marginBottom: 12 }}
        />
        {err && <div style={{ fontSize: 13, color: RED, fontWeight: 600, marginBottom: 12 }}>{err}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', background: RED, color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 10, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Přihlašuji…' : 'Přihlásit se'}
        </button>
      </form>
    </div>
  );
}
