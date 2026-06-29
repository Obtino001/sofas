const SECTION_SELECTOR =
  '#MainContent > .shopify-section, .shopify-section-group-footer-group .shopify-section';
const REVEAL_CLASS = 'premium-scroll-reveal';
const STATIC_CLASS = 'premium-scroll-reveal--static';
const DESIGN_MODE_CLASS = 'premium-scroll-reveal--design-mode';
const NO_MOTION_CLASS = 'premium-scroll-reveal--no-motion';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const supportsViewTimeline =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

let scrollSections = [];
let scrollTicking = false;
let scrollBound = false;

function getRevealSections(root = document) {
  if (root.matches?.(SECTION_SELECTOR)) {
    return root.closest('cart-drawer, .drawer, [hidden]') ? [] : [root];
  }

  const container = root === document ? document : root;
  return Array.from(container.querySelectorAll(SECTION_SELECTOR)).filter(
    (section) => !section.closest('cart-drawer, .drawer, [hidden]')
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function updateScrollLinkedReveals() {
  const viewportHeight = window.innerHeight;

  scrollSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const start = viewportHeight * 0.98;
    const end = viewportHeight * 0.52;
    const raw = (start - rect.top) / (start - end);
    const progress = easeOutCubic(clamp(raw, 0, 1));

    section.style.setProperty('--reveal-progress', progress);
    section.style.setProperty('--reveal-opacity', progress);
  });

  scrollTicking = false;
}

function onScroll() {
  if (scrollTicking || scrollSections.length === 0) return;
  scrollTicking = true;
  requestAnimationFrame(updateScrollLinkedReveals);
}

function bindScrollFallback() {
  if (scrollBound || supportsViewTimeline || scrollSections.length === 0) return;

  scrollBound = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateScrollLinkedReveals();
}

function initPremiumScrollReveal(root = document, isDesignModeEvent = false) {
  const sections = getRevealSections(root);
  if (sections.length === 0) return;

  const mainSections = sections.filter((section) => section.closest('#MainContent'));

  sections.forEach((section) => {
    section.classList.add(REVEAL_CLASS);

    const isFirstMainSection = mainSections[0] === section;

    if (prefersReducedMotion.matches) {
      section.classList.add(NO_MOTION_CLASS, STATIC_CLASS);
      return;
    }

    if (isDesignModeEvent) {
      section.classList.add(DESIGN_MODE_CLASS, STATIC_CLASS);
      return;
    }

    if (isFirstMainSection) {
      section.classList.add(STATIC_CLASS);
    }
  });

  if (!prefersReducedMotion.matches && !isDesignModeEvent && !supportsViewTimeline) {
    scrollSections = getRevealSections(document).filter(
      (section) => !section.classList.contains(STATIC_CLASS)
    );
    bindScrollFallback();
  }
}

window.addEventListener('DOMContentLoaded', () => initPremiumScrollReveal());

if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => initPremiumScrollReveal(event.target, true));
  document.addEventListener('shopify:section:reorder', () => initPremiumScrollReveal(document, true));
}
