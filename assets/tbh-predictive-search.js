function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
var dispatchCustomEvent = function dispatchCustomEvent(eventName) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var detail = {
    detail: data
  };
  var event = new CustomEvent(eventName, data ? detail : null);
  document.dispatchEvent(event);
};
window.recentlyViewedIds = [];


class TbhPredictiveSearch {
  constructor() {
    this.container = document.getElementById('Search-Drawer');
    if (!this.container) return;

    this.form = this.container.querySelector('form.searchform');
    this.button = document.querySelectorAll('.thb-quick-search');
    this.input = this.container.querySelector('input[type="search"]');
    this.predictiveSearchResults = this.container.querySelector('.side-panel-content--has-tabs');

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.form) this.form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.input.addEventListener('input', debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));

    this.button.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        document.body.classList.toggle('open-cc');
        this.container.classList.toggle('active');

        if (this.container.classList.contains('active')) {
          document.body.classList.add('tbh-search-open');
          setTimeout(() => this.input.focus({ preventScroll: true }), 100);
          window.dispatchEvent(new CustomEvent('search:open'));
        } else {
          document.body.classList.remove('tbh-search-open');
        }
      });
    });

    const closeButton = this.container.querySelector('.side-panel-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.close();
      });
    }

    document.body.addEventListener('click', (event) => {
      if (document.body.classList.contains('tbh-search-open')) {
        if (event.target.classList.contains('tbh-search-overlay')) {
          this.close();
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('tbh-search-open')) {
        this.close();
      }
    });
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const searchTerm = this.getQuery();
    if (!searchTerm.length) {
      this.predictiveSearchResults.classList.remove('active');
      return;
    }
    this.predictiveSearchResults.classList.add('active');
    this.getSearchResults(searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length) event.preventDefault();
  }

  onFocus() {
    const searchTerm = this.getQuery();
    if (!searchTerm.length) return;
    this.getSearchResults(searchTerm);
  }

  getSearchResults(searchTerm) {
    this.predictiveSearchResults.classList.add('loading');

    fetch(`${window.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent('resources[type]')}=product,article,query&${encodeURIComponent('resources[limit]')}=10&resources[options][fields]=title,product_type,vendor,variants.title,variants.sku&section_id=tbh-predictive-search`)
      .then((response) => {
        this.predictiveSearchResults.classList.remove('loading');
        if (!response.ok) throw new Error(response.status);
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-tbh-predictive-search').innerHTML;
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        this.predictiveSearchResults.classList.remove('loading');
        throw error;
      });
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    const submitButton = this.container.querySelector('#search-results-submit');
    if (submitButton) {
      submitButton.addEventListener('click', () => this.form.submit());
    }
  }

  close() {
    this.container.classList.remove('active');
    document.body.classList.remove('tbh-search-open');
    document.body.classList.remove('open-cc');
  }
}

function debounce(fn, wait) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, arguments), wait);
  };
}

window.addEventListener('load', () => {
  if (typeof TbhPredictiveSearch !== 'undefined' && document.getElementById('Search-Drawer')) {
    new TbhPredictiveSearch();
  }
});