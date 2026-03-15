import React, { useState } from 'react';

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return (
        <div className="flex items-center justify-center h-20 border border-dashed border-[#EDEAE3] text-[10px] text-[#1E1A14]/40 font-bold tracking-widest uppercase">
          Map unavailable
        </div>
      );
    return this.props.children;
  }
}
import { Article, SavedFilter } from '../types';
import MapFilter from './MapFilter';

const CATEGORIES = [
  'Politics', 'Economy', 'Health', 'Technology',
  'Environment', 'Defence and Security', 'Sports',
];

interface FilterBuilderScreenProps {
  articles: Article[];
  onSave: (filter: SavedFilter) => void;
  onClose: () => void;
  initial?: SavedFilter;
}

const FilterBuilderScreen: React.FC<FilterBuilderScreenProps> = ({
  articles,
  onSave,
  onClose,
  initial,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const [regions, setRegions] = useState<string[]>(initial?.regions ?? []);

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      categories,
      regions,
      enabled: initial?.enabled ?? true,
    });
    onClose();
  };

  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] bg-[#FAF7F0] flex flex-col">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-[#EDEAE3] bg-[#FAF7F0]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-[#1E1A14]/50 hover:text-[#1E1A14] transition-colors focus:outline-none"
          aria-label="Close filter builder"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>

        <div className="flex-1 text-[11px] font-black tracking-widest uppercase text-[#1E1A14]">
          {initial ? 'Edit Filter' : 'Build Filter'}
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="text-[10px] font-black tracking-widest uppercase px-5 py-2.5 bg-[#D4A843] text-[#1E1A14] disabled:opacity-30 hover:bg-[#c4983a] transition-colors focus:outline-none"
        >
          Save
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

          {/* Name */}
          <section>
            <SectionLabel label="Filter Name" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Middle East Politics"
              className="w-full px-4 py-3 border border-[#EDEAE3] bg-transparent text-[#1E1A14] text-sm placeholder-[#1E1A14]/30 focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
              autoFocus
            />
          </section>

          {/* Categories */}
          <section>
            <SectionLabel
              label="Categories"
              hint={categories.length === 0 ? 'All categories' : `${categories.length} selected`}
            />
            <p className="text-[10px] text-[#1E1A14]/40 mb-3">
              Select which categories to include. Leave empty to match all.
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const active = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    className={`text-[10px] font-bold tracking-wide uppercase px-3 py-1.5 border transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A843] ${
                      active
                        ? 'border-[#D4A843] bg-[#D4A843] text-[#1E1A14]'
                        : 'border-[#EDEAE3] text-[#1E1A14]/60 hover:border-[#D4A843]/60 hover:text-[#1E1A14]/80'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Location */}
          <section>
            <SectionLabel
              label="Location"
              hint={regions.length === 0 ? 'All regions' : `${regions.length} selected`}
            />
            <p className="text-[10px] text-[#1E1A14]/40 mb-3">
              Click regions on the map to include them. Leave empty to match all.
            </p>

            <MapErrorBoundary>
              <MapFilter
                articles={articles}
                multiSelect
                selectedRegions={regions}
                onSelectRegions={setRegions}
              />
            </MapErrorBoundary>

            {regions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {regions.map(r => (
                  <span
                    key={r}
                    className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 bg-[#D4A843] text-[#1E1A14]"
                  >
                    {r}
                    <button
                      onClick={() => setRegions(prev => prev.filter(x => x !== r))}
                      className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                      aria-label={`Remove ${r}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setRegions([])}
                  className="text-[10px] text-[#1E1A14]/40 hover:text-[#1E1A14]/60 font-bold tracking-wide uppercase underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </section>

          {/* Preview summary */}
          <section className="border border-[#EDEAE3] p-4">
            <div className="text-[9px] font-bold tracking-widest uppercase text-[#1E1A14]/40 mb-2">Filter Summary</div>
            <div className="text-[11px] text-[#1E1A14]/70 space-y-1">
              <div>
                <span className="font-bold text-[#1E1A14]">Name: </span>
                {name.trim() || <span className="italic text-[#1E1A14]/30">untitled</span>}
              </div>
              <div>
                <span className="font-bold text-[#1E1A14]">Categories: </span>
                {categories.length === 0 ? 'All' : categories.join(', ')}
              </div>
              <div>
                <span className="font-bold text-[#1E1A14]">Regions: </span>
                {regions.length === 0 ? 'All' : regions.join(', ')}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

const SectionLabel: React.FC<{ label: string; hint?: string }> = ({ label, hint }) => (
  <div className="flex items-baseline gap-3 mb-3">
    <div className="text-[10px] font-black tracking-widest uppercase text-[#D4A843]">{label}</div>
    {hint && (
      <div className="text-[9px] font-bold tracking-widest uppercase text-[#1E1A14]/40">{hint}</div>
    )}
  </div>
);

export default FilterBuilderScreen;
