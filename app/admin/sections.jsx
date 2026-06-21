'use client';
import { useData, setSection } from '@/lib/store';
import { Field, Row, Btn, Card, SectionHead, ListEditor, StringListEditor } from './adminui';

const IMG_HINT = 'Pozadí (gradient): dusk · slate · sunset · char · red · cool · warm · ember';
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
  return (
    <div>
      <SectionHead title="Týmy" desc="Soupisky, realizační týmy a soutěže — vše z webu" count={teams.length} />
      <ListEditor
        items={teams}
        onChange={(v) => set('teams', v)}
        itemTitle={(t) => `${t.name} · ${t.players.length} hráčů · ${t.coaches.length} trenérů`}
        newItem={() => ({ id: 'novy-tym-' + Date.now(), name: 'Nový tým', cat: 'Mládež · —', short: '—', comp: 'Soutěž', contact: '', coaches: [], players: [] })}
        addLabel="+ Přidat tým"
        renderItem={(t, update) => (
          <div>
            <Row>
              <Field label="Název" value={t.name} onChange={(v) => update({ name: v })} />
              <Field label="Kategorie" value={t.cat} onChange={(v) => update({ cat: v })} />
              <Field label="Zkratka" value={t.short} onChange={(v) => update({ short: v })} width="120px" />
            </Row>
            <div style={{ height: 10 }} />
            <Row>
              <Field label="Soutěž" value={t.comp} onChange={(v) => update({ comp: v })} />
              <Field label="Kontakt" value={t.contact} onChange={(v) => update({ contact: v })} placeholder="nepovinné" />
              <Field label="ID (URL)" value={t.id} onChange={(v) => update({ id: v })} width="160px" />
            </Row>
            <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.4px' }}>REALIZAČNÍ TÝM</div>
            <div style={{ height: 8 }} />
            <ListEditor
              items={t.coaches}
              onChange={(v) => update({ coaches: v })}
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
            <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.4px' }}>SOUPISKA ({t.players.length})</div>
            <div style={{ height: 8 }} />
            <StringListEditor items={t.players} onChange={(v) => update({ players: v })} placeholder="hráč" columns={2} />
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------- ZÁPASY
export function Zapasy() {
  const d = useData();
  const nm = d.nextMatch;
  const updNm = (patch) => set('nextMatch', { ...nm, ...patch });
  const md = d.matchDetail;
  const updMd = (patch) => set('matchDetail', { ...md, ...patch });
  return (
    <div>
      <SectionHead title="Zápasy" desc="Příští zápas, výsledky, tabulka a detail odehraného zápasu" />

      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Příští zápas (homepage)</div>
        <Row>
          <Field label="Domácí — zkratka" value={nm.home.short} onChange={(v) => updNm({ home: { ...nm.home, short: v } })} width="140px" />
          <Field label="Domácí — název" value={nm.home.name} onChange={(v) => updNm({ home: { ...nm.home, name: v } })} />
          <Field label="Hosté — zkratka" value={nm.away.short} onChange={(v) => updNm({ away: { ...nm.away, short: v } })} width="140px" />
          <Field label="Hosté — název" value={nm.away.name} onChange={(v) => updNm({ away: { ...nm.away, name: v } })} />
        </Row>
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Kdy / soutěž" value={nm.when} onChange={(v) => updNm({ when: v })} />
          <Field label="Místo" value={nm.venue} onChange={(v) => updNm({ venue: v })} />
        </Row>
      </Card>

      <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Poslední výsledky</div>
      <ListEditor
        items={d.results}
        onChange={(v) => set('results', v)}
        itemTitle={(r) => `${r.opp} ${r.score}`}
        newItem={{ wld: 'V', opp: 'Soupeř', score: '0:0' }}
        addLabel="+ Přidat výsledek"
        renderItem={(r, u) => (
          <Row>
            <Field label="V / R / P" value={r.wld} onChange={(v) => u({ wld: v.toUpperCase().slice(0, 1) })} width="100px" />
            <Field label="Soupeř" value={r.opp} onChange={(v) => u({ opp: v })} />
            <Field label="Skóre" value={r.score} onChange={(v) => u({ score: v })} width="120px" />
          </Row>
        )}
      />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Tabulka soutěže</div>
      <ListEditor
        items={d.leagueTable}
        onChange={(v) => set('leagueTable', v)}
        itemTitle={(t) => `${t.pos}. ${t.team} — ${t.pts} b.`}
        newItem={(items) => ({ pos: (d.leagueTable.length + 1), team: 'Tým', gp: 0, pts: 0, me: false })}
        addLabel="+ Přidat řádek tabulky"
        renderItem={(t, u) => (
          <Row>
            <Field label="Pozice" type="number" value={t.pos} onChange={(v) => u({ pos: Number(v) || 0 })} width="90px" />
            <Field label="Tým" value={t.team} onChange={(v) => u({ team: v })} />
            <Field label="Záp." type="number" value={t.gp} onChange={(v) => u({ gp: Number(v) || 0 })} width="90px" />
            <Field label="Body" type="number" value={t.pts} onChange={(v) => u({ pts: Number(v) || 0 })} width="90px" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#3a3f47', paddingBottom: 10 }}>
              <input type="checkbox" checked={!!t.me} onChange={(e) => u({ me: e.target.checked })} /> náš tým
            </label>
          </Row>
        )}
      />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Detail odehraného zápasu (/zapasy)</div>
      <Card style={{ marginBottom: 16 }}>
        <Row>
          <Field label="Hlavička" value={md.header} onChange={(v) => updMd({ header: v })} />
        </Row>
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Kdy / místo" value={md.when} onChange={(v) => updMd({ when: v })} />
          <Field label="Domácí" value={md.home.name} onChange={(v) => updMd({ home: { ...md.home, name: v } })} />
          <Field label="Hosté" value={md.away.name} onChange={(v) => updMd({ away: { ...md.away, name: v } })} />
        </Row>
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Skóre domácí" type="number" value={md.score.home} onChange={(v) => updMd({ score: { ...md.score, home: Number(v) || 0 } })} width="130px" />
          <Field label="Skóre hosté" type="number" value={md.score.away} onChange={(v) => updMd({ score: { ...md.score, away: Number(v) || 0 } })} width="130px" />
          <Field label="Výsledek (popis)" value={md.result} onChange={(v) => updMd({ result: v })} width="160px" />
        </Row>
      </Card>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#9AA1AC', margin: '4px 0 8px' }}>Události zápasu (typ: goal / yellow / red · tým: h / a)</div>
      <ListEditor
        items={md.events}
        onChange={(v) => updMd({ events: v })}
        itemTitle={(e) => `${e.min}' ${e.player}`}
        newItem={{ min: 0, type: 'goal', team: 'h', player: '', note: '' }}
        addLabel="+ Přidat událost"
        renderItem={(e, u) => (
          <Row>
            <Field label="Min." type="number" value={e.min} onChange={(v) => u({ min: Number(v) || 0 })} width="80px" />
            <Field label="Typ" value={e.type} onChange={(v) => u({ type: v })} width="110px" />
            <Field label="Tým (h/a)" value={e.team} onChange={(v) => u({ team: v })} width="100px" />
            <Field label="Hráč" value={e.player} onChange={(v) => u({ player: v })} />
            <Field label="Pozn." value={e.note} onChange={(v) => u({ note: v })} width="100px" />
          </Row>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------- NOVINKY
export function Novinky() {
  const d = useData();
  return (
    <div>
      <SectionHead title="Novinky" desc="Články magazínu a novinky na homepage" count={d.articles.length} />
      <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 10px' }}>Magazín — články (/novinky)</div>
      <ListEditor
        items={d.articles}
        onChange={(v) => set('articles', v)}
        itemTitle={(a) => a.title}
        newItem={{ cat: 'KLUB', _c: 'Klub', title: 'Nový článek', excerpt: '', author: '', authorIni: '', authorBg: '#C1121F', date: '', read: '2 min', img: 'slate' }}
        addLabel="+ Přidat článek"
        renderItem={(a, u) => (
          <div>
            <Row>
              <Field label="Kategorie (štítek)" value={a.cat} onChange={(v) => u({ cat: v })} width="160px" />
              <Field label="Filtr kategorie" value={a._c} onChange={(v) => u({ _c: v })} width="150px" placeholder="Áčko/Mládež/Klub/Akce" />
              <Field label="Datum" value={a.date} onChange={(v) => u({ date: v })} width="150px" />
              <Field label="Čtení" value={a.read} onChange={(v) => u({ read: v })} width="110px" />
            </Row>
            <div style={{ height: 10 }} />
            <Field label="Titulek" value={a.title} onChange={(v) => u({ title: v })} />
            <div style={{ height: 10 }} />
            <Field label="Perex" textarea rows={2} value={a.excerpt} onChange={(v) => u({ excerpt: v })} />
            <div style={{ height: 10 }} />
            <Row>
              <Field label="Autor" value={a.author} onChange={(v) => u({ author: v })} />
              <Field label="Iniciály" value={a.authorIni} onChange={(v) => u({ authorIni: v })} width="110px" />
              <Field label="Barva autora" value={a.authorBg} onChange={(v) => u({ authorBg: v })} width="140px" />
              <Field label="Obrázek" value={a.img} onChange={(v) => u({ img: v })} width="130px" />
            </Row>
            <div style={{ fontSize: 11, color: '#B7BCC4', marginTop: 6 }}>{IMG_HINT}</div>
          </div>
        )}
      />
      <div style={{ fontWeight: 800, fontSize: 15, margin: '22px 0 10px' }}>Novinky na homepage (boční výpis)</div>
      <ListEditor
        items={d.homeNews}
        onChange={(v) => set('homeNews', v)}
        itemTitle={(n) => n.title}
        newItem={{ tag: 'KLUB', title: 'Nová novinka', date: '', img: 'slate' }}
        addLabel="+ Přidat novinku"
        renderItem={(n, u) => (
          <Row>
            <Field label="Štítek" value={n.tag} onChange={(v) => u({ tag: v })} width="150px" />
            <Field label="Titulek" value={n.title} onChange={(v) => u({ title: v })} />
            <Field label="Datum" value={n.date} onChange={(v) => u({ date: v })} width="150px" />
            <Field label="Obrázek" value={n.img} onChange={(v) => u({ img: v })} width="120px" />
          </Row>
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
      <ListEditor items={c.perks} onChange={(v) => upd({ perks: v })} itemTitle={(p) => p.title} newItem={{ emoji: '⭐', title: '', text: '' }} addLabel="+ Přidat výhodu"
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
export function Pronajem() {
  const d = useData();
  const busyStr = d.rentalBusyDays.map(String);
  return (
    <div>
      <SectionHead title="Pronájem areálu" desc="Plochy, ceník, obsazené dny, FAQ a žádosti" />
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
              <Field label="Stav (VOLNO/OBSAZENO)" value={p.status} onChange={(v) => u({ status: v })} width="200px" />
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

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Žádosti o pronájem (dashboard)</div>
      <ListEditor items={d.cmsRentalRequests} onChange={(v) => set('cmsRentalRequests', v)} itemTitle={(r) => r.who} newItem={{ who: '', what: '' }} addLabel="+ Přidat žádost"
        renderItem={(r, u) => (<Row><Field label="Kdo" value={r.who} onChange={(v) => u({ who: v })} /><Field label="Co / termín" value={r.what} onChange={(v) => u({ what: v })} /></Row>)} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Časté dotazy (pronájem)</div>
      <ListEditor items={d.rentalFaq} onChange={(v) => set('rentalFaq', v)} itemTitle={(f) => f.q} newItem={{ q: '', a: '' }} addLabel="+ Přidat dotaz"
        renderItem={(f, u) => (<div><Field label="Otázka" value={f.q} onChange={(v) => u({ q: v })} /><div style={{ height: 8 }} /><Field label="Odpověď" textarea rows={2} value={f.a} onChange={(v) => u({ a: v })} /></div>)} />
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
