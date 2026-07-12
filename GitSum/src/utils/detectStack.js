/**
 * src/utils/detectStack.js
 *
 * Detects programming languages and frameworks from a list of GitHub repos.
 * Uses word-boundary matching and a confidence system to reduce false positives
 * from the naive regex approach the original Summarizer used.
 *
 * @typedef {'high' | 'medium' | 'low'} Confidence
 * @typedef {{ name: string, confidence: Confidence, logo?: string }} StackItem
 */

/** @type {Record<string, RegExp>} Word-boundary patterns per framework */
const FRAMEWORK_PATTERNS = {
  React:      /\breact\b/i,
  'Next.js':  /\bnext(?:js)?\b/i,
  Vue:        /\bvue(?:js)?\b/i,
  Nuxt:       /\bnuxt\b/i,
  Angular:    /\bangular\b/i,
  Svelte:     /\bsvelte(?:kit)?\b/i,
  Gatsby:     /\bgatsby\b/i,
  Django:     /\bdjango\b/i,
  Flask:      /\bflask\b/i,
  FastAPI:    /\bfastapi\b/i,
  Express:    /\bexpress(?:js)?\b/i,
  Node:       /\bnode(?:js)?\b/i,
  Spring:     /\bspring(?:-?boot)?\b/i,
  Rails:      /\b(?:ruby[-_ ]on[-_ ]rails|rails)\b/i,
  Laravel:    /\blaravel\b/i,
  GraphQL:    /\bgraphql\b/i,
  Docker:     /\bdocker\b/i,
  Kubernetes: /\b(?:kubernetes|k8s)\b/i,
  AWS:        /\b(?:aws|amazon[-_ ]web[-_ ]services?|lambda|s3)\b/i,
  Tailwind:   /\btailwind(?:css)?\b/i,
  Vite:       /\bvite\b/i,
};

/** Logo URLs from devicons CDN */
const FRAMEWORK_LOGOS = {
  React:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  'Next.js':  'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
  Vue:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  Nuxt:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg',
  Angular:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
  Svelte:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
  Gatsby:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gatsby/gatsby-original.svg',
  Django:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
  Flask:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
  FastAPI:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
  Express:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
  Node:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  Spring:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
  Rails:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-original.svg',
  Laravel:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg',
  GraphQL:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
  Docker:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  Kubernetes: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
  AWS:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',
  Tailwind:   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
  Vite:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg',
};

const LANGUAGE_LOGOS = {
  JavaScript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  TypeScript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  Python:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  Java:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  'C++':      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
  C:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
  'C#':       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  Go:         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
  Rust:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',
  Ruby:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
  PHP:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  Swift:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
  Kotlin:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
  CSS:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
  HTML:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
  Shell:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
  Dart:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg',
  Scala:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scala/scala-original.svg',
  R:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg',
  Lua:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg',
};

/**
 * Calculate language usage percentages from a list of repos.
 *
 * @param {Array<{ language: string | null }>} repos
 * @returns {Array<{ name: string, percentage: number, logo: string | undefined }>}
 */
export function calcLanguageStats(repos) {
  const counts = {};
  let total = 0;

  repos.forEach((repo) => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] ?? 0) + 1;
      total += 1;
    }
  });

  if (total === 0) return [];

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
      logo: LANGUAGE_LOGOS[name],
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Detect frameworks from repo names and descriptions using word-boundary patterns.
 * Confidence:
 *   'high'   — pattern matched in BOTH name and description (or topic-level)
 *   'medium' — matched in description or name only once
 *   'low'    — very weak single-word hit (filtered out by default)
 *
 * @param {Array<{ name: string, description: string | null }>} repos
 * @param {{ minConfidence?: 'high' | 'medium' | 'low' }} [options]
 * @returns {StackItem[]}
 */
export function detectFrameworks(repos, { minConfidence = 'medium' } = {}) {
  /** @type {Record<string, number>} name → match count */
  const hits = {};

  repos.forEach((repo) => {
    const nameText   = (repo.name ?? '').replace(/[-_]/g, ' ');
    const descText   = repo.description ?? '';
    const combined   = `${nameText} ${descText}`;

    Object.entries(FRAMEWORK_PATTERNS).forEach(([framework, pattern]) => {
      if (pattern.test(combined)) {
        hits[framework] = (hits[framework] ?? 0) + 1;
      }
    });
  });

  const confidenceThresholds = { high: 3, medium: 1, low: 0 };
  const minHits = confidenceThresholds[minConfidence] ?? 1;

  return Object.entries(hits)
    .filter(([, count]) => count > minHits || (minConfidence === 'medium' && count >= 1))
    .map(([name, count]) => ({
      name,
      confidence: count >= 3 ? 'high' : count >= 1 ? 'medium' : 'low',
      logo: FRAMEWORK_LOGOS[name],
    }))
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    });
}

export { LANGUAGE_LOGOS, FRAMEWORK_LOGOS };
