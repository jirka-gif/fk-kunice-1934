'use client';
import { useState, Fragment } from 'react';
import { useData, setSection } from '@/lib/store';
import { Field, Row, Btn, Card, SectionHead, ListEditor, StringListEditor, Select, TeamSwitcher, ImageField } from './adminui';

const WLD_OPTS = [{ value: 'V', label: 'Výhra' }, { value: 'R', label: 'Remíza' }, { value: 'P', label: 'Prohra' }];
const EV_TYPE_OPTS = [{ value: 'goal', label: 'Gól' }, { value: 'yellow', label: 'Žlutá karta' }, { value: 'red', label: 'Červená karta' }];
const EV_TEAM_OPTS = [{ value: 'h', label: 'Domácí' }, { value: 'a', label: 'Hosté' }];
const RESULT_OPTS = ['VÝHRA', 'REMÍZA', 'PROHRA'];

const set = (k, v) => setSection(k, v);

// ---------------------------------------------------------------- NASTAVENÍ
export function Nastaveni() {
  const { club } = useData();
  const upd = (patch) => set('club', { ...club, ...patch });
  const updAddr = (patch) => upd({ address: { ...club.address, ...patch } });
  return (
    <div>
      <SectionHead title="Nastavení klubu" desc="Základní údaje zobrazené v patičce a na webu" />
      <Card>
        <Row>
          <Field label="Název" value={club.name} onChange={(v) => upd({ name: v })} />
          <Field label="Plný název" value={club.fullName} onChange={(v) => upd({ fullName: v })} />
          <Field label="Rok založení" type="number" value={club.since} onChange={(v) => upd({ since: Number(v) || 0 })} width="120px" />
        </Row>
        <div style={{ height: 12 }} />
        <Row>
          <Field label="Motto" value={club.motto} onChange={(v) => upd({ motto: v })} />
          <Field label="Kraj" value={club.region} onChange={(v) => upd({ region: v })} />
        </Row>
        <div style={{ height: 12 }} />
        <Row>
          <Field label="Ulice / č.p." value={club.address.street} onChange={(v) => updAddr({ street: v })} />
          <Field label="PSČ" value={club.address.zip} onChange={(v) => updAddr({ zip: v })} width="120px" />
          <Field label="Obec" value={club.address.city} onChange={(v) => updAddr({ city: v })} />
        </Row>
        <div style={{ height: 12 }} />
        <Row>
          <Field label="E-mail" value={club.email} onChange={(v) => upd({ email: v })} />
          <Field label="Telefon" value={club.phone} onChange={(v) => upd({ phone: v })} />
          <Field label="Messenger" value={club.messenger} onChange={(v) => upd({ messenger: v })} />
        </Row>
        <div style={{ height: 12 }} />
        <Field label="Popis (patička)" textarea value={club.description} onChange={(v) => upd({ description: v })} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- TÝMY
export function Tymy() {
  const { teams } = useData();
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, teams.length - 1);
  const t = teams[idx] || teams[0];

  const updateTeam = (patch) => {
    set('teams', teams.map((tm, i) => (i === idx ? { ...tm, ...patch } : tm)));
  };
  const addTeam = () => {
    set('teams', [...teams, { id: 'novy-tym-' + Date.now(), name: 'Nový tým', cat: 'Mládež · —', short: '—', comp: 'Soutěž', contact: '', coaches: [], players: [] }]);
    setSel(teams.length);
  };
  const removeTeam = () => {
    if (!confirm(`Opravdu smazat tým „${t.name}" včetně soupisky?`)) return;
    set('teams', teams.filter((_, i) => i !== idx));
    setSel(Math.max(0, idx - 1));
  };

  return (
    <div>
      <SectionHead title="Týmy" desc="Vyber tým nahoře a uprav jeho soupisku, realizační tým a soutěž" count={teams.length} />

      {/* přepínač týmů */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        {teams.map((tm, i) => {
          const active = i === idx;
          return (
            <button key={tm.id} onClick={() => setSel(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s', border: active ? '1px solid #C1121F' : '1px solid #ECEEF1', background: active ? '#C1121F' : '#fff', color: active ? '#fff' : '#3a3f47' }}>
              {tm.name}
              <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: active ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: active ? '#fff' : '#9AA1AC' }}>{tm.players.length}</span>
            </button>
          );
        })}
        <button onClick={addTeam} style={{ fontSize: 13.5, fontWeight: 700, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', border: '1px dashed #C1121F', background: '#FBEAEC', color: '#C1121F' }}>+ Přidat tým</button>
      </div>

      {/* editor vybraného týmu */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: '#121212', letterSpacing: '.3px' }}>{t.name}</div>
          <Btn kind="danger" small onClick={removeTeam}>Smazat tým</Btn>
        </div>
        <Row>
          <Field label="Název" value={t.name} onChange={(v) => updateTeam({ name: v })} />
          <Field label="Kategorie" value={t.cat} onChange={(v) => updateTeam({ cat: v })} />
          <Field label="Zkratka" value={t.short} onChange={(v) => updateTeam({ short: v })} width="120px" />
        </Row>
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Soutěž" value={t.comp} onChange={(v) => updateTeam({ comp: v })} />
          <Field label="Kontakt" value={t.contact} onChange={(v) => updateTeam({ contact: v })} placeholder="nepovinné" />
          <Field label="ID (URL)" value={t.id} onChange={(v) => updateTeam({ id: v })} width="160px" />
        </Row>

        <div style={{ marginTop: 20, fontSize: 11, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.4px' }}>REALIZAČNÍ TÝM ({t.coaches.length})</div>
        <div style={{ height: 8 }} />
        <ListEditor
          items={t.coaches}
          onChange={(v) => updateTeam({ coaches: v })}
          itemTitle={(c) => c.n || 'Trenér'}
          newItem={{ n: '', r: 'Trenér' }}
          addLabel="+ Přidat člena realizačního týmu"
          renderItem={(c, u) => (
            <Row>
              <Field label="Jméno" value={c.n} onChange={(v) => u({ n: v })} />
              <Field label="Role" value={c.r} onChange={(v) => u({ r: v })} />
            </Row>
          )}
        />

        {t.id === 'skolicka' ? (
          <div style={{ marginTop: 20, background: '#FAFBFC', border: '1px solid #ECEEF1', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
            U <b>fotbalové školičky</b> (4–6 let) se soupiska ani statistiky nevedou — spravuj jen kontakt a realizační tým. Na webu se místo soupisky zobrazí výzva k náboru.
          </div>
        ) : (
          <>
            <div style={{ marginTop: 20, fontSize: 11, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.4px' }}>SOUPISKA ({t.players.length})</div>
            <div style={{ height: 8 }} />
            <ListEditor
              items={t.players}
              onChange={(v) => updateTeam({ players: v })}
              itemTitle={(p) => `#${p.number || '?'}  ${p.name || 'Nový hráč'}${p.position ? ' · ' + p.position : ''}`}
              newItem={() => ({ name: '', number: t.players.length + 1, position: 'ZÁL', photo: '', age: '', apps: '', goals: '', assists: '', since: '', favClub: '', favPlayer: '' })}
              addLabel="+ Přidat hráče"
              renderItem={(p, u) => (
                <div>
                  <ImageField label="Fotka hráče" value={p.photo} onChange={(v) => u({ photo: v })} />
                  <div style={{ height: 12 }} />
                  <Row>
                    <Field label="Jméno a příjmení" value={p.name} onChange={(v) => u({ name: v })} />
                    <Field label="Číslo" type="number" value={p.number} onChange={(v) => u({ number: v })} width="100px" />
                    <Select label="Pozice" value={p.position} onChange={(v) => u({ position: v })} options={['GK', 'OBR', 'ZÁL', 'ÚTO', 'KŘÍ']} width="120px" />
                  </Row>
                  <div style={{ height: 10 }} />
                  <Row>
                    <Field label="Věk" type="number" value={p.age} onChange={(v) => u({ age: v })} width="100px" />
                    <Field label="Zápasy" type="number" value={p.apps} onChange={(v) => u({ apps: v })} width="110px" />
                    <Field label="Góly" type="number" value={p.goals} onChange={(v) => u({ goals: v })} width="100px" />
                    <Field label="Asistence" type="number" value={p.assists} onChange={(v) => u({ assists: v })} width="110px" />
                    <Field label="V klubu od" value={p.since} onChange={(v) => u({ since: v })} width="120px" placeholder="2019" />
                  </Row>
                  <div style={{ height: 10 }} />
                  <Row>
                    <Field label="Oblíbený klub" value={p.favClub} onChange={(v) => u({ favClub: v })} />
                    <Field label="Oblíbený hráč" value={p.favPlayer} onChange={(v) => u({ favPlayer: v })} />
                  </Row>
                </div>
              )}
            />
          </>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- ZÁPASY
export function Zapasy() {
  const { teams } = useData();
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, teams.length - 1);
  const t = teams[idx] || teams[0];
  const updateTeam = (patch) => set('teams', teams.map((tm, i) => (i === idx ? { ...tm, ...patch } : tm)));

  const nm = t.nextMatch || {};
  const md = t.matchDetail || {};
  const lm = t.lastMatch || {};
  const home = nm.home || {}; const away = nm.away || {};
  const mdHome = md.home || {}; const mdAway = md.away || {}; const score = md.score || {};
  const updNm = (patch) => updateTeam({ nextMatch: { ...nm, ...patch } });
  const updMd = (patch) => updateTeam({ matchDetail: { ...md, ...patch } });
  const updLm = (patch) => updateTeam({ lastMatch: { ...lm, ...patch } });
  const isA = t.id === 'muziA';

  return (
    <div>
      <SectionHead title="Zápasy" desc="Vyber tým — příští zápas, poslední zápas se střelci a tabulka" count={teams.length} />
      <TeamSwitcher teams={teams} activeIndex={idx} onSelect={setSel} badge={null} />

      {/* PŘÍŠTÍ ZÁPAS */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Příští zápas</div>
        <Row>
          <Field label="Domácí — zkratka" value={home.short} onChange={(v) => updNm({ home: { ...home, short: v } })} width="140px" />
          <Field label="Domácí — název" value={home.name} onChange={(v) => updNm({ home: { ...home, name: v } })} />
          <Field label="Hosté — zkratka" value={away.short} onChange={(v) => updNm({ away: { ...away, short: v } })} width="140px" />
          <Field label="Hosté — název" value={away.name} onChange={(v) => updNm({ away: { ...away, name: v } })} />
        </Row>
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Kdy / soutěž (text)" value={nm.when} onChange={(v) => updNm({ when: v })} placeholder="NE 16:30 · III. TŘÍDA" />
          <Field label="Datum a čas (pro odpočet)" type="datetime-local" value={nm.dateISO} onChange={(v) => updNm({ dateISO: v })} width="230px" />
          <Field label="Kde se hraje" value={nm.venue} onChange={(v) => updNm({ venue: v })} placeholder="Areál Kunice" />
        </Row>
      </Card>

      {/* POSLEDNÍ ZÁPAS + STŘELCI */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Poslední zápas + střelci</div>
        <Row>
          <Field label="Soupeř" value={lm.opp} onChange={(v) => updLm({ opp: v })} />
          <Field label="Skóre" value={lm.score} onChange={(v) => updLm({ score: v })} width="120px" placeholder="3:1" />
          <Select label="Výsledek" value={lm.result} onChange={(v) => updLm({ result: v })} options={RESULT_OPTS} width="160px" />
        </Row>
        <div style={{ height: 10 }} />
        <Field label="Střelci" value={lm.scorers} onChange={(v) => updLm({ scorers: v })} placeholder="A. Pokorný, J. Svoboda, F. Veselý" />
      </Card>

      {/* TABULKA */}
      <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Tabulka soutěže</div>
      <ListEditor
        items={t.table || []}
        onChange={(v) => updateTeam({ table: v })}
        itemTitle={(r) => `${r.pos}. ${r.team} — ${r.pts} b.`}
        newItem={{ pos: (t.table ? t.table.length : 0) + 1, team: 'Tým', gp: 0, pts: 0, me: false }}
        addLabel="+ Přidat řádek tabulky"
        renderItem={(r, u) => (
          <Row>
            <Field label="Pozice" type="number" value={r.pos} onChange={(v) => u({ pos: Number(v) || 0 })} width="90px" />
            <Field label="Tým" value={r.team} onChange={(v) => u({ team: v })} />
            <Field label="Záp." type="number" value={r.gp} onChange={(v) => u({ gp: Number(v) || 0 })} width="90px" />
            <Field label="Body" type="number" value={r.pts} onChange={(v) => u({ pts: Number(v) || 0 })} width="90px" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#3a3f47', paddingBottom: 10 }}>
              <input type="checkbox" checked={!!r.me} onChange={(e) => u({ me: e.target.checked })} /> náš tým
            </label>
          </Row>
        )}
      />

      {/* POUZE A-TÝM: homepage výsledky + detailní průběh zápasu */}
      {isA && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '24px 0 10px' }}>Poslední výsledky <span style={{ fontWeight: 600, fontSize: 12, color: '#9AA1AC' }}>(blok na homepage)</span></div>
          <ListEditor
            items={t.results || []}
            onChange={(v) => updateTeam({ results: v })}
            itemTitle={(r) => `${r.opp} ${r.score}`}
            newItem={{ wld: 'V', opp: 'Soupeř', score: '0:0' }}
            addLabel="+ Přidat výsledek"
            renderItem={(r, u) => (
              <Row>
                <Select label="Výsledek" value={r.wld} onChange={(v) => u({ wld: v })} options={WLD_OPTS} width="150px" />
                <Field label="Soupeř" value={r.opp} onChange={(v) => u({ opp: v })} />
                <Field label="Skóre" value={r.score} onChange={(v) => u({ score: v })} width="120px" />
              </Row>
            )}
          />

          <div style={{ fontWeight: 800, fontSize: 15, margin: '24px 0 6px' }}>Průběh zápasu (detail A-týmu)</div>
          <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, marginBottom: 10 }}>Detailní časová osa s góly a kartami — zobrazí se v /zapasy u A-týmu. (Statistiky držení/střel jsme záměrně vynechali.)</div>
          <Card style={{ marginBottom: 16 }}>
            <Field label="Hlavička" value={md.header} onChange={(v) => updMd({ header: v })} />
            <div style={{ height: 10 }} />
            <Row>
              <Field label="Kdy / místo" value={md.when} onChange={(v) => updMd({ when: v })} />
              <Field label="Domácí" value={mdHome.name} onChange={(v) => updMd({ home: { ...mdHome, name: v } })} />
              <Field label="Hosté" value={mdAway.name} onChange={(v) => updMd({ away: { ...mdAway, name: v } })} />
            </Row>
            <div style={{ height: 10 }} />
            <Row>
              <Field label="Skóre domácí" type="number" value={score.home} onChange={(v) => updMd({ score: { ...score, home: Number(v) || 0 } })} width="130px" />
              <Field label="Skóre hosté" type="number" value={score.away} onChange={(v) => updMd({ score: { ...score, away: Number(v) || 0 } })} width="130px" />
              <Select label="Výsledek" value={md.result} onChange={(v) => updMd({ result: v })} options={RESULT_OPTS} width="160px" />
            </Row>
          </Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9AA1AC', margin: '4px 0 8px' }}>Události zápasu</div>
          <ListEditor
            items={md.events || []}
            onChange={(v) => updMd({ events: v })}
            itemTitle={(e) => `${e.min}' ${e.player}`}
            newItem={{ min: 0, type: 'goal', team: 'h', player: '', note: '' }}
            addLabel="+ Přidat událost"
            renderItem={(e, u) => (
              <Row>
                <Field label="Min." type="number" value={e.min} onChange={(v) => u({ min: Number(v) || 0 })} width="80px" />
                <Select label="Typ" value={e.type} onChange={(v) => u({ type: v })} options={EV_TYPE_OPTS} width="150px" />
                <Select label="Tým" value={e.team} onChange={(v) => u({ team: v })} options={EV_TEAM_OPTS} width="130px" />
                <Field label="Hráč" value={e.player} onChange={(v) => u({ player: v })} />
                <Field label="Pozn." value={e.note} onChange={(v) => u({ note: v })} width="100px" />
              </Row>
            )}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- NOVINKY
export function Novinky() {
  const { news } = useData();
  return (
    <div>
      <SectionHead title="Novinky" desc="Fotka, pár vět, datum — a hotovo. Zobrazí se na webu i na homepage (nejnovější nahoře)." count={news.length} />
      <ListEditor
        items={news}
        onChange={(v) => set('news', v)}
        itemTitle={(n) => n.title || 'Nová novinka'}
        newItem={{ category: 'Klub', title: 'Nová novinka', text: '', date: '', image: '' }}
        addLabel="+ Přidat novinku"
        renderItem={(n, u) => (
          <div>
            <ImageField label="Fotka" value={n.image} onChange={(v) => u({ image: v })} />
            <div style={{ height: 14 }} />
            <Row>
              <Field label="Titulek" value={n.title} onChange={(v) => u({ title: v })} />
              <Select label="Kategorie" value={n.category} onChange={(v) => u({ category: v })} options={['Áčko', 'Mládež', 'Klub', 'Akce']} width="160px" />
              <Field label="Datum" value={n.date} onChange={(v) => u({ date: v })} width="150px" placeholder="14. 6. 2026" />
            </Row>
            <div style={{ height: 12 }} />
            <Field label="Text (pár vět)" textarea rows={3} value={n.text} onChange={(v) => u({ text: v })} />
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------- KEMPY
export function Kempy() {
  const { campDetail } = useData();
  const upd = (patch) => set('campDetail', { ...campDetail, ...patch });
  const c = campDetail;
  return (
    <div>
      <SectionHead title="Kempy" desc="Letní kemp — informace, program, FAQ" />
      <Card style={{ marginBottom: 16 }}>
        <Field label="Odznak (badge)" value={c.badge} onChange={(v) => upd({ badge: v })} />
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Titulek" value={c.title} onChange={(v) => upd({ title: v })} />
          <Field label="Cena" value={c.price} onChange={(v) => upd({ price: v })} width="140px" />
          <Field label="Termín" value={c.term} onChange={(v) => upd({ term: v })} />
        </Row>
        <div style={{ height: 10 }} />
        <Field label="Úvodní text" textarea rows={2} value={c.lead} onChange={(v) => upd({ lead: v })} />
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Obsazeno (počet)" type="number" value={c.capacity.taken} onChange={(v) => upd({ capacity: { ...c.capacity, taken: Number(v) || 0 } })} width="160px" />
          <Field label="Kapacita celkem" type="number" value={c.capacity.total} onChange={(v) => upd({ capacity: { ...c.capacity, total: Number(v) || 0 } })} width="160px" />
          <Field label="Start (ISO pro odpočet)" value={c.startISO} onChange={(v) => upd({ startISO: v })} />
        </Row>
      </Card>

      <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Co je v ceně</div>
      <StringListEditor items={c.includes} onChange={(v) => upd({ includes: v })} placeholder="položka" columns={2} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Výhody kempu</div>
      <ListEditor items={c.perks} onChange={(v) => upd({ perks: v })} itemTitle={(p) => p.title} newItem={{ emoji: '🏆', title: '', text: '' }} addLabel="+ Přidat výhodu"
        renderItem={(p, u) => (<Row><Field label="Emoji" value={p.emoji} onChange={(v) => u({ emoji: v })} width="90px" /><Field label="Název" value={p.title} onChange={(v) => u({ title: v })} /><Field label="Text" value={p.text} onChange={(v) => u({ text: v })} /></Row>)} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Denní program</div>
      <ListEditor items={c.program} onChange={(v) => upd({ program: v })} itemTitle={(p) => `${p.time} ${p.title}`} newItem={{ time: '00:00', title: '' }} addLabel="+ Přidat bod programu"
        renderItem={(p, u) => (<Row><Field label="Čas" value={p.time} onChange={(v) => u({ time: v })} width="120px" /><Field label="Název" value={p.title} onChange={(v) => u({ title: v })} /></Row>)} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Trenéři kempu</div>
      <ListEditor items={c.coaches} onChange={(v) => upd({ coaches: v })} itemTitle={(p) => p.name} newItem={{ name: '', role: 'Trenér', img: 'dusk' }} addLabel="+ Přidat trenéra"
        renderItem={(p, u) => (<Row><Field label="Jméno" value={p.name} onChange={(v) => u({ name: v })} /><Field label="Role" value={p.role} onChange={(v) => u({ role: v })} /><Field label="Obrázek" value={p.img} onChange={(v) => u({ img: v })} width="120px" /></Row>)} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Časté dotazy</div>
      <ListEditor items={c.faq} onChange={(v) => upd({ faq: v })} itemTitle={(f) => f.q} newItem={{ q: '', a: '' }} addLabel="+ Přidat dotaz"
        renderItem={(f, u) => (<div><Field label="Otázka" value={f.q} onChange={(v) => u({ q: v })} /><div style={{ height: 8 }} /><Field label="Odpověď" textarea rows={2} value={f.a} onChange={(v) => u({ a: v })} /></div>)} />
    </div>
  );
}

// ---------------------------------------------------------------- PRONÁJEM
const RES_STATUS = ['nová', 'potvrzená', 'zamítnutá'];
const RES_SOURCE = ['web', 'telefon', 'osobně'];
function statusPill(status) {
  const map = { 'nová': { background: '#FBEAEC', color: '#C1121F' }, 'potvrzená': { background: '#EAF6EE', color: '#1F8A4C' }, 'zamítnutá': { background: '#F4F5F7', color: '#9AA1AC' } };
  return { fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, marginLeft: 6, textTransform: 'uppercase', ...(map[status] || map['nová']) };
}

function SubTabs({ tab, setTab, tabs }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s', border: active ? '1px solid #C1121F' : '1px solid #ECEEF1', background: active ? '#C1121F' : '#fff', color: active ? '#fff' : '#3a3f47' }}>
            {t.label}
            {t.badge != null && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: active ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: active ? '#fff' : '#9AA1AC' }}>{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

function RezervaceTable({ reservations, areaOptions }) {
  const [open, setOpen] = useState(null);
  const update = (i, patch) => set('reservations', reservations.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i) => { if (confirm('Opravdu smazat tuto rezervaci?')) { set('reservations', reservations.filter((_, idx) => idx !== i)); setOpen(null); } };
  const add = () => { set('reservations', [{ name: '', contact: '', area: areaOptions[0] || '', date: '', time: '', note: '', source: 'telefon', status: 'nová' }, ...reservations]); setOpen(0); };

  const cols = '1.5fr 1.1fr 1.1fr 90px 112px 92px';
  const cell = { padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', minWidth: 0 };

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ECEEF1', padding: '12px 16px', fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
        Rezervace odeslané z webu sem dorazí se stavem <b>nová</b>. Klikni na řádek pro detail a úpravu. Vlastní rezervaci (když někdo zavolá / přijde osobně) přidáš tlačítkem dole.
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 680 }}>
            <div style={{ display: 'grid', gridTemplateColumns: cols, background: '#FAFBFC', borderBottom: '1px solid #ECEEF1', fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC' }}>
              <div style={cell}>JMÉNO / FIRMA</div>
              <div style={cell}>PLOCHA</div>
              <div style={cell}>TERMÍN</div>
              <div style={cell}>ZDROJ</div>
              <div style={cell}>STAV</div>
              <div style={cell} />
            </div>
            {reservations.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Zatím žádné rezervace.</div>}
            {reservations.map((r, i) => (
              <Fragment key={i}>
                <div onClick={() => setOpen(open === i ? null : i)} style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '1px solid #F2F3F5', cursor: 'pointer', background: open === i ? '#FBF6F6' : '#fff', alignItems: 'center' }}>
                  <div style={{ ...cell, fontWeight: 700, color: '#1E1E1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || <span style={{ color: '#C7CCD3' }}>Bez jména</span>}</div>
                  <div style={{ ...cell, color: '#3a3f47', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.area || '—'}</div>
                  <div style={{ ...cell, color: '#3a3f47' }}>{[r.date, r.time].filter(Boolean).join(' ') || '—'}</div>
                  <div style={{ ...cell, color: '#9AA1AC', fontWeight: 600 }}>{r.source}</div>
                  <div style={cell}><span style={statusPill(r.status)}>{r.status}</span></div>
                  <div style={{ ...cell, justifyContent: 'flex-end', color: '#C1121F', fontWeight: 700, fontSize: 12 }}>Detail {open === i ? '▲' : '▾'}</div>
                </div>
                {open === i && (
                  <div style={{ padding: 18, background: '#FBF6F6', borderBottom: '1px solid #F2F3F5' }}>
                    <Row>
                      <Field label="Jméno / firma" value={r.name} onChange={(v) => update(i, { name: v })} />
                      <Field label="Kontakt (tel. / e-mail)" value={r.contact} onChange={(v) => update(i, { contact: v })} />
                    </Row>
                    <div style={{ height: 10 }} />
                    <Row>
                      <Select label="Plocha" value={r.area} onChange={(v) => update(i, { area: v })} options={areaOptions.length ? areaOptions : ['—']} />
                      <Field label="Datum" value={r.date} onChange={(v) => update(i, { date: v })} width="150px" placeholder="22. 6. 2026" />
                      <Field label="Čas" value={r.time} onChange={(v) => update(i, { time: v })} width="110px" placeholder="18:00" />
                    </Row>
                    <div style={{ height: 10 }} />
                    <Row>
                      <Select label="Zdroj" value={r.source} onChange={(v) => update(i, { source: v })} options={RES_SOURCE} width="150px" />
                      <Select label="Stav" value={r.status} onChange={(v) => update(i, { status: v })} options={RES_STATUS} width="170px" />
                    </Row>
                    <div style={{ height: 10 }} />
                    <Field label="Poznámka" textarea rows={2} value={r.note} onChange={(v) => update(i, { note: v })} />
                    <div style={{ marginTop: 12 }}><Btn kind="danger" small onClick={() => remove(i)}>Smazat rezervaci</Btn></div>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 14 }}><Btn kind="primary" onClick={add}>+ Nová rezervace (telefon / osobně)</Btn></div>
    </div>
  );
}

export function Pronajem() {
  const d = useData();
  const [tab, setTab] = useState('rezervace');
  const busyStr = d.rentalBusyDays.map(String);
  const areaOptions = d.rentalPlans.map((p) => p.name);
  const newCount = d.reservations.filter((r) => r.status === 'nová').length;

  return (
    <div>
      <SectionHead title="Pronájem areálu" desc="Správa rezervací a nastavení pronajímaných ploch" />
      <SubTabs tab={tab} setTab={setTab} tabs={[
        { id: 'rezervace', label: 'Rezervace', badge: newCount },
        { id: 'plochy', label: 'Plochy & ceník' },
      ]} />

      {tab === 'rezervace' ? (
        <RezervaceTable reservations={d.reservations} areaOptions={areaOptions} />
      ) : (
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 10px' }}>Plochy a ceník (/pronajem)</div>
          <ListEditor items={d.rentalPlans} onChange={(v) => set('rentalPlans', v)} itemTitle={(p) => `${p.name} — ${p.price}`}
            newItem={{ name: 'Nová plocha', spec: '', price: '0 Kč', status: 'VOLNO', img: 'char', features: [] }} addLabel="+ Přidat plochu"
            renderItem={(p, u) => (
              <div>
                <Row>
                  <Field label="Název" value={p.name} onChange={(v) => u({ name: v })} />
                  <Field label="Specifikace" value={p.spec} onChange={(v) => u({ spec: v })} />
                  <Field label="Cena / hod" value={p.price} onChange={(v) => u({ price: v })} width="130px" />
                </Row>
                <div style={{ height: 10 }} />
                <Row>
                  <Select label="Stav" value={p.status} onChange={(v) => u({ status: v })} options={['VOLNO', 'OBSAZENO']} width="200px" />
                  <Field label="Obrázek" value={p.img} onChange={(v) => u({ img: v })} width="130px" />
                </Row>
                <div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, color: '#9AA1AC' }}>VYBAVENÍ</div>
                <div style={{ height: 6 }} />
                <StringListEditor items={p.features} onChange={(v) => u({ features: v })} placeholder="prvek" columns={2} />
              </div>
            )} />

          <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 6px' }}>Obsazené dny v kalendáři (čísla dnů)</div>
          <Card>
            <StringListEditor items={busyStr} onChange={(v) => set('rentalBusyDays', v.map((x) => Number(x) || 0).filter(Boolean))} placeholder="den" columns={4} />
          </Card>

          <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Časté dotazy (pronájem)</div>
          <ListEditor items={d.rentalFaq} onChange={(v) => set('rentalFaq', v)} itemTitle={(f) => f.q} newItem={{ q: '', a: '' }} addLabel="+ Přidat dotaz"
            renderItem={(f, u) => (<div><Field label="Otázka" value={f.q} onChange={(v) => u({ q: v })} /><div style={{ height: 8 }} /><Field label="Odpověď" textarea rows={2} value={f.a} onChange={(v) => u({ a: v })} /></div>)} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- KONTAKT
export function Kontakt() {
  const d = useData();
  return (
    <div>
      <SectionHead title="Kontakt" desc="Lidé a rychlé kontakty na webu" />
      <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 10px' }}>Klubové kontakty (lidé)</div>
      <ListEditor items={d.people} onChange={(v) => set('people', v)} itemTitle={(p) => p.name} newItem={{ name: '', role: '', ini: '', bg: '#C1121F', phone: '', email: '' }} addLabel="+ Přidat osobu"
        renderItem={(p, u) => (
          <div>
            <Row>
              <Field label="Jméno" value={p.name} onChange={(v) => u({ name: v })} />
              <Field label="Role" value={p.role} onChange={(v) => u({ role: v })} />
              <Field label="Iniciály" value={p.ini} onChange={(v) => u({ ini: v })} width="100px" />
              <Field label="Barva" value={p.bg} onChange={(v) => u({ bg: v })} width="120px" />
            </Row>
            <div style={{ height: 10 }} />
            <Row>
              <Field label="Telefon" value={p.phone} onChange={(v) => u({ phone: v })} />
              <Field label="E-mail" value={p.email} onChange={(v) => u({ email: v })} />
            </Row>
          </div>
        )} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Rychlé kontakty (dlaždice)</div>
      <ListEditor items={d.quickActions} onChange={(v) => set('quickActions', v)} itemTitle={(q) => q.title} newItem={{ emoji: '📞', title: '', value: '' }} addLabel="+ Přidat dlaždici"
        renderItem={(q, u) => (<Row><Field label="Emoji" value={q.emoji} onChange={(v) => u({ emoji: v })} width="90px" /><Field label="Titulek" value={q.title} onChange={(v) => u({ title: v })} /><Field label="Hodnota" value={q.value} onChange={(v) => u({ value: v })} /></Row>)} />
    </div>
  );
}

// ---------------------------------------------------------------- PARTNEŘI
export function Partneri() {
  const { sponsors } = useData();
  return (
    <div>
      <SectionHead title="Partneři" desc="Loga / názvy partnerů klubu" count={sponsors.length} />
      <Card>
        <StringListEditor items={sponsors} onChange={(v) => set('sponsors', v)} placeholder="partner" columns={2} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- REGISTRACE
export function Registrace() {
  const d = useData();
  return (
    <div>
      <SectionHead title="Registrace" desc="Nové přihlášky / registrace členů" count={d.cmsRegistrations.length} />
      <ListEditor items={d.cmsRegistrations} onChange={(v) => set('cmsRegistrations', v)} itemTitle={(r) => `${r.name} · ${r.team}`}
        newItem={{ name: '', team: '', ini: '', bg: '#C1121F', tag: 'Nová', tg: 'new' }} addLabel="+ Přidat registraci"
        renderItem={(r, u) => (
          <div>
            <Row>
              <Field label="Jméno" value={r.name} onChange={(v) => u({ name: v })} />
              <Field label="Tým / kategorie" value={r.team} onChange={(v) => u({ team: v })} />
              <Field label="Iniciály" value={r.ini} onChange={(v) => u({ ini: v })} width="100px" />
            </Row>
            <div style={{ height: 10 }} />
            <Row>
              <Field label="Štítek" value={r.tag} onChange={(v) => u({ tag: v })} width="140px" />
              <Field label="Stav (new/wait/ok)" value={r.tg} onChange={(v) => u({ tg: v })} width="160px" />
              <Field label="Barva" value={r.bg} onChange={(v) => u({ bg: v })} width="120px" />
            </Row>
          </div>
        )} />
    </div>
  );
}
