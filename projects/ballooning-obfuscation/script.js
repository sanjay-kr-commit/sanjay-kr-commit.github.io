/* ============================================================
   BALLOONING OBFUSCATION — page script
   1. reveal-on-scroll
   2. faithful reimplementation of mask.py/unmask.py and
      enc_mask.py/dec_unmask.py, wired to a live demo
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- reveal on scroll ---------------- */
  (function reveal() {
    const els = document.querySelectorAll(".reveal");
    if (reduceMotion) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
  })();

  /* ---------------- hex helpers (match Python's f"{v:X}" family) ---------------- */
  function hex(v, width = 0) {
    return v.toString(16).toUpperCase().padStart(width, "0");
  }

  /* ---------------- mask.py / unmask.py ----------------
     random salt embedded in the output, plus a fixed
     quadratic "chaos" step keyed only on position.
     ---------------------------------------------------- */
  const A = 37, B = 59, C = 101, M = 0xfff;

  function chaosStep(i) {
    return (A * i * i + B * i + C) % M;
  }

  function maskEncode(message, salt) {
    const saltHex = hex(salt);
    const saltPrefixChar = String(saltHex.length);
    let segments = "";
    for (let i = 0; i < message.length; i++) {
      const asciiVal = message.codePointAt(i);
      const hexVal = hex(asciiVal, 2);
      const reversed = (hexVal + "1").split("").reverse().join("");
      const numVal = parseInt(reversed, 16);
      const saltedNum = numVal + salt + chaosStep(i);
      const finalHex = hex(saltedNum);
      segments += String(finalHex.length) + finalHex;
    }
    return saltPrefixChar + saltHex + segments;
  }

  function maskDecode(encoded) {
    const saltLength = parseInt(encoded[0], 10);
    const saltHex = encoded.slice(1, 1 + saltLength);
    const salt = parseInt(saltHex, 16);
    let index = 1 + saltLength;
    let out = "";
    let i = 0;
    while (index < encoded.length) {
      const segLen = parseInt(encoded[index], 10);
      index += 1;
      const currentHex = encoded.slice(index, index + segLen);
      index += segLen;
      const saltedNum = parseInt(currentHex, 16);
      const numVal = saltedNum - salt - chaosStep(i);
      i++;
      const reversedHex = hex(numVal);
      const origHex = reversedHex.split("").reverse().join("").slice(0, -1);
      out += String.fromCodePoint(parseInt(origHex || "0", 16));
    }
    return { text: out, salt };
  }

  /* ---------------- enc_mask.py / dec_unmask.py ----------------
     password + position through SHA-256, first two bytes as
     the keystream — real crypto.subtle, not a stand-in.
     ---------------------------------------------------- */
  async function keystream(password, position) {
    const bytes = new TextEncoder().encode(`${password}:${position}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const view = new Uint8Array(digest);
    return (view[0] << 8) | view[1];
  }

  async function encMaskEncode(message, password) {
    let out = "";
    for (let i = 0; i < message.length; i++) {
      const asciiVal = message.codePointAt(i);
      const hexVal = hex(asciiVal, 2);
      const transformed = parseInt((hexVal + "1").split("").reverse().join(""), 16);
      const chaos = await keystream(password, i);
      const encodedNum = transformed + chaos;
      out += hex(encodedNum, 5);
    }
    return out;
  }

  async function decMaskDecode(encoded, password) {
    let out = "";
    let pos = 0;
    for (let index = 0; index < encoded.length; index += 5) {
      const block = encoded.slice(index, index + 5);
      const encodedNum = parseInt(block, 16);
      const chaos = await keystream(password, pos);
      const transformed = encodedNum - chaos;
      pos++;
      const reversedHex = hex(transformed);
      const origHex = reversedHex.split("").reverse().join("").slice(0, -1);
      out += String.fromCodePoint(parseInt(origHex || "0", 16));
    }
    return out;
  }

  /* ---------------- demo wiring ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".demo-tab");
    const passwordRow = document.getElementById("passwordRow");
    const messageInput = document.getElementById("demoMessage");
    const passwordInput = document.getElementById("demoPassword");
    const encodedInput = document.getElementById("demoEncoded");
    const decodedInput = document.getElementById("demoDecoded");
    const noteEl = document.getElementById("demoNote");

    let variant = "salt";
    let currentSalt = Math.floor(Math.random() * 0xfff) + 1;

    async function update() {
      const message = messageInput.value;
      if (!message.length) {
        encodedInput.value = "";
        decodedInput.value = "";
        noteEl.textContent = "";
        return;
      }
      if (variant === "salt") {
        const encoded = maskEncode(message, currentSalt);
        const { text, salt } = maskDecode(encoded);
        encodedInput.value = encoded;
        decodedInput.value = text;
        noteEl.textContent = `embedded salt = 0x${hex(salt)} — anyone with this string can decode it, no password needed.`;
      } else {
        const password = passwordInput.value || "";
        const encoded = await encMaskEncode(message, password);
        const decoded = await decMaskDecode(encoded, password);
        encodedInput.value = encoded;
        decodedInput.value = decoded;
        noteEl.textContent = `keystream derived from SHA-256("${password}:0") for the first character — change the password and the encoded text changes completely.`;
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        variant = tab.dataset.variant;
        passwordRow.hidden = variant !== "password";
        if (variant === "salt") currentSalt = Math.floor(Math.random() * 0xfff) + 1;
        update();
      });
    });

    messageInput.addEventListener("input", update);
    passwordInput.addEventListener("input", update);
    update();
  });
})();
