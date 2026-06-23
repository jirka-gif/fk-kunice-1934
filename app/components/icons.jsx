// Vlastní sada SVG ikon (line styl, currentColor) — náhrada za emoji.
// Použití: <Icon name="phone" size={22} color="#C1121F" />

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.9, style, className }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style, className, 'aria-hidden': true };
  switch (name) {
    // ----- administrace -----
    case 'dashboard': return (<svg {...c}><path d="M3 20h18" /><path d="M7 20v-6" /><path d="M12 20V5" /><path d="M17 20v-9" /></svg>);
    case 'teams': return (<svg {...c}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    case 'ball': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" /><path d="M12 3v4.5M19.8 9.8l-3.5 1.2M16.7 18.6l-1.7-3.9M7.3 18.6l1.7-3.9M4.2 9.8l3.5 1.2" /></svg>);
    case 'news': return (<svg {...c}><path d="M4 5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z" /><path d="M17 8h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2" /><path d="M8 8h6M8 12h6M8 16h4" /></svg>);
    case 'tent': return (<svg {...c}><path d="M3.5 20l8.5-15 8.5 15" /><path d="M12 5v15" /><path d="M2 20h20" /><path d="M12 20l-4-6M12 20l4-6" /></svg>);
    case 'stadium': return (<svg {...c}><path d="M3 21h18" /><path d="M5 21V8l7-4 7 4v13" /><path d="M9 21v-5h6v5" /></svg>);
    case 'mail': return (<svg {...c}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6 8.5-6" /></svg>);
    case 'partners': return (<svg {...c}><path d="M3 9l1.6-5h14.8L21 9" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M3 9h18" /><path d="M9 20v-6h6v6" /></svg>);
    case 'userplus': return (<svg {...c}><path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>);
    case 'settings': return (<svg {...c}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1.5 14h5M9.5 8h5M17.5 16h5" /></svg>);
    // ----- kontakt / akce -----
    case 'phone': return (<svg {...c}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>);
    case 'chat': return (<svg {...c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
    case 'pin': return (<svg {...c}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>);
    case 'award': return (<svg {...c}><circle cx="12" cy="9" r="6" /><path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1" /></svg>);
    // ----- výhody kempu -----
    case 'trophy': return (<svg {...c}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3" /></svg>);
    case 'utensils': return (<svg {...c}><path d="M4 2v7a2 2 0 0 0 4 0V2M6 2v20" /><path d="M17 2a3 3 0 0 0-3 3v6h3M17 2v20" /></svg>);
    case 'gift': return (<svg {...c}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9" /><path d="M12 8v13" /><path d="M12 8S11 3 8.5 3a2.5 2.5 0 0 0 0 5z" /><path d="M12 8s1-5 3.5-5a2.5 2.5 0 0 1 0 5z" /></svg>);
    case 'camera': return (<svg {...c}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="4" /></svg>);
    case 'check': return (<svg {...c}><path d="M20 6 9 17l-5-5" /></svg>);
    case 'checkCircle': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.2l2.4 2.4 4.6-5" /></svg>);
    default: return (<svg {...c}><circle cx="12" cy="12" r="9" /></svg>);
  }
}

const EMOJI_MAP = {
  '📞': 'phone', '✉️': 'mail', '✉': 'mail', '💬': 'chat', '📍': 'pin',
  '🏆': 'trophy', '🍽️': 'utensils', '🍽': 'utensils', '🎁': 'gift', '📸': 'camera',
  '🎖': 'award', '🎖️': 'award',
};
export function emojiIcon(e) { return EMOJI_MAP[e] || null; }
