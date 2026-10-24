/* STRYDE — inner pages: shop, product, lookbook, about, contact, bag, checkout,
   order tracking, wishlist and account. */
(function () {
  "use strict";
  var S = window.STRYDE,
    D = S.D;
  var page = document.body.dataset.page;
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };

  function accordions(root) {
    (root || document).querySelectorAll(".acc > button").forEach(function (b) {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.addEventListener("click", function () {
        var a = b.parentElement,
          open = !a.classList.contains("open");
        a.classList.toggle("open", open);
        b.setAttribute("aria-expanded", String(open));
      });
    });
  }
  function liveValidate(form) {
    form.addEventListener("input", function (e) {
      var w = e.target.closest("[data-field]");
      if (w && w.classList.contains("err")) S.validate(form);
    });
  }

  /* ---------- shop ---------- */
  function shop() {
    var st = { cat: S.param("cat") || "all", color: "", sort: "feat", q: S.param("q") || "" };
    if (!D.CATS.some(function (c) { return c.id === st.cat; })) st.cat = "all";
    var tabs = $("[data-cats]"),
      grid = $("[data-grid]");
    tabs.innerHTML = D.CATS.map(function (c) {
      return '<button type="button" class="tab" role="tab" data-cat="' + c.id + '">' + c.label + "</button>";
    }).join("");
    // one swatch per distinct colour family present
    var seen = {};
    var sw = D.PRODUCTS.filter(function (p) {
      if (seen[p.hex]) return false;
      seen[p.hex] = 1;
      return true;
    }).slice(0, 12);
    $("[data-swatches]").innerHTML = sw
      .map(function (p) {
        return '<button type="button" class="swatch" data-color="' + p.hex + '" style="background:' + p.hex + '" aria-label="' + S.esc(p.color) + '" title="' + S.esc(p.color) + '"></button>';
      })
      .join("");
    function render() {
      tabs.querySelectorAll("[data-cat]").forEach(function (b) {
        var on = b.dataset.cat === st.cat;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", String(on));
      });
      document.querySelectorAll("[data-color]").forEach(function (b) {
        b.classList.toggle("on", b.dataset.color === st.color);
      });
      var q = st.q.toLowerCase();
      var list = D.PRODUCTS.filter(function (p) {
        return (
          (st.cat === "all" || p.cat === st.cat) &&
          (!st.color || p.hex === st.color) &&
          (!q || (p.name + " " + p.color + " " + p.cat).toLowerCase().indexOf(q.replace(/s$/, "")) > -1)
        );
      });
      if (st.sort === "low") list.sort(function (a, b) { return a.price - b.price; });
      if (st.sort === "high") list.sort(function (a, b) { return b.price - a.price; });
      if (st.sort === "new") list.sort(function (a, b) { return (b.tag === "New" || b.tag === "Drop 04") - (a.tag === "New" || a.tag === "Drop 04"); });
      grid.innerHTML = list.map(S.card).join("");
      $("[data-count]").textContent = list.length + " piece" + (list.length === 1 ? "" : "s") + (q ? " for “" + st.q + "”" : "");
      $("[data-none]").hidden = list.length > 0;
      var cat = D.CATS.filter(function (c) { return c.id === st.cat; })[0];
      document.title = (st.cat === "all" ? "Shop all" : cat.label) + " — STRYDE";
      S.reveal(grid);
      document.dispatchEvent(new CustomEvent("wish"));
    }
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      st.cat = b.dataset.cat;
      st.q = "";
      history.replaceState(null, "", st.cat === "all" ? "shop.html" : "shop.html?cat=" + st.cat);
      render();
    });
    $("[data-swatches]").addEventListener("click", function (e) {
      var b = e.target.closest("[data-color]");
      if (!b) return;
      st.color = st.color === b.dataset.color ? "" : b.dataset.color;
      render();
    });
    $("[data-sort]").addEventListener("change", function (e) {
      st.sort = e.target.value;
      render();
    });
    $("[data-reset]").addEventListener("click", function () {
      st = { cat: "all", color: "", sort: "feat", q: "" };
      $("[data-sort]").value = "feat";
      history.replaceState(null, "", "shop.html");
      render();
    });
    render();
  }

  /* ---------- product ---------- */
  function product() {
    var p = S.find(S.param("id")) || D.PRODUCTS[0];
    document.title = p.name + " — " + p.color + " | STRYDE";
    var variants = D.PRODUCTS.filter(function (x) {
      return x.name === p.name;
    });
    var imgs = [p.src];
    if (p.src2 !== p.src) imgs.push(p.src2);
    D.PRODUCTS.forEach(function (x) {
      if (imgs.length < 3 && x.cat === p.cat && x.id !== p.id && imgs.indexOf(x.src) < 0 && x.name === p.name) imgs.push(x.src);
    });
    var one = p.sizes.length === 1;
    var catLabel = D.CATS.filter(function (c) { return c.id === p.cat; })[0].label;
    $("[data-pdp]").innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a>/<a href="shop.html?cat=' + p.cat + '">' + catLabel + "</a>/<span>" + S.esc(p.name) + "</span></nav>" +
      '<div class="pdp">' +
      '<div class="gallery">' +
      imgs.map(function (src, i) {
        return '<div class="gimg rv" style="--d:' + i * 80 + 'ms" data-zoom><img src="' + src + '" alt="' + (i ? "" : S.esc(p.name + " in " + p.color)) + '" ' + (i ? 'loading="lazy"' : "") + " /></div>";
      }).join("") +
      "</div>" +
      '<div class="pdp-info">' +
      (p.tag ? '<p class="kicker" style="color:var(--coral)">' + S.esc(p.tag) + "</p>" : '<p class="kicker">' + catLabel + "</p>") +
      '<h1 class="h2 split">' + S.esc(p.name) + "</h1>" +
      '<p class="pdp-price">' + S.price(p.price) + " <small>incl. taxes</small></p>" +
      (variants.length > 1
        ? '<div class="pdp-block"><p class="label">Colour: <b style="color:var(--ink)">' + S.esc(p.color) + '</b></p><div class="pdp-colors">' +
          variants.map(function (v) {
            return '<a href="product.html?id=' + v.id + '" class="' + (v.id === p.id ? "on" : "") + '" aria-label="' + S.esc(v.color) + '" title="' + S.esc(v.color) + '"><img src="' + v.src + '" alt="" loading="lazy" /></a>';
          }).join("") + "</div></div>"
        : '<div class="pdp-block"><p class="label">Colour: <b style="color:var(--ink)">' + S.esc(p.color) + "</b></p></div>") +
      '<div class="pdp-block"><div class="size-row"><p class="label">Size</p>' + (one ? "" : '<button type="button" class="link small" data-open-size>Size guide</button>') + "</div>" +
      '<div class="sizes" role="radiogroup" aria-label="Size" data-sizes>' +
      p.sizes.map(function (s) {
        return '<button type="button" class="size' + (one ? " on" : "") + '" role="radio" aria-checked="' + one + '" data-size="' + s + '">' + s + "</button>";
      }).join("") +
      '</div><p class="ferr" data-size-err></p></div>' +
      '<div class="pdp-buy" data-buy><div class="qty"><button type="button" data-pq="-1" aria-label="Fewer">&minus;</button><span data-pqty>1</span><button type="button" data-pq="1" aria-label="More">+</button></div>' +
      '<button type="button" class="btn btn-ink magnet" data-add>Add to bag · ' + S.price(p.price) + "</button>" +
      '<button type="button" class="wish-btn" data-wish="' + p.id + '" aria-label="Save to wishlist">' + S.I.heart + "</button></div>" +
      '<div class="pdp-notes"><p>' + S.I.bag + "Free delivery over " + S.price(S.FREE_FROM) + "</p><p>" + '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>' + "7-day free exchange</p></div>" +
      '<div class="pdp-block">' +
      '<div class="acc open"><button type="button" aria-expanded="true">Details<i></i></button><div class="acc-body"><div><p>' + S.esc(p.fit) + " fit. " + S.esc(p.fabric) + ".</p><p>Designed in Lahore and made in small runs. Machine wash cold, inside out. Do not tumble dry.</p></div></div></div>" +
      (one
        ? ""
        : '<div class="acc" id="size-guide"><button type="button" aria-expanded="false">Size chart<i></i></button><div class="acc-body"><div>' +
          (p.cat === "bottoms"
            ? '<table class="size-table"><tr><th>Size</th><th>Waist (in)</th><th>Inseam (in)</th></tr><tr><td>28</td><td>28</td><td>30</td></tr><tr><td>30</td><td>30</td><td>31</td></tr><tr><td>32</td><td>32</td><td>32</td></tr><tr><td>34</td><td>34</td><td>32</td></tr><tr><td>36</td><td>36</td><td>33</td></tr></table>'
            : '<table class="size-table"><tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th></tr><tr><td>XS</td><td>44</td><td>26</td></tr><tr><td>S</td><td>46</td><td>27</td></tr><tr><td>M</td><td>48</td><td>28</td></tr><tr><td>L</td><td>50</td><td>29</td></tr><tr><td>XL</td><td>52</td><td>30</td></tr><tr><td>XXL</td><td>54</td><td>31</td></tr></table><p class="small">Cut oversized. Size down for a regular fit.</p>') +
          "</div></div></div>") +
      '<div class="acc"><button type="button" aria-expanded="false">Delivery &amp; exchange<i></i></button><div class="acc-body"><div>Delivered in 2&ndash;4 working days across Pakistan. Cash on delivery available. Exchange any unworn piece within 7 days.</div></div></div>' +
      "</div></div></div>" +
      '<div class="sticky-buy" data-sticky><img src="' + p.src + '" alt="" /><p><b>' + S.esc(p.name) + "</b><br />" + S.price(p.price) + '</p><button type="button" class="btn btn-sm" data-sticky-add>Add to bag</button></div>';
    S.split($("[data-pdp]"));
    accordions($("[data-pdp]"));

    var size = one ? p.sizes[0] : "",
      qty = 1;
    var root = $("[data-pdp]");
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-size]");
      if (b) {
        size = b.dataset.size;
        root.querySelectorAll("[data-size]").forEach(function (x) {
          x.classList.toggle("on", x === b);
          x.setAttribute("aria-checked", String(x === b));
        });
        $("[data-size-err]").textContent = "";
      }
      var q = e.target.closest("[data-pq]");
      if (q) {
        qty = Math.max(1, Math.min(10, qty + Number(q.dataset.pq)));
        $("[data-pqty]").textContent = String(qty);
      }
      if (e.target.closest("[data-add]") || e.target.closest("[data-sticky-add]")) {
        if (!size) {
          $("[data-size-err]").textContent = "Please choose a size.";
          $("[data-sizes]").scrollIntoView({ behavior: S.reduce ? "auto" : "smooth", block: "center" });
          $("[data-sizes]").animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 350 });
          return;
        }
        S.bag.add(p.id, size, qty);
        S.added(p, size);
      }
      if (e.target.closest("[data-open-size]")) {
        var g = $("#size-guide");
        g.classList.add("open");
        g.querySelector("button").setAttribute("aria-expanded", "true");
        g.scrollIntoView({ behavior: S.reduce ? "auto" : "smooth", block: "center" });
      }
    });
    // hover zoom
    root.querySelectorAll("[data-zoom]").forEach(function (z) {
      z.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = z.getBoundingClientRect();
        z.style.setProperty("--zx", ((e.clientX - r.left) / r.width) * 100 + "%");
        z.style.setProperty("--zy", ((e.clientY - r.top) / r.height) * 100 + "%");
        z.classList.add("zoom");
      });
      z.addEventListener("pointerleave", function () {
        z.classList.remove("zoom");
      });
    });
    // sticky buy bar once the main button scrolls away
    var buy = $("[data-buy]"),
      sticky = $("[data-sticky]");
    if ("IntersectionObserver" in window)
      new IntersectionObserver(function (en) {
        sticky.classList.toggle("on", !en[0].isIntersecting && en[0].boundingClientRect.top < 0);
      }).observe(buy);

    var rel = D.PRODUCTS.filter(function (x) {
      return x.cat === p.cat && x.id !== p.id;
    });
    if (rel.length < 4)
      rel = rel.concat(
        D.PRODUCTS.filter(function (x) {
          return x.cat !== p.cat && x.id !== p.id;
        })
      );
    $("[data-related]").innerHTML = rel.slice(0, 4).map(S.card).join("");
    document.dispatchEvent(new CustomEvent("wish"));
  }

  /* ---------- lookbook ---------- */
  function lookbook() {
    var layouts = [
      ["1 / span 7", "9 / span 4"],
      ["6 / span 7", "1 / span 4"],
      ["1 / span 6", "8 / span 4"],
      ["5 / span 8", "1 / span 3"],
    ];
    $("[data-lb]").innerHTML = D.LOOKS.map(function (l, i) {
      var lay = layouts[i % layouts.length];
      var img = '<div class="lb-img" style="grid-column:' + lay[0] + ';grid-row:1"><img src="' + l.img + '" alt="Lookbook: ' + S.esc(l.title) + '" loading="lazy" /></div>';
      var cap =
        '<div class="lb-cap" style="grid-column:' + lay[1] + ';grid-row:1"><p class="kicker">Look 0' + (i + 1) + '</p><h2 class="h3">' + S.esc(l.title) + "</h2>" +
        l.items.map(function (id) {
          var p = S.find(id);
          return '<a href="product.html?id=' + id + '">' + S.esc(p.name) + " · " + S.esc(p.color) + "<span>" + S.price(p.price) + "</span></a>";
        }).join("") + "</div>";
      return '<div class="lb-row">' + img + cap + "</div>";
    }).join("");
    if ("IntersectionObserver" in window && !S.reduce) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) {
            x.target.classList.add("in");
            io.unobserve(x.target);
          }
        });
      }, { rootMargin: "0px 0px -15% 0px" });
      document.querySelectorAll(".lb-img").forEach(function (e) {
        io.observe(e);
      });
    } else
      document.querySelectorAll(".lb-img").forEach(function (e) {
        e.classList.add("in");
      });
  }

  /* ---------- about: count-up numbers ---------- */
  function about() {
    var nums = document.querySelectorAll("[data-n]");
    var run = function (el) {
      var to = Number(el.dataset.n),
        t0 = performance.now();
      (function f(t) {
        var k = Math.min(1, (t - t0) / 1400);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    };
    if (S.reduce || !("IntersectionObserver" in window))
      nums.forEach(function (n) {
        n.textContent = n.dataset.n;
      });
    else {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) {
            run(x.target);
            io.unobserve(x.target);
          }
        });
      });
      nums.forEach(function (n) {
        io.observe(n);
      });
    }
  }

  /* ---------- contact ---------- */
  function contact() {
    var f = $("[data-contact]");
    liveValidate(f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!S.validate(f)) return;
      var d = $("[data-c-done]");
      d.textContent = "Thanks, " + $("#c-name").value.trim().split(" ")[0] + ". We'll reply within a day.";
      d.hidden = false;
      f.reset();
      S.say("Message sent.");
    });
    accordions();
  }

  /* ---------- promo + totals ---------- */
  var promo = S.load("stryde-promo", "");
  var express = false;
  function totals() {
    var t = S.totals(promo);
    if (express && t.sub) {
      t.ship = 600;
      t.total = t.sub - t.disc + 600;
    }
    return t;
  }
  function totalsHTML() {
    var t = totals();
    return (
      "<div><dt>Subtotal</dt><dd>" + S.price(t.sub) + "</dd></div>" +
      (t.disc ? "<div><dt>Discount (" + t.code + ")</dt><dd>&minus; " + S.price(t.disc) + "</dd></div>" : "") +
      "<div><dt>Delivery" + (express ? " (express)" : "") + "</dt><dd>" + (t.ship ? S.price(t.ship) : "Free") + "</dd></div>" +
      '<div class="grand"><dt>Total</dt><dd>' + S.price(t.total) + "</dd></div>"
    );
  }
  function bindPromo(after) {
    var f = $("[data-promo]");
    var msg = $("[data-promo-msg]"),
      inp = $("[data-promo-in]");
    if (promo) {
      inp.value = promo;
      msg.textContent = promo + " applied.";
      msg.className = "promo-msg ok";
    }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = inp.value.trim().toUpperCase();
      if (!c) {
        promo = "";
        msg.textContent = "";
      } else if (S.PROMOS[c]) {
        promo = c;
        msg.textContent = c + " applied: " + Math.round(S.PROMOS[c] * 100) + "% off.";
        msg.className = "promo-msg ok";
      } else {
        promo = "";
        msg.textContent = "That code isn't valid. Try STRYDE15.";
        msg.className = "promo-msg bad";
      }
      inp.value = promo || c;
      S.save("stryde-promo", promo);
      after();
    });
  }

  /* ---------- bag ---------- */
  function cart() {
    var box = $("[data-lines]");
    function render() {
      var lines = S.bag.lines();
      box.innerHTML = lines.length
        ? lines.map(S.lineHTML).join("") + '<div class="row-between" style="margin-top:20px"><a href="shop.html" class="link small">&larr; Keep shopping</a><button type="button" class="link small" data-clear>Clear bag</button></div>'
        : '<div class="empty">' + S.I.bag + '<p>Your bag is empty.</p><a href="shop.html" class="btn btn-ink">Shop the drop</a></div>';
      $("[data-summary]").hidden = !lines.length;
      $("[data-totals]").innerHTML = totalsHTML();
    }
    box.addEventListener("click", function (e) {
      if (e.target.closest("[data-clear]")) {
        S.bag.clear();
        S.say("Bag cleared.");
      }
    });
    S.bag.on(render);
    bindPromo(render);
    render();
  }

  /* ---------- checkout ---------- */
  function checkout() {
    if (!S.bag.count()) {
      $(".bag-grid").innerHTML = '<div class="empty">' + S.I.bag + '<p>Your bag is empty, so there is nothing to check out yet.</p><a href="shop.html" class="btn btn-ink">Shop the drop</a></div>';
      return;
    }
    var f = $("[data-co]");
    var u = S.user();
    if (u) {
      $("#o-name").value = u.name;
      $("#o-email").value = u.email;
    }
    liveValidate(f);
    function render() {
      $("[data-co-lines]").innerHTML = S.bag
        .lines()
        .map(function (l) {
          return '<div class="mini"><img src="' + l.p.src + '" alt="" /><div><p>' + l.qty + " &times; " + S.esc(l.p.name) + "</p><small>" + S.esc(l.p.color) + " · " + S.esc(l.size) + "</small></div><b>" + S.price(l.total) + "</b></div>";
        })
        .join("");
      $("[data-totals]").innerHTML = totalsHTML();
      var t = S.totals(promo);
      $("[data-ship-std]").textContent = t.ship ? S.price(S.SHIP) : "Free";
    }
    f.addEventListener("change", function (e) {
      if (e.target.name === "ship") {
        express = e.target.value === "express";
        render();
      }
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!S.validate(f)) return S.say("Please check the highlighted fields.");
      var t = totals();
      var o = {
        id: "ST" + String(Date.now()).slice(-6),
        at: Date.now(),
        name: $("#o-name").value.trim(),
        email: $("#o-email").value.trim(),
        phone: $("#o-phone").value.trim(),
        address: $("#o-addr").value.trim() + ", " + $("#o-city").value,
        ship: express ? "Express" : "Standard",
        pay: f.querySelector('input[name="pay"]:checked').value,
        lines: S.bag.lines().map(function (l) {
          return { id: l.id, size: l.size, qty: l.qty, name: l.p.name, color: l.p.color, src: l.p.src, total: l.total };
        }),
        totals: t,
      };
      var orders = S.load("stryde-orders", []);
      orders.unshift(o);
      S.save("stryde-orders", orders.slice(0, 20));
      S.save("stryde-promo", "");
      S.bag.clear();
      location.href = "order.html?id=" + o.id;
    });
    S.bag.on(function () {
      if (!S.bag.count()) location.reload();
      else render();
    });
    bindPromo(render);
    render();
  }

  /* ---------- order ---------- */
  var STAGES = [
    { t: 0, label: "Confirmed", icon: '<path d="m5 12 5 5 9-10"/>' },
    { t: 10, label: "Packed", icon: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>' },
    { t: 25, label: "On the way", icon: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>' },
    { t: 45, label: "Delivered", icon: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>' },
  ];
  function order() {
    var box = $("[data-track]");
    var orders = S.load("stryde-orders", []);
    var id = S.param("id");
    var o = id ? orders.filter(function (x) { return x.id === id; })[0] : null;
    if (!o) {
      box.innerHTML =
        '<p class="kicker">Orders</p><h1 class="h1 split">Track an <em>order</em></h1>' +
        (orders.length
          ? '<div class="card-box" style="margin-top:30px">' +
            orders.map(function (x) {
              return '<a class="orow" href="order.html?id=' + x.id + '"><b>#' + x.id + "</b><span>" + new Date(x.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) + "</span><span>" + x.lines.length + " item" + (x.lines.length > 1 ? "s" : "") + "</span><b>" + S.price(x.totals.total) + "</b></a>";
            }).join("") + "</div>"
          : '<div class="empty"><p>' + (id ? "We couldn't find order #" + S.esc(id) + " on this device." : "You haven't placed an order on this device yet.") + '</p><a href="shop.html" class="btn btn-ink">Shop the drop</a></div>');
      S.split(box);
      S.reveal(box);
      return;
    }
    box.innerHTML =
      '<p class="kicker" style="color:var(--coral)">Order #' + o.id + '</p><h1 class="h1 split">Thank <em>you</em>, ' + S.esc(o.name.split(" ")[0]) + "</h1>" +
      '<p class="lead" data-eta></p>' +
      '<ol class="stages"><span class="bar" data-bar></span>' +
      STAGES.map(function (s) {
        return '<li><span><svg viewBox="0 0 24 24">' + s.icon + "</svg></span>" + s.label + "</li>";
      }).join("") + "</ol>" +
      '<div class="bag-grid"><div class="card-box"><p class="h4" style="margin-bottom:10px">Items</p>' +
      o.lines.map(function (l) {
        return '<div class="mini"><img src="' + l.src + '" alt="" /><div><p>' + l.qty + " &times; " + S.esc(l.name) + "</p><small>" + S.esc(l.color) + " · " + S.esc(l.size) + "</small></div><b>" + S.price(l.total) + "</b></div>";
      }).join("") +
      '<dl class="totals"><div><dt>Subtotal</dt><dd>' + S.price(o.totals.sub) + "</dd></div>" +
      (o.totals.disc ? "<div><dt>Discount (" + o.totals.code + ")</dt><dd>&minus; " + S.price(o.totals.disc) + "</dd></div>" : "") +
      "<div><dt>Delivery</dt><dd>" + (o.totals.ship ? S.price(o.totals.ship) : "Free") + '</dd></div><div class="grand"><dt>Total</dt><dd>' + S.price(o.totals.total) + "</dd></div></dl></div>" +
      '<aside class="summary"><p class="h4">Details</p><dl class="totals">' +
      "<div><dt>Name</dt><dd>" + S.esc(o.name) + "</dd></div><div><dt>Mobile</dt><dd>" + S.esc(o.phone) + "</dd></div>" +
      '<div><dt>Address</dt><dd style="text-align:right">' + S.esc(o.address) + "</dd></div><div><dt>Delivery</dt><dd>" + o.ship + "</dd></div><div><dt>Payment</dt><dd>" + S.esc(o.pay) + "</dd></div></dl>" +
      '<a href="shop.html" class="btn btn-ink btn-block">Keep shopping</a><a href="order.html" class="btn btn-line btn-block">All orders</a></aside></div>' +
      '<p class="muted small center" style="margin-top:28px">Demo tracker: stages move every few seconds so you can see the whole journey.</p>';
    S.split(box);
    S.reveal(box);
    var lis = box.querySelectorAll(".stages li"),
      bar = $("[data-bar]"),
      eta = $("[data-eta]"),
      timer;
    function tick() {
      var s = (Date.now() - o.at) / 1000,
        cur = 0;
      STAGES.forEach(function (st, i) {
        if (s >= st.t) cur = i;
      });
      var last = cur === STAGES.length - 1;
      lis.forEach(function (li, i) {
        li.classList.toggle("done", i < cur || last);
        li.classList.toggle("now", i === cur && !last);
      });
      bar.style.setProperty("--p", cur / (STAGES.length - 1));
      eta.textContent = last ? "Delivered. Enjoy the fit." : "A confirmation is on its way to " + o.email + ". Arriving in about " + Math.ceil(STAGES[3].t - s) + " sec (demo time).";
      if (last) clearInterval(timer);
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- wishlist ---------- */
  function wishlist() {
    var g = $("[data-wish-grid]");
    function render() {
      var list = S.wish.list().map(S.find).filter(Boolean);
      g.innerHTML = list.map(S.card).join("");
      $("[data-wish-none]").hidden = list.length > 0;
      S.reveal(g);
      g.querySelectorAll("[data-wish]").forEach(function (b) {
        b.classList.add("on");
      });
    }
    document.addEventListener("wish", render);
    render();
  }

  /* ---------- account (demo, stored on this device only) ---------- */
  function account() {
    var box = $("[data-auth]");
    function render(mode) {
      var u = S.user();
      if (u) {
        var orders = S.load("stryde-orders", []);
        box.innerHTML =
          '<p class="kicker">My account</p><h1 class="h1 split">Hey <em>' + S.esc(u.name.split(" ")[0]) + "</em></h1>" +
          '<div class="card-box" style="margin-top:26px"><p class="label">Signed in as</p><p style="margin:0;font-weight:700">' + S.esc(u.email) + "</p></div>" +
          '<div class="nums" style="margin-top:14px;grid-template-columns:1fr 1fr"><a class="num" href="order.html"><b>' + orders.length + "</b><span>orders</span></a><a class=\"num\" href=\"wishlist.html\"><b>" + S.wish.list().length + "</b><span>saved</span></a></div>" +
          '<button type="button" class="btn btn-line btn-block" data-logout style="margin-top:18px">Log out</button>';
        S.split(box);
        S.reveal(box);
        return;
      }
      var reg = mode === "register";
      box.innerHTML =
        '<p class="kicker">Account</p><h1 class="h1 split">' + (reg ? "Join the <em>crew</em>" : "Welcome <em>back</em>") + "</h1>" +
        '<div class="card-box" style="margin-top:26px"><div class="auth-tabs" role="tablist"><button type="button" role="tab" class="' + (reg ? "" : "on") + '" data-mode="login">Log in</button><button type="button" role="tab" class="' + (reg ? "on" : "") + '" data-mode="register">Create account</button></div>' +
        '<form data-auth-form novalidate>' +
        (reg ? '<div class="field" data-field><label for="a-name">Full name</label><input id="a-name" required autocomplete="name" /><p class="ferr"></p></div>' : "") +
        '<div class="field" data-field><label for="a-email">Email</label><input id="a-email" type="email" required autocomplete="email" /><p class="ferr"></p></div>' +
        '<div class="field" data-field><label for="a-pass">Password</label><input id="a-pass" type="password" required minlength="6" autocomplete="' + (reg ? "new-password" : "current-password") + '" /><p class="ferr"></p></div>' +
        '<button type="submit" class="btn btn-ink btn-block">' + (reg ? "Create account" : "Log in") + "</button>" +
        '<p class="muted small" style="margin-top:12px">Demo account: your name and email are kept only in this browser. Passwords are never stored.</p></form></div>';
      S.split(box);
      S.reveal(box);
      var f = box.querySelector("[data-auth-form]");
      liveValidate(f);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!S.validate(f)) return;
        var email = $("#a-email").value.trim();
        var name = reg ? $("#a-name").value.trim() : email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        S.save("stryde-user", { name: name, email: email });
        S.say(reg ? "Account created. Welcome to STRYDE." : "Logged in.");
        setTimeout(function () {
          location.reload();
        }, 600);
      });
    }
    box.addEventListener("click", function (e) {
      var m = e.target.closest("[data-mode]");
      if (m) render(m.dataset.mode);
      if (e.target.closest("[data-logout]")) {
        S.save("stryde-user", null);
        try {
          localStorage.removeItem("stryde-user");
        } catch (x) {}
        S.say("Logged out.");
        setTimeout(function () {
          location.reload();
        }, 500);
      }
    });
    render(S.param("mode"));
  }

  var run = { shop: shop, product: product, lookbook: lookbook, about: about, contact: contact, cart: cart, checkout: checkout, order: order, wishlist: wishlist, account: account }[page];
  if (run) run();
  S.split();
  S.reveal();
})();
