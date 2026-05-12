document.addEventListener("DOMContentLoaded", () => {
  const state = {
    catalog: { products: [], offers: [] },
    filter: "all",
    search: "",
    cart: [],
    receiptNumber: "",
    receiptCreatedAt: null,
  };

  const STORAGE_KEYS = {
    cart: "tg_cart",
    customerName: "tg_customer_name",
    customerPhone: "tg_customer_phone",
    taxRate: "tg_tax_rate",
    filter: "tg_filter",
    search: "tg_search",
    receiptHistory: "tg_receipt_history",
    lastReceipt: "tg_last_receipt",
  };

  const els = {
    currentDate: document.getElementById("currentDate"),
    currentTime: document.getElementById("currentTime"),
    customerName: document.getElementById("customerName"),
    customerPhone: document.getElementById("customerPhone"),
    taxRate: document.getElementById("taxRate"),
    searchInput: document.getElementById("searchInput"),
    filterGroup: document.getElementById("filterGroup"),
    catalogGrid: document.getElementById("catalogGrid"),
    addSelectedBtn: document.getElementById("addSelectedBtn"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    cartBody: document.getElementById("cartBody"),
    subtotalValue: document.getElementById("subtotalValue"),
    taxValue: document.getElementById("taxValue"),
    grandTotalValue: document.getElementById("grandTotalValue"),
    generateBtn: document.getElementById("generateBtn"),
    downloadPdfBtn: document.getElementById("downloadPdfBtn"),
    downloadImageBtn: document.getElementById("downloadImageBtn"),
    shareBtn: document.getElementById("shareBtn"),
    clearCartBtn: document.getElementById("clearCartBtn"),
    receiptArea: document.getElementById("receiptArea"),
    receiptOrderNo: document.getElementById("receiptOrderNo"),
    receiptDate: document.getElementById("receiptDate"),
    receiptTime: document.getElementById("receiptTime"),
    receiptCustomerName: document.getElementById("receiptCustomerName"),
    receiptCustomerPhone: document.getElementById("receiptCustomerPhone"),
    receiptBody: document.getElementById("receiptBody"),
    receiptItemCount: document.getElementById("receiptItemCount"),
    receiptSubtotal: document.getElementById("receiptSubtotal"),
    receiptTax: document.getElementById("receiptTax"),
    receiptGrandTotal: document.getElementById("receiptGrandTotal"),
  };

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatDateParts(date = new Date()) {
    return {
      date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
      time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`,
      compactDate: `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`,
      compactTime: `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`,
    };
  }

  function formatKES(amount) {
    const value = Number(amount) || 0;

    return `KES ${value.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function generateOrderNumber() {
    const now = formatDateParts(new Date());
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    return `TG-${now.compactDate}-${now.compactTime}-${randomDigits}`;
  }

  function setClock() {
    const now = formatDateParts(new Date());

    els.currentDate.textContent = now.date;
    els.currentTime.textContent = now.time;
  }

  function normalizeCatalog(data) {
    if (Array.isArray(data)) {
      return { products: data, offers: [] };
    }

    if (data && typeof data === "object") {
      return {
        products: Array.isArray(data.products) ? data.products : [],
        offers: Array.isArray(data.offers) ? data.offers : [],
      };
    }

    return { products: [], offers: [] };
  }

  async function loadCatalog() {
    try {
      const response = await fetch("data/items.json", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      state.catalog = normalizeCatalog(data);
    } catch (error) {
      console.error("Failed to load catalog:", error);
      state.catalog = { products: [], offers: [] };
    }
  }

  function getAllItems() {
    return [
      ...state.catalog.products.map((item) => ({
        ...item,
        category: "products",
        typeLabel: "Product",
      })),

      ...state.catalog.offers.map((item) => ({
        ...item,
        category: "offers",
        typeLabel: "Offer",
      })),
    ];
  }

  function filteredItems() {
    const query = state.search.trim().toLowerCase();

    return getAllItems().filter((item) => {
      const categoryMatch =
        state.filter === "all" ||
        item.category === state.filter;

      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEYS.cart,
      JSON.stringify(state.cart)
    );

    localStorage.setItem(
      STORAGE_KEYS.customerName,
      els.customerName.value.trim()
    );

    localStorage.setItem(
      STORAGE_KEYS.customerPhone,
      els.customerPhone.value.trim()
    );

    localStorage.setItem(
      STORAGE_KEYS.taxRate,
      String(els.taxRate.value || 0)
    );

    localStorage.setItem(
      STORAGE_KEYS.filter,
      state.filter
    );

    localStorage.setItem(
      STORAGE_KEYS.search,
      state.search
    );
  }

  function loadState() {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.cart) || "[]"
      );

      if (Array.isArray(savedCart)) {
        state.cart = savedCart;
      }
    } catch {
      state.cart = [];
    }

    els.customerName.value =
      localStorage.getItem(STORAGE_KEYS.customerName) || "";

    els.customerPhone.value =
      localStorage.getItem(STORAGE_KEYS.customerPhone) || "";

    els.taxRate.value =
      localStorage.getItem(STORAGE_KEYS.taxRate) || "0";

    els.searchInput.value =
      localStorage.getItem(STORAGE_KEYS.search) || "";

    state.search = els.searchInput.value;

    state.filter =
      localStorage.getItem(STORAGE_KEYS.filter) || "all";

    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.dataset.filter === state.filter
        );
      });
  }

  function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => {
      return (
        sum +
        num(item.price) * num(item.quantity)
      );
    }, 0);

    const taxRate = num(els.taxRate.value);

    const tax = subtotal * (taxRate / 100);

    const grandTotal = subtotal + tax;

    return {
      subtotal,
      tax,
      grandTotal,
    };
  }

  function calculateItemCount() {
    return state.cart.reduce(
      (sum, item) => sum + num(item.quantity),
      0
    );
  }

  function renderCatalog() {
    els.catalogGrid.innerHTML = "";

    const items = filteredItems();

    if (!items.length) {
      const empty = document.createElement("div");

      empty.className = "product-card";

      empty.innerHTML = `
        <h4>No items found</h4>
        <div class="price">Try another search or category</div>
      `;

      els.catalogGrid.appendChild(empty);

      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");

      card.className = "product-card";

      card.dataset.name = item.name;
      card.dataset.price = item.price;
      card.dataset.category = item.category;

      card.innerHTML = `
        <div class="card-top">
          <label class="pick-wrap">
            <input type="checkbox" class="pick-item" />
            <span>Select</span>
          </label>

          <span class="badge">${item.typeLabel}</span>
        </div>

        <h4>${item.name}</h4>

        <div class="price">${formatKES(item.price)}</div>

        <div class="qty-control">
          <button type="button" class="qty-minus">−</button>

          <input
            type="number"
            class="qty-input"
            min="1"
            value="1"
          />

          <button type="button" class="qty-plus">+</button>
        </div>
      `;

      const checkbox =
        card.querySelector(".pick-item");

      const qtyInput =
        card.querySelector(".qty-input");

      const minusBtn =
        card.querySelector(".qty-minus");

      const plusBtn =
        card.querySelector(".qty-plus");

      checkbox.addEventListener("change", () => {
        card.classList.toggle(
          "selected",
          checkbox.checked
        );
      });

      minusBtn.addEventListener("click", () => {
        qtyInput.value = Math.max(
          1,
          num(qtyInput.value) - 1
        );
      });

      plusBtn.addEventListener("click", () => {
        qtyInput.value = Math.max(
          1,
          num(qtyInput.value) + 1
        );
      });

      els.catalogGrid.appendChild(card);
    });
  }

  function clearSelection() {
    document
      .querySelectorAll(".product-card")
      .forEach((card) => {
        const checkbox =
          card.querySelector(".pick-item");

        const qtyInput =
          card.querySelector(".qty-input");

        if (checkbox) checkbox.checked = false;

        if (qtyInput) qtyInput.value = 1;

        card.classList.remove("selected");
      });
  }

  function addSelectedItems() {
    const selectedCards = Array.from(
      document.querySelectorAll(".product-card")
    ).filter(
      (card) =>
        card.querySelector(".pick-item")?.checked
    );

    if (!selectedCards.length) {
      alert("Please select at least one item first.");
      return;
    }

    selectedCards.forEach((card) => {
      const item = {
        name: card.dataset.name,
        price: num(card.dataset.price),
        category: card.dataset.category,
      };

      const quantity = Math.max(
        1,
        Math.floor(
          num(
            card.querySelector(".qty-input")
              ?.value || 1
          )
        )
      );

      const existingIndex =
        state.cart.findIndex(
          (row) =>
            row.name === item.name &&
            num(row.price) === num(item.price)
        );

      if (existingIndex >= 0) {
        state.cart[existingIndex].quantity +=
          quantity;
      } else {
        state.cart.push({
          name: item.name,
          price: item.price,
          quantity,
          category: item.category,
        });
      }
    });

    clearSelection();

    saveState();

    renderCart();

    renderReceipt();
  }

  function updateCartQuantity(index, delta) {
    const row = state.cart[index];

    if (!row) return;

    row.quantity = Math.max(
      1,
      Math.floor(num(row.quantity) + delta)
    );

    saveState();

    renderCart();

    renderReceipt();
  }

  function removeCartItem(index) {
    state.cart.splice(index, 1);

    saveState();

    renderCart();

    renderReceipt();
  }

  function renderCart() {
    els.cartBody.innerHTML = "";

    if (!state.cart.length) {
      const row = document.createElement("tr");

      row.className = "empty-row";

      row.innerHTML = `
        <td colspan="5">
          No items selected yet.
        </td>
      `;

      els.cartBody.appendChild(row);
    } else {
      state.cart.forEach((item, index) => {
        const total =
          num(item.price) *
          num(item.quantity);

        const row =
          document.createElement("tr");

        row.innerHTML = `
          <td>${item.name}</td>

          <td>
            <div class="qty-inline">
              <button type="button" data-action="minus">−</button>

              <input
                type="number"
                min="1"
                value="${item.quantity}"
              />

              <button type="button" data-action="plus">+</button>
            </div>
          </td>

          <td>${formatKES(item.price)}</td>

          <td>${formatKES(total)}</td>

          <td>
            <button
              type="button"
              class="remove-item-btn"
            >
              Remove
            </button>
          </td>
        `;

        const qtyInput =
          row.querySelector("input");

        const minusBtn =
          row.querySelector(
            '[data-action="minus"]'
          );

        const plusBtn =
          row.querySelector(
            '[data-action="plus"]'
          );

        const removeBtn =
          row.querySelector(
            ".remove-item-btn"
          );

        qtyInput.addEventListener(
          "change",
          () => {
            state.cart[index].quantity =
              Math.max(
                1,
                Math.floor(
                  num(qtyInput.value) || 1
                )
              );

            saveState();

            renderCart();

            renderReceipt();
          }
        );

        minusBtn.addEventListener(
          "click",
          () => updateCartQuantity(index, -1)
        );

        plusBtn.addEventListener(
          "click",
          () => updateCartQuantity(index, 1)
        );

        removeBtn.addEventListener(
          "click",
          () => removeCartItem(index)
        );

        els.cartBody.appendChild(row);
      });
    }

    const totals = calculateTotals();

    els.subtotalValue.textContent =
      formatKES(totals.subtotal);

    els.taxValue.textContent =
      formatKES(totals.tax);

    els.grandTotalValue.textContent =
      formatKES(totals.grandTotal);
  }

  function renderReceipt() {
    const totals = calculateTotals();

    els.receiptCustomerName.textContent =
      els.customerName.value.trim() || "--";

    els.receiptCustomerPhone.textContent =
      els.customerPhone.value.trim() || "--";

    els.receiptSubtotal.textContent =
      formatKES(totals.subtotal);

    els.receiptTax.textContent =
      formatKES(totals.tax);

    els.receiptGrandTotal.textContent =
      formatKES(totals.grandTotal);

    els.receiptItemCount.textContent =
      String(calculateItemCount());

    if (!state.receiptNumber) {
      els.receiptOrderNo.textContent = "Draft";

      const now = formatDateParts(new Date());

      els.receiptDate.textContent =
        now.date;

      els.receiptTime.textContent =
        now.time;
    }

    els.receiptBody.innerHTML = "";

    if (!state.cart.length) {
      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td colspan="4">
          The receipt will appear here after generation.
        </td>
      `;

      els.receiptBody.appendChild(row);

      return;
    }

    state.cart.forEach((item) => {
      const total =
        num(item.price) *
        num(item.quantity);

      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatKES(item.price)}</td>
        <td>${formatKES(total)}</td>
      `;

      els.receiptBody.appendChild(row);
    });
  }

  function saveReceiptHistory(payload) {
    localStorage.setItem(
      STORAGE_KEYS.lastReceipt,
      JSON.stringify(payload)
    );

    let history = [];

    try {
      history = JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.receiptHistory
        ) || "[]"
      );
    } catch {
      history = [];
    }

    history.unshift(payload);

    history = history.slice(0, 30);

    localStorage.setItem(
      STORAGE_KEYS.receiptHistory,
      JSON.stringify(history)
    );
  }

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing =
        document.querySelector(
          `script[data-dynamic-src="${src}"]`
        );

      if (existing) {
        if (
          existing.dataset.loaded ===
          "true"
        ) {
          resolve();
          return;
        }

        existing.addEventListener(
          "load",
          () => resolve(),
          { once: true }
        );

        existing.addEventListener(
          "error",
          reject,
          { once: true }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src = src;

      script.defer = true;

      script.dataset.dynamicSrc = src;

      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };

      script.onerror = () =>
        reject(
          new Error(
            `Failed to load ${src}`
          )
        );

      document.head.appendChild(script);
    });
  }

  async function ensureHtml2Canvas() {
    if (window.html2canvas) return;

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    );
  }

  async function ensureJsPDF() {
    if (window.jspdf?.jsPDF) return;

    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    );
  }

  function buildReceiptClone() {
    const clone =
      els.receiptArea.cloneNode(true);

    clone.style.width = "380px";
    clone.style.maxWidth = "380px";
    clone.style.minWidth = "380px";

    clone.style.position = "fixed";
    clone.style.left = "0";
    clone.style.top = "0";

    clone.style.zIndex = "-9999";

    clone.style.opacity = "1";

    clone.style.pointerEvents = "none";

    clone.style.background = "#ffffff";

    clone.style.boxShadow = "none";

    clone.style.transform = "none";

    clone.style.margin = "0";

    clone.style.padding = "16px";

    clone.style.display = "block";

    clone.style.visibility = "visible";

    clone.style.overflow = "visible";

    clone.style.height = "auto";

    return clone;
  }

  async function waitForImages(element) {
    const images = Array.from(
      element.querySelectorAll("img")
    );

    await Promise.all(
      images.map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  }

  async function withExportClone(callback) {
    const clone = buildReceiptClone();

    document.body.appendChild(clone);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await waitForImages(clone);

      await new Promise((resolve) =>
        requestAnimationFrame(resolve)
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      return await callback(clone);
    } finally {
      clone.remove();
    }
  }

  async function createHighQualityCanvas(
    element
  ) {
    await ensureHtml2Canvas();

    const canvas = await html2canvas(
      element,
      {
        scale: Math.max(
          window.devicePixelRatio || 2,
          3
        ),

        useCORS: true,

        allowTaint: false,

        backgroundColor: "#ffffff",

        logging: false,

        imageTimeout: 15000,

        removeContainer: true,

        foreignObjectRendering: false,

        scrollX: 0,
        scrollY: 0,

        windowWidth:
          element.scrollWidth,

        windowHeight:
          element.scrollHeight,
      }
    );

    return canvas;
  }

  async function generateReceipt() {
    if (!state.cart.length) {
      alert(
        "Please add at least one item first."
      );
      return;
    }

    const now = new Date();

    const parts = formatDateParts(now);

    state.receiptNumber =
      generateOrderNumber();

    state.receiptCreatedAt = now;

    els.receiptOrderNo.textContent =
      state.receiptNumber;

    els.receiptDate.textContent =
      parts.date;

    els.receiptTime.textContent =
      parts.time;

    renderReceipt();

    const totals = calculateTotals();

    const receiptPayload = {
      orderNumber:
        state.receiptNumber,

      date: parts.date,

      time: parts.time,

      customerName:
        els.customerName.value.trim(),

      customerPhone:
        els.customerPhone.value.trim(),

      items: state.cart,

      itemCount:
        calculateItemCount(),

      subtotal: totals.subtotal,

      tax: totals.tax,

      grandTotal:
        totals.grandTotal,

      taxRate: num(
        els.taxRate.value
      ),

      createdAt:
        now.toISOString(),
    };

    saveReceiptHistory(
      receiptPayload
    );

    saveState();

    els.receiptArea.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  
  
  async function downloadAsImage() {
    if (!state.cart.length) {
      alert(
        "Please add items before downloading."
      );
      return;
    }

    if (!state.receiptNumber) {
      await generateReceipt();
    }

    try {
      await withExportClone(
        async (clone) => {
          const canvas =
            await createHighQualityCanvas(
              clone
            );

          const link =
            document.createElement("a");

          link.download = `${
            state.receiptNumber ||
            "tranquil-glow-receipt"
          }.png`;

          link.href =
            canvas.toDataURL(
              "image/png",
              1
            );

          document.body.appendChild(
            link
          );

          link.click();

          link.remove();
        }
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to download image."
      );
    }
  }
  
  
  async function downloadAsPDF() {
    if (!state.cart.length) {
      alert(
        "Please add items before downloading."
      );
      return;
    }

    if (!state.receiptNumber) {
      await generateReceipt();
    }

    try {
      await ensureJsPDF();

      await withExportClone(
        async (clone) => {
          const canvas =
            await createHighQualityCanvas(
              clone
            );

          const imgData =
            canvas.toDataURL(
              "image/jpeg",
              1
            );

          const { jsPDF } =
            window.jspdf;

          const pdf = new jsPDF({
            orientation:
              "portrait",

            unit: "mm",

            format: "a4",

            compress: true,
          });

          const pageWidth =
            pdf.internal.pageSize.getWidth();

          const pageHeight =
            pdf.internal.pageSize.getHeight();

          const margin = 10;

          const usableWidth =
            pageWidth -
            margin * 2;

          const canvasWidth =
            canvas.width;

          const canvasHeight =
            canvas.height;

          const imgHeight =
            (canvasHeight *
              usableWidth) /
            canvasWidth;

          let finalHeight =
            imgHeight;

          if (
            finalHeight >
            pageHeight -
              margin * 2
          ) {
            finalHeight =
              pageHeight -
              margin * 2;
          }

          pdf.addImage(
            imgData,
            "JPEG",
            margin,
            margin,
            usableWidth,
            finalHeight,
            undefined,
            "FAST"
          );

          pdf.save(
            `${
              state.receiptNumber ||
              "tranquil-glow-receipt"
            }.pdf`
          );
        }
      );
    } catch (error) {
      console.error(error);

      alert(
        "PDF generation failed."
      );
    }
  }

  async function shareReceipt() {
    if (!state.cart.length) {
      alert(
        "Please add items before sharing."
      );
      return;
    }
    
    
    if (!state.receiptNumber) {
      await generateReceipt();
    }

    try {
      await withExportClone(
        async (clone) => {
          const canvas =
            await createHighQualityCanvas(
              clone
            );

          const blob =
            await new Promise(
              (resolve) => {
                canvas.toBlob(
                  resolve,
                  "image/png",
                  1
                );
              }
            );

          if (!blob) {
            throw new Error(
              "Could not create image."
            );
          }

          const fileName = `${
            state.receiptNumber ||
            "tranquil-glow-receipt"
          }.png`;

          const file = new File(
            [blob],
            fileName,
            {
              type: "image/png",
            }
          );

          if (
            navigator.share &&
            (!navigator.canShare ||
              navigator.canShare({
                files: [file],
              }))
          ) {
            await navigator.share({
              title: "Receipt",

              text: `Receipt ${state.receiptNumber}`,

              files: [file],
            });

            return;
          }

          const url =
            URL.createObjectURL(blob);

          const a =
            document.createElement("a");

          a.href = url;

          a.download = fileName;

          document.body.appendChild(a);

          a.click();

          a.remove();

          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }
      );
    } catch (error) {
      console.error(error);

      alert("Sharing failed.");
    }
  }

  function clearAll() {
    state.cart = [];

    state.receiptNumber = "";

    state.receiptCreatedAt = null;

    localStorage.removeItem(
      STORAGE_KEYS.lastReceipt
    );

    saveState();

    renderCart();

    renderReceipt();
  }
  
  
  function wireEvents() {
    els.filterGroup.addEventListener(
      "click",
      (event) => {
        const btn =
          event.target.closest(
            ".filter-btn"
          );

        if (!btn) return;

        document
          .querySelectorAll(
            ".filter-btn"
          )
          .forEach((item) =>
            item.classList.remove(
              "active"
            )
          );

        btn.classList.add("active");

        state.filter =
          btn.dataset.filter;

        saveState();

        renderCatalog();
      }
    );

    els.searchInput.addEventListener(
      "input",
      () => {
        state.search =
          els.searchInput.value;

        saveState();

        renderCatalog();
      }
    );

    els.customerName.addEventListener(
      "input",
      () => {
        renderReceipt();
        saveState();
      }
    );

    els.customerPhone.addEventListener(
      "input",
      () => {
        renderReceipt();
        saveState();
      }
    );

    els.taxRate.addEventListener(
      "input",
      () => {
        renderCart();
        renderReceipt();
        saveState();
      }
    );

    els.addSelectedBtn.addEventListener(
      "click",
      addSelectedItems
    );

    els.clearSelectionBtn.addEventListener(
      "click",
      clearSelection
    );

    els.generateBtn.addEventListener(
      "click",
      generateReceipt
    );

    els.downloadPdfBtn.addEventListener(
      "click",
      downloadAsPDF
    );

    els.downloadImageBtn.addEventListener(
      "click",
      downloadAsImage
    );

    els.shareBtn.addEventListener(
      "click",
      shareReceipt
    );

    els.clearCartBtn.addEventListener(
      "click",
      clearAll
    );
  }
  
  
  async function init() {
    setClock();

    setInterval(setClock, 1000);

    await loadCatalog();

    loadState();

    wireEvents();

    renderCatalog();

    renderCart();

    renderReceipt();
  }

  init();
});