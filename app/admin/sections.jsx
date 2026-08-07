'use client';
import { useState, useEffect, Fragment } from 'react';
import { useData, setSection, updateData, emptyCamp, emptyNews, slugify, emptySponsor, emptyGalleryItem, emptyReservation, emptyRegistration } from '@/lib/store';
import { czechDate, daySlots, occurrencesInRange, shiftDays, dateKey, toMinutes, REPEAT_LABELS, REPEAT_MODES } from '@/lib/rental';
import { matchWhenText, sortResults } from '@/lib/defaults';
import { reservationDecisionMail, registrationDecisionMail } from '@/lib/mail';
import { postFromResult } from '@/lib/social';
import { Field, Row, Btn, Card, SectionHead, ListEditor, StringListEditor, Select, TeamSwitcher, ImageField, Pokrocile, Prepinac, IkonaKos, IkonaTuzka, UdajeZakaznika, ZpravaZadateli, StavPosty } from './adminui';

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
          <Field label="Adresa pro mapu (Kontakt)" value={club.mapQuery} onChange={(v) => upd({ mapQuery: v })} placeholder="FK Kunice, Kunice 130, 251 63 Kunice" />
        </Row>
        <div style={{ height: 12 }} />
        <Field label="Popis (patička)" textarea value={club.description} onChange={(v) => upd({ description: v })} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- DOMŮ / TEXTY
const WHY_ICONS = [
  { value: 'star', label: 'Hvězda' },
  { value: 'home', label: 'Domeček' },
  { value: 'users', label: 'Lidé' },
  { value: 'ball', label: 'Míč' },
];

// dvojice „nadpis sekce" (eyebrow + titulek) na hlavní stránce
// Náhled textu, který se upravuje přímo na webu. V administraci se jen
// ukazuje, aby bylo vidět, co na webu je — měnit se má na jednom místě,
// ne na dvou.
function NaWebu({ polozky, odkaz = '/?upravy=1' }) {
  return (
    <div style={{ background: '#FAFBFC', border: '1px solid #ECEEF1', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 26px' }}>
        {polozky.filter((p) => p).map((p) => (
          <div key={p.label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC', textTransform: 'uppercase' }}>{p.label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: p.value ? '#1E1E1E' : '#C7CCD3', marginTop: 2, whiteSpace: 'pre-wrap' }}>{p.value || 'nevyplněno'}</div>
          </div>
        ))}
      </div>
      <a href={odkaz} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, fontWeight: 700, color: '#C1121F' }}>
        Upravit přímo na webu
      </a>
    </div>
  );
}

function SectionTexts({ label, value, onChange, extra }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>{label}</div>
      <NaWebu polozky={[
        { label: 'Malý nadpis nad', value: value.eyebrow },
        { label: 'Nadpis', value: value.title },
      ]} />
      {/* popisky tlačítek a jednotky se na webu upravit nedají, zůstávají tady */}
      {extra && <Pokrocile title="Texty tlačítek a popisky">{extra}</Pokrocile>}
    </Card>
  );
}

export function Domu() {
  const { homeTexts, whyCards, footer, gallery } = useData();
  const [tab, setTab] = useState('hero');
  const setHome = (patch) => set('homeTexts', { ...homeTexts, ...patch });
  const sec = (key) => (patch) => setHome({ [key]: { ...homeTexts[key], ...patch } });
  const setFooter = (patch) => set('footer', { ...footer, ...patch });
  const h = homeTexts.hero;

  return (
    <div>
      <SectionHead title="Domů / texty" desc="Texty na hlavní stránce a v patičce — hero, nadpisy sekcí, karty „Proč my“ a odkazy v patičce" />
      <SubTabs tab={tab} setTab={setTab} tabs={[
        { id: 'hero', label: 'Hero' },
        { id: 'sekce', label: 'Nadpisy sekcí' },
        { id: 'proc', label: 'Proč my', badge: whyCards.length },
        { id: 'galerie', label: 'Galerie', badge: gallery.filter((g) => g.image).length },
        { id: 'paticka', label: 'Patička' },
      ]} />

      {tab === 'hero' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <NaWebu polozky={[
              { label: 'Hlavní nadpis', value: h.title },
              { label: 'Psaný podtitulek', value: h.script },
              { label: 'Odstavec', value: h.perex },
            ]} />

            <Pokrocile title="Drobnosti">
              <Field label="Popisek u šipky dolů" value={h.scrollLabel} onChange={(v) => sec('hero')({ scrollLabel: v })} width="220px" />
            </Pokrocile>
          </Card>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Tlačítka v hero (první je červené)</div>
          <ListEditor
            items={h.ctas || []}
            onChange={(v) => sec('hero')({ ctas: v })}
            itemTitle={(c) => c.label || 'Nové tlačítko'}
            newItem={{ label: 'Nové tlačítko', href: '/' }}
            addLabel="+ Přidat tlačítko"
            renderItem={(c, u) => (
              <Row>
                <Field label="Text tlačítka" value={c.label} onChange={(v) => u({ label: v })} />
                <Field label="Odkaz" value={c.href} onChange={(v) => u({ href: v })} placeholder="/kontakt" />
              </Row>
            )}
          />
        </div>
      )}

      {tab === 'sekce' && (
        <div>
          <SectionTexts label="Match center (zápasy)" value={homeTexts.match} onChange={sec('match')} extra={
            <div>
              <Row>
                <Field label="Text odkazu" value={homeTexts.match.link} onChange={(v) => sec('match')({ link: v })} />
                <Field label="Popisek příštího zápasu" value={homeTexts.match.nextLabel} onChange={(v) => sec('match')({ nextLabel: v })} />
                <Field label="Tlačítko detailu" value={homeTexts.match.detailLink} onChange={(v) => sec('match')({ detailLink: v })} />
              </Row>
              <div style={{ height: 10 }} />
              <Row>
                <Field label="Nadpis výsledků" value={homeTexts.match.resultsTitle} onChange={(v) => sec('match')({ resultsTitle: v })} />
                <Field label="Nadpis tabulky" value={homeTexts.match.tableTitle} onChange={(v) => sec('match')({ tableTitle: v })} />
              </Row>
            </div>
          } />
          <SectionTexts label="Týmy" value={homeTexts.teams} onChange={sec('teams')} />
          <SectionTexts label="Proč my" value={homeTexts.why} onChange={sec('why')} />
          <SectionTexts label="Kempy" value={homeTexts.camps} onChange={sec('camps')} extra={
            <Field label="Text tlačítka u kempu" value={homeTexts.camps.ctaLabel} onChange={(v) => sec('camps')({ ctaLabel: v })} width="240px" />
          } />
          <SectionTexts label="Pronájem" value={homeTexts.rental} onChange={sec('rental')} extra={
            <Row>
              <Field label="Text odkazu" value={homeTexts.rental.link} onChange={(v) => sec('rental')({ link: v })} />
              <Field label="Jednotka u ceny" value={homeTexts.rental.unit} onChange={(v) => sec('rental')({ unit: v })} width="180px" />
            </Row>
          } />
          <SectionTexts label="Novinky" value={homeTexts.news} onChange={sec('news')} extra={
            <Field label="Text odkazu" value={homeTexts.news.link} onChange={(v) => sec('news')({ link: v })} width="240px" />
          } />
          <SectionTexts label="Galerie" value={homeTexts.gallery} onChange={sec('gallery')} />
          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>Partneři</div>
            <Field label="Nadpis nad logy partnerů" value={homeTexts.sponsors.title} onChange={(v) => sec('sponsors')({ title: v })} width="280px" />
          </Card>
        </div>
      )}

      {tab === 'proc' && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 10px' }}>Karty „Proč rodiče volí nás“</div>
          <ListEditor
            items={whyCards}
            onChange={(v) => set('whyCards', v)}
            itemTitle={(w) => w.title || 'Nová karta'}
            newItem={{ title: 'Nová karta', text: '', icon: 'star' }}
            addLabel="+ Přidat kartu"
            renderItem={(w, u) => (
              <div>
                <Row>
                  <Field label="Nadpis" value={w.title} onChange={(v) => u({ title: v })} />
                  <Select label="Ikona" value={w.icon} onChange={(v) => u({ icon: v })} options={WHY_ICONS} width="170px" />
                </Row>
                <div style={{ height: 10 }} />
                <Field label="Text" textarea rows={2} value={w.text} onChange={(v) => u({ text: v })} />
              </div>
            )}
          />
        </div>
      )}

      {tab === 'galerie' && (
        <div>
          
          <ListEditor
            items={gallery}
            onChange={(v) => set('gallery', v)}
            itemTitle={(g, i) => `Dlaždice ${i + 1}${i === 0 ? ' (velká)' : i === 3 || i === 6 ? ' (široká)' : ''}`}
            newItem={() => ({ ...emptyGalleryItem(), id: `foto-${Date.now()}` })}
            addLabel="Přidat fotku"
            renderItem={(g, u) => (
              <div>
                <ImageField label="Fotka" value={g.image} onChange={(v) => u({ image: v })} />
                <div style={{ height: 12 }} />
                <Field label="Popis pro čtečky (nepovinný)" value={g.alt} onChange={(v) => u({ alt: v })} placeholder="Áčko po vítězném zápase" />
              </div>
            )}
          />
        </div>
      )}

      {tab === 'paticka' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row>
              <Field label="Nadpis kontaktu" value={footer.contactTitle} onChange={(v) => setFooter({ contactTitle: v })} />
              <Field label="První řádek adresy" value={footer.contactLead} onChange={(v) => setFooter({ contactLead: v })} />
              <Field label="Popisek u mapy" value={footer.mapLabel} onChange={(v) => setFooter({ mapLabel: v })} />
            </Row>
            <div style={{ height: 12 }} />
            <Row>
              <Field label="Spodní řádek (copyright)" value={footer.copyright} onChange={(v) => setFooter({ copyright: v })} />
              <Field label="Claim vpravo dole" value={footer.claim} onChange={(v) => setFooter({ claim: v })} width="260px" />
            </Row>
            <div style={{ height: 12 }} />
            <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginBottom: 8 }}>Odkazy na sociální sítě — prázdné pole ikonu skryje.</div>
            <Row>
              <Field label="Instagram" value={footer.social.instagram} onChange={(v) => setFooter({ social: { ...footer.social, instagram: v } })} placeholder="https://instagram.com/…" />
              <Field label="Facebook" value={footer.social.facebook} onChange={(v) => setFooter({ social: { ...footer.social, facebook: v } })} placeholder="https://facebook.com/…" />
              <Field label="X / Twitter" value={footer.social.twitter} onChange={(v) => setFooter({ social: { ...footer.social, twitter: v } })} placeholder="https://x.com/…" />
            </Row>
          </Card>

          {[['columnA', 'První sloupec odkazů'], ['columnB', 'Druhý sloupec odkazů']].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 10px' }}>{label}</div>
              <Card style={{ marginBottom: 10 }}>
                <Field label="Nadpis sloupce" value={footer[key].title} onChange={(v) => setFooter({ [key]: { ...footer[key], title: v } })} width="240px" />
              </Card>
              <ListEditor
                items={footer[key].links || []}
                onChange={(v) => setFooter({ [key]: { ...footer[key], links: v } })}
                itemTitle={(l) => l.label || 'Nový odkaz'}
                newItem={{ label: 'Nový odkaz', href: '/' }}
                addLabel="+ Přidat odkaz"
                renderItem={(l, u) => (
                  <Row>
                    <Field label="Text" value={l.label} onChange={(v) => u({ label: v })} />
                    <Field label="Odkaz" value={l.href} onChange={(v) => u({ href: v })} placeholder="/tymy" />
                  </Row>
                )}
              />
            </div>
          ))}
        </div>
      )}
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
            <button key={tm.id} onClick={() => setSel(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s', border: active ? '1px solid #C1121F' : '1px solid #ECEEF1', background: active ? '#C1121F' : '#fff', color: active ? '#fff' : '#3a3f47' }}>
              {tm.name}
              <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 10, background: active ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: active ? '#fff' : '#9AA1AC' }}>{tm.players.length}</span>
            </button>
          );
        })}
        <button onClick={addTeam} style={{ fontSize: 13.5, fontWeight: 700, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', border: '1px dashed #C1121F', background: '#FBEAEC', color: '#C1121F' }}>+ Přidat tým</button>
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
        </Row>
        <div style={{ height: 14 }} />
        <ImageField label="Fotka týmu (karta na homepage)" value={t.photo} onChange={(v) => updateTeam({ photo: v })} />
        <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 6 }}>
          Bez nahrané fotky zůstane na kartě barevný přechod.
        </div>

        <Pokrocile hint="Adresa stránky týmu — měň jen když víš proč, staré odkazy přestanou fungovat.">
          <Field label="Adresa stránky (/tymy/…)" value={t.id} onChange={(v) => updateTeam({ id: v })} width="220px" />
        </Pokrocile>

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

        {/* U školičky (4–6 let) se soupiska nevede — na webu je místo ní výzva k náboru. */}
        {t.id === 'skolicka' ? null : (
          <>
            <div style={{ marginTop: 20, fontSize: 11, fontWeight: 800, color: '#9AA1AC', letterSpacing: '.4px' }}>SOUPISKA ({t.players.length})</div>
            <div style={{ height: 8 }} />
            <ListEditor
              items={t.players}
              onChange={(v) => updateTeam({ players: v })}
              itemTitle={(p) => `#${p.number || '?'}  ${p.name || 'Nový hráč'}${p.position ? ' · ' + p.position : ''}`}
              newItem={() => ({ name: '', number: t.players.length + 1, position: 'ZÁL', photo: '', birthdate: '' })}
              addLabel="+ Přidat hráče"
              renderItem={(p, u) => (
                <div>
                  <ImageField label="Fotka hráče" value={p.photo} onChange={(v) => u({ photo: v })} />
                  <div style={{ height: 12 }} />
                  <Row>
                    <Field label="Jméno a příjmení" value={p.name} onChange={(v) => u({ name: v })} />
                    <Field label="Číslo" type="number" value={p.number} onChange={(v) => u({ number: v })} width="100px" />
                    <Select label="Pozice" value={p.position} onChange={(v) => u({ position: v })} options={['GK', 'OBR', 'ZÁL', 'ÚTO', 'KŘÍ']} width="120px" />
                    <Field label="Datum narození" type="date" value={p.birthdate} onChange={(v) => u({ birthdate: v })} width="180px" />
                  </Row>
                  <div style={{ fontSize: 12, color: '#9AA1AC', marginTop: 8 }}>Datum narození se na webu nezobrazuje — počítá se z něj věk hráče.</div>
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
  const d = useData();
  const { teams, matchProposals, matchesSync } = d;
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState('rucne');
  const idx = Math.min(sel, teams.length - 1);
  const t = teams[idx] || teams[0];
  const updateTeam = (patch) => set('teams', teams.map((tm, i) => (i === idx ? { ...tm, ...patch } : tm)));
  const newProposals = matchProposals.filter((p) => p.status === 'nová');

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
      <SyncStav sync={matchesSync} />
      <SubTabs tab={tab} setTab={setTab} tabs={[
        { id: 'rucne', label: 'Ruční úprava' },
        { id: 'navrhy', label: 'Návrhy z fotbal.cz', badge: newProposals.length },
      ]} />

      {tab === 'navrhy' ? (
        <Navrhy proposals={matchProposals} teams={teams} />
      ) : (
      <>
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
        <div style={{ height: 10 }} />
        {/* Datum se zadává JEDNOU. Text pro web („NE 16:30 · III. TŘÍDA") se
            z data a soutěže složí sám — dřív se vyplňoval zvlášť a šlo tak
            snadno mít v odpočtu jiný termín než v popisku. */}
        <Row>
          <Field
            label="Datum a čas" type="datetime-local" width="230px"
            value={(nm.dateISO || '').slice(0, 16)}
            onChange={(v) => updNm({ dateISO: v, when: matchWhenText(v, nm.competition) })}
          />
          <Field
            label="Soutěž" value={nm.competition} placeholder="III. TŘÍDA"
            onChange={(v) => updNm({ competition: v, when: matchWhenText(nm.dateISO, v) })}
          />
          <Field label="Kde se hraje" value={nm.venue} onChange={(v) => updNm({ venue: v })} placeholder="Areál Kunice" />
        </Row>
        {nm.when && (
          <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
            Na webu se ukáže: <b style={{ color: '#3a3f47' }}>{nm.when}</b>
          </div>
        )}
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

      {/* Adresy se mění jednou za sezónu, proto dole a sbalené.
          Odkaz na FAČR tu byl dvakrát — zůstal jeden. */}
      <Pokrocile title="Odkazy na fotbal.cz" hint="Nastavuje se jednou za sezónu.">
        <Row>
          <Field label="Adresa soutěže pro stahování zápasů" value={t.sourceUrl} onChange={(v) => updateTeam({ sourceUrl: v })} placeholder="https://www.fotbal.cz/souteze/turnaje/…" />
          <Field label="Odkaz na FAČR (tlačítko na webu)" value={t.facrUrl} onChange={(v) => updateTeam({ facrUrl: v })} placeholder="https://www.fotbal.cz/souteze/..." />
        </Row>
        <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
          Z první adresy se 4× týdně stahují návrhy zápasů. Prázdné pole znamená, že se tým nestahuje.
        </div>
      </Pokrocile>

      {/* TABULKA */}
      <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Tabulka soutěže <span style={{ fontWeight: 600, fontSize: 12, color: '#9AA1AC' }}>(náhled na webu — nepovinné)</span></div>
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
          {/* Ručně se výsledek přidává jen tehdy, když se nestáhne z fotbal.cz.
              Seznam se sám řadí od nejnovějšího podle data. */}
          <ListEditor
            items={t.results || []}
            onChange={(v) => updateTeam({ results: sortResults(v) })}
            itemTitle={(r) => `${r.dateISO ? czechDate(r.dateISO) + ' · ' : ''}${r.opp} ${r.score}`}
            newItem={{ wld: 'V', opp: 'Soupeř', score: '0:0', dateISO: '' }}
            addLabel="+ Přidat výsledek"
            renderItem={(r, u) => (
              <Row>
                <Field label="Datum" type="date" value={r.dateISO || ''} onChange={(v) => u({ dateISO: v })} width="170px" />
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
      </>
      )}
    </div>
  );
}

// --- návrhy zápasů stažené z fotbal.cz --------------------------------------
// Stav automatického stahování. Když poslední běh selhal nebo je dávno,
// admin to hned vidí — web mezitím ukazuje poslední ručně potvrzená data.
function SyncStav({ sync }) {
  if (!sync || sync.status === 'nikdy') {
    return (
      <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
        Automatické stahování zápasů zatím neproběhlo. Vyplň u týmů adresu soutěže a nastav v repozitáři tajný klíč <b>MATCHES_TOKEN</b>.
      </div>
    );
  }
  const failed = sync.status === 'chyba';
  const staleDays = sync.lastOkAt ? Math.floor((Date.now() - new Date(sync.lastOkAt)) / 86400000) : null;
  const stale = staleDays !== null && staleDays > 7;
  const warn = failed || stale;
  return (
    <div style={{ background: warn ? '#FBEAEC' : '#EAF6EE', color: warn ? '#C1121F' : '#1F8A4C', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, marginBottom: 16, lineHeight: 1.5 }}>
      {failed ? 'Poslední stahování selhalo. ' : 'Poslední stahování proběhlo v pořádku. '}
      Naposledy: {formatDate(sync.lastRunAt)}
      {sync.lastOkAt ? ` · úspěšně: ${formatDate(sync.lastOkAt)}` : ''}
      {sync.message ? ` · ${sync.message}` : ''}
      {stale && ' — data jsou starší než týden, radši je zkontroluj ručně.'}
    </div>
  );
}

// Přehled tabulky v návrhu (jen pro čtení)
function TabulkaNahled({ rows }) {
  if (!rows || !rows.length) return <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>Tabulka se nestáhla.</div>;
  return (
    <div style={{ background: '#FAFBFC', borderRadius: 10, padding: 12 }}>
      {rows.slice(0, 8).map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, padding: '4px 0', color: r.me ? '#C1121F' : '#3a3f47', fontWeight: r.me ? 800 : 600 }}>
          <span style={{ width: 22 }}>{r.pos}.</span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.team}</span>
          <span style={{ width: 34, textAlign: 'right' }}>{r.gp}</span>
          <span style={{ width: 34, textAlign: 'right' }}>{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

export function Navrhy({ proposals, teams }) {
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState(null); // rozpracovaná úprava návrhu

  const nove = proposals.filter((p) => p.status === 'nová');
  const setStatus = (id, status) => set('matchProposals', proposals.map((p) => (p.id === id ? { ...p, status } : p)));

  // Potvrzení = data z návrhu se zapíšou do týmu, návrh se označí za schválený
  // a z výsledku rovnou vznikne koncept příspěvku na sociální sítě (Krok 4).
  const potvrdit = (p, data) => {
    const payload = data || p.data;
    updateData((d) => {
      const team = d.teams.find((t) => t.id === p.teamId);
      if (!team) return;
      if (payload.nextMatch) team.nextMatch = { ...team.nextMatch, ...payload.nextMatch };
      if (payload.lastMatch) team.lastMatch = { ...team.lastMatch, ...payload.lastMatch };
      if (payload.table && payload.table.length) team.table = payload.table;
      d.matchProposals = d.matchProposals.map((x) => (x.id === p.id ? { ...x, status: 'schválená', data: payload } : x));

      if (payload.lastMatch && payload.lastMatch.score) {
        const post = postFromResult({
          teamName: team.name,
          lastMatch: payload.lastMatch,
          competition: team.comp,
          settings: d.socialSettings,
        });
        // stejný výsledek nezakládá druhý příspěvek
        const same = d.socialPosts.some((x) => x.visual.score === post.visual.score && x.visual.away === post.visual.away && x.visual.home === post.visual.home);
        if (!same) d.socialPosts = [post, ...d.socialPosts];
      }
    });
    setOpen(null);
    setDraft(null);
  };

  const zahodit = (p) => {
    if (!confirm('Opravdu zahodit tento návrh? Data týmu zůstanou beze změny.')) return;
    setStatus(p.id, 'zahozená');
    setOpen(null);
    setDraft(null);
  };

  if (!nove.length) {
    return (
      <Card>
        <div style={{ padding: 8, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>
          Žádné nevyřízené návrhy. Nové se objeví po dalším automatickém stažení.
        </div>
      </Card>
    );
  }

  return (
    <div>
      

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nove.map((p) => {
          const isOpen = open === p.id;
          const team = teams.find((t) => t.id === p.teamId);
          const d = (isOpen && draft) || p.data;
          const nm = d.nextMatch || {};
          const lm = d.lastMatch || {};
          const updDraft = (patch) => setDraft({ ...d, ...patch });
          return (
            <Card key={p.id} style={{ padding: 0, overflow: 'hidden' }}>
              <div onClick={() => { setOpen(isOpen ? null : p.id); setDraft(isOpen ? null : p.data); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: isOpen ? '#FBF6F6' : '#fff' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>
                    {p.teamName || (team ? team.name : p.teamId)}
                    {!team && <span style={{ fontSize: 10, fontWeight: 800, color: '#C1121F', marginLeft: 8 }}>TÝM NEEXISTUJE</span>}
                    {p.warnings.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: '#A98C4E', marginLeft: 8 }}>{p.warnings.length}× VAROVÁNÍ</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2 }}>
                    Staženo {formatDate(p.createdAt)}
                    {lm.score ? ` · poslední ${lm.opp} ${lm.score}` : ''}
                    {nm.when ? ` · příští ${nm.when}` : ''}
                  </div>
                </div>
                <span style={{ color: '#C1121F', fontWeight: 700, fontSize: 12, flex: 'none' }}>Zkontrolovat {isOpen ? '▲' : '▾'}</span>
              </div>

              {isOpen && (
                <div style={{ padding: 18, background: '#FBF6F6', borderTop: '1px solid #F2F3F5' }}>
                  {p.warnings.length > 0 && (
                    <div style={{ background: '#F3F0E9', color: '#A98C4E', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                      {p.warnings.join(' · ')}
                    </div>
                  )}

                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Příští zápas</div>
                  {nm.home ? (
                    <>
                      <Row>
                        <Field label="Domácí" value={nm.home.name} onChange={(v) => updDraft({ nextMatch: { ...nm, home: { ...nm.home, name: v } } })} />
                        <Field label="Hosté" value={nm.away.name} onChange={(v) => updDraft({ nextMatch: { ...nm, away: { ...nm.away, name: v } } })} />
                      </Row>
                      <div style={{ height: 10 }} />
                      <Row>
                        <Field label="Kdy (text)" value={nm.when} onChange={(v) => updDraft({ nextMatch: { ...nm, when: v } })} />
                        <Field label="Datum a čas" type="datetime-local" value={(nm.dateISO || '').slice(0, 16)} onChange={(v) => updDraft({ nextMatch: { ...nm, dateISO: v } })} width="230px" />
                        <Field label="Kde" value={nm.venue} onChange={(v) => updDraft({ nextMatch: { ...nm, venue: v } })} />
                      </Row>
                    </>
                  ) : <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>Příští zápas se nestáhl.</div>}

                  <div style={{ fontWeight: 800, fontSize: 14, margin: '18px 0 8px' }}>Poslední výsledek</div>
                  {lm.score ? (
                    <Row>
                      <Field label="Soupeř" value={lm.opp} onChange={(v) => updDraft({ lastMatch: { ...lm, opp: v } })} />
                      <Field label="Skóre" value={lm.score} onChange={(v) => updDraft({ lastMatch: { ...lm, score: v } })} width="120px" />
                      <Select label="Výsledek" value={lm.result} onChange={(v) => updDraft({ lastMatch: { ...lm, result: v } })} options={RESULT_OPTS} width="160px" />
                      <Field label="Střelci (doplň ručně)" value={lm.scorers} onChange={(v) => updDraft({ lastMatch: { ...lm, scorers: v } })} />
                    </Row>
                  ) : <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600 }}>Poslední výsledek se nestáhl.</div>}

                  <div style={{ fontWeight: 800, fontSize: 14, margin: '18px 0 8px' }}>Tabulka ({(d.table || []).length} řádků)</div>
                  <TabulkaNahled rows={d.table} />

                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Btn kind="primary" onClick={() => potvrdit(p, d)}>Potvrdit a zapsat k týmu</Btn>
                    <span style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600 }}>Změny v polích výš se uloží spolu s potvrzením.</span>
                    <span style={{ marginLeft: 'auto' }}><Btn kind="danger" small onClick={() => zahodit(p)}>Zahodit</Btn></span>
                  </div>
                  {p.sourceUrl && (
                    <div style={{ marginTop: 10 }}>
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#C1121F' }}>Otevřít zdroj na fotbal.cz</a>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- NOVINKY
export function Novinky() {
  const { news } = useData();
  // Nová novinka patří na začátek — web i homepage řadí nejnovější nahoru,
  // takže přidání na konec by ji schovalo pod všechny starší.
  // Nová novinka vzniká jako KONCEPT — na webu není, dokud ji nezveřejníš.
  // Rovnou se rozbalí, aby se nezaložila prázdná a nemusela se hledat.
  const [otevriNovou, setOtevriNovou] = useState(null);
  const pridatNovinku = () => {
    set('news', [{ ...emptyNews(), title: 'Nová novinka', id: `novinka-${Date.now()}`, draft: true }, ...news]);
    setOtevriNovou(0);
  };

  return (
    <div>
      <SectionHead
        title="Novinky"
        desc="Fotka, pár vět a datum. Zobrazí se na webu i na hlavní stránce, nejnovější nahoře. Delší text se ukáže na detailu článku."
        count={news.length}
        akce={<Btn kind="primary" small onClick={pridatNovinku}>+ Přidat novinku</Btn>}
      />
      <ListEditor
        items={news}
        onChange={(v) => set('news', v)}
        itemTitle={(n) => `${n.draft ? 'KONCEPT · ' : ''}${n.title || 'Nová novinka'}`}
        bezPridat
        otevriIndex={otevriNovou}
        onOtevrenoPouzito={() => setOtevriNovou(null)}
        renderItem={(n, u) => (
          <div>
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F2F3F5' }}>
              <Prepinac
                value={!n.draft}
                onChange={(v) => u({ draft: !v })}
                label="Zveřejnit novinku na webu"
                popisZap="Zveřejněná — je na webu"
                popisVyp="Koncept — na webu není"
              />
            </div>
            <ImageField label="Fotka" value={n.image} onChange={(v) => u({ image: v })} />
            <div style={{ height: 14 }} />
            <Row>
              <Field label="Titulek" value={n.title} onChange={(v) => u({ title: v })} />
              <Select label="Kategorie" value={n.category} onChange={(v) => u({ category: v })} options={['Áčko', 'Mládež', 'Klub', 'Akce']} width="160px" />
              <Field label="Datum" value={n.date} onChange={(v) => u({ date: v })} width="150px" placeholder="14. 6. 2026" />
            </Row>
            <div style={{ height: 12 }} />
            <Field label="Perex (pár vět do výpisu)" textarea rows={2} value={n.text} onChange={(v) => u({ text: v })} />
            <div style={{ height: 12 }} />
            <Field label="Text článku (jen na detailu — prázdný řádek dělí odstavce)" textarea rows={6} value={n.body} onChange={(v) => u({ body: v })} />
            <div style={{ height: 12 }} />
            <a href={`/novinky/${n.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: '#C1121F' }}>Otevřít článek na webu</a>
            <Pokrocile hint="Adresa článku se vytvoří z titulku sama. Změnou přestanou fungovat dřív sdílené odkazy.">
              <Field label="Adresa článku (/novinky/…)" value={n.id} onChange={(v) => u({ id: slugify(v) })} />
            </Pokrocile>
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------- KEMPY
export function Kempy() {
  const { camps } = useData();
  const [sel, setSel] = useState(0);
  const idx = Math.min(sel, Math.max(0, camps.length - 1));
  const c = camps[idx];

  // Kemp je sbalený stejně jako novinka — rozbalí ho tužka. Nový se otevře sám.
  const [rozbaleno, setRozbaleno] = useState(false);
  const upd = (patch) => set('camps', camps.map((cm, i) => (i === idx ? { ...cm, ...patch } : cm)));
  const addCamp = () => {
    const id = `kemp-${Date.now()}`;
    // Nový kemp je vypnutý — na web ho pustí až přepínač, až bude vyplněný.
    set('camps', [...camps, { ...emptyCamp(), id, title: 'Nový kemp', tag: 'NOVÝ', badge: 'NOVÝ KEMP', img: 'sunset', archived: true }]);
    setSel(camps.length);
    setRozbaleno(true);
  };
  const removeCamp = () => {
    if (!confirm(`Opravdu smazat kemp „${c.title}“? Tuto akci nelze vrátit zpět.`)) return;
    set('camps', camps.filter((_, i) => i !== idx));
    setSel(0);
  };

  if (!c) {
    return (
      <div>
        <SectionHead title="Kempy" desc="Zatím nemáš vypsaný žádný kemp" />
        <Card><Btn kind="primary" onClick={addCamp}>+ Přidat kemp</Btn></Card>
      </div>
    );
  }

  const activeCount = camps.filter((cm) => !cm.archived).length;

  return (
    <div>
      <SectionHead
        title="Kempy"
        desc="Vypsané kempy včetně programu, trenérů a častých dotazů. Vypnutý kemp zůstane v administraci, ale na webu se nezobrazí."
        count={`${activeCount} / ${camps.length}`}
        akce={<Btn kind="primary" small onClick={addCamp}>+ Přidat kemp</Btn>}
      />

      {/* Přepínač kempů. Vypnuté jsou vybledlé, ať je na první pohled vidět,
          co veřejnost nevidí. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {camps.map((cm, i) => {
          const on = i === idx;
          return (
            <button key={cm.id || i} onClick={() => setSel(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s', border: on ? '1px solid #C1121F' : '1px solid #ECEEF1', background: on ? '#C1121F' : '#fff', color: on ? '#fff' : (cm.archived ? '#9AA1AC' : '#3a3f47'), opacity: cm.archived && !on ? .65 : 1 }}>
              {cm.title || 'Bez názvu'}
              {cm.archived && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: on ? 'rgba(255,255,255,.22)' : '#EFF1F4', color: on ? '#fff' : '#9AA1AC' }}>VYPNUTÝ</span>}
            </button>
          );
        })}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #F2F3F5' }}>
          <Prepinac
            value={!c.archived}
            onChange={(v) => upd({ archived: !v })}
            label="Zobrazovat kemp na webu"
            popisZap="Zobrazuje se na webu"
            popisVyp="Archivovaný — na webu není"
          />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <IkonaTuzka title={rozbaleno ? 'Sbalit' : 'Upravit kemp'} onClick={() => setRozbaleno((o) => !o)} />
            <IkonaKos title={`Smazat kemp „${c.title}“`} onClick={removeCamp} />
          </div>
        </div>
        {!rozbaleno ? null : (
        <div>
        <Row>
          <Field label="Odznak (badge)" value={c.badge} onChange={(v) => upd({ badge: v })} />
          <Field label="Štítek na homepage" value={c.tag} onChange={(v) => upd({ tag: v })} width="180px" />
        </Row>
        <div style={{ height: 10 }} />
        <Row>
          <Field label="Titulek" value={c.title} onChange={(v) => upd({ title: v })} />
          <Field label="Cena" value={c.price} onChange={(v) => upd({ price: v })} width="140px" />
          <Field label="Termín" value={c.term} onChange={(v) => upd({ term: v })} />
        </Row>
        <div style={{ height: 10 }} />
        <Field label="Popis na homepage" textarea rows={2} value={c.desc} onChange={(v) => upd({ desc: v })} />
        <div style={{ height: 10 }} />
        <Field label="Úvodní text (detail kempu)" textarea rows={2} value={c.lead} onChange={(v) => upd({ lead: v })} />
        <div style={{ height: 14 }} />
        <ImageField label="Fotka kempu" value={c.img} onChange={(v) => upd({ img: v })} />
        <div style={{ height: 14 }} />
        <Row>
          <Field label="Obsazeno (počet)" type="number" value={c.capacity.taken} onChange={(v) => upd({ capacity: { ...c.capacity, taken: Number(v) || 0 } })} width="160px" />
          <Field label="Kapacita celkem" type="number" value={c.capacity.total} onChange={(v) => upd({ capacity: { ...c.capacity, total: Number(v) || 0 } })} width="160px" />
          <Field label="Začátek kempu" type="datetime-local" value={(c.startISO || '').slice(0, 16)} onChange={(v) => upd({ startISO: v })} width="230px" />

        </Row>
      {/* Všechno k jednomu kempu drží jeden rámeček — program, trenéři i dotazy
          patří k té samé události, ne aby se rozpadly do samostatných bloků. */}
      <div style={{ fontWeight: 800, fontSize: 15, margin: '6px 0 10px' }}>Co je v ceně</div>
      <StringListEditor items={c.includes} onChange={(v) => upd({ includes: v })} placeholder="položka" columns={2} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Výhody kempu</div>
      <ListEditor items={c.perks} onChange={(v) => upd({ perks: v })} itemTitle={(p) => p.title} newItem={{ emoji: '🏆', title: '', text: '' }} addLabel="+ Přidat výhodu"
        renderItem={(p, u) => (<Row><Field label="Název" value={p.title} onChange={(v) => u({ title: v })} /><Field label="Text" value={p.text} onChange={(v) => u({ text: v })} /></Row>)} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Denní program</div>
      <ListEditor items={c.program} onChange={(v) => upd({ program: v })} itemTitle={(p) => `${p.time} ${p.title}`} newItem={{ time: '00:00', title: '' }} addLabel="+ Přidat bod programu"
        renderItem={(p, u) => (<Row><Field label="Čas" value={p.time} onChange={(v) => u({ time: v })} width="120px" /><Field label="Název" value={p.title} onChange={(v) => u({ title: v })} /></Row>)} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Trenéři kempu</div>
      <ListEditor items={c.coaches} onChange={(v) => upd({ coaches: v })} itemTitle={(p) => p.name} newItem={{ name: '', role: 'Trenér', img: 'dusk' }} addLabel="+ Přidat trenéra"
        renderItem={(p, u) => (
          <div>
            <Row>
              <Field label="Jméno" value={p.name} onChange={(v) => u({ name: v })} />
              <Field label="Role" value={p.role} onChange={(v) => u({ role: v })} />
            </Row>
            <div style={{ height: 12 }} />
            <ImageField label="Fotka" value={p.img} onChange={(v) => u({ img: v })} />
          </div>
        )} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Časté dotazy</div>
      <ListEditor items={c.faq} onChange={(v) => upd({ faq: v })} itemTitle={(f) => f.q} newItem={{ q: '', a: '' }} addLabel="+ Přidat dotaz"
        renderItem={(f, u) => (<div><Field label="Otázka" value={f.q} onChange={(v) => u({ q: v })} /><div style={{ height: 8 }} /><Field label="Odpověď" textarea rows={2} value={f.a} onChange={(v) => u({ a: v })} /></div>)} />
        </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- ZPRÁVY
// datum ve tvaru „14. 6. 2026 18:05"; když chybí nebo je poškozené, vrátí „—"
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function Zpravy() {
  const { messages } = useData();
  const [tab, setTab] = useState('nove');
  const [open, setOpen] = useState(null);

  const newCount = messages.filter((m) => m.status !== 'vyřízená').length;
  const shown = messages
    .map((m, i) => ({ ...m, _i: i }))
    .filter((m) => (tab === 'vse' ? true : tab === 'nove' ? m.status !== 'vyřízená' : m.status === 'vyřízená'));

  const update = (i, patch) => set('messages', messages.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i) => {
    if (!confirm('Opravdu smazat tuto zprávu? Tuto akci nelze vrátit zpět.')) return;
    set('messages', messages.filter((_, idx) => idx !== i));
    setOpen(null);
  };

  return (
    <div>
      <SectionHead title="Zprávy" desc="Zprávy odeslané z kontaktního formuláře na webu" count={newCount} />
      <SubTabs tab={tab} setTab={setTab} tabs={[
        { id: 'nove', label: 'Nové', badge: newCount },
        { id: 'vyrizene', label: 'Vyřízené', badge: messages.length - newCount },
        { id: 'vse', label: 'Vše', badge: messages.length },
      ]} />

      {shown.length === 0 ? (
        <Card><div style={{ padding: 8, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Žádné zprávy v této složce.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map((m) => {
            const done = m.status === 'vyřízená';
            const isOpen = open === m._i;
            return (
              <Card key={m._i} style={{ padding: 0, overflow: 'hidden' }}>
                <div onClick={() => setOpen(isOpen ? null : m._i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: isOpen ? '#FBF6F6' : '#fff' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>
                      {m.name || <span style={{ color: '#C7CCD3' }}>Bez jména</span>}
                      <span style={statusPill(done ? 'potvrzená' : 'nová')}>{done ? 'vyřízená' : 'nová'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[m.email, formatDate(m.date)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span style={{ color: '#C1121F', fontWeight: 700, fontSize: 12, flex: 'none' }}>Detail {isOpen ? '▲' : '▾'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: 18, background: '#FBF6F6', borderTop: '1px solid #F2F3F5' }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: 16, fontSize: 14, color: '#3a3f47', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.text || 'Bez textu.'}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Btn small onClick={() => update(m._i, { status: done ? 'nová' : 'vyřízená' })}>{done ? 'Vrátit mezi nové' : 'Označit jako vyřízenou'}</Btn>
                      {m.email && <a href={`mailto:${m.email}`} style={{ fontSize: 12, fontWeight: 700, color: '#C1121F' }}>Odpovědět e-mailem</a>}
                      <span style={{ marginLeft: 'auto' }}><Btn small kind="danger" onClick={() => remove(m._i)}>Smazat zprávu</Btn></span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- PRONÁJEM
const RES_STATUS = ['nová', 'potvrzená', 'zamítnutá'];
const RES_SOURCE = ['web', 'telefon', 'osobně'];
function statusPill(status) {
  const map = { 'nová': { background: '#FBEAEC', color: '#C1121F' }, 'potvrzená': { background: '#EAF6EE', color: '#1F8A4C' }, 'zamítnutá': { background: '#F4F5F7', color: '#9AA1AC' } };
  return { fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, marginLeft: 6, textTransform: 'uppercase', ...(map[status] || map['nová']) };
}

// Filtr uvnitř sekce. Je to přepínač pohledu, ne hlavní akce — proto drobnější
// než tlačítka typu „+ Přidat". Dřív byl výraznější než ona, což pletlo:
// největší prvek na stránce nebyl ten, kterým se něco dělá.
// `akce` = tlačítka vpravo na stejném řádku.
function SubTabs({ tab, setTab, tabs, akce }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ display: 'inline-flex', gap: 2, flexWrap: 'wrap', background: '#F4F5F7', borderRadius: 10, padding: 3 }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, padding: '7px 13px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s', border: 'none', fontFamily: 'inherit', background: active ? '#fff' : 'transparent', color: active ? '#C1121F' : '#6B7280', boxShadow: active ? '0 1px 3px rgba(18,18,18,.12)' : 'none' }}>
              {t.label}
              {t.badge != null && <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10, background: active ? '#FBEAEC' : '#E7E9ED', color: active ? '#C1121F' : '#9AA1AC' }}>{t.badge}</span>}
            </button>
          );
        })}
      </div>
      {akce && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{akce}</div>}
    </div>
  );
}

// `klubEmail` se podepisuje pod zprávy žadateli, aby věděl, kam odepsat.
function RezervaceTable({ reservations, areaOptions, openId, onOpenIdUsed, klubEmail }) {
  const [open, setOpen] = useState(null);
  // index rezervace, u které je odemčené přepisování údajů od zákazníka
  const [upravuji, setUpravuji] = useState(null);
  // rozepsaná zpráva žadateli: { i, subject, text }
  const [zprava, setZprava] = useState(null);

  // Přišlo kliknutí z kalendáře — otevřeme ten řádek. Hledá se podle `id`,
  // ne podle pořadí: seznam se řadí od nejnovější, takže index se mění.
  useEffect(() => {
    if (!openId) return;
    const i = reservations.findIndex((r) => r.id === openId);
    if (i >= 0) setOpen(i);
    onOpenIdUsed?.();
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i, patch) => set('reservations', reservations.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i) => { if (confirm('Opravdu smazat tuto rezervaci?')) { set('reservations', reservations.filter((_, idx) => idx !== i)); setOpen(null); } };
  // Přidání rezervace řeší sekce Pronájem (tlačítko je nahoře u filtru) —
  // nová položka se sem propíše přes `openId` a rovnou se rozbalí.

  const cols = '1.5fr 1.1fr 1.1fr 90px 112px 190px';
  const cell = { padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', minWidth: 0 };

  return (
    <div>
      
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
                  <div style={{ ...cell, color: '#3a3f47' }}>{[r.date, r.from && r.to ? `${r.from}–${r.to}` : r.time].filter(Boolean).join(' · ') || '—'}</div>
                  <div style={{ ...cell, color: '#9AA1AC', fontWeight: 600 }}>{r.source}</div>
                  <div style={cell}><span style={statusPill(r.status)}>{r.status}</span></div>
                  <div style={{ ...cell, justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    {r.status !== 'potvrzená' && <Btn small kind="primary" onClick={() => update(i, { status: 'potvrzená' })}>Potvrdit</Btn>}
                    {r.status !== 'zamítnutá' && <Btn small onClick={() => update(i, { status: 'zamítnutá' })}>Zamítnout</Btn>}
                    {r.status === 'zamítnutá' && <Btn small onClick={() => update(i, { status: 'nová' })}>Vrátit</Btn>}
                    <span onClick={() => setOpen(open === i ? null : i)} style={{ color: '#C1121F', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{open === i ? '▲' : '▾'}</span>
                  </div>
                </div>
                {open === i && (
                  <div style={{ padding: 18, background: '#FBF6F6', borderBottom: '1px solid #F2F3F5' }}>
                    {/* Co poptal zákazník z webu, se jen ukazuje — přepsat to jde
                        po kliknutí na tužku. Rezervaci domluvenou telefonem
                        zapisuje klub sám, tam zamykat není co. */}
                    <UdajeZakaznika
                      upravovat={r.source !== 'web' || upravuji === i}
                      onUpravovat={() => setUpravuji(i)}
                      polozky={[
                        { label: 'Jméno / firma', value: r.name },
                        { label: 'E-mail', value: r.email },
                        { label: 'Telefon', value: r.phone },
                        { label: 'Plocha', value: r.area },
                        { label: 'Termín', value: [r.date, r.from && r.to ? `${r.from}–${r.to}` : ''].filter(Boolean).join(' · ') },
                      ]}
                    >
                    <div>
                    <Row>
                      <Field label="Jméno / firma" value={r.name} onChange={(v) => update(i, { name: v })} />
                      <Field label="E-mail" value={r.email} onChange={(v) => update(i, { email: v })} placeholder="jan@novak.cz" />
                      <Field label="Telefon" value={r.phone} onChange={(v) => update(i, { phone: v })} placeholder="602 123 456" width="180px" />
                    </Row>
                    <div style={{ height: 10 }} />
                    <Row>
                      <Select label="Plocha" value={r.area} onChange={(v) => update(i, { area: v })} options={areaOptions.length ? areaOptions : ['—']} />
                      <Field label="Datum" type="date" value={r.dateISO} onChange={(v) => update(i, { dateISO: v, date: czechDate(v) })} width="170px" />
                      <Field label="Od" value={r.from} onChange={(v) => update(i, { from: v, time: v })} width="100px" placeholder="18:00" />
                      <Field label="Do" value={r.to} onChange={(v) => update(i, { to: v })} width="100px" placeholder="19:00" />
                    </Row>
                    <div style={{ marginTop: 10 }}><Btn small onClick={() => setUpravuji(null)}>Hotovo</Btn></div>
                    </div>
                    </UdajeZakaznika>
                    <div style={{ height: 10 }} />
                    {/* Dlouhodobý pronájem: jeden záznam, který drží termín každý týden.
                        Potvrzuje se jednou pro celou sérii. */}
                    <Row>
                      <Select label="Opakování" value={r.repeat} onChange={(v) => update(i, { repeat: v })} width="200px"
                        options={REPEAT_MODES.map((m) => ({ value: m, label: REPEAT_LABELS[m] }))} />
                      {r.repeat ? (
                        <Field label="Opakovat do" type="date" value={r.repeatUntil} onChange={(v) => update(i, { repeatUntil: v })} width="170px" />
                      ) : null}
                      {r.repeat ? (
                        <div style={{ flex: 1, minWidth: 200, alignSelf: 'end', fontSize: 12, color: '#6B7280', fontWeight: 600, paddingBottom: 12 }}>
                          Drží stejný čas každý {r.repeat === 'biweekly' ? 'druhý ' : ''}týden{r.repeatUntil ? '' : ' — bez data konce běží dál'}.
                        </div>
                      ) : null}
                    </Row>
                    <div style={{ height: 10 }} />
                    <Row>
                      <Select label="Zdroj" value={r.source} onChange={(v) => update(i, { source: v })} options={RES_SOURCE} width="150px" />
                      <Select label="Stav" value={r.status} onChange={(v) => update(i, { status: v })} options={RES_STATUS} width="170px" />
                    </Row>
                    <div style={{ height: 10 }} />
                    <Field label="Poznámka" textarea rows={2} value={r.note} onChange={(v) => update(i, { note: v })} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Změna stavu rovnou otevře předvyplněnou zprávu. Nic
                          neodejde bez kliknutí na Odeslat. */}
                      {r.status !== 'potvrzená' && <Btn small kind="primary" onClick={() => { update(i, { status: 'potvrzená' }); setZprava({ i, ...reservationDecisionMail(r, true, klubEmail) }); }}>Potvrdit rezervaci</Btn>}
                      {r.status !== 'zamítnutá' && <Btn small onClick={() => { update(i, { status: 'zamítnutá' }); setZprava({ i, ...reservationDecisionMail(r, false, klubEmail) }); }}>Zamítnout (uvolní termín)</Btn>}
                      {r.email && <Btn small onClick={() => setZprava({ i, subject: '', text: '' })}>Napsat zprávu</Btn>}
                      <span style={{ marginLeft: 'auto' }}><Btn kind="danger" small onClick={() => remove(i)}>Smazat rezervaci</Btn></span>
                    </div>
                    {zprava && zprava.i === i && (
                      <ZpravaZadateli
                        typ="rezervace" id={r.id} email={r.email}
                        predvyplneno={{ subject: zprava.subject, text: zprava.text }}
                        historie={r.messages || []}
                        onOdeslano={(z) => update(i, { messages: [z, ...(r.messages || [])].slice(0, 50) })}
                        onZavrit={() => setZprava(null)}
                      />
                    )}
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Otevírací doba a pravidla poptávek — podle nich web nabízí volné termíny.
function RentalNastaveni({ settings }) {
  const upd = (patch) => set('rentalSettings', { ...settings, ...patch });
  const sloty = daySlots(settings);
  return (
    <div>
      
      <Card style={{ marginBottom: 16 }}>
        <Row>
          <Field label="Otevřeno od" value={settings.openFrom} onChange={(v) => upd({ openFrom: v })} width="140px" placeholder="08:00" />
          <Field label="Otevřeno do" value={settings.openTo} onChange={(v) => upd({ openTo: v })} width="140px" placeholder="22:00" />
          <Field label="Délka termínu (minuty)" type="number" value={settings.slotMinutes} onChange={(v) => upd({ slotMinutes: Number(v) || 60 })} width="190px" />
        </Row>
        <div style={{ height: 12 }} />
        <Row>
          <Field label="Poptat nejpozději (hodin předem)" type="number" value={settings.leadHours} onChange={(v) => upd({ leadHours: Number(v) || 0 })} width="230px" />
          <Field label="Jak daleko dopředu (dnů)" type="number" value={settings.horizonDays} onChange={(v) => upd({ horizonDays: Number(v) || 120 })} width="200px" />
          <Field label="E-mail pro upozornění" value={settings.notifyEmail} onChange={(v) => upd({ notifyEmail: v })} placeholder="klub@fkkunice.cz" />
        </Row>
        <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 12 }}>
          Denně to dělá <b>{sloty.length}</b> termínů{sloty.length ? `: ${sloty[0]} – ${sloty[sloty.length - 1]}` : ' — zkontroluj otevírací dobu'}.
          Jestli e-maily odcházejí, ukazuje pole níž; poptávka se do administrace uloží vždycky.
        </div>
      </Card>

      <StavPosty vychoziEmail={settings.notifyEmail} />

      <div style={{ fontWeight: 800, fontSize: 15, margin: '20px 0 10px' }}>Zavřené dny <span style={{ fontWeight: 600, fontSize: 12, color: '#9AA1AC' }}>(turnaj, údržba — web je vůbec nenabídne)</span></div>
      <StringListEditor items={settings.closedDays} onChange={(v) => upd({ closedDays: v })} placeholder="2026-07-04" columns={3} />
    </div>
  );
}

// Týdenní kalendář obsazenosti. Jen zobrazuje — co je zabrané, počítá
// `occurrencesInRange` v lib/rental.js, takže kalendář ukazuje přesně to,
// co web nabízí a co server pouští dovnitř. Dlouhodobý nájem se tu proto
// kreslí do všech svých termínů, i když je v datech jediný záznam.
const DNY = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

function pondeliTydne(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const den = (new Date(y, m - 1, d).getDay() + 6) % 7; // pondělí = 0
  return shiftDays(dateISO, -den);
}

function RezervaceKalendar({ reservations, settings, areaOptions, onOpen }) {
  const [pondeli, setPondeli] = useState(() => pondeliTydne(dateKey(new Date())));
  const [plocha, setPlocha] = useState('');

  const dny = Array.from({ length: 7 }, (_, i) => shiftDays(pondeli, i));
  const sloty = daySlots(settings);
  const vyskyty = occurrencesInRange(reservations, {
    fromISO: pondeli,
    toISO: dny[6],
    area: plocha || undefined,
  });
  const dnesISO = dateKey(new Date());

  // Termíny dne seřazené podle času — v buňce se vykreslí jen ty, co v ní začínají.
  const vBunce = (dateISO, cas) => vyskyty.filter((v) => v.dateISO === dateISO && v.reservation.from === cas);

  const posun = (tydnu) => setPondeli(shiftDays(pondeli, tydnu * 7));
  const bunka = { padding: '4px 6px', borderRight: '1px solid #F2F3F5', borderBottom: '1px solid #F2F3F5', minHeight: 34, minWidth: 0 };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <Btn small onClick={() => posun(-1)}>Předchozí</Btn>
        <Btn small onClick={() => setPondeli(pondeliTydne(dnesISO))}>Tento týden</Btn>
        <Btn small onClick={() => posun(1)}>Další</Btn>
        <div style={{ fontWeight: 800, fontSize: 14, marginLeft: 6 }}>{czechDate(pondeli)} – {czechDate(dny[6])}</div>
        <div style={{ marginLeft: 'auto', minWidth: 200 }}>
          <Select label="" value={plocha} onChange={setPlocha}
            options={[{ value: '', label: 'Všechny plochy' }, ...areaOptions.map((a) => ({ value: a, label: a }))]} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 10, flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#1F8A4C', marginRight: 5 }} />potvrzená</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#fff', border: '2px dashed #C1121F', marginRight: 5 }} />nová — drží místo, čeká na tebe</span>
        <span style={{ color: '#9AA1AC' }}>zamítnuté se nekreslí</span>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', background: '#FAFBFC', borderBottom: '1px solid #ECEEF1' }}>
              <div style={{ ...bunka, minHeight: 0 }} />
              {dny.map((dISO, i) => (
                <div key={dISO} style={{ ...bunka, minHeight: 0, padding: '8px 6px', textAlign: 'center', background: dISO === dnesISO ? '#FBF6F6' : 'transparent' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#9AA1AC' }}>{DNY[i].toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: dISO === dnesISO ? '#C1121F' : '#1E1E1E' }}>{Number(dISO.slice(8, 10))}. {Number(dISO.slice(5, 7))}.</div>
                </div>
              ))}
            </div>

            {sloty.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Otevírací doba není nastavená — mřížka nemá co vykreslit.</div>}

            {sloty.map((cas) => (
              <div key={cas} style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)' }}>
                <div style={{ ...bunka, fontSize: 11, fontWeight: 700, color: '#9AA1AC', background: '#FAFBFC' }}>{cas}</div>
                {dny.map((dISO) => (
                  <div key={dISO} style={{ ...bunka, background: dISO === dnesISO ? '#FEFBFB' : '#fff' }}>
                    {vBunce(dISO, cas).map(({ reservation: r }, i) => {
                      const potvrzena = r.status === 'potvrzená';
                      return (
                        <div key={`${r.id}-${i}`} onClick={() => onOpen(r)} title={`${r.name || 'Bez jména'} · ${r.area || '—'} · ${r.from}–${r.to}${r.repeat ? ` · ${REPEAT_LABELS[r.repeat]}` : ''}`}
                          style={{
                            cursor: 'pointer', borderRadius: 6, padding: '3px 6px', marginBottom: 3, fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: potvrzena ? '#1F8A4C' : '#fff',
                            color: potvrzena ? '#fff' : '#C1121F',
                            border: potvrzena ? '2px solid #1F8A4C' : '2px dashed #C1121F',
                          }}>
                          {r.repeat ? '⟳ ' : ''}{r.name || 'Bez jména'}
                          {!plocha && r.area ? <span style={{ opacity: .75, fontWeight: 600 }}> · {r.area}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
        Klikni na termín — otevře se detail v záložce Rezervace, kde se potvrzuje a upravuje.
        Symbol ⟳ značí dlouhodobý pronájem; opakuje se, i když je v datech jediný záznam.
      </div>
    </div>
  );
}

export function Pronajem() {
  const d = useData();
  const [tab, setTab] = useState('rezervace');
  const [openId, setOpenId] = useState('');
  const areaOptions = d.rentalPlans.map((p) => p.name);
  const newCount = d.reservations.filter((r) => r.status === 'nová').length;

  // Klik v kalendáři přepne na Rezervace a rozbalí ten správný řádek.
  const otevriRezervaci = (r) => { setOpenId(r.id); setTab('rezervace'); };

  // Rezervaci, kterou někdo domluvil telefonem, zakládá sekce — tlačítko patří
  // nahoru k filtru, ne pod tabulku, kam se muselo scrollovat.
  const pridatRezervaci = () => {
    const id = `rezervace-${Date.now()}`;
    set('reservations', [{ ...emptyReservation(), id, area: areaOptions[0] || '', source: 'telefon', createdAt: new Date().toISOString() }, ...d.reservations]);
    setOpenId(id);
    setTab('rezervace');
  };

  return (
    <div>
      <SectionHead title="Pronájem areálu" desc="Správa rezervací a nastavení pronajímaných ploch" />
      <SubTabs
        tab={tab} setTab={setTab}
        akce={<Btn kind="primary" small onClick={pridatRezervaci}>+ Nová rezervace (telefon / osobně)</Btn>}
        tabs={[
          { id: 'rezervace', label: 'Rezervace', badge: newCount },
          { id: 'kalendar', label: 'Kalendář' },
          { id: 'plochy', label: 'Plochy & ceník' },
          { id: 'nastaveni', label: 'Otevírací doba' },
        ]} />

      {tab === 'nastaveni' ? (
        <RentalNastaveni settings={d.rentalSettings} />
      ) : tab === 'kalendar' ? (
        <RezervaceKalendar reservations={d.reservations} settings={d.rentalSettings} areaOptions={areaOptions} onOpen={otevriRezervaci} />
      ) : tab === 'rezervace' ? (
        <RezervaceTable reservations={d.reservations} areaOptions={areaOptions} openId={openId} onOpenIdUsed={() => setOpenId('')} klubEmail={d.club.email} />
      ) : (
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '0 0 6px' }}>Hřiště k pronájmu</div>
          <div style={{ fontSize: 13, color: '#9AA1AC', fontWeight: 600, marginBottom: 10 }}>
            Jeden seznam pro celý web — ceník na stránce Pronájem, první tři se ukážou i na hlavní stránce
            a vybírají se v poptávkovém formuláři.
          </div>
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
                </Row>
                <div style={{ height: 12 }} />
                <ImageField label="Fotka hřiště" value={p.img} onChange={(v) => u({ img: v })} />
                <div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, color: '#9AA1AC' }}>VYBAVENÍ</div>
                <div style={{ height: 6 }} />
                <StringListEditor items={p.features} onChange={(v) => u({ features: v })} placeholder="prvek" columns={2} />
              </div>
            )} />

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
        renderItem={(q, u) => (<Row><Field label="Titulek" value={q.title} onChange={(v) => u({ title: v })} placeholder="Zavolejte nám" /><Field label="Hodnota" value={q.value} onChange={(v) => u({ value: v })} placeholder="+420 777 123 456" /></Row>)} />
    </div>
  );
}

// ---------------------------------------------------------------- PARTNEŘI
export function Partneri() {
  const { sponsors } = useData();
  return (
    <div>
      <SectionHead title="Partneři" desc="Loga partnerů klubu — bez nahraného loga se zobrazí název" count={sponsors.length} />
      <ListEditor
        items={sponsors}
        onChange={(v) => set('sponsors', v)}
        itemTitle={(sp) => sp.name || 'Nový partner'}
        newItem={() => ({ ...emptySponsor(), id: `partner-${Date.now()}` })}
        addLabel="Přidat partnera"
        renderItem={(sp, u) => (
          <div>
            <Row>
              <Field label="Název" value={sp.name} onChange={(v) => u({ name: v, id: slugify(v) || sp.id })} placeholder="STAVOSPOL" />
              <Field label="Odkaz na web (nepovinný)" value={sp.url} onChange={(v) => u({ url: v })} placeholder="https://…" />
            </Row>
            <div style={{ height: 12 }} />
            <ImageField label="Logo" value={sp.logo} onChange={(v) => u({ logo: v })} />
          </div>
        )}
      />
      <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 10 }}>
        Nejlépe vypadá logo na průhledném pozadí (PNG) nebo na bílém. Dlaždice je vysoká 96 px, logo se do ní vejde samo.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- REGISTRACE
export function Registrace() {
  const { cmsRegistrations, teams, club } = useData();
  const klubEmail = club.email;
  const [tab, setTab] = useState('nove');
  const [open, setOpen] = useState(null);
  // index přihlášky, u které je odemčené přepisování údajů od zájemce
  const [upravuji, setUpravuji] = useState(null);
  // rozepsaná zpráva rodiči: { i, subject, text }
  const [zprava, setZprava] = useState(null);

  const newCount = cmsRegistrations.filter((r) => r.status === 'nová').length;
  const shown = cmsRegistrations
    .map((r, i) => ({ ...r, _i: i }))
    .filter((r) => (tab === 'vse' ? true : tab === 'nove' ? r.status === 'nová' : r.status !== 'nová'));

  const update = (i, patch) => set('cmsRegistrations', cmsRegistrations.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i) => {
    if (!confirm('Opravdu smazat tuto přihlášku? Tuto akci nelze vrátit zpět.')) return;
    set('cmsRegistrations', cmsRegistrations.filter((_, idx) => idx !== i));
    setOpen(null);
  };
  const add = () => {
    set('cmsRegistrations', [{ ...emptyRegistration(), id: `prihlaska-${Date.now()}`, source: 'telefon', createdAt: new Date().toISOString() }, ...cmsRegistrations]);
    setTab('nove');
    setOpen(0);
  };

  return (
    <div>
      <SectionHead title="Přihlášky do klubu" desc="Zájemci o nábor z formuláře na webu — potvrď je, nebo zamítni" count={newCount} />
      
      <SubTabs tab={tab} setTab={setTab} tabs={[
        { id: 'nove', label: 'Nové', badge: newCount },
        { id: 'vyrizene', label: 'Vyřízené', badge: cmsRegistrations.length - newCount },
        { id: 'vse', label: 'Vše', badge: cmsRegistrations.length },
      ]} />

      {shown.length === 0 ? (
        <Card><div style={{ padding: 8, textAlign: 'center', color: '#9AA1AC', fontWeight: 600, fontSize: 14 }}>Žádné přihlášky v této složce.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map((r) => {
            const isOpen = open === r._i;
            const hotovo = r.status !== 'nová';
            return (
              <Card key={r.id || r._i} style={{ padding: 0, overflow: 'hidden' }}>
                <div onClick={() => setOpen(isOpen ? null : r._i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: isOpen ? '#FBF6F6' : '#fff' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1E1E' }}>
                      {r.name || <span style={{ color: '#C7CCD3' }}>Bez jména</span>}
                      <span style={statusPill(r.status === 'zamítnutá' ? 'zamítnutá' : hotovo ? 'potvrzená' : 'nová')}>{r.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[r.team, r.contact, formatDate(r.createdAt)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span style={{ color: '#C1121F', fontWeight: 700, fontSize: 12, flex: 'none' }}>Detail {isOpen ? '▲' : '▾'}</span>
                </div>

                {isOpen && (
                  <div style={{ padding: 18, background: '#FBF6F6', borderTop: '1px solid #F2F3F5' }}>
                    {/* Co vyplnil zájemce, se jen ukazuje. Psát do toho jde až
                        po kliknutí na tužku — jinak se snadno přepíše, co
                        člověk skutečně odeslal. */}
                    <UdajeZakaznika
                      upravovat={upravuji === r._i}
                      onUpravovat={() => setUpravuji(r._i)}
                      polozky={[
                        { label: 'Jméno zájemce', value: r.name },
                        { label: 'Datum narození', value: r.birthdate },
                        { label: 'Tým / kategorie', value: r.team },
                        { label: 'Rodič / zákonný zástupce', value: r.parent },
                        { label: 'E-mail', value: r.email || r.contact },
                        { label: 'Poznámka', value: r.note },
                      ]}
                    >
                      <div>
                        <Row>
                          <Field label="Jméno zájemce" value={r.name} onChange={(v) => update(r._i, { name: v })} />
                          <Field label="Datum narození" type="date" value={r.birthdate} onChange={(v) => update(r._i, { birthdate: v })} width="180px" />
                          <Select label="Tým / kategorie" value={r.team} onChange={(v) => update(r._i, { team: v })} options={teams.map((t) => t.name)} width="220px" />
                        </Row>
                        <div style={{ height: 10 }} />
                        <Row>
                          <Field label="Rodič / zákonný zástupce" value={r.parent} onChange={(v) => update(r._i, { parent: v })} />
                          <Field label="E-mail" value={r.email} onChange={(v) => update(r._i, { email: v })} placeholder="rodic@email.cz" />
                          <Field label="Telefon" value={r.phone} onChange={(v) => update(r._i, { phone: v })} width="180px" />
                        </Row>
                        <div style={{ height: 10 }} />
                        <Field label="Poznámka" textarea rows={2} value={r.note} onChange={(v) => update(r._i, { note: v })} />
                        <div style={{ marginTop: 10 }}><Btn small onClick={() => setUpravuji(null)}>Hotovo</Btn></div>
                      </div>
                    </UdajeZakaznika>

                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Vyřízení i zamítnutí otevřou předvyplněnou zprávu.
                          Odejde až po kliknutí na Odeslat. */}
                      <Btn small onClick={() => { update(r._i, { status: hotovo ? 'nová' : 'vyřízená' }); if (!hotovo) setZprava({ i: r._i, ...registrationDecisionMail(r, true, klubEmail) }); }}>
                        {hotovo ? 'Vrátit mezi nové' : 'Označit jako vyřízenou'}
                      </Btn>
                      {r.status !== 'zamítnutá' && <Btn small onClick={() => { update(r._i, { status: 'zamítnutá' }); setZprava({ i: r._i, ...registrationDecisionMail(r, false, klubEmail) }); }}>Zamítnout</Btn>}
                      {r.email && <Btn small onClick={() => setZprava({ i: r._i, subject: '', text: '' })}>Napsat zprávu</Btn>}
                      <span style={{ marginLeft: 'auto' }}><Btn small kind="danger" onClick={() => remove(r._i)}>Smazat</Btn></span>
                    </div>
                    {zprava && zprava.i === r._i && (
                      <ZpravaZadateli
                        typ="prihlaska" id={r.id} email={r.email}
                        predvyplneno={{ subject: zprava.subject, text: zprava.text }}
                        historie={r.messages || []}
                        onOdeslano={(z) => update(r._i, { messages: [z, ...(r.messages || [])].slice(0, 50) })}
                        onZavrit={() => setZprava(null)}
                      />
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 14 }}><Btn kind="primary" onClick={add}>Přidat přihlášku (telefon / osobně)</Btn></div>
    </div>
  );
}
