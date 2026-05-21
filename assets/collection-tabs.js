/**
 * Collection Tabs — section behaviour.
 *
 * Responsibilities:
 *   - Switch tabs and panels (ARIA-aware).
 *   - Re-route the header "View All" and arrow buttons to the active panel's
 *     slider (slider-container web component instance).
 *   - Optionally add the featured variant to cart from the card icon button.
 *
 * The script auto-initialises every `.collection-tabs` instance on the page
 * and re-initialises after Shopify section reload events in the theme editor.
 */
(function () {
  'use strict';

  const SECTION_SELECTOR = '.collection-tabs';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }
  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function init(section) {
    if (!section || section.__collectionTabsBound) return;
    section.__collectionTabsBound = true;

    const tabs = $$('.collection-tabs__tab', section);
    const panels = $$('.collection-tabs__panel', section);
    const viewAllBtn = $('[data-collection-tabs-view-all]', section);
    const prevBtn = $('[data-collection-tabs-arrow="prev"]', section);
    const nextBtn = $('[data-collection-tabs-arrow="next"]', section);

    function getActivePanel() {
      return panels.find((p) => p.classList.contains('is-active')) || panels[0];
    }

    function getActiveSliderContainer() {
      const panel = getActivePanel();
      return panel ? panel.querySelector('slider-container') : null;
    }

    function updateActions() {
      const panel = getActivePanel();
      if (!panel) return;
      const url = panel.getAttribute('data-collection-url') || '#';
      if (viewAllBtn) {
        viewAllBtn.setAttribute('href', url);
        viewAllBtn.style.display = url && url !== '#' ? '' : 'none';
      }
      refreshArrowState();
    }

    function refreshArrowState() {
      const sliderContainer = getActiveSliderContainer();
      const swiper = sliderContainer ? sliderContainer.swiperInstance : null;
      if (!swiper || swiper.destroyed) {
        toggleArrow(prevBtn, false);
        toggleArrow(nextBtn, false);
        return;
      }
      const enabled = swiper.slides && swiper.slides.length > swiper.params.slidesPerView;
      if (!enabled) {
        toggleArrow(prevBtn, false);
        toggleArrow(nextBtn, false);
        return;
      }
      toggleArrow(prevBtn, !swiper.isBeginning || swiper.params.loop);
      toggleArrow(nextBtn, !swiper.isEnd || swiper.params.loop);
    }

    function toggleArrow(btn, enabled) {
      if (!btn) return;
      btn.toggleAttribute('disabled', !enabled);
      btn.classList.toggle('is-disabled', !enabled);
    }

    function activateTab(tab) {
      const targetId = tab.getAttribute('data-target');
      if (!targetId) return;

      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const active = panel.id === targetId;
        panel.classList.toggle('is-active', active);
        if (active) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });

      updateActions();

      // Swiper sometimes mis-measures while hidden. Trigger a recalculation
      // for the newly visible panel.
      requestAnimationFrame(() => {
        const sliderContainer = getActiveSliderContainer();
        if (sliderContainer && sliderContainer.swiperInstance) {
          try {
            sliderContainer.swiperInstance.update();
          } catch (e) {
            /* noop */
          }
        }
        window.dispatchEvent(new Event('resize'));
        refreshArrowState();
      });
    }

    function bindTabs() {
      tabs.forEach((tab) => {
        tab.addEventListener('click', (event) => {
          event.preventDefault();
          activateTab(tab);
        });
        tab.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const idx = tabs.indexOf(tab);
            const nextIdx = event.key === 'ArrowRight'
              ? (idx + 1) % tabs.length
              : (idx - 1 + tabs.length) % tabs.length;
            tabs[nextIdx].focus();
            activateTab(tabs[nextIdx]);
          }
        });
      });
    }

    function bindArrows() {
      [prevBtn, nextBtn].forEach((btn) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
          const sliderContainer = getActiveSliderContainer();
          const swiper = sliderContainer ? sliderContainer.swiperInstance : null;
          if (!swiper || swiper.destroyed) return;
          if (btn === prevBtn) swiper.slidePrev();
          else swiper.slideNext();
        });
      });
    }

    function bindCartButtons() {
      const cartButtons = $$('.card-product-tabs__cart-btn', section);
      cartButtons.forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const variantId = btn.getAttribute('data-variant-id');
          const productUrl = btn.getAttribute('data-product-url');

          if (!variantId) {
            if (productUrl) window.location.href = productUrl;
            return;
          }

          btn.classList.add('is-loading');
          addVariantToCart(variantId)
            .catch(() => {
              if (productUrl) window.location.href = productUrl;
            })
            .finally(() => {
              btn.classList.remove('is-loading');
            });
        });
      });
    }

    function addVariantToCart(variantId) {
      const cartDrawer = document.querySelector('cart-drawer');
      const sectionsToRequest = [];
      if (cartDrawer && typeof cartDrawer.getSectionsToRender === 'function') {
        cartDrawer.getSectionsToRender().forEach((s) => sectionsToRequest.push(s.id));
      }

      const formData = new FormData();
      formData.append('id', variantId);
      formData.append('quantity', 1);
      if (sectionsToRequest.length > 0) {
        formData.append('sections', sectionsToRequest.join(','));
        formData.append('sections_url', window.location.pathname);
      }

      const routeBase = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
      return fetch(`${routeBase}cart/add.js`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Add to cart failed');
          return response.json();
        })
        .then((parsedState) => {
          if (cartDrawer && typeof cartDrawer.renderContents === 'function' && parsedState.sections) {
            cartDrawer.renderContents(parsedState);
          } else {
            const cartIconBubble = document.getElementById('cart-icon-bubble');
            if (cartIconBubble) {
              cartIconBubble.click();
            }
          }
        });
    }

    // Initial wiring.
    bindTabs();
    bindArrows();
    bindCartButtons();
    updateActions();

    // Re-evaluate arrows after swiper initialises / on resize.
    const refresh = () => requestAnimationFrame(refreshArrowState);
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
    setTimeout(refresh, 600);
  }

  function initAll() {
    $$(SECTION_SELECTOR).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Shopify theme editor — re-init on section load/unload.
  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target.querySelector(SECTION_SELECTOR) ||
      (event.target.classList && event.target.classList.contains('collection-tabs') ? event.target : null);
    if (section) init(section);
  });
})();
