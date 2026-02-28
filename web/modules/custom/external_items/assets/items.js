(function (Drupal, drupalSettings) {
  "use strict";

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === "class") node.className = v;
        else if (k.startsWith("aria-")) node.setAttribute(k, v);
        else if (k === "href") node.setAttribute("href", v);
        else node[k] = v;
      });
    }
    (children || []).forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  function setBusy(root, isBusy) {
    root.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function getPageFromUrl() {
    const url = new URL(window.location.href);
    const p = parseInt(url.searchParams.get("page") || "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }

  function setPageInUrl(page) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.pushState({}, "", url.toString());
  }

  function renderError(root, message) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "external__state" }, ["Error: " + message]));
  }

  function renderEmpty(root, message) {
    root.innerHTML = "";
    root.appendChild(el("div", { class: "external__state" }, [message]));
  }

  function renderList(root, items, meta) {
    root.innerHTML = "";

    const grid = el("div", { class: "external__grid" }, []);
    items.forEach((it) => {
      const title = `${it.emoji ? it.emoji + " " : ""}${it.name}`;
      const card = el("article", { class: "external__card" }, [
        el("div", { class: "external__cardTitle" }, [
          el("a", { href: "/items/" + it.code }, [title]),
        ]),
        el("p", { class: "external__meta" }, [
          `ID: ${it.code} · Continent: ${it.continent?.name || "—"}`,
        ]),
        el("p", { class: "external__meta" }, [
          `Capital: ${it.capital || "—"}`,
        ]),
      ]);
      grid.appendChild(card);
    });

    root.appendChild(grid);

    // Pager
    const pager = el("div", { class: "external__pager", "aria-label": "Pagination" }, []);

    const prevBtn = el("button", { class: "external__btn", type: "button" }, ["Prev"]);
    prevBtn.disabled = meta.page <= 1;
    prevBtn.addEventListener("click", () => meta.onPageChange(meta.page - 1));

    const nextBtn = el("button", { class: "external__btn", type: "button" }, ["Next"]);
    nextBtn.disabled = meta.page >= meta.pages;
    nextBtn.addEventListener("click", () => meta.onPageChange(meta.page + 1));

    const label = el("span", null, [
      `Page ${meta.page} of ${meta.pages} · Total ${meta.total}`,
    ]);

    pager.appendChild(prevBtn);
    pager.appendChild(label);
    pager.appendChild(nextBtn);

    root.appendChild(pager);
  }

  function renderDetail(root, item) {
    root.innerHTML = "";

    const languages = (item.languages || []).map((l) => l.name).filter(Boolean).join(", ") || "—";

    const dl = el("dl", { class: "external__kv" }, [
      el("dt", null, ["Code"]),
      el("dd", null, [item.code]),
      el("dt", null, ["Name"]),
      el("dd", null, [item.name]),
      el("dt", null, ["Native"]),
      el("dd", null, [item.native || "—"]),
      el("dt", null, ["Capital"]),
      el("dd", null, [item.capital || "—"]),
      el("dt", null, ["Currency"]),
      el("dd", null, [item.currency || "—"]),
      el("dt", null, ["Continent"]),
      el("dd", null, [item.continent?.name || "—"]),
      el("dt", null, ["Languages"]),
      el("dd", null, [languages]),
    ]);

    root.appendChild(dl);
  }

  Drupal.behaviors.externalItems = {
    attach: function (context) {
      const root = context.querySelector("#external-root");
      if (!root || root.dataset.externalInit) return;
      root.dataset.externalInit = "1";

      const cfg = (drupalSettings && drupalSettings.external_items) || { mode: "list" };

      (async () => {
        try {
          setBusy(root, true);

          if (cfg.mode === "detail") {
            const data = await fetchJson("/api/items/" + encodeURIComponent(cfg.id));
            if (!data.ok) throw new Error(data.error || "Unknown error");
            if (!data.item) return renderEmpty(root, "Not found.");
            renderDetail(root, data.item);
          } else {
            const limit = 12;

            async function loadList(page) {
              setBusy(root, true);
              try {
                root.innerHTML = '<div class="external__state external__state--loading">Loading…</div>';

                const data = await fetchJson(`/api/items?limit=${limit}&page=${page}`);
                if (!data.ok) throw new Error(data.error || "Unknown error");
                if (!data.items || data.items.length === 0) return renderEmpty(root, "No items.");

                renderList(root, data.items, {
                  page: data.page,
                  pages: data.pages,
                  total: data.total,
                  onPageChange: (newPage) => {
                    setPageInUrl(newPage);
                    loadList(newPage);
                  },
                });
              } catch (e) {
                renderError(root, e.message || "Request failed");
              } finally {
                setBusy(root, false);
              }
            }

            const initialPage = getPageFromUrl();
            loadList(initialPage);

            window.addEventListener("popstate", () => {
              loadList(getPageFromUrl());
            });
          }
        } catch (e) {
          renderError(root, e.message || "Request failed");
        } finally {
          setBusy(root, false);
        }
      })();
    },
  };
})(Drupal, drupalSettings);
