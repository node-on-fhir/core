// imports/ui/theme/ambianceAnalysis.js
//
// Palette extraction + neutral-space analysis for ambiance backgrounds.
// analyzeImageData() is pure math over an RGBA byte array (unit-tested,
// dependency-free); analyzeAmbianceImage() is the browser wrapper that
// downsamples an <img> through a canvas and feeds it in. Outputs a draft
// curation record for the background library. Curated values in the library
// always win over these computed suggestions. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

// Rec. 709 relative luminance, 0..1.
function luminance(r, g, b) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Mean + variance of luminance for pixels whose x falls in [x0, x1).
function thirdStats(img, x0, x1) {
  const { data, width, height } = img;
  let sum = 0, sumSq = 0, n = 0;
  for (let y = 0; y < height; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const l = luminance(data[i], data[i + 1], data[i + 2]);
      sum += l; sumSq += l * l; n++;
    }
  }
  const mean = n ? sum / n : 0;
  return { mean: mean, variance: n ? (sumSq / n) - (mean * mean) : 0 };
}

function toHex(v) {
  const s = Math.round(v).toString(16);
  return s.length === 1 ? '0' + s : s;
}

// Dominant colors: quantize to 4 bits/channel, count buckets, return the top
// 3 distinct buckets as hex (bucket-center color).
function dominantColors(img) {
  const { data, width, height } = img;
  const counts = {};
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.keys(counts)
    .sort(function(a, b) { return counts[b] - counts[a]; })
    .slice(0, 3)
    .map(function(key) {
      const k = parseInt(key, 10);
      const r = ((k >> 8) & 0xf) * 16 + 8;
      const g = ((k >> 4) & 0xf) * 16 + 8;
      const b = (k & 0xf) * 16 + 8;
      return '#' + toHex(r) + toHex(g) + toHex(b);
    });
}

export function analyzeImageData(img) {
  const w = img.width;
  const t1 = Math.floor(w / 3);
  const t2 = Math.floor((2 * w) / 3);
  const thirds = [
    { focus: 'left', stats: thirdStats(img, 0, t1) },
    { focus: 'center', stats: thirdStats(img, t1, t2) },
    { focus: 'right', stats: thirdStats(img, t2, w) }
  ];

  // Neutral space = the calmest (lowest-variance) third.
  const calmest = thirds.reduce(function(best, cur) {
    return cur.stats.variance < best.stats.variance ? cur : best;
  });

  // Overall luminance decides which ink family survives the image.
  const overallMean = (thirds[0].stats.mean + thirds[1].stats.mean + thirds[2].stats.mean) / 3;

  // Scrim scales with the busyness of the third content will sit on.
  // Variance of luminance tops out at 0.25 (half-black/half-white).
  const scrim = Math.min(0.8, Math.max(0.35, 0.35 + (calmest.stats.variance / 0.25) * 0.45));

  return {
    focus: calmest.focus,
    recommendedPageMode: overallMean >= 0.5 ? 'light' : 'dark',
    scrimStrength: Math.round(scrim * 100) / 100,
    palette: dominantColors(img)
  };
}

// Browser wrapper: downsample via canvas (≤96px wide keeps this O(10k) pixels)
// and analyze. Resolves null on any failure — callers treat null as
// "no suggestions", never as an error.
export function analyzeAmbianceImage(src) {
  return new Promise(function(resolve) {
    if (typeof document === 'undefined') { resolve(null); return; }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = function() {
      try {
        const scale = Math.min(1, 96 / image.naturalWidth);
        const w = Math.max(3, Math.round(image.naturalWidth * scale));
        const h = Math.max(3, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, w, h);
        resolve(analyzeImageData(ctx.getImageData(0, 0, w, h)));
      } catch (error) {
        resolve(null); // tainted canvas / decode failure — no suggestions
      }
    };
    image.onerror = function() { resolve(null); };
    image.src = src;
  });
}
