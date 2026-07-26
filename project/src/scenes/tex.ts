import Phaser from 'phaser';

// texReady: a texture key is safe to render ONLY when its source image has actually
// DECODED. textures.exists() returns true the instant addBase64 registers the key,
// but in the single-file prod build the data-URI decode is async — in slower webviews
// (Electron/Claude desktop) a sprite can be rendered before decode completes, and
// Phaser's Canvas renderer then calls drawImage(null) and crashes the whole game
// (real player report v1.0.4: 'could not enter the Micromanager fight' — the zone-3
// boss texture wasn't decoded yet). Every add.image guard uses this instead of
// exists(), so an un-decoded/failed texture falls back to the placeholder rect —
// an ugly boss beats a hard crash that blocks progress forever.
export function texReady(scene: Phaser.Scene, key: string): boolean {
  if (!scene.textures.exists(key)) return false;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  return !!src && (src.width || 0) > 0 && (src.height || 0) > 0;
}
