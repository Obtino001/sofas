const SECTION_SELECTOR =
  '#MainContent > .shopify-section, .shopify-section-group-footer-group .shopify-section';
const REVEAL_CLASS = 'premium-scroll-reveal';
const VISIBLE_CLASS = 'premium-scroll-reveal--visible';
const DESIGN_MODE_CLASS = 'premium-scroll-reveal--design-mode';
const NO_MOTION_CLASS = 'premium-scroll-reveal--no-motion';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getRevealSections(root = document) {
  if (root.matches?.(SECTION_SELECTOR)) {
    return root.closest('cart-drawer, .drawer, [hidden]') ? [] : [root];
  }

  const container = root === document ? document : root;
  return Array.from(container.querySelectorAll(SECTION_SELECTOR)).filter(
    (section) => !section.closest('cart-drawer, .drawer, [hidden]')
  );
}

function markVisible(section) {
  section.classList.add(VISIBLE_CLASS);
}

function initPremiumScrollReveal(root = document, isDesignModeEvent = false) {
  const sections = getRevealSections(root);
  if (sections.length === 0) return;

  if (prefersReducedMotion.matches) {
    sections.forEach((section) => {
      section.classList.add(REVEAL_CLASS, NO_MOTION_CLASS, VISIBLE_CLASS);
    });
    return;
  }

  if (isDesignModeEvent) {
    sections.forEach((section) => {
      section.classList.add(REVEAL_CLASS, DESIGN_MODE_CLASS, VISIBLE_CLASS);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        markVisible(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: '0px 0px -6% 0px',
      threshold: 0.06,
    }
  );

  const mainSections = sections.filter((section) => section.closest('#MainContent'));

  sections.forEach((section) => {
    if (section.classList.contains(VISIBLE_CLASS)) return;

    section.classList.add(REVEAL_CLASS);

    const isFirstMainSection = mainSections[0] === section;
    if (isFirstMainSection) {
      markVisible(section);
      return;
    }

    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      markVisible(section);
      return;
    }

    observer.observe(section);
  });
}

window.addEventListener('DOMContentLoaded', () => initPremiumScrollReveal());

if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => initPremiumScrollReveal(event.target, true));
  document.addEventListener('shopify:section:reorder', () => initPremiumScrollReveal(document, true));
}
