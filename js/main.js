/* always restart from the top, so a reload plays the intro like the first visit */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
addEventListener("beforeunload", () => scrollTo(0, 0));
addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});

(() => {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis <-> GSAP ---------- */
  ScrollTrigger.clearScrollMemory("manual");
  scrollTo(0, 0);
  let introDone = false;
  const lenis = new Lenis({
    lerp: 0.075,
    smoothWheel: true,
    wheelMultiplier: 1,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(id, {
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
    }),
  );

  /* ---------- helpers ---------- */
  function split(el) {
    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="w"><span>${w}</span></span>`)
      .join(" ");
    return el.querySelectorAll(".w>span");
  }
  const heroWords = [];
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = split(el);
    gsap.set(words, { yPercent: 115, rotate: 5, opacity: 0 });
    if (el.hasAttribute("data-hero")) {
      heroWords.push(...words);
      return;
    }
    gsap.to(words, {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.06,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });
  gsap.set("[data-fade]", { autoAlpha: 0, y: 24 });

  /* ---------- hero image stack ---------- */
  const heroSrc = ["ap-01", "ap-02", "ap-03"];
  const heroBox = document.getElementById("heroImgs");
  const heroImgs = heroSrc.map((s) => {
    img = new Image();
    img.src = `/img/${s}.jpg`;
    img.alt = "";
    img.decoding = "async";
    heroBox.appendChild(img);
    return img;
  });
  let zTop = 1;
  gsap.set(heroImgs, { autoAlpha: 0 });
  gsap.set(heroImgs[0], { autoAlpha: 1 });
  function cycle(i) {
    const next = heroImgs[(i + 1) % heroImgs.length];
    gsap.fromTo(
      next,
      {
        autoAlpha: 1,
        zIndex: ++zTop,
        clipPath: "inset(100% 0% 0% 0%)",
        scale: 1.2,
      },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        duration: 1.4,
        ease: "expo.inOut",
        delay: 2.4,
        onComplete: () => cycle(i + 1),
      },
    );
  }
  cycle(0);
  gsap.to(".hero-in", {
    yPercent: -12,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
  gsap.to(heroBox, {
    scale: 1.12,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  /* ---------- preloader -> intro (site slides up from bottom) ---------- */
  const counter = { v: 0 };
  gsap.set("#site", { y: innerHeight });
  const finishIntro = () => {
    gsap.set("#site", { clearProps: "transform" }); // so pinning (position:fixed) works again
    gsap.set(".pre", { display: "none" });
    introDone = true;
    lenis.scrollTo(0, { immediate: true, force: true });
    ScrollTrigger.refresh();
    lenis.start();
  };
  gsap
    .timeline()
    .to(counter, {
      v: 100,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: () => (count.textContent = Math.round(counter.v)),
    })
    .to(".pre b", { scale: 0.92, duration: 0.5, ease: "power2.in" })
    .to(
      "#site",
      {
        y: 0,
        duration: 1.6,
        ease: "expo.inOut",
        onComplete: finishIntro,
      },
      ">",
    )
    .to(".pre", { yPercent: -20, duration: 1.6, ease: "expo.inOut" }, "<")
    .fromTo(
      heroImgs[0],
      { scale: 1.35 },
      { scale: 1, duration: 2, ease: "expo.out" },
      "<.25",
    )
    .to(
      heroWords,
      {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        duration: 1.4,
        ease: "expo.out",
        stagger: 0.09,
      },
      "-=1.1",
    )
    .to(
      "[data-fade]",
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
      },
      "-=1",
    )
    .to("header", { autoAlpha: 1, duration: 0.8 }, "-=1");

  /* ---------- menu ---------- */
  const menu = document.getElementById("menu"),
    btn = document.getElementById("menuBtn");
  const header = document.querySelector("header");
  const mtl = gsap
    .timeline({ paused: true, defaults: { ease: "expo.inOut" } })
    .to(menu, { clipPath: "inset(0 0 0% 0)", duration: 1 })
    .to(
      ".menu li a",
      { yPercent: 0, duration: 1, stagger: 0.07, ease: "expo.out" },
      "-=.4",
    );
  mtl.eventCallback("onReverseComplete", () =>
    gsap.set(".menu li a", { yPercent: 105 }),
  );
  function openMenu() {
    header.classList.add("blend");
    mtl.timeScale(1).play();
    btn.textContent = "Close";
    btn.setAttribute("aria-expanded", true);
    lenis.stop();
  }
  function closeMenu() {
    if (btn.getAttribute("aria-expanded") !== "true") return;
    mtl.timeScale(1.4).reverse();
    btn.textContent = "Menu";
    btn.setAttribute("aria-expanded", false);
    lenis.start();
    setTimeout(() => header.classList.remove("blend"), 1000);
  }
  btn.addEventListener("click", () =>
    btn.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu(),
  );
  gsap.set(".menu li a", { yPercent: 105 });

  /* ---------- pinned image-expand sections ---------- */
  document.querySelectorAll("[data-expand]").forEach((sec) => {
    const from =
      innerWidth < 760
        ? "inset(32% 12% 32% 12% round 18px)"
        : "inset(30% 34% 30% 34% round 18px)";
    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(
        sec.querySelector(".box"),
        { clipPath: from },
        { clipPath: "inset(0% 0% 0% 0% round 0px)" },
        0,
      )
      .fromTo(
        sec.querySelector(".box img"),
        { scale: 1.35, transformOrigin: "50% 50%" },
        { scale: 1 },
        0,
      )
      .fromTo(sec.querySelector(".cap"), { scale: 0.8 }, { scale: 1.08 }, 0);
  });

  /* ---------- featured: parallax + enter ---------- */
  document.querySelectorAll(".card").forEach((card) => {
    const img = card.querySelector("img"),
      media = card.querySelector(".media");
    gsap.fromTo(
      img,
      { yPercent: -9 },
      {
        yPercent: 9,
        ease: "none",
        scrollTrigger: {
          trigger: media,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
    gsap.fromTo(
      media,
      { clipPath: "inset(14% 14% 14% 14% round 14px)", y: 90 },
      {
        clipPath: "inset(0% 0% 0% 0% round 14px)",
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: media,
          start: "top 105%",
          end: "top 50%",
          scrub: true,
        },
      },
    );
    card.addEventListener("mouseenter", () =>
      gsap.to(img, { scale: 1.06, duration: 0.8, ease: "power3.out" }),
    );
    card.addEventListener("mouseleave", () =>
      gsap.to(img, { scale: 1, duration: 0.8, ease: "power3.out" }),
    );
  });

  /* ---------- news: horizontal scroll ---------- */
  /*const track = document.getElementById("track");
  gsap.to(track, {
    x: () => -(track.scrollWidth - innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: ".news",
      start: "top top",
      end: () => "+=" + (track.scrollWidth - innerWidth),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });*/

  /* ---------- our story: stacked in the centre -> split apart -> copy appears between ---------- */
  const sSec = document.getElementById("story"),
    sOur = sSec.querySelector(".s-our"),
    sStory = sSec.querySelector(".s-story");
  const copyWords = split(sSec.querySelector(".s-copy p"));
  gsap.set(copyWords, { yPercent: 115, rotate: 5, opacity: 0 });
  //gsap.set(".s-copy .btn", { autoAlpha: 0, y: 20 });
  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sSec,
        start: "top top",
        end: "+=170%",
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
    .fromTo(
      sOur,
      {
        x: () => sSec.clientWidth / 2 - sOur.offsetWidth / 2 - sOur.offsetLeft,
        y: () => sSec.clientHeight / 2 - (sOur.offsetTop + sOur.offsetHeight),
      },
      { x: 0, y: 0, duration: 1, ease: "power3.inOut" },
      0,
    )
    .fromTo(
      sStory,
      {
        x: () =>
          sSec.clientWidth / 2 - sStory.offsetWidth / 2 - sStory.offsetLeft,
        y: () => sSec.clientHeight / 2 - sStory.offsetTop,
      },
      { x: 0, y: 0, duration: 1, ease: "power3.inOut" },
      0,
    )
    .to(
      copyWords,
      {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.035,
        ease: "power3.out",
      },
      0.75,
    )
    //.to(".s-copy .btn", { autoAlpha: 1, y: 0, duration: 0.5 }, ">-.2")
    .to({}, { duration: 0.35 }); // short hold before unpinning

  /* ---------- contact ---------- */
  gsap.fromTo(
    ".form .rule",
    { scaleX: 0, transformOrigin: "0 50%" },
    {
      scaleX: 1,
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: { trigger: ".form", start: "top 80%" },
    },
  );

  const form = document.getElementById("contactForm"),
    fStatus = document.getElementById("formStatus");
  const ta = form.elements.message;
  ta.addEventListener("input", () => {
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.website.value) return; // honeypot: bots fill this in
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    fStatus.textContent = "Sending…";
    try {
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        const r = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!r.ok) throw new Error("bad response");
      } else await new Promise((r) => setTimeout(r, 900)); // demo mode until an endpoint is set
      form.reset();
      ta.style.height = "";
      fStatus.textContent =
        "Thanks, your message is on its way. We reply within two working days.";
    } catch (err) {
      fStatus.textContent =
        "Something went wrong. Please try again or email hello@example.com.";
    }
    submit.disabled = false;
  });

  addEventListener("load", () => {
    if (introDone) ScrollTrigger.refresh();
    else scrollTo(0, 0);
  });
})();

//Video Popup
(function () {
  var overlay = document.getElementById("vpOverlay");
  var frameHolder = document.getElementById("vpFrame");
  var closeBtn = overlay.querySelector(".vp-close");
  var lastFocus = null;

  // Accepts a bare ID or any common YouTube URL (watch, youtu.be, embed, shorts)
  function getId(value) {
    var m = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(value) ? value : null;
  }

  function open(value, trigger) {
    var id = getId(value);
    if (!id) return;
    lastFocus = trigger;
    var iframe = document.createElement("iframe");
    iframe.src =
      "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    iframe.title = "YouTube video player";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    frameHolder.appendChild(iframe);
    overlay.hidden = false;
    // next frame so the CSS transition runs
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove("is-open");
    frameHolder.innerHTML = ""; // removing the iframe stops playback
    document.body.style.overflow = "";
    setTimeout(function () {
      overlay.hidden = true;
    }, 200);
    if (lastFocus) lastFocus.focus();
  }

  // One delegated listener covers every trigger, including ones added later
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-video-popup]");
    if (t) {
      e.preventDefault();
      open(t.getAttribute("data-video-popup"), t);
    }
  });

  // Keyboard: Enter/Space on non-button triggers (e.g. the image)
  document.addEventListener("keydown", function (e) {
    var t = e.target.closest && e.target.closest("[data-video-popup]");
    if (
      t &&
      (e.key === "Enter" || e.key === " ") &&
      !/^(A|BUTTON)$/.test(t.tagName)
    ) {
      e.preventDefault();
      open(t.getAttribute("data-video-popup"), t);
    }
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });
})();
