export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const lerp = (a, b, t) => a + (b - a) * t;

export const distance = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
};

export const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const toDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const createSvgImage = (svg) => {
  const img = new Image();
  img.src = toDataUri(svg);
  return img;
};

export const normalize = (v) => {
  const mag = Math.hypot(v.x, v.y);
  if (!mag) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / mag, y: v.y / mag };
};
