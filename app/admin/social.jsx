'use client';
// =============================================================================
//  ADMIN — SOCIÁLNÍ SÍTĚ
//  Fronta příspěvků (koncept → ke schválení → odesláno / chyba), náhled vizuálu
//  z /api/og/match, úprava textu i proměnných vizuálu a odeslání přes Metu.
// =============================================================================
import { useState } from 'react';
import { useData, setSection, updateData } from '@/lib/store';
import { Card, Btn, Field, Row, Select, SectionHead, ImageField } from './adminui';
import { buildOgUrl, buildPostText, emptySocialPost, SOCIAL_TARGETS, DEFAULT_TEMPLATE } from '@/lib/social';

const RED = '#C1121F';

function statusPill(status) {
  const map = {
    'koncept': { background: '#F4F5F7', color: '#9AA1AC' },
    'ke schválení': { background: '#FBEAEC', color: RED },
    'odesláno': { background: '#EAF6EE', color: '#1F8A4C' },
    'chyba': { background: '#F3F0E9', color: '#A98C4E' },
  };
  return { fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 10, marginLeft: 8, textTransform: 'uppercase', ...(map[status] || map.koncept) };
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function Socialni() {
  const { socialPosts, socialSettings } = useData();
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const setSettings = (patch) => setSection('socialSettings', { ...socialSettings, ...patch });
  const updatePost = (id, patch) => setSection('socialPosts', socialPosts.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addPost = () => {
    const id = `post-${new Date().toISOString()}`;
    const post = { ...emptySocialPost(), id, createdAt: new Date().toISOString(), targets: socialSettings.targets };
    post.text = buildPostText(socialSettings.template, post.visual);
    setSection('socialPosts', [post, ...socialPosts]);
    setOpen(id);
  };

  const removePost = (p) => {
    if (!confirm('Opravdu smazat tento příspěvek z fronty?')) return;
    setSection('socialPosts', socialPosts.filter((x) => x.id !== p.id));
    setOpen(null);
  };

  // Odeslání běží na serveru (tokeny nikdy nejdou do prohlížeče).
  const publish = async (p) => {
    if (!p.targets.length) { setError('Vyber aspoň jednu síť.'); return; }
    if (!confirm(`Opravdu teď zveřejnit příspěvek na ${p.targets.join(' a ')}?`)) return;
    setBusy(p.id); setError(''); setInfo('');
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.post) {
        // server už příspěvek uložil — promítneme jeho stav i do klientského obsahu
        updateData((d) => { d.socialPosts = d.socialPosts.map((x) => (x.id === p.id ? data.post : x)); });
      }
      if (res.ok && data.ok) setInfo('Příspěvek byl zveřejněn.');
      else setError(data.error || (data.post && data.post.lastError) || 'Zveřejnění se nezdařilo.');
    } catch {
      setError('Server je nedostupný.');
    } finally {
      setBusy('');
    }
  };

  const fronta = socialPosts.filter((p) => p.status !== 'odesláno');
  const odeslane = socialPosts.filter((p) => p.status === 'odesláno');

  return (
    <div>
      <SectionHead title="Sociální sítě" desc="Vizuál a text příspěvku z výsledku zápasu, zveřejnění na Facebook a Instagram" count={fronta.length} />

      {error && <div style={{ background: '#FBEAEC', color: RED, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{error}</div>}
      {info && <div style={{ background: '#EAF6EE', color: '#1F8A4C', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{info}</div>}

      {/* NASTAVENÍ */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Nastavení</div>
        <Row>
          <Select
            label="Po potvrzení výsledku"
            value={socialSettings.autoPublish ? 'auto' : 'rucne'}
            onChange={(v) => setSettings({ autoPublish: v === 'auto' })}
            options={[
              { value: 'rucne', label: 'Jen připravit koncept (doporučeno)' },
              { value: 'auto', label: 'Rovnou dát ke schválení' },
            ]}
            width="320px"
          />
          <Field label="Kolikrát opakovat při chybě" type="number" value={socialSettings.maxAttempts} onChange={(v) => setSettings({ maxAttempts: Math.min(10, Math.max(1, Number(v) || 1)) })} width="180px" />
        </Row>
        <div style={{ height: 12 }} />
        <Field
          label="Šablona textu — {vysledek} {domaci} {hoste} {skore} {soutez} {datum} {strelci}"
          textarea
          rows={4}
          value={socialSettings.template}
          onChange={(v) => setSettings({ template: v })}
          placeholder={DEFAULT_TEMPLATE}
        />
        <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
          Tokeny Mety se nastavují v proměnných prostředí (META_PAGE_ID, META_PAGE_TOKEN, META_IG_USER_ID) — do administrace se nikdy nezadávají.
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Btn kind="primary" onClick={addPost}>+ Nový příspěvek</Btn>
      </div>

      {/* FRONTA */}
      {fronta.length === 0 ? (
        <Card><div style={{ padding: 8, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Fronta je prázdná. Nový příspěvek vznikne sám po potvrzení výsledku zápasu.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fronta.map((p) => {
            const isOpen = open === p.id;
            return (
              <Card key={p.id} style={{ padding: 0, overflow: 'hidden' }}>
                <div onClick={() => setOpen(isOpen ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: isOpen ? '#FBF6F6' : '#fff' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>
                      {p.visual.home} {p.visual.score} {p.visual.away}
                      <span style={statusPill(p.status)}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2 }}>
                      {formatDate(p.createdAt)} · {p.targets.join(', ') || 'bez sítě'}
                      {p.attempts > 0 ? ` · pokusů: ${p.attempts}` : ''}
                    </div>
                  </div>
                  <span style={{ color: RED, fontWeight: 700, fontSize: 12, flex: 'none' }}>Upravit {isOpen ? '▲' : '▾'}</span>
                </div>

                {isOpen && (
                  <div style={{ padding: 18, background: '#FBF6F6', borderTop: '1px solid #F2F3F5' }}>
                    {p.lastError && (
                      <div style={{ background: '#F3F0E9', color: '#A98C4E', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                        Poslední chyba: {p.lastError}
                      </div>
                    )}

                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Vizuál</div>
                    <Row>
                      <Field label="Nadpis" value={p.visual.title} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, title: v } })} width="180px" />
                      <Field label="Domácí" value={p.visual.home} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, home: v } })} />
                      <Field label="Skóre" value={p.visual.score} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, score: v } })} width="120px" />
                      <Field label="Hosté" value={p.visual.away} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, away: v } })} />
                    </Row>
                    <div style={{ height: 10 }} />
                    <Row>
                      <Field label="Soutěž" value={p.visual.competition} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, competition: v } })} />
                      <Field label="Datum" value={p.visual.date} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, date: v } })} width="160px" />
                      <Field label="Střelci" value={p.visual.scorers} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, scorers: v } })} />
                      <Field label="Hashtag ve vizuálu" value={p.visual.hashtag} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, hashtag: v } })} width="230px" />
                    </Row>

                    <div style={{ height: 14 }} />
                    <ImageField label="Fotka na pozadí (nepovinná)" value={p.visual.photo} onChange={(v) => updatePost(p.id, { visual: { ...p.visual, photo: v } })} />
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 6 }}>
                      Fotka se ořízne na výšku a ztmaví, aby zůstaly texty čitelné. Bez fotky zůstane tmavé pozadí s klubovou červenou.
                    </div>

                    <div style={{ margin: '14px 0' }}>
                      <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 700, marginBottom: 8 }}>Náhled vizuálu — 1080 × 1350 px (4:5, formát pro Instagram i Facebook)</div>
                      {/* náhled generovaného obrázku (stejná adresa jde i na Metu) */}
                      <img
                        src={buildOgUrl(p.visual, '', p.id)}
                        alt="Náhled vizuálu"
                        data-og-preview={p.id}
                        style={{ width: '100%', maxWidth: 340, borderRadius: 10, display: 'block', border: '1px solid #ECEEF1' }}
                      />
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 14, margin: '18px 0 8px' }}>Text příspěvku</div>
                    <Field label="Text příspěvku" textarea rows={5} value={p.text} onChange={(v) => updatePost(p.id, { text: v })} />
                    <div style={{ marginTop: 8 }}>
                      <Btn small onClick={() => updatePost(p.id, { text: buildPostText(socialSettings.template, p.visual) })}>Přegenerovat text ze šablony</Btn>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 14, margin: '18px 0 8px' }}>Kam zveřejnit</div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {SOCIAL_TARGETS.map((t) => (
                        <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#3a3f47' }}>
                          <input
                            type="checkbox"
                            checked={p.targets.includes(t.value)}
                            onChange={(e) => updatePost(p.id, {
                              targets: e.target.checked ? [...p.targets, t.value] : p.targets.filter((x) => x !== t.value),
                            })}
                          />
                          {t.label}
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Btn kind="primary" onClick={() => (busy === p.id ? undefined : publish(p))}>
                        {busy === p.id ? 'Odesílám…' : p.status === 'chyba' ? 'Zkusit odeslat znovu' : 'Zveřejnit'}
                      </Btn>
                      {p.status !== 'ke schválení' && <Btn small onClick={() => updatePost(p.id, { status: 'ke schválení' })}>Dát ke schválení</Btn>}
                      <span style={{ marginLeft: 'auto' }}><Btn small kind="danger" onClick={() => removePost(p)}>Smazat</Btn></span>
                    </div>

                    {p.history.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>Historie</div>
                        {p.history.slice().reverse().map((h, i) => (
                          <div key={i} style={{ fontSize: 12, fontWeight: 600, color: h.ok ? '#1F8A4C' : RED, padding: '3px 0' }}>
                            {formatDate(h.at)} · {h.target} · {h.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* HISTORIE ODESLANÝCH */}
      {odeslane.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>Odeslané příspěvky</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {odeslane.map((p) => (
              <Card key={p.id} style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1E1E' }}>
                  {p.visual.home} {p.visual.score} {p.visual.away}
                  <span style={statusPill(p.status)}>{p.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2 }}>
                  {formatDate(p.createdAt)} · {p.targets.join(', ')}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
