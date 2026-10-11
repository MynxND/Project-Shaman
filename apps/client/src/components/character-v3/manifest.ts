export type ReviewPoint = { x: number; y: number };
export type V3Panel = {
  id: 'V2' | 'A' | 'B' | 'C'; label: string; role: string; targetHeads: number | null;
  headHeight: number; headHeightRange: [number, number]; headWidth: number;
  figureHeight: number; top: number; chin: number; ratio: number;
  baseline: number; shoulder: number; waist: number; url: string; sha256: string;
  sourcePath: string; sourceMethod: string; visualApproved: false;
  anchors: Record<string, ReviewPoint>;
};
export type V3Manifest = {
  version: string; panels: V3Panel[];
  diagnostics: { nativeUrl: string; nearest4xUrl: string };
};

export function parseV3Manifest(input: unknown): V3Manifest {
  const requireValue = (condition: unknown, reason: string) => {
    if (!condition) throw new Error(`V3 manifest: ${reason}`);
  };
  requireValue(typeof input === 'object' && input !== null, 'missing object');
  const data = input as Record<string, unknown>;
  requireValue(data.version === 'shaman-base-character-v3-front-prototype/1', 'version');
  requireValue(data.direction === 'south' && data.state === 'idle' && data.frameCount === 1, 'front static only');
  requireValue(JSON.stringify(data.timeline) === '[null]', 'static timeline');
  requireValue(data.method === 'original-manual-pixel-clusters' && data.jobId === null, 'manual provenance');
  requireValue(data.paidCalls === 0 && data.creditsSpent === 0 && data.paidBudgetApproved === false, 'paid gate');
  const canvas = data.canvas as { width?: number; height?: number; origin?: ReviewPoint } | undefined;
  requireValue(canvas?.width === 128 && canvas?.height === 128 && canvas?.origin?.x === 61 && canvas?.origin?.y === 112, 'native canvas/origin');
  const review = data.review as Record<string, unknown> | undefined;
  requireValue(review && ['userVisualAccepted', 'anchorsApproved', 'bodyLocked', 'productionReady'].every(key => review[key] === false), 'unapproved review gates');
  const gates = data.gates as Record<string, unknown> | undefined;
  requireValue(gates && ['otherDirections', 'hair', 'outfit', 'weapons', 'accessories', 'animation', 'liveIntegration'].every(key => gates[key] === false), 'scope gates');
  requireValue(data.semanticLandmarksProvisional === true, 'provisional landmarks');
  requireValue(Array.isArray(data.panels) && data.panels.length === 4, 'four panels');
  const panels = data.panels as V3Panel[];
  const expected = ['V2', 'A', 'B', 'C'];
  const heights = [93, 90, 98, 105];
  panels.forEach((panel, index) => {
    requireValue(panel && panel.id === expected[index], 'panel identity/order');
    requireValue(panel.figureHeight === heights[index] && panel.top === 113 - heights[index]! && panel.baseline === 112, 'measured height/baseline');
    requireValue(panel.headHeight === (index === 0 ? 29 : 30) && panel.headWidth === (index === 0 ? 31 : 34), 'head geometry');
    requireValue(panel.visualApproved === false, 'comparison is not visual approval');
    requireValue(panel.role === (index === 0 ? 'unchanged-reference' : 'provisional-candidate'), 'reference/candidate role');
    requireValue(panel.url === `/assets/character-v3/proportion-front-01/${panel.id}.png`, 'asset URL');
    requireValue(typeof panel.sha256 === 'string' && /^[a-f0-9]{64}$/.test(panel.sha256), 'source hash');
    requireValue(panel.anchors && typeof panel.anchors === 'object', 'anchors');
    for (const name of ['head', 'neck', 'shoulderLeft', 'shoulderRight', 'elbowLeft', 'elbowRight', 'handLeft', 'handRight', 'waist', 'hipLeft', 'hipRight', 'kneeLeft', 'kneeRight', 'foot', 'footLeft', 'footRight', 'hair', 'headgear', 'mainHand', 'offHand', 'accessories']) {
      const point = panel.anchors[name];
      requireValue(point && Number.isInteger(point.x) && Number.isInteger(point.y) && point.x >= 0 && point.x < 128 && point.y >= 0 && point.y < 128, `anchor ${name}`);
    }
  });
  const diagnostics = data.diagnostics as V3Manifest['diagnostics'] | undefined;
  requireValue(diagnostics?.nativeUrl === '/assets/character-v3/proportion-front-01/comparison-native.png' && diagnostics.nearest4xUrl === '/assets/character-v3/proportion-front-01/comparison-4x.png', 'diagnostic URLs');
  return { version: data.version as string, panels, diagnostics: diagnostics! };
}