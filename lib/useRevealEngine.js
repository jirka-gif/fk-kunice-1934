'use client';
import { useEffect } from 'react';

// Reveal-on-mount, parallax, count-up a countdown — věrný port z návrhu.
// Voláno na každé stránce, aby obsah nikdy nezůstal skrytý.
export function useRevealEngine() {
  useEffect(() => {
    let raf = 0;
    const cds = [];

    function revealEl(el, delay) {
      el.dataset.fkShown = '1';
      const dur = 600;
      let start = null;
      const step = (t) => {
        if (start === null) start = t + (delay || 0);
        if (t < start) { raf = requestAnimationFrame(step); return; }
        const p = Math.min((t - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.style.opacity = String(e);
        el.style.transform = 'translateY(' + (1 - e) * 26 + 'px)';
        if (p < 1) raf = requestAnimationFrame(step);
        else { el.style.opacity = '1'; el.style.transform = 'none'; el.style.willChange = 'auto'; }
      };
      raf = requestAnimationFrame(step);
    }

    function countUp(el) {
      el.dataset.fkDone = '1';
      const target = parseFloat(el.getAttribute('data-count')) || 0;
      const dur = 1500;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min((t - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function revealAll() {
      const vh = window.innerHeight || 800;
      let order = 0;
      document.querySelectorAll('.fk-rev').forEach((el) => {
        if (el.dataset.fkShown === '1') return;
        const r = el.getBoundingClientRect();
        const inView = r.top < vh * 1.05;
        const delay = inView ? Math.min(order * 70, 650) : 0;
        if (inView) order++;
        revealEl(el, delay);
      });
      document.querySelectorAll('[data-count]').forEach((el) => {
        if (el.dataset.fkDone !== '1') countUp(el);
      });
    }

    const onScroll = () => {
      const p = document.querySelector('[data-parallax]');
      if (p) p.style.transform = 'translateY(' + window.scrollY * 0.16 + 'px)';
    };

    function pad(v) { return String(v).padStart(2, '0'); }
    function updateCountdown() {
      const now = new Date();
      // příští neděle 16:30
      const t = new Date(now);
      const day = t.getDay();
      let add = (7 - day) % 7;
      t.setHours(16, 30, 0, 0);
      if (add === 0 && now > t) add = 7;
      t.setDate(t.getDate() + add);
      let diff = Math.max(0, Math.floor((t - now) / 1000));
      const d = Math.floor(diff / 86400); diff -= d * 86400;
      const h = Math.floor(diff / 3600); diff -= h * 3600;
      const m = Math.floor(diff / 60); const s = diff - m * 60;
      const set = (k, v) => { const el = document.querySelector('[data-cd="' + k + '"]'); if (el) el.textContent = pad(v); };
      set('d', d); set('h', h); set('m', m); set('s', s);
      // kemp
      const camp = new Date('2026-07-07T08:00:00');
      let cdiff = Math.max(0, Math.floor((camp - now) / 1000));
      const cd2 = Math.floor(cdiff / 86400); cdiff -= cd2 * 86400;
      const ch = Math.floor(cdiff / 3600); cdiff -= ch * 3600;
      const cm = Math.floor(cdiff / 60); const cs2 = cdiff - cm * 60;
      const setC = (k, v) => { const el = document.querySelector('[data-cd-camp="' + k + '"]'); if (el) el.textContent = pad(v); };
      setC('d', cd2); setC('h', ch); setC('m', cm); setC('s', cs2);
    }

    window.scrollTo(0, 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    const t0 = setTimeout(revealAll, 50);
    const t1 = setTimeout(revealAll, 400); // pojistka
    updateCountdown();
    const cd = setInterval(updateCountdown, 1000);
    cds.push(cd);

    // Tvrdá pojistka (nezávislá na requestAnimationFrame): obsah nesmí nikdy
    // zůstat neviditelný — i při reduced-motion, pomalém zařízení či throttlingu.
    const hard = setTimeout(() => {
      document.querySelectorAll('.fk-rev').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 1400);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(t0); clearTimeout(t1); clearTimeout(hard);
      cds.forEach(clearInterval);
    };
  }, []);
}
