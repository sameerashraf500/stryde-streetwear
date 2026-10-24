/* STRYDE — shared by every page: header, footer, bag drawer, wishlist, quick view,
   search, account, toasts, cursor, magnetic buttons and scroll reveals. */
(function () {
  "use strict";
  var D = window.STRYDE_DATA;
  var page = document.body.dataset.page || "";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var S = {
    D: D,
    reduce: reduce,
    fine: fine,
    price: function (n) {
      return "Rs " + Math.round(n).toLocaleString("en-US");
    },
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    param: function (k) {
      return new URLSearchParams(location.search).get(k);
    },
    find: function (id) {
      for (var i = 0; i < D.PRODUCTS.length; i++) if (D.PRODUCTS[i].id === id) return D.PRODUCTS[i];
      return null;
    },
  };

  /* ---------- storage (falls back to memory) ---------- */
  var mem = {};
  S.load = function (k, fb) {
    try {
      var v = localStorage.getItem(k);
      return v ? JSON.parse(v) : k in mem ? mem[k] : fb;
    } catch (e) {
      return k in mem ? mem[k] : fb;
    }
  };
  S.save = function (k, v) {
    mem[k] = v;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  };

  /* ---------- icons ---------- */
  var I = {
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  };
  S.I = I;

  /* ---------- bag ----------
     line: { key, id, size, qty } — prices are looked up live from the catalogue */
  var bag = S.load("stryde-bag", []);
  var subs = [];
  function commit() {
    S.save("stryde-bag", bag);
    subs.forEach(function (fn) {
      fn();
    });
  }
  S.bag = {
    lines: function () {
      return bag
        .map(function (l) {
          var p = S.find(l.id);
          return p ? Object.assign({ p: p, total: p.price * l.qty }, l) : null;
        })
        .filter(Boolean);
    },
    count: function () {
      return bag.reduce(function (n, l) {
        return n + l.qty;
      }, 0);
    },
    subtotal: function () {
      return S.bag.lines().reduce(function (n, l) {
        return n + l.total;
      }, 0);
    },
    add: function (id, size, qty) {
      var key = id + "|" + size;
      var hit = bag.filter(function (l) {
        return l.key === key;
      })[0];
      if (hit) hit.qty = Math.min(10, hit.qty + (qty || 1));
      else bag.push({ key: key, id: id, size: size, qty: qty || 1 });
      commit();
    },
    setQty: function (key, q) {
      bag = bag
        .map(function (l) {
          if (l.key === key) l.qty = Math.max(0, Math.min(10, q));
          return l;
        })
        .filter(function (l) {
          return l.qty > 0;
        });
      commit();
    },
    clear: function () {
      bag = [];
      commit();
    },
    on: function (fn) {
      subs.push(fn);
    },
  };

  S.SHIP = 250;
  S.FREE_FROM = 7500;
  S.PROMOS = { STRYDE15: 0.15, FIRST10: 0.1 };
  S.totals = function (code) {
    var sub = S.bag.subtotal();
    var rate = code && S.PROMOS[code] ? S.PROMOS[code] : 0;
    var disc = Math.round(sub * rate);
    var ship = sub === 0 || sub - disc >= S.FREE_FROM ? 0 : S.SHIP;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + ship, code: rate ? code : "" };
  };

  /* ---------- wishlist ---------- */
  var wish = S.load("stryde-wish", []);
  S.wish = {
    has: function (id) {
      return wish.indexOf(id) > -1;
    },
    list: function () {
      return wish.slice();
    },
    toggle: function (id) {
      var on = !S.wish.has(id);
      wish = on
        ? wish.concat(id)
        : wish.filter(function (x) {
            return x !== id;
          });
      S.save("stryde-wish", wish);
      syncWish();
      S.say(on ? "Saved to your wishlist." : "Removed from your wishlist.");
      document.dispatchEvent(new CustomEvent("wish"));
      return on;
    },
  };
  function syncWish() {
    document.querySelectorAll("[data-wish]").forEach(function (b) {
      var on = S.wish.has(b.dataset.wish);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-wish-count]").forEach(function (e) {
      e.textContent = String(wish.length);
      e.hidden = !wish.length;
    });
  }

  /* ---------- account (demo) ---------- */
  S.user = function () {
    return S.load("stryde-user", null);
  };

  /* ---------- product card ---------- */
  S.card = function (p, i) {
    return (
      '<article class="pcard rv" style="--d:' + ((i || 0) % 4) * 70 + 'ms">' +
      '<a class="pcard-media" href="product.html?id=' + p.id + '" aria-label="' + S.esc(p.name + ", " + p.color) + '">' +
      '<img src="' + p.src + '" alt="' + S.esc(p.name + " in " + p.color) + '" loading="lazy" decoding="async" width="1000" height="1250" />' +
      '<img class="pcard-alt" src="' + p.src2 + '" alt="" aria-hidden="true" loading="lazy" decoding="async" width="1000" height="1250" />' +
      (p.tag ? '<span class="pcard-tag' + (p.tag === "Low stock" ? " warn" : "") + '">' + S.esc(p.tag) + "</span>" : "") +
      "</a>" +
      '<button type="button" class="pcard-wish" data-wish="' + p.id + '" aria-label="Save ' + S.esc(p.name) + '">' + I.heart + "</button>" +
      '<div class="pcard-quick"><button type="button" class="btn btn-ink btn-sm" data-quick="' + p.id + '">' + I.plus + "Quick add</button></div>" +
      '<div class="pcard-body"><div><h3 class="pcard-name"><a href="product.html?id=' + p.id + '">' + S.esc(p.name) + '</a></h3><p class="pcard-color"><i style="background:' + p.hex + '"></i>' + S.esc(p.color) + "</p></div>" +
      '<p class="pcard-price">' + S.price(p.price) + "</p></div></article>"
    );
  };

  /* ---------- layout ---------- */
  var NAV = [
    { href: "index.html", label: "Home", id: "home" },
    { href: "shop.html", label: "Shop", id: "shop" },
    { href: "shop.html?cat=hoodies", label: "Hoodies", id: "hoodies" },
    { href: "lookbook.html", label: "Lookbook", id: "lookbook" },
    { href: "about.html", label: "About", id: "about" },
    { href: "contact.html", label: "Contact", id: "contact" },
  ];
  var LOGO = '<a href="index.html" class="logo" aria-label="STRYDE home"><span class="logo-mark" aria-hidden="true"><i></i><i></i></span>STRYDE</a>';

  function header() {
    var u = S.user();
    var msgs = ["Free delivery on orders over Rs 7,500", "Drop 04 is live: puffers, fleece sets and new hoodies", "Easy 7-day exchange", "Cash on delivery across Pakistan"];
    var row = msgs.map(function (m) {
      return "<span>" + m + "</span><b>✦</b>";
    }).join("");
    return (
      '<div class="announce" aria-label="Store news"><div class="announce-track">' + row + row + "</div></div>" +
      '<header class="nav" data-nav>' + LOGO +
      '<nav class="nav-links" aria-label="Main">' +
      NAV.map(function (n) {
        var cur = n.id === page || (n.id === "hoodies" && page === "shop" && S.param("cat") === "hoodies" && false);
        return '<a href="' + n.href + '"' + (cur ? ' aria-current="page"' : "") + "><span>" + n.label + "</span><span>" + n.label + "</span></a>";
      }).join("") +
      "</nav>" +
      '<div class="nav-actions">' +
      '<button type="button" class="icon-btn" data-open-search aria-label="Search">' + I.search + "</button>" +
      '<a href="wishlist.html" class="icon-btn nav-wish" aria-label="Wishlist">' + I.heart + '<span class="badge" data-wish-count hidden>0</span></a>' +
      '<a href="account.html" class="login-pill">' + (u ? "Hi, " + S.esc(u.name.split(" ")[0]) : "Log in") + "</a>" +
      '<button type="button" class="icon-btn" data-open-bag aria-label="Open your bag">' + I.bag + '<span class="badge" data-bag-count>0</span></button>' +
      '<button type="button" class="menu-btn" data-menu aria-expanded="false" aria-label="Menu"><span></span><span></span></button>' +
      "</div></header>" +
      '<div class="mnav" data-mnav aria-hidden="true"><nav>' +
      NAV.map(function (n, i) {
        return '<a href="' + n.href + '" style="--i:' + i + '">' + n.label + "</a>";
      }).join("") +
      '<a href="wishlist.html" style="--i:6">Wishlist</a><a href="account.html" style="--i:7">' + (u ? "My account" : "Log in") + "</a></nav>" +
      '<p class="mnav-foot">Drop 04 · Made in Pakistan</p></div>'
    );
  }
  function footer() {
    return (
      '<footer class="footer">' +
      '<div class="footer-big" aria-hidden="true">STRYDE</div>' +
      '<div class="footer-grid">' +
      '<div class="footer-news"><p class="kicker">Join the crew</p><h2 class="h3">First look at every drop.</h2>' +
      '<form class="news" data-news novalidate><label class="sr" for="news-email">Email</label><input id="news-email" type="email" placeholder="you@email.com" autocomplete="email" required /><button type="submit" class="btn btn-ink">Subscribe</button></form><p class="news-msg" data-news-msg></p></div>' +
      '<div><p class="kicker">Shop</p><ul><li><a href="shop.html?cat=hoodies">Hoodies</a></li><li><a href="shop.html?cat=tees">Tees</a></li><li><a href="shop.html?cat=outerwear">Outerwear</a></li><li><a href="shop.html?cat=bottoms">Bottoms</a></li><li><a href="shop.html?cat=accessories">Accessories</a></li></ul></div>' +
      '<div><p class="kicker">Help</p><ul><li><a href="contact.html#faq">Shipping &amp; returns</a></li><li><a href="contact.html#faq">Size guide</a></li><li><a href="order.html">Track an order</a></li><li><a href="contact.html">Contact</a></li></ul></div>' +
      '<div><p class="kicker">Studio</p><ul><li><a href="about.html">About</a></li><li><a href="lookbook.html">Lookbook</a></li><li><a href="account.html">Account</a></li><li><a href="wishlist.html">Wishlist</a></li></ul></div>' +
      "</div>" +
      '<div class="footer-bottom"><p>&copy; ' + new Date().getFullYear() + " STRYDE Studio. A concept store: no real orders are placed.</p>" +
      '<p>Designed &amp; developed by <a href="https://www.linkedin.com/in/sameer-ashraf-541691387" target="_blank" rel="noreferrer">Sameer Ashraf</a> · Vision Spider Tech</p></div>' +
      "</footer>"
    );
  }
  function overlays() {
    return (
      '<div class="scrim" data-close></div>' +
      '<aside class="drawer" data-drawer aria-label="Your bag" aria-hidden="true">' +
      '<div class="drawer-head"><p class="h4">Your bag <span data-bag-count>0</span></p><button type="button" class="icon-btn" data-close aria-label="Close">' + I.x + "</button></div>" +
      '<div class="drawer-ship"><p data-ship-msg></p><div class="meter"><i data-meter></i></div></div>' +
      '<div class="drawer-body" data-bag-lines></div>' +
      '<div class="drawer-foot"><div class="row-between"><span>Subtotal</span><b data-bag-sub>Rs 0</b></div><p class="muted small">Taxes included. Delivery worked out at checkout.</p>' +
      '<a href="checkout.html" class="btn btn-ink btn-block" data-checkout>Checkout</a><a href="cart.html" class="btn btn-line btn-block">View bag</a></div></aside>' +
      // quick view
      '<div class="modal" data-quick-modal role="dialog" aria-modal="true" aria-labelledby="qv-name" aria-hidden="true"><div class="modal-card">' +
      '<button type="button" class="icon-btn modal-x" data-close aria-label="Close">' + I.x + "</button>" +
      '<div class="qv-img"><img alt="" data-qv-img /></div><div class="qv-body"><p class="kicker" data-qv-cat></p><h3 class="h3" id="qv-name" data-qv-name></h3><p class="qv-price" data-qv-price></p>' +
      '<p class="label">Size</p><div class="sizes" data-qv-sizes role="radiogroup" aria-label="Size"></div><p class="ferr" data-qv-err></p>' +
      '<button type="button" class="btn btn-ink btn-block" data-qv-add>Add to bag</button><a class="link" data-qv-link href="#">View full details</a></div></div></div>' +
      // search
      '<div class="search" data-search-panel aria-hidden="true" role="dialog" aria-label="Search"><div class="search-inner">' +
      '<div class="search-bar">' + I.search + '<input type="search" placeholder="Search hoodies, denim, puffer…" data-search-input aria-label="Search products" /><button type="button" class="icon-btn" data-close aria-label="Close">' + I.x + "</button></div>" +
      '<div class="search-hint" data-search-hint><p class="label">Popular</p><div class="chips"><button type="button" data-term="hoodie">Hoodie</button><button type="button" data-term="puffer">Puffer</button><button type="button" data-term="denim">Denim</button><button type="button" data-term="tee">Tee</button><button type="button" data-term="shades">Shades</button></div></div>' +
      '<div class="search-results" data-search-results></div></div></div>' +
      '<div class="toast" role="status" aria-live="polite"></div>' +
      '<div class="cursor" aria-hidden="true"><span></span></div>' +
      '<div class="curtain" aria-hidden="true"></div>'
    );
  }

  /* ---------- toast ---------- */
  var toastEl, tt;
  S.say = function (m) {
    toastEl.textContent = m;
    toastEl.classList.add("on");
    clearTimeout(tt);
    tt = setTimeout(function () {
      toastEl.classList.remove("on");
    }, 2600);
  };

  /* ---------- overlays ---------- */
  function openLayer(name) {
    closeLayers();
    document.body.classList.add("lock", name + "-open");
    var el = document.querySelector("[data-" + (name === "bag" ? "drawer" : name === "quick" ? "quick-modal" : "search-panel") + "]");
    if (el) el.setAttribute("aria-hidden", "false");
    if (name === "search") setTimeout(function () {
      document.querySelector("[data-search-input]").focus();
    }, 60);
  }
  function closeLayers() {
    document.body.classList.remove("lock", "bag-open", "quick-open", "search-open", "menu-open");
    document.querySelectorAll("[data-drawer],[data-quick-modal],[data-search-panel],[data-mnav]").forEach(function (e) {
      e.setAttribute("aria-hidden", "true");
    });
    var mb = document.querySelector("[data-menu]");
    if (mb) mb.setAttribute("aria-expanded", "false");
  }
  S.openBag = function () {
    openLayer("bag");
  };
  S.close = closeLayers;

  function lineHTML(l) {
    return (
      '<div class="bline" data-key="' + S.esc(l.key) + '">' +
      '<a href="product.html?id=' + l.id + '"><img src="' + l.p.src + '" alt="" loading="lazy" /></a>' +
      '<div><p class="bline-name">' + S.esc(l.p.name) + "</p>" +
      '<p class="muted small">' + S.esc(l.p.color) + " · Size " + S.esc(l.size) + "</p>" +
      '<div class="bline-row"><div class="qty"><button type="button" data-q="-1" aria-label="Fewer">&minus;</button><span>' + l.qty + '</span><button type="button" data-q="1" aria-label="More">+</button></div>' +
      '<button type="button" class="link small" data-rm>Remove</button></div></div>' +
      "<b>" + S.price(l.total) + "</b></div>"
    );
  }
  S.lineHTML = lineHTML;

  function renderBag() {
    var n = S.bag.count();
    document.querySelectorAll("[data-bag-count]").forEach(function (e) {
      e.textContent = String(n);
    });
    var lines = S.bag.lines();
    var box = document.querySelector("[data-bag-lines]");
    box.innerHTML = lines.length
      ? lines.map(lineHTML).join("")
      : '<div class="empty">' + I.bag + "<p>Your bag is empty.</p><a href=\"shop.html\" class=\"btn btn-ink btn-sm\">Shop the drop</a></div>";
    var sub = S.bag.subtotal();
    document.querySelector("[data-bag-sub]").textContent = S.price(sub);
    var left = S.FREE_FROM - sub;
    document.querySelector("[data-ship-msg]").innerHTML = !sub ? "Free delivery on orders over <b>" + S.price(S.FREE_FROM) + "</b>" : left > 0 ? "You're <b>" + S.price(left) + "</b> away from free delivery" : "<b>Free delivery</b> unlocked";
    document.querySelector("[data-meter]").style.transform = "scaleX(" + Math.min(1, sub / S.FREE_FROM) + ")";
    document.querySelector("[data-checkout]").classList.toggle("is-off", !lines.length);
  }

  /* ---------- quick view ---------- */
  var qv = { p: null, size: "" };
  S.quick = function (id) {
    var p = S.find(id);
    if (!p) return;
    qv = { p: p, size: p.sizes.length === 1 ? p.sizes[0] : "" };
    var m = document.querySelector("[data-quick-modal]");
    m.querySelector("[data-qv-img]").src = p.src;
    m.querySelector("[data-qv-img]").alt = p.name + " in " + p.color;
    m.querySelector("[data-qv-name]").textContent = p.name;
    m.querySelector("[data-qv-cat]").textContent = p.color + " · " + p.fit;
    m.querySelector("[data-qv-price]").textContent = S.price(p.price);
    m.querySelector("[data-qv-link]").href = "product.html?id=" + p.id;
    m.querySelector("[data-qv-err]").textContent = "";
    m.querySelector("[data-qv-sizes]").innerHTML = p.sizes.map(function (s) {
      return '<button type="button" role="radio" aria-checked="' + (s === qv.size) + '" class="size' + (s === qv.size ? " on" : "") + '" data-qv-size="' + s + '">' + s + "</button>";
    }).join("");
    openLayer("quick");
  };
  S.added = function (p, size) {
    S.say(p.name + " (" + size + ") added to your bag.");
    document.querySelectorAll("[data-bag-count]").forEach(function (e) {
      e.classList.remove("bump");
      void e.offsetWidth;
      e.classList.add("bump");
    });
    setTimeout(S.openBag, 250);
  };

  /* ---------- search ---------- */
  function runSearch(q) {
    q = q.trim().toLowerCase();
    var res = document.querySelector("[data-search-results]");
    document.querySelector("[data-search-hint]").hidden = !!q;
    if (!q) {
      res.innerHTML = "";
      return;
    }
    var words = q.split(/\s+/);
    var hits = D.PRODUCTS.filter(function (p) {
      var hay = (p.name + " " + p.color + " " + p.cat + " " + p.fit + (p.cat === "accessories" ? " shades sunglasses bag" : "")).toLowerCase();
      return words.every(function (w) {
        return hay.indexOf(w.replace(/s$/, "")) > -1;
      });
    });
    res.innerHTML = hits.length
      ? '<p class="label">' + hits.length + " result" + (hits.length > 1 ? "s" : "") + "</p><div class=\"sres\">" +
        hits.slice(0, 8).map(function (p) {
          return '<a href="product.html?id=' + p.id + '"><img src="' + p.src + '" alt="" loading="lazy" /><span><b>' + S.esc(p.name) + "</b><small>" + S.esc(p.color) + " · " + S.price(p.price) + "</small></span></a>";
        }).join("") + "</div>"
      : '<p class="muted">Nothing found for “' + S.esc(q) + '”. Try “hoodie” or “denim”.</p>';
  }

  /* ---------- reveal on scroll ---------- */
  S.reveal = function (root) {
    var els = (root || document).querySelectorAll(".rv:not(.in), .split:not(.in)");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (e) {
        e.classList.add("in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) {
            x.target.classList.add("in");
            io.unobserve(x.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach(function (e) {
      io.observe(e);
    });
  };
  // wrap each word of .split headings so they can rise in one by one
  S.split = function (root) {
    (root || document).querySelectorAll(".split:not([data-done])").forEach(function (h) {
      h.setAttribute("data-done", "");
      var i = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (w) {
              if (!w) return;
              if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w));
              else {
                var o = document.createElement("span");
                o.className = "w";
                var s = document.createElement("span");
                s.textContent = w;
                s.style.setProperty("--i", i++);
                o.appendChild(s);
                frag.appendChild(o);
              }
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1) walk(c);
        });
      };
      walk(h);
    });
  };

  S.validate = function (form) {
    var ok = true;
    form.querySelectorAll("[data-field]").forEach(function (w) {
      var i = w.querySelector("input, select, textarea");
      if (!i || w.closest("[hidden]")) return;
      var v = (i.value || "").trim(),
        msg = "";
      if (i.required && !v) msg = "This field is required.";
      else if (v && i.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Enter a valid email address.";
      else if (v && i.dataset.type === "phone" && !/^(\+92|0)?3\d{2}[\s-]?\d{7}$/.test(v.replace(/\s/g, ""))) msg = "Enter a mobile number like 0300 1234567.";
      else if (v && i.minLength > 0 && v.length < i.minLength) msg = "Use at least " + i.minLength + " characters.";
      w.classList.toggle("err", !!msg);
      var e = w.querySelector(".ferr");
      if (e) e.textContent = msg;
      if (msg && ok) {
        ok = false;
        i.focus();
      }
    });
    return ok;
  };

  /* ---------- boot ---------- */
  var h = document.querySelector("[data-header]");
  if (h) h.outerHTML = header();
  var f = document.querySelector("[data-footer]");
  if (f) f.outerHTML = footer();
  document.body.insertAdjacentHTML("beforeend", overlays());
  toastEl = document.querySelector(".toast");
  S.bag.on(renderBag);
  renderBag();
  syncWish();

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-open-bag]")) {
      e.preventDefault();
      S.openBag();
    }
    if (t.closest("[data-open-search]")) openLayer("search");
    if (t.closest("[data-close]") || t.matches("[data-quick-modal]") || t.matches("[data-search-panel]")) closeLayers();
    var co = t.closest("[data-checkout]");
    if (co && co.classList.contains("is-off")) {
      e.preventDefault();
      S.say("Your bag is empty.");
    }
    var line = t.closest("[data-key]");
    if (line) {
      var key = line.dataset.key;
      var cur = bag.filter(function (l) {
        return l.key === key;
      })[0];
      if (cur && t.closest("[data-q]")) S.bag.setQty(key, cur.qty + Number(t.closest("[data-q]").dataset.q));
      if (cur && t.closest("[data-rm]")) {
        S.bag.setQty(key, 0);
        S.say("Removed from your bag.");
      }
    }
    var w = t.closest("[data-wish]");
    if (w) {
      e.preventDefault();
      S.wish.toggle(w.dataset.wish);
    }
    var q = t.closest("[data-quick]");
    if (q) S.quick(q.dataset.quick);
    var sz = t.closest("[data-qv-size]");
    if (sz) {
      qv.size = sz.dataset.qvSize;
      document.querySelectorAll("[data-qv-size]").forEach(function (b) {
        b.classList.toggle("on", b === sz);
        b.setAttribute("aria-checked", String(b === sz));
      });
      document.querySelector("[data-qv-err]").textContent = "";
    }
    if (t.closest("[data-qv-add]")) {
      if (!qv.size) {
        document.querySelector("[data-qv-err]").textContent = "Please choose a size.";
        return;
      }
      S.bag.add(qv.p.id, qv.size, 1);
      closeLayers();
      S.added(qv.p, qv.size);
    }
    var term = t.closest("[data-term]");
    if (term) {
      var inp = document.querySelector("[data-search-input]");
      inp.value = term.dataset.term;
      runSearch(inp.value);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLayers();
    if (e.key === "/" && !e.target.closest("input, textarea")) {
      e.preventDefault();
      openLayer("search");
    }
  });
  document.querySelector("[data-search-input]").addEventListener("input", function (e) {
    runSearch(e.target.value);
  });
  document.querySelector("[data-search-input]").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.value.trim()) location.href = "shop.html?q=" + encodeURIComponent(e.target.value.trim());
  });

  // menu
  var mb = document.querySelector("[data-menu]");
  mb.addEventListener("click", function () {
    var open = !document.body.classList.contains("menu-open");
    closeLayers();
    if (open) {
      document.body.classList.add("menu-open", "lock");
      mb.setAttribute("aria-expanded", "true");
      document.querySelector("[data-mnav]").setAttribute("aria-hidden", "false");
    }
  });

  // newsletter
  var nf = document.querySelector("[data-news]");
  nf.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = nf.querySelector("input").value.trim();
    var msg = document.querySelector("[data-news-msg]");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      msg.textContent = "Enter a valid email address.";
      msg.className = "news-msg bad";
      return;
    }
    msg.textContent = "You're on the list. Use FIRST10 for 10% off your first order.";
    msg.className = "news-msg ok";
    nf.reset();
  });

  // header: shrink on scroll, hide on scroll down
  var nav = document.querySelector("[data-nav]");
  var lastY = 0;
  var onS = function () {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hide", y > 400 && y > lastY && !document.body.classList.contains("lock"));
    lastY = y;
  };
  window.addEventListener("scroll", onS, { passive: true });
  onS();

  // custom cursor + magnetic buttons (mouse only)
  if (fine && !reduce) {
    var cur = document.querySelector(".cursor");
    var cx = innerWidth / 2,
      cy = innerHeight / 2,
      tx = cx,
      ty = cy;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      document.body.classList.add("has-cursor");
      var over = e.target.closest("a, button, [data-cursor], input, select, textarea, label");
      cur.classList.toggle("big", !!(over && !over.matches("input, select, textarea")));
      var lab = e.target.closest("[data-cursor]");
      cur.querySelector("span").textContent = lab ? lab.dataset.cursor : "";
      cur.classList.toggle("label", !!lab);
    });
    document.addEventListener("pointerleave", function () {
      document.body.classList.remove("has-cursor");
    });
    (function loop() {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointermove", function (e) {
      var m = e.target.closest(".magnet");
      document.querySelectorAll(".magnet.pull").forEach(function (b) {
        if (b !== m) {
          b.classList.remove("pull");
          b.style.transform = "";
        }
      });
      if (!m) return;
      var r = m.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2),
        dy = e.clientY - (r.top + r.height / 2);
      m.classList.add("pull");
      m.style.transform = "translate(" + dx * 0.25 + "px," + dy * 0.35 + "px)";
    });
  }

  // page transition: a coral curtain wipes away on load and covers on internal navigation
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    var href = a.getAttribute("href");
    if (!href || href[0] === "#" || /^(https?:|mailto:|tel:)/.test(href) || href.indexOf("#") > -1) return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(function () {
      location.href = href;
    }, 420);
  });
  window.addEventListener("pageshow", function () {
    document.body.classList.remove("leaving");
  });

  window.STRYDE = S;
  S.split();
  requestAnimationFrame(function () {
    document.body.classList.add("loaded");
    S.reveal();
  });
})();
