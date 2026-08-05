'use client';
// =============================================================================
//  ÚPRAVY TEXTŮ PŘÍMO NA WEBU
//  Části webu jsou zabalené do bloků. Návštěvník vidí obyčejnou stránku.
//  Přihlášenému s právem na danou sekci se v režimu úprav u bloku objeví
//  tlačítko „Upravit“ — teprve po něm jde do textů klikat. Změny jsou zatím
//  jen rozepsané (blok svítí „Neuloženo“) a na web se zapíšou až po „Uložit“.
//  „Zrušit“ vrátí původní znění.
//
//  Určeno na PEVNÉ texty (nadpisy, hero, patička). Seznamy — kempy, hráči,
//  novinky — se dál spravují v administraci, kde jde položky přidávat a mazat.
// =============================================================================
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/session';
import { updateData } from '@/lib/store';

const RED = '#C1121F';
const BlokCtx = createContext(null);

// `cesta` je tečkovaná adresa v obsahu, např. "homeTexts.hero.title"
function zapisDo(cil, cesta, hodnota) {
  const casti = cesta.split('.');
  let uzel = cil;
  for (const k of casti.slice(0, -1)) {
    if (uzel[k] == null || typeof uzel[k] !== 'object') return;
    uzel = uzel[k];
  }
  uzel[casti[casti.length - 1]] = hodnota;
}

// -----------------------------------------------------------------------------
//  BLOK — zabalená část webu, kterou lze otevřít k úpravě a pak uložit
// -----------------------------------------------------------------------------
export function Blok({ nazev = 'Texty', sekce = 'domu', children, style }) {
  const { editMode, muzeUpravit } = useSession();
  const rozepsane = useRef({});
  const [uprava, setUprava] = useState(false);
  const [zmeneno, setZmeneno] = useState(false);
  const [verze, setVerze] = useState(0);

  const lze = editMode && muzeUpravit(sekce);
  // když se režim úprav vypne, rozepsané změny zahodíme (nic se nezapsalo)
  useEffect(() => { if (!lze && uprava) { rozepsane.current = {}; setUprava(false); setZmeneno(false); setVerze((v) => v + 1); } }, [lze, uprava]);

  const nahlas = (cesta, hodnota) => {
    rozepsane.current[cesta] = hodnota;
    if (!zmeneno) setZmeneno(true);
  };

  const uloz = () => {
    const zmeny = rozepsane.current;
    if (Object.keys(zmeny).length) {
      updateData((d) => { for (const [cesta, hodnota] of Object.entries(zmeny)) zapisDo(d, cesta, hodnota); });
    }
    rozepsane.current = {};
    setZmeneno(false);
    setUprava(false);
  };

  const zrus = () => {
    rozepsane.current = {};
    setZmeneno(false);
    setUprava(false);
    setVerze((v) => v + 1); // vrátí do textů původní znění
  };

  if (!lze) return <div style={style}>{children}</div>;

  return (
    <BlokCtx.Provider value={{ uprava, nahlas, verze }}>
      <div
        data-blok={nazev}
        data-uprava={uprava ? '1' : undefined}
        data-neulozeno={zmeneno ? '1' : undefined}
        style={{
          ...style,
          position: 'relative',
          outline: uprava ? `2px solid ${RED}` : '2px dashed rgba(193,18,31,.45)',
          outlineOffset: 6,
          borderRadius: 6,
        }}
      >
        <div style={{ position: 'absolute', top: -14, left: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: uprava ? RED : 'rgba(193,18,31,.85)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.6px', padding: '4px 9px', borderRadius: 6, textTransform: 'uppercase' }}>{nazev}</span>
          {zmeneno && <span style={{ background: '#121212', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 6 }}>Neuloženo</span>}
          {!uprava ? (
            <button onClick={() => setUprava(true)} style={tlacitko(RED)}>Upravit</button>
          ) : (
            <>
              <button onClick={uloz} style={tlacitko('#121212')}>Uložit</button>
              <button onClick={zrus} style={{ ...tlacitko('#fff'), color: '#3a3f47', boxShadow: 'inset 0 0 0 1px #D8DBE0' }}>Zrušit</button>
            </>
          )}
        </div>
        {children}
      </div>
    </BlokCtx.Provider>
  );
}

function tlacitko(pozadi) {
  return {
    background: pozadi, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 11px',
    fontSize: 11, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1.6,
  };
}

// -----------------------------------------------------------------------------
//  TEXT — jedno pole uvnitř bloku
// -----------------------------------------------------------------------------
export function Text({ cesta, as = 'span', hodnota, viceradkovy = false, style, ...rest }) {
  const blok = useContext(BlokCtx);
  const ref = useRef(null);
  const El = as;
  const uprava = !!blok && blok.uprava;

  // při otevření úpravy (a při „Zrušit“) nasadíme původní znění; během psaní
  // do pole nesaháme, ať kurzor neskáče
  useEffect(() => {
    if (uprava && ref.current) ref.current.innerText = hodnota ?? '';
  }, [uprava, blok?.verze]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!uprava) return <El style={style} {...rest}>{hodnota}</El>;

  return (
    <El
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Upravit text: ${cesta}`}
      data-upravitelny={cesta}
      onInput={() => {
        const text = String(ref.current.innerText || '').replace(/ /g, ' ');
        blok.nahlas(cesta, viceradkovy ? text.replace(/\n+$/, '') : text.replace(/\s*\n+\s*/g, ' ').trim());
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' && !viceradkovy) e.preventDefault(); }}
      style={{
        ...style,
        background: 'rgba(193,18,31,.08)',
        boxShadow: `inset 0 0 0 1px rgba(193,18,31,.5)`,
        borderRadius: 4,
        cursor: 'text',
        minWidth: 24,
        display: style && style.display ? style.display : 'inline-block',
      }}
      {...rest}
    />
  );
}

// -----------------------------------------------------------------------------
//  PŘEPÍNAČ — plovoucí tlačítko; vidí ho jen ten, kdo smí texty měnit
// -----------------------------------------------------------------------------
export function PrepinacUprav() {
  const { user, editMode, setEditMode, muzeUpravit } = useSession();
  if (!user || !muzeUpravit('domu')) return null;

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {editMode && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', maxWidth: 280, fontSize: 12, fontWeight: 600, color: '#3a3f47', lineHeight: 1.5, boxShadow: '0 10px 30px rgba(18,18,18,.18)' }}>
          U každé části webu je tlačítko Upravit. Po něm můžeš do textů klikat a přepsat je. Na web se to zapíše až po Uložit. Kempy, hráče a novinky přidávej v administraci.
        </div>
      )}
      <button
        data-prepinac-uprav
        onClick={() => setEditMode(!editMode)}
        style={{
          background: editMode ? '#121212' : RED, color: '#fff', border: 'none', borderRadius: 10,
          padding: '13px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 12px 30px rgba(18,18,18,.28)',
        }}
      >
        {editMode ? 'Hotovo' : 'Upravit texty'}
      </button>
    </div>
  );
}
