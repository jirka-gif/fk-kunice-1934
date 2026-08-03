'use client';
// =============================================================================
//  ADMIN — UŽIVATELÉ A ROLE
//  Uživatelé a role se neukládají do obsahu webu, ale přes vlastní API
//  (/api/users, /api/roles), protože obsahují hesla.
// =============================================================================
import { useCallback, useEffect, useState } from 'react';
import { Card, Btn, Field, Row, Select, SectionHead } from './adminui';
import { ADMIN_SECTIONS, LEVELS, LEVEL_LABELS } from '@/lib/permissions';

const RED = '#C1121F';

function Hlaska({ error, info }) {
  if (!error && !info) return null;
  return (
    <div style={{ background: error ? '#FBEAEC' : '#EAF6EE', color: error ? RED : '#1F8A4C', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
      {error || info}
    </div>
  );
}

function SubTabs({ tab, setTab, tabs }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', border: active ? `1px solid ${RED}` : '1px solid #ECEEF1', background: active ? RED : '#fff', color: active ? '#fff' : '#3a3f47' }}>
            {t.label}
            {t.badge != null && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 10, background: active ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: active ? '#fff' : '#9AA1AC' }}>{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Uzivatele() {
  const [tab, setTab] = useState('uzivatele');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meId, setMeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // formulář pozvánky
  const [invite, setInvite] = useState({ email: '', name: '', role: 'redaktor' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Seznam uživatelů se nepodařilo načíst.');
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setMeId(data.meId || '');
    } catch {
      setError('Server je nedostupný.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const call = async (url, options, okMessage) => {
    setError(''); setInfo('');
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Akce se nezdařila.'); return null; }
      if (okMessage) setInfo(typeof okMessage === 'function' ? okMessage(data) : okMessage);
      await load();
      return data;
    } catch {
      setError('Server je nedostupný.');
      return null;
    }
  };

  const doInvite = async () => {
    if (!invite.email.includes('@')) { setError('Zadej platný e-mail.'); return; }
    const data = await call('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invite),
    }, (d) => `Uživatel ${d.user.email} založen. První heslo: ${d.password} — předej mu ho bezpečně, při prvním přihlášení si ho má změnit.`);
    if (data) setInvite({ email: '', name: '', role: invite.role });
  };

  const updateUser = (id, patch, okMessage) => call('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  }, okMessage);

  const removeUser = (u) => {
    if (!confirm(`Opravdu smazat uživatele ${u.email}? Tuto akci nelze vrátit zpět.`)) return;
    call(`/api/users?id=${encodeURIComponent(u.id)}`, { method: 'DELETE' }, 'Uživatel smazán.');
  };

  const resetPassword = (u) => {
    if (!confirm(`Vygenerovat nové heslo pro ${u.email}?`)) return;
    updateUser(u.id, { resetPassword: true }, (d) => `Nové heslo pro ${u.email}: ${d.password} — předej mu ho bezpečně.`);
  };

  // --- role ---
  const setRolePerm = (roleId, sectionId, level) => {
    setRoles((rs) => rs.map((r) => (r.id === roleId ? { ...r, permissions: { ...r.permissions, [sectionId]: level } } : r)));
  };
  const setRoleField = (roleId, patch) => setRoles((rs) => rs.map((r) => (r.id === roleId ? { ...r, ...patch } : r)));
  const addRole = () => {
    const id = prompt('Jak se má role jmenovat? (např. Vedoucí mládeže)');
    if (!id) return;
    const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `role-${roles.length + 1}`;
    if (roles.some((r) => r.id === slug)) { setError('Role s tímto názvem už existuje.'); return; }
    const perms = {};
    for (const s of ADMIN_SECTIONS) perms[s.id] = 'none';
    setRoles((rs) => [...rs, { id: slug, name: id, description: '', system: false, permissions: perms }]);
  };
  const removeRole = (roleId) => {
    if (users.some((u) => u.role === roleId)) { setError('Roli používají uživatelé — nejdřív jim nastav jinou.'); return; }
    if (!confirm('Opravdu smazat tuto roli?')) return;
    setRoles((rs) => rs.filter((r) => r.id !== roleId));
  };
  const saveRoles = () => call('/api/roles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles }),
  }, 'Role uloženy.');

  if (loading) {
    return (
      <div>
        <SectionHead title="Uživatelé a role" desc="Kdo se dostane do administrace a co tam smí" />
        <Card><div style={{ padding: 8, color: '#9AA1AC', fontWeight: 600 }}>Načítám…</div></Card>
      </div>
    );
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div>
      <SectionHead title="Uživatelé a role" desc="Kdo se dostane do administrace a co tam smí" count={users.length} />
      <SubTabs tab={tab} setTab={setTab} tabs={[
        { id: 'uzivatele', label: 'Uživatelé', badge: users.length },
        { id: 'role', label: 'Role a oprávnění', badge: roles.length },
      ]} />
      <Hlaska error={error} info={info} />

      {tab === 'uzivatele' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Pozvat nového uživatele</div>
            <Row>
              <Field label="E-mail" value={invite.email} onChange={(v) => setInvite((s) => ({ ...s, email: v }))} placeholder="jmeno@fkkunice.cz" />
              <Field label="Jméno" value={invite.name} onChange={(v) => setInvite((s) => ({ ...s, name: v }))} placeholder="Jan Novák" />
              <Select label="Role" value={invite.role} onChange={(v) => setInvite((s) => ({ ...s, role: v }))} options={roleOptions} width="200px" />
              <Btn kind="primary" onClick={doInvite}>Pozvat</Btn>
            </Row>
            <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
              Heslo se vygeneruje automaticky a zobrazí se ti hned po založení. Uživatel si ho má po prvním přihlášení změnit.
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.map((u) => (
              <Card key={u.id} style={{ padding: 16, opacity: u.active ? 1 : 0.65 }}>
                <Row>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1E1E' }}>
                      {u.name || u.email}
                      {u.id === meId && <span style={{ fontSize: 10, fontWeight: 800, color: RED, marginLeft: 8 }}>TO JSI TY</span>}
                      {!u.active && <span style={{ fontSize: 10, fontWeight: 800, color: '#9AA1AC', marginLeft: 8 }}>DEAKTIVOVANÝ</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2 }}>{u.email}</div>
                  </div>
                  <Select label="Role" value={u.role} onChange={(v) => updateUser(u.id, { role: v }, 'Role změněna.')} options={roleOptions} width="200px" />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <Btn small onClick={() => resetPassword(u)}>Nové heslo</Btn>
                    <Btn small onClick={() => updateUser(u.id, { active: !u.active }, u.active ? 'Uživatel deaktivován.' : 'Uživatel aktivován.')}>
                      {u.active ? 'Deaktivovat' : 'Aktivovat'}
                    </Btn>
                    <Btn small kind="danger" onClick={() => removeUser(u)}>Smazat</Btn>
                  </div>
                </Row>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'role' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #ECEEF1', padding: '12px 16px', fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
            U každé role zaškrtej, co smí v jednotlivých sekcích administrace. <b>Nevidí</b> = sekce se v menu vůbec nezobrazí,
            <b> jen prohlížet</b> = uvidí ji, ale nic neuloží, <b>může upravovat</b> = plný přístup. Role <b>Správce</b> má vždy vše.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 760 }}>
              {roles.map((r) => (
                <Card key={r.id} style={{ marginBottom: 12 }}>
                  <Row>
                    <Field label="Název role" value={r.name} onChange={(v) => setRoleField(r.id, { name: v })} width="220px" />
                    <Field label="Popis" value={r.description} onChange={(v) => setRoleField(r.id, { description: v })} />
                    {!r.system && <Btn small kind="danger" onClick={() => removeRole(r.id)}>Smazat roli</Btn>}
                  </Row>
                  <div style={{ height: 14 }} />
                  {r.system ? (
                    <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>Správce má vždy plný přístup ke všem sekcím — nelze mu ho odebrat.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,110px)', gap: 4, alignItems: 'center' }}>
                      <div />
                      {LEVELS.map((lvl) => (
                        <div key={lvl} style={{ fontSize: 11, fontWeight: 800, color: '#9AA1AC', textAlign: 'center', textTransform: 'uppercase' }}>{LEVEL_LABELS[lvl]}</div>
                      ))}
                      {ADMIN_SECTIONS.map((s) => (
                        <PermRow key={s.id} role={r} section={s} onPick={setRolePerm} />
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn kind="primary" onClick={saveRoles}>Uložit role</Btn>
            <Btn onClick={addRole}>+ Nová role</Btn>
            <Btn onClick={load}>Zahodit změny</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// jeden řádek matice: název sekce + tři přepínače úrovně
function PermRow({ role, section, onPick }) {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#3a3f47', padding: '8px 0' }}>{section.label}</div>
      {LEVELS.map((lvl) => {
        const on = (role.permissions[section.id] || 'none') === lvl;
        return (
          <button
            key={lvl}
            data-perm={`${role.id}:${section.id}:${lvl}`}
            aria-pressed={on}
            onClick={() => onPick(role.id, section.id, lvl)}
            title={`${section.label} — ${LEVEL_LABELS[lvl]}`}
            style={{ fontSize: 12, fontWeight: 700, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', border: on ? `1px solid ${RED}` : '1px solid #ECEEF1', background: on ? RED : '#fff', color: on ? '#fff' : '#9AA1AC', fontFamily: 'inherit' }}
          >
            {on ? '✓' : '·'}
          </button>
        );
      })}
    </>
  );
}
