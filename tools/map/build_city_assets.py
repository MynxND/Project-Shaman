"""Brings Umbral Capital v2 PixelLab art (tools/map/generate_city_assets.ps1) into the client.

Reads docs/design/umbral-v2/raw/ and merges into apps/client/public/assets/umbral/manifest.json (the v1 entries written
by tools/sprites/build_umbral_assets.py stay):
- objects: cropped to their opaque bounds + 1 px, NOT resampled (PixelLab draws at the map's 16 asset px per unit),
  anchor = bottom centre of the opaque pixels; written to objects/<id>.png.
- decals: same crop, anchor = centre; written to decals/<id>.png.
- tilesets: sheet + per-tile corners from the PixelLab metadata (NW, NE, SW, SE; 1 = upper terrain), with the terrain
  ids named in TILESETS; written to tilesets/<id>.png.
Usage: python -I tools/map/build_city_assets.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'docs/design/umbral-v2/raw'
OUT = ROOT / 'apps/client/public/assets/umbral'
ASSET_PX_PER_UNIT = 16

# Raw file id -> map asset id (objects stand on the ground, decals lie flat).
OBJECTS = {
    'lantern': 'ritual-lantern',
    'spirit-pillar': 'spirit-pillar',
    'sacred-tree': 'sacred-tree',
    'house-front': 'teak-house',
    # First-size brazier/guardian/flowerbed/pillar came out too large beside the player (kept in raw/); "-s" are used.
    'ritual-pillar-s': 'ritual-pillar',
    'brazier-s': 'bronze-brazier',
    'guardian-s': 'yak-guardian',
    'banner-pole': 'talisman-banner',
    'flowerbed-s': 'lotus-flowerbed',
    'incense': 'incense-urn',
    # Level design pass + user prototype (2026-10-09).
    'temple-thai': 'thai-temple',
    'training-hall': 'training-hall',
    'house-stilt': 'stilt-house',
    'house-row': 'row-house',
    'fence': 'teak-fence',
    'dummy': 'training-dummy',
    'bridge-h': 'bridge-h',
    'bridge-v': 'bridge-v',
    'wall': 'city-wall',
    'tower': 'wall-tower',
    'pine2': 'cypress',  # 'pine' came with a small house attached; kept in raw/ only
    'blossom': 'blossom-tree',
    'bush': 'flower-bush',
    'lotus-pads': 'lotus-pads',
    'gate-thai': 'thai-gate',
    # Lighting redesign: talisman post (roads), spirit stone (sacred), ritual fire (ceremonial), hanging (buildings).
    'light-talisman': 'talisman-lantern',
    'light-spirit': 'spirit-lantern',
    'light-brazier': 'ritual-fire',
    'light-hanging': 'hanging-lantern',
    # Landscape pass. Rejected (raw/ only): 'stepping' (came out as drums), 'shrub-low' (on a ground tile).
    'reeds': 'reed-planter',
    'moss-stones': 'garden-shrine',  # asked for mossy stones, came out as a small mossy spirit shrine: used as one
    'clay-pots': 'clay-pots',
    'stone-bed': 'stone-bed',
    'small-tree': 'shade-tree',
    # Whispering Spiritwood (2026-10-09). 'sw-fern' came out as a small shrub; used as low undergrowth.
    'sw-bamboo': 'bamboo',
    'sw-jungle-tree': 'jungle-tree',
    'sw-mossy-rock': 'mossy-rock',
    'sw-fern': 'fern',
    'sw-cursed-tree': 'cursed-tree',
    'sw-ruined-shrine': 'ruined-shrine',
    'sw-spirit-house': 'spirit-house',
    'sw-noticeboard': 'noticeboard',
}
DECALS: dict[str, str] = {'yantra-disc': 'yantra-disc'}
# Raw tileset id -> (asset id, lower terrain, upper terrain).
TILESETS = {
    # Superseded (raw/ only): tiles-plaza (orange wicker), tiles-plaza2 + tiles-grass-road2 (busy blue-violet road
    # grid), tiles-grass-road (neon grass). The calm flagstone road chains on the same grass tile as water and earth.
    'tiles-road-calm': ('grass-road', 'grass', 'road'),
    'tiles-water': ('water-grass', 'water', 'grass'),
    'tiles-dirt': ('grass-dirt', 'grass', 'dirt'),
}


def crop(img: Image.Image) -> Image.Image:
    a = np.asarray(img)[..., 3] > 0
    ys, xs = np.where(a)
    return img.crop((max(0, xs.min() - 1), max(0, ys.min() - 1), min(img.width, xs.max() + 2), min(img.height, ys.max() + 2)))


def main():
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest.setdefault('decals', {})
    # Tilesets are rebuilt from TILESETS every run so superseded sets disappear from the game.
    manifest['tilesets'] = {}
    for folder in ('objects', 'decals', 'tilesets'):
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    for raw_id, asset_id in OBJECTS.items():
        src = RAW / f'{raw_id}.png'
        if not src.exists():
            print('missing', src.name)
            continue
        sprite = crop(Image.open(src).convert('RGBA'))
        a = np.asarray(sprite)[..., 3] > 0
        ys, xs = np.where(a)
        bottom = int(ys.max())
        base = xs[ys >= bottom - 2]
        anchor = {'x': int(round((base.min() + base.max()) / 2)), 'y': bottom}
        sprite.save(OUT / f'objects/{asset_id}.png')
        manifest['objects'][asset_id] = {'image': f'objects/{asset_id}.png', 'width': sprite.width, 'height': sprite.height, 'anchor': anchor, 'source': f'pixellab:{raw_id}'}
        print(f'object {asset_id:16s} {sprite.width}x{sprite.height} px = {sprite.width / ASSET_PX_PER_UNIT:.1f} x {sprite.height / ASSET_PX_PER_UNIT:.1f} units')
    for raw_id, asset_id in DECALS.items():
        src = RAW / f'{raw_id}.png'
        if not src.exists():
            print('missing', src.name)
            continue
        sprite = crop(Image.open(src).convert('RGBA'))
        sprite.save(OUT / f'decals/{asset_id}.png')
        manifest['decals'][asset_id] = {'image': f'decals/{asset_id}.png', 'width': sprite.width, 'height': sprite.height, 'source': f'pixellab:{raw_id}'}
        print(f'decal  {asset_id:16s} {sprite.width}x{sprite.height} px = {sprite.width / ASSET_PX_PER_UNIT:.1f} units across')
    for raw_id, (asset_id, lower, upper) in TILESETS.items():
        src, meta = RAW / f'{raw_id}.png', RAW / f'{raw_id}.json'
        if not src.exists() or not meta.exists():
            print('missing', raw_id)
            continue
        data = json.loads(meta.read_text(encoding='utf-8'))
        tiles = []
        for t in data['tileset_data']['tiles']:
            c, box = t['corners'], t['bounding_box']
            tiles.append({'x': box['x'], 'y': box['y'], 'size': box['width'], 'corners': [int(c[k] == 'upper') for k in ('NW', 'NE', 'SW', 'SE')]})
        Image.open(src).convert('RGBA').save(OUT / f'tilesets/{asset_id}.png')
        manifest['tilesets'][asset_id] = {'image': f'tilesets/{asset_id}.png', 'lower': lower, 'upper': upper, 'tiles': tiles, 'source': f'pixellab:{data["id"]}'}
        print(f'tileset {asset_id}: {lower} -> {upper}, {len(tiles)} tiles')
    build_side_wall(manifest)
    # Town NPCs: front-facing 128 px sprites drawn like the player (half scale), so they keep their full frame;
    # anchor = bottom centre of the feet.
    manifest['npcs'] = {}
    (OUT / 'npcs').mkdir(parents=True, exist_ok=True)
    for src in sorted(RAW.glob('npc-*.png')):
        sprite = crop(Image.open(src).convert('RGBA'))
        a = np.asarray(sprite)[..., 3] > 0
        ys, xs = np.where(a)
        bottom = int(ys.max())
        feet = xs[ys >= bottom - 2]
        sprite.save(OUT / f'npcs/{src.stem}.png')
        manifest['npcs'][src.stem] = {'image': f'npcs/{src.stem}.png', 'width': sprite.width, 'height': sprite.height, 'anchor': {'x': int(round((feet.min() + feet.max()) / 2)), 'y': bottom}, 'source': f'pixellab:{src.stem}'}
    print('npcs', len(manifest['npcs']))
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')


def build_side_wall(manifest):
    """East/west wall run: the Pro Flash 'wall-side' strip leans at its top, but rows 87-118 are straight and tile
    vertically with the smallest seam (searched over start row and length). A 128 px (8 unit) segment is that band
    repeated four times; segments are stacked end to end in the map, flipped for the east side."""
    src = RAW / 'wall-side.png'
    if not src.exists():
        print('missing wall-side.png')
        return
    band = Image.open(src).convert('RGBA').crop((0, 87, 48, 119))
    seg = Image.new('RGBA', (48, 128), (0, 0, 0, 0))
    for k in range(4):
        seg.alpha_composite(band, (0, k * 32))
    # Banner variant: the strip's own red banner (rows 43-70, on the stone face at x 30-41, the same columns as the
    # straight band) pasted onto the middle of a segment, so the alternating sections need no new generation.
    banner = Image.open(src).convert('RGBA').crop((30, 43, 42, 71))
    flagged = seg.copy()
    flagged.paste(banner, (30, 50))
    left, _, right, _ = seg.getbbox()
    box = (max(0, left - 1), 0, min(48, right + 1), 128)
    for asset_id, img, note in (('city-wall-side', seg, 'tiled rows 87-118'), ('city-wall-side-banner', flagged, 'tiled rows 87-118 + banner rows 43-70')):
        img = img.crop(box)
        img.save(OUT / f'objects/{asset_id}.png')
        manifest['objects'][asset_id] = {'image': f'objects/{asset_id}.png', 'width': img.width, 'height': img.height, 'anchor': {'x': img.width // 2, 'y': img.height - 1}, 'source': f'pixellab:wall-side ({note})'}
        print(f'object {asset_id} {img.width}x{img.height} px = {img.width / ASSET_PX_PER_UNIT:.1f} x {img.height / ASSET_PX_PER_UNIT:.1f} units')


if __name__ == '__main__':
    main()
