/* STRYDE — catalogue. Every page reads from here. */
(function () {
  "use strict";
  var P = "assets/img/p/";

  var CATS = [
    { id: "all", label: "All" },
    { id: "hoodies", label: "Hoodies" },
    { id: "tees", label: "Tees" },
    { id: "outerwear", label: "Outerwear" },
    { id: "bottoms", label: "Bottoms" },
    { id: "sets", label: "Sets" },
    { id: "accessories", label: "Accessories" },
  ];

  var SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

  // p: product. img + alt (hover image). tag: small label on the card.
  var PRODUCTS = [
    { id: "box-tee-black", name: "Oversized Box Tee", color: "Jet Black", hex: "#141414", cat: "tees", price: 2990, tag: "Bestseller", fit: "Oversized", fabric: "240 GSM combed cotton", img: "box-tee-black", alt: "box-tee-black-alt", sizes: SIZES },
    { id: "washed-tee-grey", name: "Washed Heavy Tee", color: "Stone Grey", hex: "#6f6a64", cat: "tees", price: 3290, tag: "New", fit: "Oversized", fabric: "280 GSM garment-washed cotton", img: "washed-tee-grey", alt: "washed-tee-grey-alt", sizes: SIZES },
    { id: "washed-tee-ash", name: "Washed Heavy Tee", color: "Ash", hex: "#4d4b49", cat: "tees", price: 3290, tag: "", fit: "Oversized", fabric: "280 GSM garment-washed cotton", img: "washed-tee-ash", alt: "washed-tee-grey", sizes: SIZES },
    { id: "night-crew-black", name: "Night Crew Long Sleeve", color: "Black", hex: "#111", cat: "tees", price: 3690, tag: "", fit: "Relaxed", fabric: "Heavy jersey cotton", img: "night-crew-black", alt: "night-crew-black-alt", sizes: SIZES },
    { id: "core-hoodie-ember", name: "Core Hoodie", color: "Ember", hex: "#e2711d", cat: "hoodies", price: 5490, tag: "Drop 04", fit: "Boxy", fabric: "420 GSM brushed fleece", img: "core-hoodie-ember", alt: "core-hoodie-signal", sizes: SIZES },
    { id: "core-hoodie-mint", name: "Core Hoodie", color: "Mint", hex: "#9fd6cf", cat: "hoodies", price: 5490, tag: "", fit: "Boxy", fabric: "420 GSM brushed fleece", img: "core-hoodie-mint", alt: "core-hoodie-cloud", sizes: SIZES },
    { id: "core-hoodie-cocoa", name: "Core Hoodie", color: "Cocoa", hex: "#8a5a3c", cat: "hoodies", price: 5490, tag: "", fit: "Boxy", fabric: "420 GSM brushed fleece", img: "core-hoodie-cocoa", alt: "core-hoodie-sand", sizes: SIZES },
    { id: "core-hoodie-signal", name: "Core Hoodie", color: "Signal Red", hex: "#d1281f", cat: "hoodies", price: 5490, tag: "Low stock", fit: "Boxy", fabric: "420 GSM brushed fleece", img: "core-hoodie-signal", alt: "core-hoodie-ember", sizes: SIZES },
    { id: "core-hoodie-cloud", name: "Core Hoodie", color: "Cloud White", hex: "#f2f0ea", cat: "hoodies", price: 5490, tag: "", fit: "Boxy", fabric: "420 GSM brushed fleece", img: "core-hoodie-cloud", alt: "core-hoodie-mint", sizes: SIZES },
    { id: "core-hoodie-midnight", name: "Script Hoodie", color: "Midnight", hex: "#151515", cat: "hoodies", price: 5990, tag: "New", fit: "Oversized", fabric: "450 GSM fleece, puff print", img: "core-hoodie-midnight", alt: "core-hoodie-ash", sizes: SIZES },
    { id: "core-hoodie-ash", name: "Studio Hoodie", color: "Ash Blue", hex: "#c9d3dc", cat: "hoodies", price: 5490, tag: "", fit: "Regular", fabric: "380 GSM loopback cotton", img: "core-hoodie-ash", alt: "core-hoodie-midnight", sizes: SIZES },
    { id: "core-hoodie-sand", name: "Core Hoodie", color: "Sand", hex: "#d8c9a8", cat: "hoodies", price: 5490, tag: "", fit: "Boxy", fabric: "420 GSM brushed fleece", img: "core-hoodie-sand", alt: "core-hoodie-cocoa", sizes: SIZES },
    { id: "gloss-puffer-black", name: "Gloss Puffer Jacket", color: "Black", hex: "#0e0e0e", cat: "outerwear", price: 14990, tag: "Drop 04", fit: "Boxy", fabric: "High-shine nylon, recycled fill", img: "gloss-puffer-black", alt: "gloss-puffer-black-alt", sizes: SIZES },
    { id: "cloud-puffer-cream", name: "Cloud Puffer Jacket", color: "Cream", hex: "#eee5d2", cat: "outerwear", price: 13990, tag: "", fit: "Relaxed", fabric: "Matte nylon, recycled fill", img: "cloud-puffer-cream", alt: "gloss-puffer-black", sizes: SIZES },
    { id: "ivory-tailored-set", name: "Ivory Tailored Set", color: "Ivory", hex: "#efe9dc", cat: "sets", price: 16490, tag: "Limited", fit: "Tailored", fabric: "Wool-touch suiting", img: "ivory-tailored-set", alt: "ivory-tailored-set-alt", sizes: ["XS", "S", "M", "L", "XL"] },
    { id: "cloud-set-pink", name: "Cloud Fleece Set", color: "Bubblegum", hex: "#f4a7d0", cat: "sets", price: 9990, tag: "Bestseller", fit: "Oversized", fabric: "Brushed fleece hoodie + jogger", img: "cloud-set-pink", alt: "cloud-set-pink-alt", sizes: SIZES },
    { id: "wide-denim-light", name: "Wide Leg Denim", color: "Light Wash", hex: "#9ab4d4", cat: "bottoms", price: 6490, tag: "", fit: "Wide leg", fabric: "13 oz rigid denim", img: "wide-denim-light", alt: "straight-denim-mid", sizes: ["28", "30", "32", "34", "36"] },
    { id: "straight-denim-mid", name: "Straight Denim", color: "Mid Wash", hex: "#5d7ea8", cat: "bottoms", price: 5990, tag: "", fit: "Straight", fabric: "12 oz stretch denim", img: "straight-denim-mid", alt: "straight-denim-mid-alt", sizes: ["28", "30", "32", "34", "36"] },
    { id: "strap-cargo-black", name: "Strap Cargo Pant", color: "Black / Red", hex: "#1b1b1b", cat: "bottoms", price: 7490, tag: "New", fit: "Tapered", fabric: "Cotton twill, detachable straps", img: "strap-cargo-black", alt: "strap-cargo-black-alt", sizes: ["28", "30", "32", "34", "36"] },
    { id: "rib-knit-black", name: "Rib Knit Sweater", color: "Black", hex: "#121212", cat: "tees", price: 6990, tag: "", fit: "Slim", fabric: "Merino blend rib", img: "rib-knit-black", alt: "night-crew-black", sizes: SIZES },
    { id: "weekender-cognac", name: "Weekender Bag", color: "Cognac", hex: "#9a4f1e", cat: "accessories", price: 18990, tag: "Limited", fit: "One size", fabric: "Full-grain leather", img: "weekender-cognac", alt: "weekender-cognac", sizes: ["One size"] },
    { id: "wayfarer-black", name: "Street Shades", color: "Gloss Black", hex: "#0c0c0c", cat: "accessories", price: 3490, tag: "", fit: "One size", fabric: "Acetate frame, UV400", img: "wayfarer-black", alt: "wayfarer-black", sizes: ["One size"] },
    { id: "round-tortoise", name: "Round Shades", color: "Tortoise", hex: "#6b3d20", cat: "accessories", price: 3490, tag: "New", fit: "One size", fabric: "Acetate frame, UV400", img: "round-tortoise", alt: "round-tortoise", sizes: ["One size"] },
  ];
  PRODUCTS.forEach(function (p) {
    p.src = P + p.img + ".webp";
    p.src2 = P + p.alt + ".webp";
  });

  // hero slides — cutout figures float over the giant headline
  var SLIDES = [
    {
      word: ["OWN THE", "STREET"], bg: "#f27d52", deep: "#d9582c", cut: "m-tee-shorts", product: "box-tee-black",
      tags: [{ t: "Oversized", x: 18, y: 38, dark: false }, { t: "New drop", x: 70, y: 30, dark: true }, { t: "Street ready", x: 66, y: 66, dark: false }],
      props: [{ cut: "shades-black", x: 20, y: 60, w: 13, r: -12 }, { cut: "bag-brown", x: 79, y: 46, w: 13, r: 8 }],
    },
    {
      word: ["SOFT BUT", "LOUD"], bg: "#f39a8b", deep: "#e0705f", cut: "w-pink-sweat", product: "cloud-set-pink",
      tags: [{ t: "Fleece set", x: 20, y: 34, dark: false }, { t: "Bestseller", x: 70, y: 28, dark: true }, { t: "Cloud soft", x: 68, y: 68, dark: false }],
      props: [{ cut: "shades-round", x: 18, y: 62, w: 15, r: 10 }],
    },
    {
      word: ["COLD", "PROOF"], bg: "#e9784a", deep: "#bf4f24", cut: "m-puffer-black", product: "gloss-puffer-black",
      tags: [{ t: "Gloss puffer", x: 18, y: 36, dark: false }, { t: "Drop 04", x: 72, y: 30, dark: true }, { t: "Winter ready", x: 68, y: 66, dark: false }],
      props: [{ cut: "shades-black", x: 78, y: 50, w: 12, r: 14 }],
    },
  ];

  var LOOKS = [
    { img: "assets/img/l/crouch.webp", title: "Low profile", items: ["washed-tee-grey", "strap-cargo-black"] },
    { img: "assets/img/l/dance.webp", title: "After hours", items: ["core-hoodie-midnight", "straight-denim-mid"] },
    { img: "assets/img/l/ember-tall.webp", title: "Golden hour", items: ["core-hoodie-ember"] },
    { img: "assets/img/l/midnight-tall.webp", title: "Script", items: ["core-hoodie-midnight", "wide-denim-light"] },
  ];

  window.STRYDE_DATA = { CATS: CATS, SIZES: SIZES, PRODUCTS: PRODUCTS, SLIDES: SLIDES, LOOKS: LOOKS };
})();
