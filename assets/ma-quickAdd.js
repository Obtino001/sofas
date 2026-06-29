class MaQuickAdd extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      btn: '.ma_quickAdd_atc',
      text: '.ma-span',
      spinner: '.loading-overlay__spinner',
    };
    this._onClick = this._onClick.bind(this);
  }

  connectedCallback() {
    this.querySelectorAll(this.selectors.btn).forEach((btn) => {
      btn.removeEventListener('click', this._onClick);
      btn.addEventListener('click', this._onClick);
    });
  }

  _onClick(e) {
    this.handleAtc(e);
  }

  async handleAtc(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    const variantId = btn.dataset.variantid;
    if (!variantId || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;

    const cartDrawer = document.querySelector('cart-drawer');
    const drawerAlreadyOpen = cartDrawer?.classList.contains('active');
    const globalOverlay = document.getElementById('CartDrawer-GlobalLoadingOverlay');

    this.toggleLoading(btn, true);
    if (drawerAlreadyOpen && globalOverlay) {
      globalOverlay.classList.add('is-active');
    }

    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          items: [{ id: Number(variantId), quantity: 1 }],
          sections: 'cart-drawer,cart-icon-bubble',
          sections_url: window.location.pathname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.description || data.message || 'Unable to add to cart');
        return;
      }

      if (data.sections && cartDrawer) {
        cartDrawer.classList.remove('is-empty');
        cartDrawer.renderContents(data);
      } else {
        await this.updateCart();
      }

      if (!drawerAlreadyOpen) {
        this.openCart();
      }

      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'ma-quickadd',
          productVariantId: variantId,
          cartData: data,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.toggleLoading(btn, false);
      globalOverlay?.classList.remove('is-active');
    }
  }

  openCart() {
    document.querySelector('cart-drawer')?.open();
  }

  closeCart() {
    document.querySelector('cart-drawer')?.close();
  }

  async updateCart() {
    try {
      const res = await fetch(`/?sections=cart-drawer,cart-icon-bubble`);
      const data = await res.json();

      const parsedHTML = new DOMParser().parseFromString(data['cart-drawer'], 'text/html');
      const drawerInner = parsedHTML.querySelector('.drawer__inner');
      const isEmpty = drawerInner?.classList.contains('is-empty');

      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && !isEmpty) {
        cartDrawer.classList.remove('is-empty');
        cartDrawer.renderContents({
          sections: {
            'cart-drawer': data['cart-drawer'],
            'cart-icon-bubble': data['cart-icon-bubble'],
          },
          id: null,
        });
      }
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  }

  toggleLoading(btn, isLoading) {
    btn.querySelector(this.selectors.spinner)?.classList.toggle('hidden', !isLoading);
    btn.querySelector(this.selectors.text)?.classList.toggle('hidden', isLoading);
    btn.classList.toggle('loading', isLoading);
    if (isLoading) {
      btn.setAttribute('aria-disabled', 'true');
    } else {
      btn.removeAttribute('aria-disabled');
    }
  }
}

if (!customElements.get('ma-quickadd')) {
  customElements.define('ma-quickadd', MaQuickAdd);
}
