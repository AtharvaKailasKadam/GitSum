// Floating Language Logos with Physics-based Animation
// Created by AI - Generated Code
// Not to Change anything here without proper testing.
import React, { useEffect, useRef } from "react";
import "./FloatingLanguages.css";

export default function FloatingLanguages({ languages = {} }) {
  const containerRef = useRef(null);

  const languageLogos = {
    JavaScript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    Python: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    Java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
    "C++": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
    C: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
    TypeScript: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    Go: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
    Rust: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg",
    Ruby: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
    PHP: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
    Swift: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
    Kotlin: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
    CSS: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
    HTML: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
    SQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
    Shell: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
    "Objective-C": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/objectivec/objectivec-plain.svg",
    Dart: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg",
    Clojure: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/clojure/clojure-original.svg",
    Scala: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scala/scala-original.svg",
    R: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
    Perl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/perl/perl-original.svg",
    Lua: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg",
  };

  const floatingLanguages = Object.keys(languages).slice(0, 12);

  useEffect(() => {
    // Respect prefers-reduced-motion — skip the entire animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const container = containerRef.current;
    if (!container || floatingLanguages.length === 0) return;

    const getBounds = () => container.getBoundingClientRect();
    let bounds = getBounds();
    const logos = [];

    // Initialize logos with physics properties
    for (let i = 0; i < floatingLanguages.length; i++) {
      const size = 40 + Math.random() * 60; // 40-100 px (bold/large)
      const radius = size / 2;
      const x = Math.random() * (bounds.width - size) + radius;
      const y = Math.random() * (bounds.height - size) + radius;
      const speed = 20 + Math.random() * 60;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      logos.push({ x, y, vx, vy, size, radius, lang: floatingLanguages[i] });
    }

    let last = performance.now();
    let rafId;
    let paused = document.hidden;

    const update = (now) => {
      if (paused) {
        rafId = requestAnimationFrame(update);
        return;
      }
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      bounds = getBounds();

      // Move and wall collisions
      for (let k = 0; k < logos.length; k++) {
        const a = logos[k];
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
      for (let i = 0; i < logos.length; i++) {
        for (let j = i + 1; j < logos.length; j++) {
          const A = logos[i];
          const B = logos[j];
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
      for (let i = 0; i < logos.length; i++) {
        const el = document.getElementById(`language-logo-${i}`);
        if (el) {
          const a = logos[i];
          const scale = a.size / 50;
          el.style.transform = `translate(${a.x - a.radius}px, ${a.y - a.radius}px) scale(${scale})`;
        }
      }

      rafId = requestAnimationFrame(update);
    };

    // Pause/resume on tab visibility change
    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) last = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);

    rafId = requestAnimationFrame(update);

    const handleResize = () => {
      bounds = getBounds();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [floatingLanguages]);

  if (floatingLanguages.length === 0) return null;

  return (
    <div className="floating-languages-container" ref={containerRef}>
      {floatingLanguages.map((lang, i) => (
        <div
          key={i}
          id={`language-logo-${i}`}
          className="language-logo"
          title={lang}
        >
          <img
            src={languageLogos[lang]}
            alt={lang}
            crossOrigin="anonymous"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect fill='%23ff9c42' width='50' height='50' rx='8'/%3E%3Ctext x='25' y='28' text-anchor='middle' fill='%23fff' font-size='14' font-weight='bold'%3E{lang.charAt(0)}%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      ))}
    </div>
  );
}
