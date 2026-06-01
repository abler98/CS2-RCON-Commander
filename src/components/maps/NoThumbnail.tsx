/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Map as MapIcon } from 'lucide-react';

// Placeholder shown when a map has no thumbnail. Rendered twice in the grid
// card: once visibly (no thumb), once as a `.fallback hidden` block that the
// <img> onError handler reveals — so the className is caller-controlled.
export default function NoThumbnail({ className }: { className?: string }) {
  return (
    <div className={className}>
      <MapIcon className="w-8 h-8 text-cs-muted/20 mb-2" />
      <span className="text-[9px] font-bold tracking-widest uppercase text-cs-muted/40">
        No Thumbnail
      </span>
    </div>
  );
}
