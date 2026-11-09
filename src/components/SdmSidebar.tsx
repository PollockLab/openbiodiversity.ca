import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, Check } from 'lucide-react';
import { SDMModel } from '../types';

const GROUPS: SDMModel['taxonGroup'][] = ['Mammal', 'Bird', 'Reptile', 'Amphibian'];
const MAX_MATCHES = 50;
// Lowercase and strip diacritics so "epervier" matches "Épervier"
const norm = (s?: string) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const TAXON_FR: Record<string, string> = { All: 'Tous', Mammal: 'Mammifères', Bird: 'Oiseaux', Reptile: 'Reptiles', Amphibian: 'Amphibiens' };
const TAXON_EN: Record<string, string> = { All: 'All', Mammal: 'Mammals', Bird: 'Birds', Reptile: 'Reptiles', Amphibian: 'Amphibians' };

interface Props {
  lang: 'EN' | 'FR';
  species: SDMModel[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onCollapse: () => void;
}

export default function SdmSidebar({ lang, species, loading, selectedId, onSelect, onCollapse }: Props) {
  const [taxon, setTaxon] = useState<string>('All');
  const [typed, setTyped] = useState<string | null>(null); // null = show the selected name
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [openClasses, setOpenClasses] = useState<Record<string, boolean>>({ Mammal: true });
  const comboRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const taxonLabel = (g: string) => (lang === 'FR' ? TAXON_FR : TAXON_EN)[g] ?? g;
  const nameOf = (s: SDMModel) => (lang === 'FR' && s.commonNameFr ? s.commonNameFr : s.commonName);
  const selected = species.find(s => s.id === selectedId);

  // Keep the selected species' class open, also when it comes from the shared link
  useEffect(() => {
    if (selected) setOpenClasses(p => (p[selected.taxonGroup] ? p : { ...p, [selected.taxonGroup]: true }));
  }, [selected?.taxonGroup]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: species.length };
    species.forEach(s => { c[s.taxonGroup] = (c[s.taxonGroup] || 0) + 1; });
    return c;
  }, [species]);
  const index = useMemo(() => species.map(s => ({ s, names: [s.commonName, s.commonNameFr, s.scientificName].map(norm).filter(Boolean) })), [species]);
  const filtered = useMemo(() => {
    const q = norm(typed ?? '').trim();
    const rows = index.filter(r => (taxon === 'All' || r.s.taxonGroup === taxon) && (!q || r.names.some(n => n.includes(q))));
    if (!q) return rows.map(r => r.s);
    const rank = (r: typeof rows[number]) => (r.names.some(n => n.startsWith(q)) ? 0 : 1);
    return rows.map(r => ({ r, k: rank(r) })).sort((x, y) => x.k - y.k).map(x => x.r.s);
  }, [index, taxon, typed]);
  const shown = filtered.slice(0, MAX_MATCHES);

  // Accordion lists: every species of the class, alphabetical by localized name
  const byGroup = useMemo(() => {
    const m: Record<string, SDMModel[]> = {};
    GROUPS.forEach(g => { m[g] = species.filter(s => s.taxonGroup === g).sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang === 'FR' ? 'fr' : 'en')); });
    return m;
  }, [species, lang]);

  const reset = () => { setOpen(false); setTyped(null); setActive(-1); };
  const choose = (s: SDMModel) => { onSelect(s.id); reset(); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (!shown.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(i => (i + step + shown.length) % shown.length);
    } else if (e.key === 'Enter') {
      if (open && shown.length) { e.preventDefault(); choose(shown[Math.max(active, 0)]); }
    } else if (e.key === 'Escape') {
      if (open) e.stopPropagation(); // close the list first, leave expanded mode on the next Esc
      reset();
    }
  };
  const onBlur = (e: React.FocusEvent) => {
    if (comboRef.current?.contains(e.relatedTarget as Node)) return;
    reset();
  };
  const rawQuery = (typed ?? '').trim();
  const selectedName = selected && nameOf(selected);

  return (
    <aside className="flex flex-col h-full bg-white/75 backdrop-blur-md border-r border-gray-200/80 shadow-lg font-sans">
      <div className="p-2.5 border-b border-gray-200/70 bg-white/60 shrink-0 space-y-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <div ref={comboRef} onBlur={onBlur} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls="sdm-listbox"
              aria-autocomplete="list"
              aria-activedescendant={open && active >= 0 ? `sdm-opt-${active}` : undefined}
              aria-label={lang === 'EN' ? 'Search species' : 'Rechercher une espèce'}
              autoComplete="off"
              disabled={loading}
              value={loading ? (lang === 'EN' ? 'Loading…' : 'Chargement…') : (typed ?? selectedName ?? '')}
              onChange={e => { setTyped(e.target.value); setOpen(true); setActive(-1); }}
              onFocus={e => { setOpen(true); e.currentTarget.select(); }}
              onClick={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={lang === 'EN' ? 'Search all species…' : 'Rechercher toutes les espèces…'}
              className="w-full bg-white/80 focus:bg-white border border-gray-200 focus:border-sage-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-wood-900 truncate focus:outline-none focus:ring-1 focus:ring-sage-500"
            />
            {open && (
              <div className="absolute z-50 mt-1.5 w-[310px] sm:w-[345px] md:w-[390px] max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <ul id="sdm-listbox" role="listbox" aria-label={lang === 'EN' ? 'Species' : 'Espèce'} className="max-h-72 overflow-y-auto">
                  {shown.map((s, i) => (
                    <li
                      key={s.id}
                      id={`sdm-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      ref={el => { if (i === active) el?.scrollIntoView({ block: 'nearest' }); }}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { choose(s); inputRef.current?.focus(); }}
                      onMouseMove={() => active !== i && setActive(i)}
                      className={`px-3 py-2 cursor-pointer flex items-baseline justify-between gap-3 ${i === active ? 'bg-sage-50' : ''} ${s.id === selectedId ? 'font-semibold' : ''}`}
                    >
                      <span className="min-w-0 truncate text-xs text-wood-900">
                        {nameOf(s)} <span className="italic font-mono text-[11px] text-gray-500">{s.scientificName}</span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-gray-400 font-mono">{taxonLabel(s.taxonGroup)}</span>
                    </li>
                  ))}
                </ul>
                {!shown.length && (
                  <p role="status" className="px-3 py-3 text-xs text-gray-500">
                    {lang === 'EN' ? `No species match "${rawQuery}"` : `Aucune espèce ne correspond à « ${rawQuery} »`}
                  </p>
                )}
                {filtered.length > MAX_MATCHES && (
                  <p className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100">
                    {lang === 'EN' ? `Showing ${MAX_MATCHES} of ${filtered.length}` : `${MAX_MATCHES} sur ${filtered.length}`}
                  </p>
                )}
              </div>
            )}
          </div>
          <button type="button" onClick={onCollapse} title={lang === 'EN' ? 'Collapse sidebar' : 'Réduire le panneau'} aria-label={lang === 'EN' ? 'Collapse sidebar' : 'Réduire le panneau'}
            className="p-1.5 text-gray-600 hover:bg-black/5 rounded-lg cursor-pointer shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label={lang === 'EN' ? 'Taxon filter' : 'Filtre par taxon'}>
          {['All', ...GROUPS].map(g => (
            <button key={g} type="button" onClick={() => setTaxon(g)} aria-pressed={taxon === g}
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${taxon === g ? 'bg-sage-600 text-white' : 'bg-white/80 text-gray-600 hover:bg-gray-100'}`}>
              {taxonLabel(g)} ({counts[g] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-gray-200/80">
        {GROUPS.filter(g => taxon === 'All' || taxon === g).map(g => {
          const list = byGroup[g] ?? [];
          const isOpen = !!openClasses[g];
          return (
            <div key={g}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpenClasses(p => ({ ...p, [g]: !p[g] }))}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none transition-colors ${isOpen ? 'bg-gray-200/90' : 'bg-gray-100/90 hover:bg-gray-200/70'}`}>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-gray-700">{taxonLabel(g)}</span>
                  <span className="text-xs text-gray-500">({list.length})</span>
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-700" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {isOpen && (
                <ul className="bg-white/80 max-h-72 overflow-y-auto divide-y divide-gray-100/60">
                  {loading && <li className="p-3 text-xs text-gray-400 text-center">{lang === 'EN' ? 'Loading species…' : 'Chargement…'}</li>}
                  {!loading && !list.length && <li className="px-3.5 py-2.5 text-xs text-gray-400 italic">{lang === 'EN' ? 'No species in this class' : 'Aucune espèce dans cette classe'}</li>}
                  {list.map(s => {
                    const sel = s.id === selectedId;
                    return (
                      <li key={s.id}>
                        <button type="button" onClick={() => onSelect(s.id)} aria-current={sel}
                          className={`w-full text-left px-3 py-2 cursor-pointer text-xs flex items-center justify-between gap-2 ${sel ? 'bg-sage-100/90 text-sage-900 font-semibold border-l-4 border-sage-600 pl-2.5' : 'hover:bg-white/70 text-gray-700'}`}>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 truncate">
                              {sel && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0" />}
                              <span className="truncate">{nameOf(s)}</span>
                            </span>
                            <span className="block text-[11px] italic text-gray-500 truncate">{s.scientificName}</span>
                          </span>
                          {s.iucnStatus && (
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${s.iucnStatus === 'CR' || s.iucnStatus === 'EN' ? 'bg-red-50 text-red-700 border border-red-200' : s.iucnStatus === 'VU' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-600'}`}>
                              {s.iucnStatus}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
