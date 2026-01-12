// AI Generated Effects. Do not edit manually.
import React, { useEffect, useRef } from "react";
import "./FloatingMarks.css";

export default function FloatingMarks({ count = 14 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getBounds = () => container.getBoundingClientRect();

    let bounds = getBounds();
    const icons = [];

    for (let i = 0; i < count; i++) {
      const size = 20 + Math.random() * 40; // 20-60 px
      const radius = size / 2;
      const x = Math.random() * (bounds.width - size) + radius;
      const y = Math.random() * (bounds.height - size) + radius;
      const speed = 30 + Math.random() * 90;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      icons.push({ x, y, vx, vy, size, radius });
    }

    let last = performance.now();
    let rafId;

    const update = (now) => {
      const dt = Math.min(50, now - last) / 1000; // seconds
      last = now;
      bounds = getBounds();

      // Move and wall collisions
      for (let k = 0; k < icons.length; k++) {
        const a = icons[k];
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        if (a.x - a.radius < 0) {
          a.x = a.radius;
          a.vx = Math.abs(a.vx) * 0.95;
        }
        if (a.x + a.radius > bounds.width) {
          a.x = bounds.width - a.radius;
          a.vx = -Math.abs(a.vx) * 0.95;
        }
        if (a.y - a.radius < 0) {
          a.y = a.radius;
          a.vy = Math.abs(a.vy) * 0.95;
        }
        if (a.y + a.radius > bounds.height) {
          a.y = bounds.height - a.radius;
          a.vy = -Math.abs(a.vy) * 0.95;
        }
      }

      // Pair collisions (simple elastic for equal mass)
      for (let i = 0; i < icons.length; i++) {
        for (let j = i + 1; j < icons.length; j++) {
          const A = icons[i];
          const B = icons[j];
          let dx = B.x - A.x;
          let dy = B.y - A.y;
          let dist = Math.hypot(dx, dy);
          const minDist = A.radius + B.radius;
          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            // resolve interpenetration
            A.x -= nx * overlap;
            A.y -= ny * overlap;
            B.x += nx * overlap;
            B.y += ny * overlap;

            // swap normal velocity components
            const vA = A.vx * nx + A.vy * ny;
            const vB = B.vx * nx + B.vy * ny;
            const dv = vA - vB;
            if (dv !== 0) {
              A.vx -= dv * nx;
              A.vy -= dv * ny;
              B.vx += dv * nx;
              B.vy += dv * ny;
            }
          }
        }
      }

      // Render positions
      for (let i = 0; i < icons.length; i++) {
        const el = document.getElementById(`gh-mark-${i}`);
        if (el) {
          const a = icons[i];
          const scale = a.size / 24;
          const tx = Math.round(a.x - a.radius);
          const ty = Math.round(a.y - a.radius);
          el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        }
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    const onResize = () => {
      bounds = getBounds();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [count]);

  return (
    <div className="floating-icons" ref={containerRef} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          id={`gh-mark-${i}`}
          className={`github-mark`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ transform: 'translate(-9999px, -9999px)' }}
        >
          <path d="M12 .297C5.37.297 0 5.667 0 12.297c0 5.286 3.438 9.773 8.205 11.363.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.204.087 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.606-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.468-2.382 1.236-3.222-.124-.304-.536-1.527.117-3.176 0 0 1.008-.323 3.301 1.23.957-.266 1.984-.399 3.005-.404 1.021.005 2.049.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.656 1.649.244 2.872.12 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.807 5.623-5.48 5.92.429.37.81 1.096.81 2.21 0 1.595-.014 2.877-.014 3.268 0 .32.217.694.825.576C20.565 22.067 24 17.582 24 12.297 24 5.667 18.627.297 12 .297z"/>
        </svg>
      ))}
    </div>
  );
}
