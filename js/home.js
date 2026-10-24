/* STRYDE — home: loader, hero slider (floating cutout figure, giant headline, props with
   dotted leader lines, pill tags, mouse parallax), categories, drop grid, sticky story
   parallax, shop-the-look pins and the drop countdown. */
(function () {
  "use strict";
  var S = window.STRYDE,
    D = S.D;
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var hero = $("[data-hero]");
  var stage = $("[data-stage]");
  var SL = D.SLIDES;
  var idx = 0,
    timer = 0,
    paused = false,
    busy = false;
  var DUR = 7000;

  /* ---------- headline ---------- */
  function wordHTML(lines) {
    var i = 0;
    return lines
      .map(function (line) {
        return (
          '<span class="line">' +
          line
            .split("")
            .map(function (c) {
              return '<span class="ch" style="--i:' + i++ + '">' + (c === " " ? "&nbsp;" : c) + "</span>";
            })
            .join("") +
          "</span>"
        );
      })
      .join("");
  }

  /* ---------- dotted leader lines (drawn in pixels so dots stay round) ---------- */
  function drawLines(s) {
    var svg = $("[data-lines]");
    var w = hero.clientWidth,
      h = hero.clientHeight;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    var fx = w * 0.5,
      mob = w < 760;
    svg.innerHTML = s.props
      .map(function (p, i) {
        var x = (p.x / 100) * w,
          y = (p.y / 100) * h;
        var tx = fx + (x < fx ? -1 : 1) * (mob ? w * 0.12 : Math.min(120, w * 0.07));
        var ty = y + (mob ? 30 : 60) * (i % 2 ? -1 : 1);
        var cx = (x + tx) / 2,
          cy = Math.min(y, ty) - (mob ? 30 : 70);
        return (
          '<path class="lead-line" style="--i:' + i + '" d="M' + x.toFixed(1) + " " + y.toFixed(1) + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + tx.toFixed(1) + " " + ty.toFixed(1) + '"/>' +
          '<circle class="lead-dot" style="--i:' + i + '" cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="4"/>'
        );
      })
      .join("");
  }

  function render(s, first) {
    // background colour
    hero.style.setProperty("--bg", s.bg);
    hero.style.setProperty("--deep", s.deep);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", s.bg);
    // headline
    var word = $("[data-word]");
    word.innerHTML = wordHTML(s.word);
    word.setAttribute("aria-label", s.word.join(" "));
    fitWord();
    // figure
    var wrap = $("[data-fig-wrap]");
    var old = wrap.querySelector(".hero-fig");
    var p = S.find(s.product);
    var img = new Image();
    img.className = "hero-fig enter";
    img.alt = "Model wearing the " + p.name + " in " + p.color;
    img.src = "assets/img/cut/" + s.cut + ".webp";
    img.setAttribute("data-fig", "");
    if (first) {
      old.replaceWith(img);
    } else {
      old.classList.add("leave");
      old.removeAttribute("data-fig");
      wrap.appendChild(img);
      setTimeout(function () {
        old.remove();
      }, 900);
    }
    // props + tags
    $("[data-props]").innerHTML = s.props
      .map(function (pr, i) {
        return '<img class="prop" src="assets/img/cut/' + pr.cut + '.webp" alt="" style="left:' + pr.x + "%;top:" + pr.y + "%;width:" + pr.w + "%;--r:" + pr.r + "deg;--i:" + i + ";--depth:" + (1 + i * 0.6) + '" />';
      })
      .join("");
    $("[data-tags]").innerHTML = s.tags
      .map(function (t, i) {
        return '<span class="htag' + (t.dark ? " dark" : "") + '" style="left:' + t.x + "%;top:" + t.y + "%;--i:" + i + '">' + S.esc(t.t) + "</span>";
      })
      .join("");
    drawLines(s);
    // links + counters
    $("[data-cta-shop]").href = "product.html?id=" + p.id;
    $("[data-count]").textContent = "0" + (idx + 1);
    hero.querySelectorAll("[data-dot]").forEach(function (d, j) {
      d.classList.toggle("on", j === idx);
      d.setAttribute("aria-selected", String(j === idx));
    });
    // replay entrance animations
    hero.classList.remove("play");
    void hero.offsetWidth;
    hero.classList.add("play");
    restart();
  }

  function fitWord() {
    var el = $("[data-word]");
    el.style.fontSize = "";
    var max = hero.clientWidth * 0.94,
      w = 0;
    el.querySelectorAll(".line").forEach(function (l) {
      w = Math.max(w, l.scrollWidth);
    });
    if (w > max) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * max) / w + "px";
  }

  function go(i) {
    if (busy) return;
    busy = true;
    hero.classList.add("out");
    setTimeout(
      function () {
        idx = (i + SL.length) % SL.length;
        hero.classList.remove("out");
        render(SL[idx]);
        busy = false;
      },
      S.reduce ? 0 : 420
    );
  }
  function restart() {
    clearTimeout(timer);
    var bars = hero.querySelectorAll("[data-dot] i");
    bars.forEach(function (b) {
      b.style.transition = "none";
      b.style.transform = "scaleX(0)";
    });
    if (S.reduce || paused) return;
    var on = hero.querySelector("[data-dot].on i");
    if (on) {
      void on.offsetWidth;
      on.style.transition = "transform " + DUR + "ms linear";
      on.style.transform = "scaleX(1)";
    }
    timer = setTimeout(function () {
      go(idx + 1);
    }, DUR);
  }

  $("[data-dots]").innerHTML = SL.map(function (s, i) {
    return '<button type="button" role="tab" data-dot="' + i + '" aria-label="Look ' + (i + 1) + '"><i></i></button>';
  }).join("");
  $("[data-dots]").addEventListener("click", function (e) {
    var d = e.target.closest("[data-dot]");
    if (d && Number(d.dataset.dot) !== idx) go(Number(d.dataset.dot));
  });
  $("[data-next]").addEventListener("click", function () {
    go(idx + 1);
  });
  $("[data-prev]").addEventListener("click", function () {
    go(idx - 1);
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest("input, textarea, select") || document.body.classList.contains("lock")) return;
    if (window.scrollY > innerHeight * 0.6) return;
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  });
  hero.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "mouse") {
      paused = true;
      restart();
    }
  });
  hero.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") {
      paused = false;
      restart();
    }
  });
  var sx = null;
  hero.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
    sx = null;
  }, { passive: true });
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      fitWord();
      drawLines(SL[idx]);
    }, 120);
  });

  // pointer parallax: headline drifts one way, figure tilts, props float with depth
  if (S.fine && !S.reduce) {
    var mx = 0, my = 0, cx = 0, cy = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("pointerleave", function () {
      mx = my = 0;
    });
    (function loop() {
      cx += (mx - cx) * 0.07;
      cy += (my - cy) * 0.07;
      hero.style.setProperty("--mx", cx.toFixed(4));
      hero.style.setProperty("--my", cy.toFixed(4));
      requestAnimationFrame(loop);
    })();
  }
  // hero content eases back as you scroll away
  var heroH = hero.offsetHeight;
  window.addEventListener("scroll", function () {
    var p = Math.min(1, window.scrollY / heroH);
    hero.style.setProperty("--sp", p.toFixed(3));
  }, { passive: true });

  /* ---------- categories ---------- */
  var CAT_IMG = { hoodies: "core-hoodie-ember", tees: "box-tee-black", outerwear: "gloss-puffer-black", bottoms: "wide-denim-light", sets: "cloud-set-pink", accessories: "weekender-cognac" };
  $("[data-cats]").innerHTML = D.CATS.slice(1)
    .map(function (c, i) {
      var n = D.PRODUCTS.filter(function (p) {
        return p.cat === c.id;
      }).length;
      return (
        '<a class="cat rv" style="--d:' + i * 60 + 'ms" href="shop.html?cat=' + c.id + '" data-cursor="Shop">' +
        '<img src="assets/img/p/' + CAT_IMG[c.id] + '.webp" alt="" loading="lazy" />' +
        '<span class="cat-n">0' + (i + 1) + "</span>" +
        '<span class="cat-label"><b>' + c.label + "</b><small>" + n + " styles</small></span>" +
        '<span class="cat-go">' + S.I.arrow + "</span></a>"
      );
    })
    .join("");

  /* ---------- drop grid ---------- */
  var SETS = {
    new: ["gloss-puffer-black", "core-hoodie-midnight", "washed-tee-grey", "strap-cargo-black", "cloud-puffer-cream", "round-tortoise", "core-hoodie-ember", "ivory-tailored-set"],
    best: ["box-tee-black", "cloud-set-pink", "core-hoodie-ember", "wide-denim-light", "core-hoodie-mint", "washed-tee-ash", "wayfarer-black", "straight-denim-mid"],
    hoodies: D.PRODUCTS.filter(function (p) { return p.cat === "hoodies"; }).slice(0, 8).map(function (p) { return p.id; }),
  };
  var grid = $("[data-drop]");
  function showSet(k) {
    grid.classList.add("swap");
    setTimeout(function () {
      grid.innerHTML = SETS[k].map(function (id, i) {
        return S.card(S.find(id), i);
      }).join("");
      grid.classList.remove("swap");
      S.reveal(grid);
      document.dispatchEvent(new CustomEvent("wish"));
    }, grid.children.length ? 250 : 0);
  }
  $("[data-drop-tabs]").addEventListener("click", function (e) {
    var t = e.target.closest("[data-set]");
    if (!t) return;
    this.querySelectorAll("[data-set]").forEach(function (b) {
      b.classList.toggle("on", b === t);
      b.setAttribute("aria-selected", String(b === t));
    });
    showSet(t.dataset.set);
  });
  showSet("new");
  document.addEventListener("wish", function () {
    document.querySelectorAll("[data-wish]").forEach(function (b) {
      b.classList.toggle("on", S.wish.has(b.dataset.wish));
    });
  });

  /* ---------- story parallax + marquee speed ---------- */
  var figs = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));
  var story = $("[data-story]");
  var mq = $("[data-marquee] .marquee-track");
  var mx2 = 0, last = window.scrollY, vel = 0;
  (function tick() {
    var y = window.scrollY;
    vel += (Math.abs(y - last) - vel) * 0.1;
    last = y;
    if (!S.reduce) {
      mx2 -= 0.6 + Math.min(vel, 60) * 0.12;
      var w = mq.scrollWidth / 2;
      if (-mx2 > w) mx2 += w;
      mq.style.transform = "translate3d(" + mx2.toFixed(1) + "px,0,0)";
      var r = story.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        figs.forEach(function (f) {
          f.style.transform = "translate3d(0," + (r.top * Number(f.dataset.speed)).toFixed(1) + "px,0)";
        });
      }
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- shop the look ---------- */
  var look = $("[data-look]");
  var lookIds = Array.prototype.map.call(look.querySelectorAll("[data-pin]"), function (b) {
    return b.dataset.pin;
  });
  $("[data-look-list]").innerHTML = lookIds
    .map(function (id, i) {
      var p = S.find(id);
      return (
        '<div class="look-item rv' + (i === 0 ? " on" : "") + '" data-look-item="' + id + '">' +
        '<img src="' + p.src + '" alt="" loading="lazy" /><div><p class="small muted">0' + (i + 1) + " · " + S.esc(p.color) + "</p><h3>" + S.esc(p.name) + "</h3><p>" + S.price(p.price) + "</p></div>" +
        '<button type="button" class="btn btn-ink btn-sm" data-quick="' + id + '">Add</button></div>'
      );
    })
    .join("");
  look.addEventListener("click", function (e) {
    var pin = e.target.closest("[data-pin]");
    if (!pin) return;
    look.querySelectorAll("[data-pin]").forEach(function (b) {
      b.classList.toggle("on", b === pin);
    });
    look.querySelectorAll("[data-look-item]").forEach(function (it) {
      it.classList.toggle("on", it.dataset.lookItem === pin.dataset.pin);
    });
  });
  look.addEventListener("mouseover", function (e) {
    var it = e.target.closest("[data-look-item]");
    if (!it) return;
    look.querySelectorAll("[data-pin]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.pin === it.dataset.lookItem);
    });
  });

  /* ---------- countdown to next Friday 8 pm ---------- */
  function nextDrop() {
    var d = new Date();
    var t = new Date(d);
    t.setHours(20, 0, 0, 0);
    var add = (5 - d.getDay() + 7) % 7;
    if (add === 0 && d >= t) add = 7;
    t.setDate(t.getDate() + add);
    return t;
  }
  var target = nextDrop();
  function cd() {
    var s = Math.max(0, Math.floor((target - new Date()) / 1000));
    if (!s) target = nextDrop();
    var pad = function (n) {
      return (n < 10 ? "0" : "") + n;
    };
    $("[data-d]").textContent = pad(Math.floor(s / 86400));
    $("[data-h]").textContent = pad(Math.floor((s % 86400) / 3600));
    $("[data-m]").textContent = pad(Math.floor((s % 3600) / 60));
    $("[data-s]").textContent = pad(s % 60);
  }
  cd();
  setInterval(cd, 1000);
  $("[data-focus-news]").addEventListener("click", function (e) {
    e.preventDefault();
    var i = document.getElementById("news-email");
    i.scrollIntoView({ behavior: S.reduce ? "auto" : "smooth", block: "center" });
    setTimeout(function () {
      i.focus({ preventScroll: true });
    }, 600);
  });

  S.reveal();

  /* ---------- loader, then start ---------- */
  var first = new Image();
  first.src = "assets/img/cut/" + SL[0].cut + ".webp";
  var started = false;
  function start() {
    if (started) return;
    started = true;
    setTimeout(function () {
      document.body.classList.add("ready");
      render(SL[0], true);
    }, S.reduce ? 0 : 900);
  }
  if (first.complete) start();
  first.onload = start;
  first.onerror = start;
  setTimeout(start, 2500);
  SL.forEach(function (s) {
    new Image().src = "assets/img/cut/" + s.cut + ".webp";
    s.props.forEach(function (p) {
      new Image().src = "assets/img/cut/" + p.cut + ".webp";
    });
  });
})();
