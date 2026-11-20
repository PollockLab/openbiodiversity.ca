import React from 'react';
import { Span, LAST_YEAR, TIMELINE_START } from '../data/sdmTemporal';

// Two-handle year range: the shaded span is the evidence period, everything after it is the test period
const T0 = TIMELINE_START;
export default function Timeline({ from, to, onChange, lang }: { from: number; to: number; onChange: (s: Span) => void; lang: string }) {
  const pct = (y: number) => `${(y - T0) / (LAST_YEAR - T0) * 100}%`;
  const thumb = 'absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sage-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-sage-600';
  return (
    <div className="flex flex-col w-full max-w-72 px-1">
      <div className="relative h-4">
        <div className="absolute top-1.5 left-0 right-0 h-1 rounded bg-gray-200" />
        <div className="absolute top-1.5 h-1 bg-sage-500" style={{ left: pct(from), width: `calc(${pct(to)} - ${pct(from)})` }} />
        <div className="absolute top-1.5 h-1 bg-amber-400" style={{ left: pct(to + 1), right: 0 }} />
        <input type="range" min={T0} max={LAST_YEAR - 1} value={from} onChange={(e) => onChange([Math.min(+e.target.value, to), to])} aria-label={lang === 'EN' ? 'Evidence from' : 'Preuves depuis'} className={thumb} />
        <input type="range" min={T0} max={LAST_YEAR - 1} value={to} onChange={(e) => onChange([from, Math.max(+e.target.value, from)])} aria-label={lang === 'EN' ? 'Evidence to' : "Preuves jusqu'à"} className={thumb} />
      </div>
      <div className="flex justify-between gap-1 text-[10px] tabular-nums whitespace-nowrap">
        <span className="text-gray-600">{T0}</span>
        <span className="text-sage-700 font-medium">{lang === 'EN' ? 'Evidence' : 'Preuves'} {from}–{to}</span>
        <span className="text-amber-700 font-medium">Test {to + 1}{to + 1 < LAST_YEAR ? `–${LAST_YEAR}` : ''}</span>
        <span className="text-gray-600">{LAST_YEAR}</span>
      </div>
    </div>
  );
}
