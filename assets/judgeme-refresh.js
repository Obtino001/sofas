/**
 * Re-initialise Judge.me preview badges after dynamic DOM updates.
 */
(function () {
  'use strict';

  function refreshJudgeMeWidgets(root) {
    if (typeof window.jdgm === 'undefined') return;

    if (typeof window.jdgm.customizeBadges === 'function') {
      window.jdgm.customizeBadges();
    }

    if (typeof window.jdgm.loadWidgets === 'function') {
      window.jdgm.loadWidgets(root || document);
    }
  }

  window.refreshJudgeMeWidgets = refreshJudgeMeWidgets;

  document.addEventListener('DOMContentLoaded', function () {
    refreshJudgeMeWidgets();
  });

  document.addEventListener('shopify:section:load', function () {
    refreshJudgeMeWidgets();
  });
})();
