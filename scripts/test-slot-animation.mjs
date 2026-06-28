// Inline checks mirroring src/lib/glyphs/slotAnimation.ts (no TS runner in CI)

function animatedSymbolCountFromDocument(clusters) {
  let total = 0;
  for (const cluster of clusters) {
    if (cluster.baseAlt) total++;
    if (cluster.markAlts) {
      for (const alt of cluster.markAlts) {
        if (alt) total++;
      }
    }
  }
  return total;
}

function validateAnimationSlot(pack, frameAKey, frameBKey) {
  if (!frameBKey) return { ok: false, reason: 'No alternate frame selected' };
  if (frameBKey === frameAKey) return { ok: false, reason: 'Alternate must differ from current symbol' };
  if (!pack.symbols[frameAKey]) return { ok: false, reason: 'Invalid base symbol' };
  if (!pack.symbols[frameBKey]) return { ok: false, reason: 'Invalid alternate symbol' };
  return { ok: true };
}

function setSlotAlt(clusters, ref, altKey) {
  return clusters.map((cluster, clusterIdx) => {
    if (clusterIdx !== ref.clusterIdx) return cluster;

    if (ref.kind === 'base') {
      if (!altKey) {
        const { baseAlt, ...rest } = cluster;
        return rest;
      }
      return { ...cluster, baseAlt: altKey };
    }

    const markIdx = ref.markIdx ?? 0;
    const markAlts = [...(cluster.markAlts ?? Array(cluster.marks.length).fill(undefined))];
    while (markAlts.length < cluster.marks.length) markAlts.push(undefined);

    if (!altKey) {
      markAlts[markIdx] = undefined;
      const hasAny = markAlts.some(Boolean);
      if (!hasAny) {
        const { markAlts: _removed, ...rest } = cluster;
        return rest;
      }
      return { ...cluster, markAlts };
    }

    markAlts[markIdx] = altKey;
    return { ...cluster, markAlts };
  });
}

const pack = {
  symbols: {
    'U+0028': {},
    'U+0029': {},
    'U+032B': {},
  },
};

let failed = 0;

function assert(label, condition) {
  if (!condition) {
    console.error(`FAIL ${label}`);
    failed++;
  }
}

const clusters = [{ base: 'U+0028', marks: ['U+032B'] }];
assert('initial animated count', animatedSymbolCountFromDocument(clusters) === 0);

const withBaseAnim = setSlotAlt(clusters, { clusterIdx: 0, kind: 'base' }, 'U+0029');
assert('base anim count', animatedSymbolCountFromDocument(withBaseAnim) === 1);

const invalidSame = validateAnimationSlot(pack, 'U+0028', 'U+0028');
assert('reject same frame', !invalidSame.ok);

if (failed > 0) {
  console.error(`${failed} slot animation tests failed`);
  process.exit(1);
}

console.log('All slot animation unit checks passed');
