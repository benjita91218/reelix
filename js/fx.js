/* =====================================================================
   REELIX · fx.js
   Capa de movimiento. NO modifica la lógica de la aplicación: solo añade
   animaciones (scroll suave, 3D al hacer scroll, tilt, transiciones) y
   pequeños ajustes de DOM para el diseño.
   Se carga como script clásico en <head> y se inicializa en
   DOMContentLoaded (cuando los módulos de la app ya corrieron).
   ===================================================================== */
(function () {
    "use strict";

    const root = document.documentElement;
    const mq = (q) => (window.matchMedia ? window.matchMedia(q).matches : false);
    const REDUCE = mq("(prefers-reduced-motion: reduce)");
    const FINE = mq("(hover: hover) and (pointer: fine)");

    root.classList.add("fx");

    /* ------------------------------------------------------------------
       Utilidades
       ------------------------------------------------------------------ */
    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    function el(tag, cls, html) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    }
    function safe(name, fn) {
        try { fn(); } catch (e) { console.warn("[reelix fx] " + name + ":", e); }
    }

    const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.3 6.2 20.7l1.5-6.6L2.6 9.6l6.7-.6L12 2.8l2.7 6.2 6.7.6-5.1 4.5 1.5 6.6z"/></svg>';

    /* Estado compartido y funciones por frame */
    const S = { sy: 0, vh: window.innerHeight, vw: window.innerWidth, vel: 0, dt: 16, mx: window.innerWidth / 2, my: window.innerHeight / 2 };
    window.addEventListener("pointermove", (e) => { S.mx = e.clientX; S.my = e.clientY; }, { passive: true });
    const frames = [];
    const onFrame = (fn) => frames.push(fn);

    // Funciones que "limpian" estados de hover/foco cuando la pestaña
    // estuvo oculta: al volver, el mouse no manda pointerenter/leave
    // hasta que se mueve, así que un hover quedaría visualmente trabado.
    const onVisible = [];
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") return;
        onVisible.forEach((fn) => { try { fn(); } catch (e) { /* noop */ } });
    });

    // Los enlaces placeholder (href="#", como "Usuario") no deben saltar
    // al principio de la página, que es el comportamiento nativo del
    // navegador para un fragmento vacío.
    document.addEventListener("click", (e) => {
        const a = e.target.closest ? e.target.closest('a[href="#"]') : null;
        if (a) e.preventDefault();
    });

    /* ------------------------------------------------------------------
       Compuerta de entrada ("go"): los reveals esperan a que la cortina
       se abra. Un temporizador de seguridad evita que algo quede oculto.
       ------------------------------------------------------------------ */
    let went = false;
    let curtain = null;
    const queue = [];

    const io = "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                en.target.classList.add("in");
                en.target.dispatchEvent(new Event("fx:in"));
                io.unobserve(en.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
        : null;

    function watch(n) {
        if (!io) { n.classList.add("in"); return; }
        if (went) io.observe(n); else queue.push(n);
    }

    function goNow() {
        if (went) return;
        went = true;
        root.classList.add("ready", "go");
        queue.splice(0).forEach((n) => io && io.observe(n));
    }

    setTimeout(() => {
        goNow();
        if (curtain && !curtain.classList.contains("opened")) {
            curtain.classList.remove("no-anim", "closing");
            curtain.classList.add("opened", "gone");
        }
    }, 5000);

    function reveal(n, delay, mode) {
        if (!n) return;
        n.setAttribute("data-reveal", mode || "");
        n.style.setProperty("--d", delay || 0);
        watch(n);
    }

    /* ------------------------------------------------------------------
       Texto
       ------------------------------------------------------------------ */
    function splitWords(node, opts) {
        opts = opts || {};
        if (!node || node.dataset.split) return;
        if (Array.from(node.childNodes).some((n) => n.nodeType === 1)) return;
        const text = node.textContent.trim().replace(/\s+/g, " ");
        if (!text) return;

        node.dataset.split = "1";
        node.setAttribute("aria-label", text);
        node.classList.add("split");
        node.style.setProperty("--base", (opts.base || 0) + "ms");
        node.textContent = "";

        const words = text.split(" ");
        words.forEach((w, i) => {
            const outer = el("span", "w");
            outer.setAttribute("aria-hidden", "true");
            const inner = el("span", "wi");
            inner.textContent = w;
            inner.style.setProperty("--i", i);
            if (opts.accentLast && words.length > 1 && i === words.length - 1) inner.classList.add("accent");
            outer.appendChild(inner);
            node.appendChild(outer);
            if (i < words.length - 1) node.appendChild(document.createTextNode(" "));
        });
        watch(node);
    }

    /* Texto de botones que "rueda" al hacer hover */
    function rollify(n) {
        if (!n || n.dataset.roll || n.children.length) return;
        const t = n.textContent.trim();
        if (!t) return;
        n.dataset.roll = "1";
        n.textContent = "";
        const r = el("span", "roll");
        const a = el("span", "roll-a");
        const b = el("span", "roll-b");
        a.textContent = t;
        b.textContent = t;
        b.setAttribute("aria-hidden", "true");
        r.append(a, b);
        n.appendChild(r);
    }

    /* Botón magnético (muy sutil) */
    function magnetize(n, strength) {
        if (!FINE || REDUCE || !n || n.dataset.mag) return;
        n.dataset.mag = "1";
        const s = strength || 0.18;
        n.addEventListener("pointermove", (e) => {
            const r = n.getBoundingClientRect();
            const x = e.clientX - (r.left + r.width / 2);
            const y = e.clientY - (r.top + r.height / 2);
            n.style.translate = (x * s).toFixed(1) + "px " + (y * s).toFixed(1) + "px";
        });
        n.addEventListener("pointerleave", () => { n.style.translate = ""; });
    }

    /* ------------------------------------------------------------------
       Tilt 3D (póster del detalle)
       ------------------------------------------------------------------ */
    const tilts = [];

    function makeTilt(n, o) {
        if (!n || !FINE || REDUCE) return;
        o = Object.assign({ max: 6, pers: 1200, scale: 1 }, o || {});
        const t = { n, o, cx: 0, cy: 0, tx: 0, ty: 0, s: 1, ts: 1, active: false };
        tilts.push(t);
        n.addEventListener("pointermove", (e) => {
            const r = n.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            t.ty = (x - 0.5) * 2 * o.max;
            t.tx = (0.5 - y) * 2 * o.max;
            t.ts = o.scale;
            t.active = true;
        });
        n.addEventListener("pointerleave", () => { t.tx = 0; t.ty = 0; t.ts = 1; });
    }

    onFrame(() => {
        for (const t of tilts) {
            t.cx = lerp(t.cx, t.tx, 0.1);
            t.cy = lerp(t.cy, t.ty, 0.1);
            t.s = lerp(t.s, t.ts, 0.1);
            const rest = Math.abs(t.cx) < 0.01 && Math.abs(t.cy) < 0.01 && Math.abs(t.s - 1) < 0.0005;
            if (rest) {
                if (t.active) { t.n.style.transform = ""; t.active = false; }
                continue;
            }
            t.n.style.transform =
                "perspective(" + t.o.pers + "px) rotateX(" + t.cx.toFixed(2) + "deg) rotateY(" + t.cy.toFixed(2) + "deg) scale(" + t.s.toFixed(4) + ")";
        }
    });

    /* ------------------------------------------------------------------
       Scroll suave con inercia (mouse/trackpad). Respeta
       prefers-reduced-motion y deja el scroll nativo en elementos internos.
       ------------------------------------------------------------------ */
    const smooth = (function () {
        const api = {
            step: function () {},
            to: function (y) { window.scrollTo({ top: y, behavior: REDUCE ? "auto" : "smooth" }); },
        };
        if (REDUCE || !FINE) return api;

        let target = window.scrollY;
        let current = target;
        let running = false;
        const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

        const innerScrollable = (node, dy) => {
            while (node && node !== document.body && node !== document.documentElement) {
                if (node.nodeType === 1) {
                    const oy = getComputedStyle(node).overflowY;
                    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight + 1) {
                        if ((dy < 0 && node.scrollTop > 0) ||
                            (dy > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return true;
                    }
                }
                node = node.parentNode;
            }
            return false;
        };

        window.addEventListener("wheel", (e) => {
            if (e.ctrlKey || e.defaultPrevented) return;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            if (innerScrollable(e.target, e.deltaY)) return;
            e.preventDefault();
            if (!running) { current = window.scrollY; target = current; }
            const unit = e.deltaMode === 1 ? 34 : e.deltaMode === 2 ? window.innerHeight : 1;
            target = clamp(target + e.deltaY * unit, 0, maxY());
            running = true;
        }, { passive: false });

        const stop = () => { running = false; };
        window.addEventListener("keydown", (e) => {
            if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].indexOf(e.key) > -1) stop();
        });
        window.addEventListener("touchstart", stop, { passive: true });
        window.addEventListener("mousedown", stop, { passive: true });

        api.step = function (dt) {
            if (!running) return;
            const k = 1 - Math.pow(1 - 0.11, dt / 16.67);
            current += (target - current) * k;
            if (Math.abs(target - current) < 0.4) { current = target; running = false; }
            window.scrollTo(0, current);
        };
        api.to = function (y) {
            current = window.scrollY;
            target = clamp(y, 0, maxY());
            running = true;
        };
        return api;
    })();

    /* ------------------------------------------------------------------
       Bucle principal
       ------------------------------------------------------------------ */
    let last = performance.now();
    function tick(now) {
        S.dt = Math.min(64, now - last);
        last = now;
        smooth.step(S.dt);

        const sy = window.scrollY;
        S.vel = lerp(S.vel, sy - S.sy, 0.2);
        S.sy = sy;
        S.vh = window.innerHeight;
        S.vw = window.innerWidth;

        for (let i = 0; i < frames.length; i++) {
            try { frames[i](S, now); } catch (e) {
                console.warn("[reelix fx] frame", e);
                frames.splice(i--, 1);
            }
        }
        requestAnimationFrame(tick);
    }

    function detectPage() {
        if ($(".login-page")) return "auth";
        if ($(".catalog-container")) return "catalog";
        if ($(".detail-container")) return "detail";
        if ($(".form-container")) return "form";
        return "other";
    }

    /* ------------------------------------------------------------------
       Luz ambiente (detalle), progreso de scroll y volver arriba
       ------------------------------------------------------------------ */
    let ambientEl = null;

    function buildBackdrop(withAmbient) {
        const bg = el("div", "bg-fx",
            '<i class="aurora a1"></i><i class="aurora a2"></i><i class="aurora a3"></i>' +
            (withAmbient ? '<i class="ambient"></i>' : "") + '<i class="glow"></i>');
        document.body.prepend(bg);
        ambientEl = $(".ambient", bg);
        const glow = $(".glow", bg);
        if (!REDUCE) document.body.appendChild(el("div", "grain"));
        if (glow && FINE && !REDUCE) {
            let gx = S.mx, gy = S.my;
            onFrame(() => {
                gx = lerp(gx, S.mx, 0.12);
                gy = lerp(gy, S.my, 0.12);
                glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
            });
        } else if (glow) {
            glow.style.display = "none";
        }
    }

    function buildProgressAndTop() {
        const bar = el("div", "scroll-progress");
        document.body.appendChild(bar);

        const C = 2 * Math.PI * 24;
        const top = el("button", "to-top",
            '<svg class="ring" viewBox="0 0 50 50"><circle class="track" cx="25" cy="25" r="24"/>' +
            '<circle class="bar" cx="25" cy="25" r="24" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>' +
            '<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>');
        top.type = "button";
        top.setAttribute("aria-label", "Volver arriba");
        document.body.appendChild(top);
        top.addEventListener("click", () => smooth.to(0));

        const barRing = $(".bar", top);
        onFrame((s) => {
            const max = Math.max(1, document.documentElement.scrollHeight - s.vh);
            const p = clamp(s.sy / max, 0, 1);
            bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
            barRing.style.strokeDashoffset = (C * (1 - p)).toFixed(1);
            top.classList.toggle("show", s.sy > 600);
        });
    }

    /* ------------------------------------------------------------------
       Cortina: intro (1ª visita) y transición entre páginas
       ------------------------------------------------------------------ */
    let leaving = false;

    function buildCurtain(first) {
        curtain = el("div", "curtain closing no-anim");
        for (let i = 0; i < 5; i++) {
            const s = el("i");
            s.style.setProperty("--i", i);
            curtain.appendChild(s);
        }
        if (first) {
            curtain.appendChild(el("div", "curtain-brand", '<span class="cb-logo">REEL<b>IX</b></span><span class="cb-bar"></span>'));
        }
        document.body.appendChild(curtain);
    }

    function openCurtain(first) {
        const open = () => {
            curtain.classList.remove("no-anim");
            void curtain.offsetWidth;
            curtain.classList.remove("closing");
            curtain.classList.add("opened");
            setTimeout(goNow, 380);
            setTimeout(() => curtain.classList.add("gone"), 1600);
        };
        root.classList.add("ready");
        if (!first) { requestAnimationFrame(open); return; }

        const bar = $(".cb-bar", curtain);
        const dur = 1100;
        const t0 = performance.now();
        (function step(now) {
            const p = clamp((now - t0) / dur, 0, 1);
            if (bar) bar.style.setProperty("--p", easeOut(p).toFixed(3));
            if (p < 1) requestAnimationFrame(step); else setTimeout(open, 200);
        })(t0);
    }

    function setupPageTransitions() {
        document.addEventListener("click", (e) => {
            if (leaving || e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target.closest ? e.target.closest("a[href]") : null;
            if (!a) return;
            const href = a.getAttribute("href");
            if (!href || href.charAt(0) === "#" || a.target === "_blank" || a.hasAttribute("download")) return;
            if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

            let url;
            try { url = new URL(a.href, location.href); } catch (_) { return; }
            if (url.origin !== location.origin) return;
            if (url.pathname === location.pathname && url.hash) return;

            e.preventDefault();
            leaving = true;
            curtain.classList.remove("no-anim", "gone", "opened");
            void curtain.offsetWidth;
            curtain.classList.add("closing");
            setTimeout(() => { location.href = a.href; }, 620);
        });

        // Al volver con el botón "atrás" (bfcache) se reabre la cortina
        window.addEventListener("pageshow", (e) => {
            if (!e.persisted) return;
            leaving = false;
            curtain.classList.remove("closing", "gone");
            curtain.classList.add("opened");
        });
    }

    /* ------------------------------------------------------------------
       Barra superior
       ------------------------------------------------------------------ */
    function setupNav() {
        const nav = $(".navbar");
        if (!nav) return;
        const links = $(".nav-links", nav);

        if (links) {
            const as = $$("a", links);
            as.forEach((a) => {
                if (/agregar\.html$/i.test(a.getAttribute("href") || "")) a.classList.add("add-btn");
            });

            const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
            const alias = { "detalle.html": "catalogo.html", "editar.html": "catalogo.html" };
            const want = alias[file] || file;
            const act = as.find((a) => (a.getAttribute("href") || "").toLowerCase() === want);
            if (act) act.classList.add("active");

            // "Usuario" todavía no tiene una página propia: mientras tanto
            // muestra el nombre con el que se inició sesión en vez de un
            // enlace muerto sin ninguna función.
            const userLink = $(".nav-user", links);
            if (userLink) {
                let nombre = "";
                try { nombre = (localStorage.getItem("reelix_usuario_actual") || "").trim(); } catch (_) { /* noop */ }
                if (nombre) userLink.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
                userLink.title = "Perfil de usuario (próximamente)";
            }

            // Indicador deslizante de hover
            if (FINE && !REDUCE) {
                const pill = el("span", "nav-pill");
                links.prepend(pill);
                links.classList.add("has-pill");
                const show = (a) => {
                    const first = !pill.classList.contains("vis");
                    if (first) pill.style.transition = "none";
                    pill.style.width = a.offsetWidth + "px";
                    pill.style.height = a.offsetHeight + "px";
                    pill.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
                    if (first) { void pill.offsetWidth; pill.style.transition = ""; pill.classList.add("vis"); }
                };
                as.filter((a) => !a.classList.contains("add-btn")).forEach((a) => {
                    a.addEventListener("pointerenter", () => show(a));
                });
                links.addEventListener("pointerleave", () => pill.classList.remove("vis"));
                // Si la pestaña estuvo oculta con el mouse sobre un enlace, el
                // pill se queda marcando esa posición hasta el próximo hover
                // real: al volver, se oculta y espera el siguiente movimiento.
                onVisible.push(() => pill.classList.remove("vis"));
            }
        }

        // Se oculta al bajar y reaparece al subir
        let lastY = 0;
        onFrame((s) => {
            nav.classList.toggle("scrolled", s.sy > 8);
            const d = s.sy - lastY;
            if (Math.abs(d) > 3) {
                nav.classList.toggle("nav-hidden", d > 0 && s.sy > 160);
                lastY = s.sy;
            }
            if (s.sy < 80) nav.classList.remove("nav-hidden");
        });
    }

    /* ------------------------------------------------------------------
       Ajustes mínimos de DOM (no tocan IDs ni la lógica de la app)
       ------------------------------------------------------------------ */
    function normalizeDOM() {
        // editar.html: label+campo => .form-group (igual que agregar.html)
        const form = $("#form-editar");
        if (form && !$(".form-group", form)) {
            $$(":scope > label", form).forEach((label) => {
                const target = document.getElementById(label.getAttribute("for"));
                if (!target) return;
                const g = el("div", "form-group");
                form.insertBefore(g, label);
                g.appendChild(label);
                g.appendChild(target);
            });
            const btn = $(":scope > button[type='submit']", form);
            if (btn) {
                const wrap = el("div", "form-buttons");
                form.insertBefore(wrap, btn);
                wrap.appendChild(btn);
                btn.classList.add("primary-btn");
            }
        }

        const fc = $(".form-container");
        if (fc && !$(".form-header", fc)) {
            const h1 = $(":scope > h1", fc);
            if (h1) {
                const head = el("div", "form-header");
                fc.insertBefore(head, h1);
                head.appendChild(h1);
                const p = head.nextElementSibling;
                if (p && p.tagName === "P") head.appendChild(p);
            }
        }

        // "← Volver": separa la flecha para animarla
        const back = $(".back-link");
        if (back && !back.children.length) {
            const t = back.textContent.trim().replace(/^←\s*/, "");
            back.innerHTML = '<span class="arr">←</span><span class="bl-t"></span>';
            $(".bl-t", back).textContent = t;
        }

        // Estrella de calificación: emoji => icono amarillo
        const dr = $(".detail-rating");
        if (dr) {
            Array.from(dr.childNodes).forEach((n) => {
                if (n.nodeType === 3 && n.textContent.indexOf("⭐") > -1) {
                    dr.replaceChild(el("span", "star", STAR), n);
                }
            });
        }
    }

    /* ------------------------------------------------------------------
       Botones: roll, magnético, ripple
       ------------------------------------------------------------------ */
    function setupButtons() {
        if (!REDUCE) {
            $$(".btn-primary, .primary-btn, .add-btn, .cancel-btn, .delete-btn, .nav-links a").forEach(rollify);
        }
        $$(".btn-primary, .primary-btn, .add-btn, .cancel-btn, .delete-btn").forEach((b) => magnetize(b, 0.16));
        $$(".logo").forEach((b) => magnetize(b, 0.14));

        document.addEventListener("click", (e) => {
            const b = e.target.closest ? e.target.closest(".btn-primary, .primary-btn, .add-btn, .cancel-btn, .delete-btn, .card-info button") : null;
            if (!b || REDUCE) return;
            const r = b.getBoundingClientRect();
            const size = Math.max(r.width, r.height) * 2.2;
            const rp = el("span", "ripple");
            rp.style.width = rp.style.height = size + "px";
            rp.style.left = (e.clientX - r.left - size / 2) + "px";
            rp.style.top = (e.clientY - r.top - size / 2) + "px";
            b.appendChild(rp);
            setTimeout(() => rp.remove(), 750);
        });
    }

    /* Encabezado que se aleja en 3D al hacer scroll */
    function heroScroll(nodes) {
        nodes = nodes.filter(Boolean);
        if (!nodes.length || REDUCE) return;
        onFrame((s) => {
            const t = clamp(s.sy / (s.vh * 0.7), 0, 1);
            nodes.forEach((n) => {
                if (t > 0.001) {
                    n.style.transform =
                        "perspective(1200px) translate3d(0," + (t * 50).toFixed(1) + "px," + (-t * 180).toFixed(1) + "px) rotateX(" + (t * 9).toFixed(2) + "deg)";
                    n.style.opacity = (1 - t * 1.1).toFixed(3);
                    n.dataset.fxh = "1";
                } else if (n.dataset.fxh) {
                    n.style.transform = "";
                    n.style.opacity = "";
                    delete n.dataset.fxh;
                }
            });
        });
    }

    /* ------------------------------------------------------------------
       Footer
       ------------------------------------------------------------------ */
    function buildFooter() {
        const f = el("footer", "site-footer",
            '<div class="footer-inner">' +
            '<span class="logo-box">REELIX</span>' +
            '<nav class="footer-links"><a href="catalogo.html">Mi catálogo</a><a href="ver-mas-tarde.html">Ver más tarde</a><a href="agregar.html">Agregar</a><a href="index.html">Salir</a></nav>' +
            '<p class="footer-copy">© ' + new Date().getFullYear() + " Reelix · Tu cine, organizado.</p></div>");
        if (!$('.nav-links a[href="ver-mas-tarde.html"]')) {
            const l = $('.footer-links a[href="ver-mas-tarde.html"]', f);
            if (l) l.remove();
        }
        document.body.appendChild(f);
        reveal($(".footer-inner", f), 0);
        if (!REDUCE) $$(".footer-links a", f).forEach((a) => { rollify(a); magnetize(a, 0.14); });
    }

    /* ------------------------------------------------------------------
       PÁGINA: Login / Registro
       ------------------------------------------------------------------ */
    // Túnel 3D (mecánica de "Panorama Films": cuatro paredes en perspectiva
    // que vienen hacia la cámara). Las paredes laterales llevan carátulas y
    // el techo/piso escenas de películas en cartelera (TMDB). Mientras
    // cargan —o si no hay conexión— se muestran escenas generadas con CSS.
    const TUNNEL_SCENES = [
        { c: ["#2b1055", "#7c3aed", "#f0abfc"], sun: "#ffe9ff", sx: "64%", sy: "30%", clip: "polygon(0 100%,0 56%,18% 32%,32% 56%,50% 22%,68% 54%,84% 36%,100% 58%,100% 100%)" },
        { c: ["#0f172a", "#3730a3", "#60a5fa"], sun: "#dbeafe", sx: "30%", sy: "24%", clip: "polygon(0 100%,0 40%,8% 40%,8% 24%,16% 24%,16% 48%,26% 48%,26% 16%,36% 16%,36% 44%,48% 44%,48% 30%,58% 30%,58% 50%,70% 50%,70% 20%,80% 20%,80% 46%,92% 46%,92% 34%,100% 34%,100% 100%)" },
        { c: ["#3b0764", "#c026d3", "#fb7185"], sun: "#fff1f2", sx: "50%", sy: "40%", clip: "polygon(0 100%,0 62%,25% 42%,55% 66%,80% 46%,100% 60%,100% 100%)" },
        { c: ["#052e3b", "#0e7490", "#a78bfa"], sun: "#ecfeff", sx: "72%", sy: "22%", clip: "polygon(0 100%,0 60%,20% 48%,40% 62%,60% 46%,80% 60%,100% 50%,100% 100%)" },
        { c: ["#1e1b4b", "#6d28d9", "#f472b6"], sun: "#fdf2f8", sx: "36%", sy: "34%", clip: "polygon(0 100%,0 50%,12% 36%,30% 58%,46% 30%,64% 56%,86% 28%,100% 52%,100% 100%)" },
        { c: ["#111827", "#4c1d95", "#818cf8"], sun: "#e0e7ff", sx: "58%", sy: "20%", clip: "polygon(0 100%,0 66%,30% 52%,48% 68%,74% 50%,100% 64%,100% 100%)" },
    ];

    function fetchArt() {
        try {
            const cached = sessionStorage.getItem("reelix_art");
            if (cached) return Promise.resolve(JSON.parse(cached));
        } catch (_) { /* noop */ }
        const pages = [1, 2].map((pg) =>
            fetch(TMDB_BASE + "/trending/movie/week?api_key=" + TMDB_KEY + "&language=es-ES&page=" + pg)
                .then((r) => (r.ok ? r.json() : null)).catch(() => null));
        return Promise.all(pages).then((rs) => {
            const list = [].concat.apply([], rs.map((r) => (r && r.results) || []))
                .filter((m) => m.poster_path && m.backdrop_path)
                .map((m) => ({
                    title: m.title || m.name || "",
                    poster: "https://image.tmdb.org/t/p/w342" + m.poster_path,
                    back: "https://image.tmdb.org/t/p/w500" + m.backdrop_path,
                }));
            for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }
            try { if (list.length) sessionStorage.setItem("reelix_art", JSON.stringify(list)); } catch (_) { /* noop */ }
            return list;
        });
    }

    function buildTunnel() {
        const page = $(".login-page");
        if (!page) return;

        document.body.prepend(el("div", "void-bg"));
        const scene = el("div", "tunnel-scene");
        const world = el("div", "tunnel-world");
        scene.appendChild(world);
        document.body.prepend(el("div", "tunnel-fog"));
        document.body.prepend(scene);
        if (!REDUCE) {
            document.body.appendChild(el("div", "grain"));
            document.body.appendChild(el("div", "fly-hint", "<i></i>Mové el mouse · la rueda acelera el vuelo"));
        }

        let panels = [];
        let rails = [];
        let G = null;
        let art = [];

        const assignArt = () => {
            if (!art.length) return;
            let ip = 0, ib = 0;
            panels.forEach((o) => {
                const item = o.kind === "poster" ? art[ip++ % art.length] : art[(ib++ + 7) % art.length];
                const img = $("img.art", o.p);
                const cap = $(".cap", o.p);
                if (cap) cap.textContent = item.title;
                img.onload = () => o.p.classList.add("has-art");
                img.src = o.kind === "poster" ? item.poster : item.back;
            });
        };

        const build = () => {
            world.textContent = "";
            panels = [];
            rails = [];
            const vw = window.innerWidth, vh = window.innerHeight;
            const W = clamp(vw * (vw < 600 ? 0.36 : 0.46), 130, 640);
            const H = clamp(vh * 0.44, 230, 400);
            const ph = H - 8, pw = Math.round(ph * 2 / 3);
            const Ls = pw + 12;
            const cols = clamp(Math.round(2 * W / 430), 1, 4);
            const colW = 2 * W / cols;
            const tw = Math.round(colW - 8), tl = Math.round(tw * 0.5625);
            const Lt = tl + 12;
            const D = 2300;
            const Ns = Math.max(5, Math.round(D / Ls)), Nt = Math.max(5, Math.round(D / Lt));
            G = { W, H, near: 220, colW, cols };

            let idx = 0;
            const make = (wall, k, slot, kind, w, h, L, total) => {
                const d = TUNNEL_SCENES[idx % TUNNEL_SCENES.length];
                const p = el("div", "tp", '<i class="sun"></i><i class="hills"></i><img class="art" alt="" decoding="async"><span class="cap">ESCENA ' + String(idx + 1).padStart(3, "0") + "</span>");
                p.style.setProperty("--s1", d.c[0]); p.style.setProperty("--s2", d.c[1]); p.style.setProperty("--s3", d.c[2]);
                p.style.setProperty("--sun", d.sun); p.style.setProperty("--sx", d.sx); p.style.setProperty("--sy", d.sy); p.style.setProperty("--clip", d.clip);
                p.style.width = w + "px"; p.style.height = h + "px";
                p.style.left = (-w / 2) + "px"; p.style.top = (-h / 2) + "px";
                world.appendChild(p);
                panels.push({ p, wall, k, slot, kind, L, total });
                idx += 1;
            };
            for (let k = 0; k < Ns; k++) ["left", "right"].forEach((wall) => { make(wall, k, 0, "poster", pw, ph, Ls, Ns * Ls); make(wall, k, 1, "poster", pw, ph, Ls, Ns * Ls); });
            for (let k = 0; k < Nt; k++) ["top", "bottom"].forEach((wall) => { for (let c = 0; c < cols; c++) make(wall, k, c, "back", tw, tl, Lt, Nt * Lt); });

            // rieles de luz en las 4 esquinas
            const len = 3400, zc = G.near - len / 2;
            [[-W, -H], [W, -H], [-W, H], [W, H]].forEach((c) => {
                const r = el("div", "rail");
                r.style.width = len + "px";
                r.style.left = (-len / 2) + "px";
                r.style.transform = "translate3d(" + c[0] + "px," + c[1] + "px," + zc + "px) rotateY(90deg)";
                world.appendChild(r);
                rails.push(r);
            });
            assignArt();
        };
        build();
        let rt = 0;
        window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 250); });
        fetchArt().then((list) => { art = list || []; assignArt(); }).catch(() => { /* se quedan las escenas CSS */ });

        let off = 0, boost = 0, mx = 0.5, my = 0.5, rx = 0, ry = 0, rz = 0;
        const BASE = 70;

        const render = (now) => {
            const { W, H, near, colW, cols } = G;
            for (const o of panels) {
                const z = (((o.k * o.L + off) % o.total) + o.total) % o.total - o.total + near;
                const dFar = clamp((near - z) / o.total, 0, 1);
                const op = Math.pow(1 - dFar, 1.35) * clamp((near - z) / (o.L * 0.5), 0, 1);
                if (op < 0.01) { o.p.style.visibility = "hidden"; continue; }
                o.p.style.visibility = "";
                o.p.style.opacity = op.toFixed(3);
                let t;
                if (o.wall === "left") t = "translate3d(" + (-W) + "px," + ((o.slot - 0.5) * H).toFixed(1) + "px," + z.toFixed(1) + "px) rotateY(90deg)";
                else if (o.wall === "right") t = "translate3d(" + W + "px," + ((o.slot - 0.5) * H).toFixed(1) + "px," + z.toFixed(1) + "px) rotateY(-90deg)";
                else if (o.wall === "top") t = "translate3d(" + ((o.slot - (cols - 1) / 2) * colW).toFixed(1) + "px," + (-H) + "px," + z.toFixed(1) + "px) rotateX(-90deg)";
                else t = "translate3d(" + ((o.slot - (cols - 1) / 2) * colW).toFixed(1) + "px," + H + "px," + z.toFixed(1) + "px) rotateX(90deg)";
                o.p.style.transform = t;
            }
            scene.style.perspective = (900 - Math.max(0, boost) * 0.2).toFixed(0) + "px";
            world.style.transform = "rotateZ(" + rz.toFixed(2) + "deg) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        };

        if (REDUCE) { render(0); return; }

        window.addEventListener("pointermove", (e) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; }, { passive: true });
        window.addEventListener("wheel", (e) => { boost = clamp(boost + clamp(e.deltaY, -160, 160) * 0.9, -700, 1000); }, { passive: true });
        let ty = null;
        window.addEventListener("touchstart", (e) => { ty = e.touches[0].clientY; }, { passive: true });
        window.addEventListener("touchmove", (e) => {
            if (ty == null) return;
            const y = e.touches[0].clientY;
            boost = clamp(boost + (ty - y) * 6, -700, 1000);
            ty = y;
        }, { passive: true });

        onFrame((s, now) => {
            const dt = s.dt / 1000;
            off += (BASE + boost) * dt;
            boost *= Math.pow(0.12, dt);
            rx = lerp(rx, (0.5 - my) * 9, 0.05);
            ry = lerp(ry, (mx - 0.5) * -13, 0.05);
            rz = lerp(rz, Math.sin(now / 3200) * 0.6 + (mx - 0.5) * -1.4, 0.05);
            render(now);
        });
    }

    function setupPasswordToggles() {
        const EYE = '<svg class="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '<svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.1 3.9M6.4 7.6A16.7 16.7 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.3-1"/></svg>';
        $$('input[type="password"]').forEach((inp) => {
            const grp = inp.closest(".input-group");
            if (!grp || $(".pw-toggle", grp)) return;
            const b = el("button", "pw-toggle", EYE);
            b.type = "button";
            b.setAttribute("aria-label", "Mostrar contraseña");
            b.addEventListener("click", () => {
                const show = inp.type === "password";
                inp.type = show ? "text" : "password";
                b.classList.toggle("on", show);
                b.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
            });
            grp.appendChild(b);
        });
    }

    function setupAuth() {
        safe("tunnel", buildTunnel);
        safe("pw", setupPasswordToggles);
        reveal($(".brand"), 80, "flat");
        const box = $(".login-box");
        reveal(box, 180, "flat");
        $$(".input-group, .register-link", box).forEach((n, i) => reveal(n, 300 + i * 70));
    }

    /* ------------------------------------------------------------------
       PÁGINA: Catálogo / Ver más tarde
       ------------------------------------------------------------------ */
    const cards = new Map();
    let rebuilt = false; // la app vacía y rellena la grilla (filtros, listas)

    function wrapPoster(card) {
        const img = $(":scope > img", card);
        if (!img || img.parentElement.classList.contains("card-poster")) return;
        const wrap = el("div", "card-poster loading");
        card.insertBefore(wrap, img);
        wrap.appendChild(img);

        const badge = $(".card-info > span", card);
        if (badge) { badge.classList.add("card-badge"); wrap.appendChild(badge); }

        const ok = () => wrap.classList.remove("loading");
        const fail = () => { wrap.classList.remove("loading"); wrap.classList.add("failed"); };
        if (img.complete) { img.naturalWidth ? ok() : fail(); }
        else {
            img.addEventListener("load", ok, { once: true });
            img.addEventListener("error", fail, { once: true });
        }
    }

    /* La calificación pasa a una pastilla sobre el póster */
    function restructureInfo(card) {
        const info = $(".card-info", card);
        const poster = $(".card-poster", card);
        if (!info || !poster || info.dataset.rated) return;
        const p = $("p", info);
        if (!p) return;
        info.dataset.rated = "1";
        const m = p.textContent.match(/⭐\s*(.+)$/);
        if (!m) return;
        const val = m[1].trim();
        const num = !isNaN(parseFloat(val));
        const pill = el("span", "pill-rate" + (num ? "" : " empty"), num ? STAR + "<span></span>" : "<span></span>");
        $("span", pill).textContent = val;
        p.textContent = p.textContent.replace(/\s*·?\s*⭐.*$/, "");
        poster.appendChild(pill);
    }

    function registerCard(card, i) {
        if (cards.has(card)) return;
        wrapPoster(card);
        restructureInfo(card);
        $$(".card-info button", card).forEach(rollify);
        card.style.opacity = "0";
        card.style.transform = "perspective(1100px) translate3d(0,80px,0) rotateX(20deg) scale(.92)";
        cards.set(card, {
            t0: rebuilt ? performance.now() - 5000 : performance.now(),
            delay: rebuilt ? 0 : Math.min(i || 0, 14) * 55,
            cX: 0, cY: 0, tX: 0, tY: 0, s: 1, ts: 1,
        });
    }

    function pageTop(n) {
        let y = 0;
        while (n) { y += n.offsetTop; n = n.offsetParent; }
        return y;
    }

    function setupCards(grid) {
        // Esqueletos mientras llega TMDB (catalogo.js los reemplaza solo)
        if (!grid.children.length) {
            for (let i = 0; i < 10; i++) grid.appendChild(el("div", "skeleton-card"));
        }
        $$(".card", grid).forEach((c, i) => registerCard(c, i));

        // La app vacía y vuelve a llenar la grilla: se conserva la altura
        // para que el scroll no salte y no se repite la intro de las tarjetas.
        let lastH = 0, holdTimer = 0, holding = false;
        onFrame(() => { if (!holding && grid.children.length) lastH = grid.offsetHeight; });

        // catalogo.js inserta el contenido de TMDB sin volver a limpiar la
        // grilla, así que los esqueletos que agregamos como placeholder nunca
        // se quitan solos: se retiran en cuanto llega una tarjeta real o un
        // mensaje de "sin resultados", y hay un timeout de seguridad por si
        // la API nunca responde (p. ej. falla de red con contenido propio).
        const clearSkeletons = () => {
            $$(".skeleton-card", grid).forEach((sk) => sk.remove());
        };
        let skeletonTimer = setTimeout(clearSkeletons, 9000);

        new MutationObserver((muts) => {
            let i = 0;
            let sawRealContent = false;
            muts.forEach((m) => {
                if (Array.from(m.removedNodes).some((n) => n.nodeType === 1 && n.classList.contains("card"))) {
                    rebuilt = true;
                    holding = true;
                    grid.style.minHeight = lastH + "px";
                    clearTimeout(holdTimer);
                    holdTimer = setTimeout(() => { holding = false; grid.style.minHeight = ""; }, 1800);
                }
                m.addedNodes.forEach((n) => {
                    if (n.nodeType !== 1) return;
                    if (n.classList.contains("card")) { registerCard(n, i++); sawRealContent = true; }
                    else if (n.classList.contains("sin-contenido")) { reveal(n, 0); sawRealContent = true; }
                });
            });
            if (sawRealContent) { clearTimeout(skeletonTimer); clearSkeletons(); }
        }).observe(grid, { childList: true });

        // Inclinación suave al pasar el mouse
        let hover = null;
        const release = () => {
            if (!hover) return;
            const st = cards.get(hover);
            if (st) { st.tX = 0; st.tY = 0; st.ts = 1; }
            hover.classList.remove("is-hover");
            hover = null;
        };
        document.addEventListener("pointermove", (e) => {
            if (e.pointerType === "touch") return;
            const c = e.target.closest ? e.target.closest(".card") : null;
            if (hover && hover !== c) release();
            if (!c || !cards.has(c)) return;
            const st = cards.get(c);
            const r = c.getBoundingClientRect();
            st.tY = ((e.clientX - r.left) / r.width - 0.5) * 2 * 5;
            st.tX = (0.5 - (e.clientY - r.top) / r.height) * 2 * 5;
            st.ts = 1.02;
            c.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
            c.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
            if (hover !== c) { hover = c; c.classList.add("is-hover"); }
        }, { passive: true });
        root.addEventListener("mouseleave", release);
        onVisible.push(release);

        // Animación 3D ligada al scroll
        onFrame((s, now) => {
            const vh = s.vh;
            cards.forEach((st, card) => {
                if (!card.isConnected) { cards.delete(card); return; }

                const h = card.offsetHeight;
                const w = card.offsetWidth;
                const top = pageTop(card) - s.sy;
                if (top > vh + 160 || top + h < -160) return;

                const enter = easeOut(clamp((vh - top) / (vh * 0.5), 0, 1));
                const exit = clamp((vh * 0.16 - (top + h)) / (vh * 0.4), 0, 1);
                const intro = easeOut(clamp((now - st.t0 - st.delay) / 800, 0, 1));
                const e = Math.min(enter, intro);

                const col = Math.round(card.offsetLeft / (w + 18));
                const centerD = (top + h / 2 - vh / 2) / vh;
                const par = col % 2 === 1 ? -centerD * 22 : 0;

                st.cX = lerp(st.cX, st.tX, 0.12);
                st.cY = lerp(st.cY, st.tY, 0.12);
                st.s = lerp(st.s, st.ts, 0.12);

                const rotX = (1 - e) * 20 - exit * 8 + st.cX;
                const ty = (1 - e) * 70 + par;
                const sc = (0.92 + 0.08 * e) * (1 - exit * 0.03) * st.s;
                const op = Math.min(1, e * 1.3) * (1 - exit * 0.5);

                card.style.transform =
                    "perspective(1100px) translate3d(0," + ty.toFixed(2) + "px,0) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + st.cY.toFixed(2) + "deg) scale(" + sc.toFixed(4) + ")";
                card.style.opacity = op.toFixed(3);
            });
        });
    }

    function buildGenreChips() {
        const sel = $("#filtro-genero");
        const filters = $(".filters");
        if (!sel || !filters) return;
        const wrap = el("div", "genre-chips");
        Array.from(sel.options).forEach((o, i) => {
            const b = el("button");
            b.type = "button";
            b.textContent = i === 0 ? "Todo" : o.textContent.trim();
            b.dataset.v = o.value;
            wrap.appendChild(b);
        });
        const sync = () => $$("button", wrap).forEach((x) => x.classList.toggle("on", x.dataset.v === sel.value));
        sync();
        wrap.addEventListener("click", (e) => {
            const b = e.target.closest("button");
            if (!b) return;
            sel.value = b.dataset.v;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            sync();
        });
        sel.addEventListener("change", sync);
        sel.style.display = "none";
        filters.parentNode.insertBefore(wrap, filters);
        reveal(wrap, 600);
    }

    // Banner destacado: toma la primera tarjeta real del catálogo
    function buildHero(grid) {
        if (!$("#buscador")) return; // solo en el catálogo, no en "ver más tarde"
        const filters = $(".filters");
        if (!filters) return;
        let done = false;
        const tryBuild = () => {
            if (done) return;
            const card = $$(".card", grid).find((c) => {
                const im = $("img", c);
                const src = im && im.getAttribute("src");
                return src && !/sin-poster/.test(src);
            });
            if (!card) return;
            done = true;
            const src = $("img", card).getAttribute("src");
            const title = ($("h3", card) || {}).textContent || "";
            const meta = ($("p", card) || {}).textContent || "";
            const rateEl = $(".pill-rate", card);
            const rate = rateEl && !rateEl.classList.contains("empty") ? rateEl.textContent.trim() : "";

            const hero = el("section", "hero",
                '<div class="hero-bg"></div><div><span class="hero-tag">Destacada de hoy</span><h2></h2><div class="hero-meta"></div><div class="hero-actions"></div></div>' +
                '<div class="hero-poster"><img alt=""></div>');
            const bg = $(".hero-bg", hero);
            bg.style.backgroundImage = 'url("' + src.replace(/"/g, "%22") + '")';
            $("img", hero).src = src;
            $("h2", hero).textContent = title;
            const metaEl = $(".hero-meta", hero);
            if (rate) metaEl.appendChild(el("span", "r", STAR + "<span>" + rate.replace(/</g, "&lt;") + "</span>"));
            if (meta) metaEl.appendChild(el("span", "", "")).textContent = meta;

            const actions = $(".hero-actions", hero);
            const more = el("button", "primary-btn", "Ver más");
            more.type = "button";
            more.addEventListener("click", () => {
                const c = $$(".card", grid).find((x) => ($("h3", x) || {}).textContent === title) || card;
                const btn = $(".card-info button:not(.btn-indicador)", c);
                if (btn) btn.click();
            });
            const explore = el("button", "cancel-btn", "Explorar catálogo");
            explore.type = "button";
            explore.addEventListener("click", () => smooth.to(Math.max(0, pageTop(grid) - 120)));
            actions.append(more, explore);

            filters.insertAdjacentElement("afterend", hero);
            [more, explore].forEach((b) => { rollify(b); magnetize(b, 0.16); });
            reveal(hero, 0, "flat");
            makeTilt($(".hero-poster", hero), { max: 9, pers: 1000, scale: 1.02 });
            if (!REDUCE) {
                onFrame(() => {
                    const r = hero.getBoundingClientRect();
                    if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
                    bg.style.transform = "scale(1.1) translate3d(0," + (r.top * -0.1).toFixed(1) + "px,0)";
                });
            }
            mo.disconnect();
        };
        const mo = new MutationObserver(tryBuild);
        mo.observe(grid, { childList: true });
        tryBuild();
    }

    function setupCatalog() {
        splitWords($(".catalog-header h1"), { accentLast: true, base: 100 });
        reveal($(".catalog-header p"), 450);
        heroScroll([$(".catalog-header")]);

        const sc = $(".search-container");
        const input = $("#buscador");
        if (sc && input) {
            sc.appendChild(el("kbd", "", "/"));
            document.addEventListener("keydown", (e) => {
                const tag = (document.activeElement && document.activeElement.tagName) || "";
                if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag) && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    input.focus();
                    smooth.to(0);
                } else if (e.key === "Escape" && document.activeElement === input) {
                    input.blur();
                }
            });
        }
        reveal(sc, 550);
        reveal($(".filters"), 650);
        reveal($(".back-link"), 550);

        safe("genre-chips", buildGenreChips);

        const grid = $("#catalogo") || $("#lista-ver-mas-tarde");
        if (grid) {
            setupCards(grid);
            safe("hero", () => buildHero(grid));
        }
    }

    /* ------------------------------------------------------------------
       PÁGINA: Detalle (local o TMDB: el contenido puede llegar después)
       ------------------------------------------------------------------ */
    const NO_POSTER = "data:image/svg+xml;utf8," + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='750' viewBox='0 0 500 750'>" +
        "<rect width='500' height='750' fill='#222'/>" +
        "<g transform='translate(190 295) scale(5)' fill='none' stroke='#777' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'>" +
        "<rect x='3' y='3' width='18' height='18' rx='3'/><path d='M7 3v18M17 3v18M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4'/></g></svg>");

    // ------------------------------------------------------------------
    // Fuente del puntaje + enlaces externos + dónde ver (solo contenido
    // de TMDB: el contenido propio no tiene id para consultar nada de esto)
    // ------------------------------------------------------------------
    const TMDB_KEY = "43273891784fd3009a645cd646db77d5";
    const TMDB_BASE = "https://api.themoviedb.org/3";

    function buildExtInfo(titleText) {
        const info = $(".detail-info");
        if (!info) return;

        const tmdbId = localStorage.getItem("reelix_tmdb_id");
        const tmdbTipo = localStorage.getItem("reelix_tmdb_tipo");
        const ratingBox = $(".detail-rating", info);
        const actions = $(".detail-actions", info);

        if (!tmdbId || !tmdbTipo) {
            if (ratingBox && !$(".rating-source", ratingBox)) {
                ratingBox.appendChild(el("span", "rating-source", "Calificación ingresada por vos"));
            }
            return;
        }

        if (ratingBox && !$(".rating-source", ratingBox)) {
            ratingBox.appendChild(el("span", "rating-source", "Calificación según TMDB"));
        }

        const block = el("div", "ext-block", "<h2>Más opiniones y disponibilidad</h2>");
        if (actions) actions.insertAdjacentElement("beforebegin", block);
        else info.appendChild(block);
        reveal(block, 500);

        const endpoint = tmdbTipo === "tv" ? "tv" : "movie";
        const q = encodeURIComponent(titleText || "");

        // Opiniones en otros sitios (IMDb enlaza directo si TMDB conoce el id;
        // el resto son búsquedas por título, ya que no hay un id compartido)
        const linksWrap = el("div", "ext-links");
        block.appendChild(linksWrap);

        const addLink = (name, href, color) => {
            const a = el("a", "", '<span class="dot" style="--c:' + color + '"></span>' + name);
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            linksWrap.appendChild(a);
        };

        fetch(TMDB_BASE + "/" + endpoint + "/" + tmdbId + "/external_ids?api_key=" + TMDB_KEY)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const imdbId = data && data.imdb_id;
                addLink("IMDb", imdbId ? "https://www.imdb.com/title/" + imdbId + "/" : "https://www.imdb.com/find/?q=" + q, "#f5c518");
            })
            .catch(() => addLink("IMDb", "https://www.imdb.com/find/?q=" + q, "#f5c518"))
            .then(() => {
                addLink("FilmAffinity", "https://www.filmaffinity.com/es/search.php?stext=" + q, "#ffb400");
                addLink("Rotten Tomatoes", "https://www.rottentomatoes.com/search?search=" + q, "#fa320a");
                addLink("Letterboxd", "https://letterboxd.com/search/" + q + "/", "#00e054");
                linksWrap.appendChild(el("p", "hint", "IMDb enlaza directo cuando hay coincidencia; el resto abre una búsqueda por título en cada sitio."));
            });

        // Dónde está disponible (streaming / alquiler / compra)
        const provTitle = el("h2", "", "Dónde ver");
        provTitle.style.marginTop = "26px";
        block.appendChild(provTitle);
        const provBody = el("div", "", '<p class="providers-empty">Buscando plataformas disponibles…</p>');
        block.appendChild(provBody);

        fetch(TMDB_BASE + "/" + endpoint + "/" + tmdbId + "/watch/providers?api_key=" + TMDB_KEY)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const results = (data && data.results) || {};
                const region = results.AR || results.MX || results.ES || results.US;
                const list = region ? [].concat(region.flatrate || [], region.rent || [], region.buy || []) : [];

                const seen = new Set();
                const unique = list.filter((pr) => {
                    if (seen.has(pr.provider_id)) return false;
                    seen.add(pr.provider_id);
                    return true;
                });

                if (!unique.length) {
                    provBody.innerHTML = '<p class="providers-empty">No encontramos dónde verla en streaming por ahora.</p>';
                    return;
                }

                const row = el("div", "providers");
                unique.forEach((pr) => {
                    const a = el("a", "");
                    a.href = region.link || ("https://www.themoviedb.org/" + endpoint + "/" + tmdbId + "/watch");
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.title = pr.provider_name;
                    const img = el("img");
                    img.src = "https://image.tmdb.org/t/p/w92" + pr.logo_path;
                    img.alt = pr.provider_name;
                    img.loading = "lazy";
                    a.appendChild(img);
                    row.appendChild(a);
                });

                provBody.innerHTML = "";
                provBody.appendChild(row);
                provBody.appendChild(el(
                    "p",
                    "providers-attr",
                    'Disponibilidad de <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a>, vía TMDB.'
                ));
            })
            .catch(() => {
                provBody.innerHTML = '<p class="providers-empty">No pudimos cargar la disponibilidad.</p>';
            });
    }

    function setupDetail() {
        const content = $(".detail-content");
        const img = $("#detalle-imagen");
        const titleEl = $("#detalle-titulo");
        const info = $(".detail-info");
        const poster = $(".detail-poster");

        reveal($(".back-link"), 150);
        makeTilt(poster, { max: 7, pers: 1200, scale: 1.015 });

        // Póster inexistente => placeholder
        if (img) {
            const fallback = () => {
                if (img.dataset.fb || !img.getAttribute("src")) return;
                img.dataset.fb = "1";
                img.src = NO_POSTER;
            };
            img.addEventListener("error", fallback);
            if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) fallback();
        }

        const setAmbient = () => {
            if (!img || !ambientEl || !img.getAttribute("src") || img.dataset.fb) return;
            ambientEl.style.backgroundImage = 'url("' + img.currentSrc + '")';
            ambientEl.classList.add("on");
        };

        const isPlaceholder = () => !titleEl || titleEl.textContent.trim() === "Título";
        let started = false;

        const start = () => {
            if (started) return;
            started = true;

            reveal(poster, 250, "flat");
            splitWords(titleEl, { base: 200 });
            if (info) {
                $$(":scope > .detail-type, :scope > .detail-meta, :scope > .detail-rating, :scope > h2, :scope > #detalle-sinopsis, :scope > .detail-actions", info)
                    .forEach((n, i) => reveal(n, 250 + i * 90));
            }
            if (content) content.classList.remove("pending");

            if (img) { if (img.complete) setAmbient(); else img.addEventListener("load", setAmbient, { once: true }); }

            safe("ext-info", () => buildExtInfo(titleEl && titleEl.textContent.trim()));

            // Conteo animado de la calificación
            const rating = $("#detalle-calificacion");
            const box = $(".detail-rating");
            if (rating && box && !REDUCE) {
                const raw = rating.textContent.trim().replace(",", ".");
                const value = parseFloat(raw);
                const dec = (raw.split(".")[1] || "").length;
                if (!isNaN(value)) {
                    rating.textContent = (0).toFixed(dec);
                    box.addEventListener("fx:in", () => {
                        const t0 = performance.now();
                        (function step(now) {
                            const p = clamp((now - t0) / 1200, 0, 1);
                            rating.textContent = (value * easeOut(p)).toFixed(dec);
                            if (p < 1) requestAnimationFrame(step);
                        })(t0);
                    });
                }
            }
        };

        if (!isPlaceholder()) { start(); return; }

        // Contenido de TMDB: se espera a que la app reemplace el texto de relleno
        if (content) content.classList.add("pending");
        if (info && "MutationObserver" in window) {
            const mo = new MutationObserver(() => { if (!isPlaceholder()) { mo.disconnect(); start(); } });
            mo.observe(info, { childList: true, characterData: true, subtree: true });
        }
        setTimeout(start, 6000);
    }

    /* ------------------------------------------------------------------
       PÁGINA: Agregar / Editar
       ------------------------------------------------------------------ */
    function setupForm() {
        const head = $(".form-header");
        splitWords($("h1", head), { accentLast: true, base: 100 });
        reveal($("p", head), 450);
        heroScroll([head]);

        const form = $(".form-container form");
        $$(".form-group", form).forEach((g, i) => reveal(g, (i % 2) * 90));
        reveal($(".form-buttons", form), 0);
    }

    /* ------------------------------------------------------------------
       Arranque
       ------------------------------------------------------------------ */
    function boot() {
        const page = detectPage();

        let first = false;
        try {
            first = page === "auth" && !REDUCE && !sessionStorage.getItem("reelix_intro");
            if (first) sessionStorage.setItem("reelix_intro", "1");
        } catch (_) { first = false; }

        if (!REDUCE) safe("curtain", () => buildCurtain(first));

        safe("normalize", normalizeDOM);
        if (page !== "auth") safe("backdrop", () => buildBackdrop(page === "detail"));
        safe("nav", setupNav);
        safe("buttons", setupButtons);
        safe("progress", buildProgressAndTop);

        if (page === "auth") safe("auth", setupAuth);
        if (page === "catalog") safe("catalog", setupCatalog);
        if (page === "detail") safe("detail", setupDetail);
        if (page === "form") safe("form", setupForm);
        if (page !== "auth") safe("footer", buildFooter);

        S.sy = window.scrollY;
        requestAnimationFrame(tick);

        if (REDUCE || !curtain) { goNow(); return; }
        safe("transitions", setupPageTransitions);
        openCurtain(first);
    }

    function start() {
        try { boot(); } catch (e) { console.warn("[reelix fx] boot", e); }
        finally { if (REDUCE || !curtain) goNow(); }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
})();
