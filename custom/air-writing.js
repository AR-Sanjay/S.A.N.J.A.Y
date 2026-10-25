const canvas = document.createElement("canvas");
canvas.id = "sanjay-air-writing-canvas";
Object.assign(canvas.style, {
  position: "fixed",
  inset: "0",
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: "20"
});
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
const strokes = [];
let enabled = false;
let active = null;
let exploded = false;

const panel = document.createElement("div");
Object.assign(panel.style, {
  position: "fixed",
  left: "50%",
  bottom: "20px",
  transform: "translateX(-50%)",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "8px",
  zIndex: "99999",
  padding: "10px",
  background: "rgba(3, 12, 28, .88)",
  border: "1px solid rgba(0, 234, 255, .6)",
  borderRadius: "10px",
  font: "12px monospace"
});
document.body.appendChild(panel);

function button(label, action) {
  const b = document.createElement("button");
  b.textContent = label;
  Object.assign(b.style, {
    padding: "9px 12px",
    color: "#00eaff",
    background: "#071426",
    border: "1px solid #00aebe",
    borderRadius: "5px",
    cursor: "pointer",
    font: "inherit"
  });
  b.addEventListener("click", action);
  panel.appendChild(b);
  return b;
}

const toggle = button("AIR WRITE: OFF", () => {
  enabled = !enabled;
  active = null;
  toggle.textContent = `AIR WRITE: ${enabled ? "ON" : "OFF"}`;
  toggle.style.background = enabled ? "#06404a" : "#071426";
});

button("EXPLODE", () => {
  active = null;
  exploded = true;
  render();
});

button("ASSEMBLE", () => {
  exploded = false;
  render();
});

button("CLEAR", () => {
  active = null;
  strokes.length = 0;
  exploded = false;
  render();
});

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function project(point, camera) {
  if (!point || !camera) return null;
  const p = point.clone().project(camera);
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) ||
      p.z < -1 || p.z > 1) return null;

  return {
    x: (p.x + 1) * window.innerWidth / 2,
    y: (1 - p.y) * window.innerHeight / 2
  };
}

function render() {
  resize();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    const points = stroke.points;
    if (!points.length) continue;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      let x = points[i].x;
      let y = points[i].y;

      if (exploded) {
        const phase = i * 2.399;
        x += Math.cos(phase) * (12 + i % 28);
        y += Math.sin(phase) * (12 + i % 28);
      }

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#00cfff";
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.95;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

window.SANJAY_AIR_WRITING = {
  update(gestures, camera) {
    if (enabled) {
      for (const hand of gestures) {
        if (!hand.present) continue;

        if (hand.pinchStarted) {
          active = { points: [] };
          strokes.push(active);
          exploded = false;
        }

        if (hand.pinching && hand.pinchPoint) {
          if (!active) {
            active = { points: [] };
            strokes.push(active);
          }

          const point = project(hand.pinchPoint, camera);
          if (point) {
            const last = active.points.at(-1);
            if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 2) {
              active.points.push(point);
            }
          }
        }

        if (hand.pinchEnded) active = null;
      }

      if (!gestures.some(h => h.present && h.pinching)) active = null;
    }

    render();
  }
};
