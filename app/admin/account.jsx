'use client';
// Změna vlastního hesla — každý přihlášený, bez ohledu na roli.
import { useState } from 'react';
import { Card, Btn, Field, Row, SectionHead } from './adminui';

const RED = '#C1121F';

export function ZmenaHesla({ me }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', repeat: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const setF = (k) => (v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setError(''); setInfo('');
    if (form.newPassword.length < 8) { setError('Nové heslo musí mít aspoň 8 znaků.'); return; }
    if (form.newPassword !== form.repeat) { setError('Hesla se neshodují.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Heslo se nepodařilo změnit.'); return; }
      setInfo('Heslo změněno.');
      setForm({ currentPassword: '', newPassword: '', repeat: '' });
    } catch {
      setError('Server je nedostupný.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionHead title="Můj účet" desc={`${me.email} · ${me.roleName}`} />
      {me.mustChangePassword && (
        <div style={{ background: '#FBEAEC', color: RED, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
          Přihlásil ses heslem od správce — nastav si prosím vlastní.
        </div>
      )}
      {error && <div style={{ background: '#FBEAEC', color: RED, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{error}</div>}
      {info && <div style={{ background: '#EAF6EE', color: '#1F8A4C', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{info}</div>}
      <Card>
        <Row>
          <Field label="Současné heslo" type="password" value={form.currentPassword} onChange={setF('currentPassword')} />
        </Row>
        <div style={{ height: 12 }} />
        <Row>
          <Field label="Nové heslo (aspoň 8 znaků)" type="password" value={form.newPassword} onChange={setF('newPassword')} />
          <Field label="Nové heslo znovu" type="password" value={form.repeat} onChange={setF('repeat')} />
        </Row>
        <div style={{ marginTop: 14 }}>
          <Btn kind="primary" onClick={busy ? undefined : submit}>{busy ? 'Ukládám…' : 'Změnit heslo'}</Btn>
        </div>
      </Card>
    </div>
  );
}
