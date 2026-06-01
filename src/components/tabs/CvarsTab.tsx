/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Terminal, Search, ChevronLeft, ChevronRight as ChevronRightIcon, RefreshCw } from 'lucide-react';
import { CVARS_PER_PAGE } from '../../constants/cvars';
import { useCvarsContext } from '../../context/CvarsContext';

export default function CvarsTab() {
  const {
    setShowRawModal,
    cvars,
    isLoadingCvars,
    fetchCvars,
    updateCvar,
  } = useCvarsContext();

  // View state for the CVars tab: the search query, the current page, and the
  // filtered/paginated slices derived from the shared cvars data.
  const [cvarSearch, setCvarSearch] = useState('');
  const [cvarPage, setCvarPage] = useState(1);

  const filteredCvars = cvars.filter(c =>
    c.name.toLowerCase().includes(cvarSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(cvarSearch.toLowerCase())
  );

  const paginatedCvars = filteredCvars.slice((cvarPage - 1) * CVARS_PER_PAGE, cvarPage * CVARS_PER_PAGE);
  const totalPages = Math.ceil(filteredCvars.length / CVARS_PER_PAGE);

  return (
    <>
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">Server Variables</h2>
          <div className="px-3 py-1 bg-cs-blue/10 border border-cs-blue/20 rounded-full text-cs-blue text-[10px] font-bold tracking-widest">
              {filteredCvars.length} Loaded
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cs-muted" />
              <input 
                  type="text" 
                  placeholder="Search variables (e.g. mp_roundtime)"
                  className="bg-cs-bg-panel border border-cs-border rounded px-10 py-2.5 text-xs w-80 focus:border-cs-yellow outline-none transition-all"
                  value={cvarSearch}
                  onChange={(e) => {
                    setCvarSearch(e.target.value);
                    setCvarPage(1);
                  }}
              />
            </div>
            <button 
              onClick={() => setShowRawModal(true)}
              className="p-2.5 bg-cs-bg-panel border border-cs-border hover:bg-cs-border/50 rounded transition-colors text-[10px] font-bold tracking-widest text-cs-muted hover:text-white flex items-center gap-2"
            >
              <Terminal className="w-3.5 h-3.5" /> Raw View
            </button>
            <button
              onClick={() => { fetchCvars(); setCvarPage(1); }}
              className="p-2.5 bg-cs-bg-panel border border-cs-border hover:bg-cs-border/50 rounded transition-colors"
              title="Force Fetch All"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCvars ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      <div className="flex-1 bg-cs-bg-panel border border-cs-border rounded-lg overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-cs-bg-main z-10 border-b border-cs-border">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted uppercase tracking-widest">Variable Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted uppercase tracking-widest">Current Value</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted uppercase tracking-widest">Flags</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-cs-muted uppercase tracking-widest">Documentation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cs-border/30">
                {isLoadingCvars && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-cs-muted font-mono animate-pulse">
                      INITIATING DIRECTORY SYNC WITH CLUSTER...
                    </td>
                  </tr>
                )}
                {!isLoadingCvars && paginatedCvars.map(cvar => (
                  <tr key={cvar.name} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-cs-yellow">{cvar.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                            defaultValue={cvar.value}
                            className="bg-transparent border border-transparent group-hover:border-cs-border/50 rounded px-2 py-1 text-xs font-mono outline-none focus:bg-black/50 focus:border-cs-yellow transition-all w-full max-w-[120px]"
                            onBlur={(e) => {
                              if (e.target.value !== cvar.value) {
                                updateCvar(cvar.name, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-cs-muted leading-tight block max-w-[150px] uppercase">
                            {cvar.flags || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] text-cs-muted leading-relaxed italic line-clamp-2 max-w-[400px]">
                            {cvar.description || 'No specialized system documentation available.'}
                        </p>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-cs-border bg-cs-bg-main flex items-center justify-between shrink-0">
              <div className="text-[10px] font-bold text-cs-muted uppercase tracking-widest">
                Showing {(cvarPage - 1) * CVARS_PER_PAGE + 1} to {Math.min(cvarPage * CVARS_PER_PAGE, filteredCvars.length)} of {filteredCvars.length}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1 overflow-x-auto max-w-[200px] no-scrollbar">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        if (cvarPage <= 3) pageNum = i + 1;
                        else if (cvarPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = cvarPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCvarPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                            cvarPage === pageNum 
                              ? 'bg-cs-yellow text-black' 
                              : 'bg-cs-bg-panel border border-cs-border text-cs-muted hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                </div>

                <div className="flex gap-2 border-l border-cs-border pl-4">
                    <button 
                      disabled={cvarPage === 1}
                      onClick={() => setCvarPage(p => p - 1)}
                      className="p-2 border border-cs-border rounded disabled:opacity-20 hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      disabled={cvarPage === totalPages}
                      onClick={() => setCvarPage(p => p + 1)}
                      className="p-2 border border-cs-border rounded disabled:opacity-20 hover:bg-white/5 transition-colors"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>
          </div>
      </div>
    </>
  );
}
