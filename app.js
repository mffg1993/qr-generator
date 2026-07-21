"use strict";

const state = {
  type: "text",
  payload: "",
  svg: "",
  filename: "qr-code",
};

const elements = {
  tabs: [...document.querySelectorAll(".tab")],
  panels: [...document.querySelectorAll("[data-panel]")],
  textInput: document.querySelector("#text-input"),
  wifiName: document.querySelector("#wifi-name"),
  wifiSecurity: document.querySelector("#wifi-security"),
  wifiPassword: document.querySelector("#wifi-password"),
  wifiHidden: document.querySelector("#wifi-hidden"),
  emailAddress: document.querySelector("#email-address"),
  emailSubject: document.querySelector("#email-subject"),
  emailBody: document.querySelector("#email-body"),
  size: document.querySelector("#qr-size"),
  errorLevel: document.querySelector("#error-level"),
  darkColor: document.querySelector("#dark-color"),
  lightColor: document.querySelector("#light-color"),
  canvas: document.querySelector("#qr-canvas"),
  preview: document.querySelector("#qr-preview"),
  generate: document.querySelector("#generate-button"),
  downloadPng: document.querySelector("#download-png"),
  downloadSvg: document.querySelector("#download-svg"),
  copyImage: document.querySelector("#copy-image"),
  formError: document.querySelector("#form-error"),
  status: document.querySelector("#status-message"),
};

function setActiveType(type) {
  state.type = type;

  elements.tabs.forEach((tab) => {
    const active = tab.dataset.type === type;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  elements.panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== type;
  });

  clearError();
}

function escapeWifiValue(value) {
  return value.replace(/([\\;,:\"])/g, "\\$1");
}

function buildPayload() {
  if (state.type === "text") {
    const value = elements.textInput.value.trim();
    if (!value) throw new Error("Enter some text or a website address.");
    state.filename = "text-qr-code";
    return value;
  }

  if (state.type === "wifi") {
    const ssid = elements.wifiName.value.trim();
    const security = elements.wifiSecurity.value;
    const password = elements.wifiPassword.value;

    if (!ssid) throw new Error("Enter the Wi-Fi network name.");
    if (security !== "nopass" && !password) {
      throw new Error("Enter the Wi-Fi password or select ‘No password’.");
    }

    const hidden = elements.wifiHidden.checked ? "true" : "false";
    state.filename = "wifi-qr-code";
    return `WIFI:T:${security};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(password)};H:${hidden};;`;
  }

  const address = elements.emailAddress.value.trim();
  if (!address || !elements.emailAddress.checkValidity()) {
    throw new Error("Enter a valid email address.");
  }

  const params = new URLSearchParams();
  const subject = elements.emailSubject.value.trim();
  const body = elements.emailBody.value.trim();

  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);

  state.filename = "email-qr-code";
  const query = params.toString();
  return `mailto:${address}${query ? `?${query}` : ""}`;
}

function qrOptions() {
  return {
    width: Number(elements.size.value),
    margin: 4,
    errorCorrectionLevel: elements.errorLevel.value,
    color: {
      dark: elements.darkColor.value,
      light: elements.lightColor.value,
    },
  };
}

function showError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
  elements.status.textContent = "Not generated";
}

function clearError() {
  elements.formError.textContent = "";
  elements.formError.hidden = true;
}

function setActionButtons(enabled) {
  elements.downloadPng.disabled = !enabled;
  elements.downloadSvg.disabled = !enabled;
  elements.copyImage.disabled =
    !enabled || !navigator.clipboard || typeof ClipboardItem === "undefined";
}

function showSvgPreview(svgMarkup) {
  elements.preview.innerHTML = svgMarkup;
  const svg = elements.preview.querySelector("svg");

  if (svg) {
    // Let CSS scale the preview while preserving the complete square viewBox.
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Generated QR code");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
}

async function generateQrCode() {
  clearError();

  if (typeof QRCode === "undefined") {
    showError("The local QR library did not load. Confirm that qrcode.min.js is in the repository root.");
    return;
  }

  try {
    state.payload = buildPayload();
    const options = qrOptions();

    // The hidden canvas is used for PNG and clipboard output.
    await QRCode.toCanvas(elements.canvas, state.payload, options);

    // The visible preview uses SVG so it scales without being cropped.
    state.svg = await QRCode.toString(state.payload, {
      ...options,
      type: "svg",
    });

    showSvgPreview(state.svg);
    setActionButtons(true);
    elements.status.textContent = "Generated";
  } catch (error) {
    setActionButtons(false);
    showError(error instanceof Error ? error.message : "Could not generate the QR code.");
  }
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadPng() {
  elements.canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `${state.filename}.png`);
  }, "image/png");
}

function downloadSvg() {
  const blob = new Blob([state.svg], {
    type: "image/svg+xml;charset=utf-8",
  });
  downloadBlob(blob, `${state.filename}.svg`);
}

async function copyImage() {
  try {
    const blob = await new Promise((resolve, reject) => {
      elements.canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Could not create the image."));
      }, "image/png");
    });

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    elements.status.textContent = "Copied to clipboard";
  } catch (error) {
    showError(error instanceof Error ? error.message : "Your browser could not copy the image.");
  }
}

function updateWifiPasswordState() {
  const noPassword = elements.wifiSecurity.value === "nopass";
  elements.wifiPassword.disabled = noPassword;
  if (noPassword) elements.wifiPassword.value = "";
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveType(tab.dataset.type));
});

elements.wifiSecurity.addEventListener("change", updateWifiPasswordState);
elements.generate.addEventListener("click", generateQrCode);
elements.downloadPng.addEventListener("click", downloadPng);
elements.downloadSvg.addEventListener("click", downloadSvg);
elements.copyImage.addEventListener("click", copyImage);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    generateQrCode();
  }
});

setActionButtons(false);
updateWifiPasswordState();
generateQrCode();
