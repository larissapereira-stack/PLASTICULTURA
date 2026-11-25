import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter type 0
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function mixColor(bg, fg, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return [
    bg[0] * (1 - a) + fg[0] * a,
    bg[1] * (1 - a) + fg[1] * a,
    bg[2] * (1 - a) + fg[2] * a,
    255,
  ];
}

function renderIcon(size, { maskable = false, rounded = true } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.72 : 0.88;
  const radiusCorner = rounded && !maskable ? size * 0.21875 : 0;

  const samples = 2; // 2x2 super-sampling for crisp anti-aliased edges
  const invSamples = 1 / (samples * samples);

  const samplePixel = (nx, ny) => {
    // Background gradient (#4A072E -> #8E1057)
    const t = Math.max(0, Math.min(1, (nx + ny) * 0.5));
    const bgR = 74 + (142 - 74) * t;
    const bgG = 7 + (16 - 7) * t;
    const bgB = 46 + (87 - 46) * t;
    let color = [bgR, bgG, bgB, 255];

    // Normalized emblem coordinates centered at (0.5, 0.5)
    const ex = (nx - 0.5) / scale;
    const ey = (ny - 0.5) / scale;

    // Outer pink ellipse (#D65F95 -> #E882B0)
    const outerDist = (ex / 0.30) ** 2 + (ey / 0.35) ** 2;
    if (outerDist <= 1) {
      color = [218, 95, 149, 255];
      // Lower deep plum ellipse (#6F0C45)
      const innerLower = (ex / 0.255) ** 2 + ((ey - 0.055) / 0.275) ** 2;
      if (innerLower <= 1) {
        color = [111, 12, 69, 255];
      }
      // Upper light pink ellipse (#E376A8)
      const innerUpper = (ex / 0.22) ** 2 + ((ey + 0.155) / 0.195) ** 2;
      if (innerUpper <= 1) {
        color = [226, 118, 168, 255];
      }
    }

    // White 'C' arc centered at (0, -0.155)
    const cx = ex;
    const cy = ey + 0.155;
    const r = Math.hypot(cx, cy);
    const angle = Math.atan2(cy, cx); // -PI..PI, right side is ~0
    const openAngle = 0.72; // opening facing right
    if (r >= 0.078 && r <= 0.124 && Math.abs(angle) >= openAngle) {
      color = [255, 255, 255, 255];
    }
    // Rounded caps for the C
    const capRadius = 0.023;
    const capCenterR = 0.101;
    for (const sign of [-1, 1]) {
      const capX = capCenterR * Math.cos(sign * openAngle);
      const capY = capCenterR * Math.sin(sign * openAngle);
      if (Math.hypot(cx - capX, cy - capY) <= capRadius) {
        color = [255, 255, 255, 255];
      }
    }

    return color;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rAcc = 0;
      let gAcc = 0;
      let bAcc = 0;
      let aAcc = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;

          // Rounded rectangle alpha mask
          let inside = true;
          if (radiusCorner > 0) {
            const dx = Math.max(radiusCorner - px, 0, px - (size - radiusCorner));
            const dy = Math.max(radiusCorner - py, 0, py - (size - radiusCorner));
            if (dx * dx + dy * dy > radiusCorner * radiusCorner) {
              inside = false;
            }
          }

          if (!inside) continue;
          const [r, g, b, a] = samplePixel(px / size, py / size);
          rAcc += r;
          gAcc += g;
          bAcc += b;
          aAcc += a;
        }
      }

      const idx = (y * size + x) * 4;
      const alpha = aAcc * invSamples;
      if (alpha > 0) {
        rgba[idx] = Math.round(rAcc / (aAcc / 255));
        rgba[idx + 1] = Math.round(gAcc / (aAcc / 255));
        rgba[idx + 2] = Math.round(bAcc / (aAcc / 255));
        rgba[idx + 3] = Math.round(alpha);
      } else {
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 0;
      }
    }
  }

  return encodePng(size, size, rgba);
}

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-192x192.png'), renderIcon(192, { maskable: false, rounded: true }));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-512x512.png'), renderIcon(512, { maskable: false, rounded: true }));
fs.writeFileSync(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'), renderIcon(512, { maskable: true, rounded: false }));
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), renderIcon(180, { maskable: false, rounded: false }));
console.log('Generated PWA PNG icons in public/.');
