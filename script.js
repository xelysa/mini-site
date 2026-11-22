// Lily is turning 6: RSVP form, countdown and snow.

// Paste the Google Apps Script web-app URL here (ends in /exec).
const RSVP_URL = "";

const PARTY_DAY = new Date(2026, 11, 12); // 12 December 2026 (months start at 0)

document.addEventListener("DOMContentLoaded", () => {
  setUpCountdown();
  setUpSnow();
  setUpForm();
});

/* ---------- Countdown ("X sleeps to go") ---------- */
function setUpCountdown() {
  const el = document.getElementById("countdown");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((PARTY_DAY - today) / 86400000);
  if (days > 1) el.textContent = `${days} sleeps to go!`;
  else if (days === 1) el.textContent = "1 sleep to go!";
  else if (days === 0) el.textContent = "Party day! 🎉";
  else return;
  el.hidden = false;
}

/* ---------- Snow ---------- */
function setUpSnow() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.querySelector(".snow");
  const ctx = canvas.getContext("2d");
  let w, h, flakes;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.round(w / 8));
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.2 + 0.8,
      speed: Math.random() * 0.6 + 0.3,
      drift: Math.random() * 0.6 - 0.3,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function tick(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (const f of flakes) {
      f.y += f.speed;
      f.x += f.drift + Math.sin(t / 1500 + f.phase) * 0.3;
      if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
      if (f.x > w + 5) f.x = -5;
      if (f.x < -5) f.x = w + 5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
}

/* ---------- RSVP form ---------- */
function setUpForm() {
  const form = document.getElementById("rsvp-form");
  const ifYes = document.getElementById("if-yes");
  const error = document.getElementById("form-error");
  const thanks = document.getElementById("thanks");
  const thanksMsg = document.getElementById("thanks-msg");
  const submit = form.querySelector(".submit");
  const child = form.elements.child;

  // Show counts and names only when "Yes!" is picked
  function syncComing() {
    ifYes.hidden = form.elements.coming.value !== "yes";
  }
  form.querySelectorAll('input[name="coming"]').forEach((r) => r.addEventListener("change", syncComing));
  syncComing();

  // − / + steppers
  form.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.for);
      const next = clamp((parseInt(input.value, 10) || 0) + Number(btn.dataset.step), input.min, input.max);
      input.value = next;
    });
  });

  child.addEventListener("input", () => {
    child.removeAttribute("aria-invalid");
    error.hidden = true;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;

    const coming = form.elements.coming.value;
    if (!child.value.trim()) {
      child.setAttribute("aria-invalid", "true");
      showError("Please add your child's name.");
      child.focus();
      return;
    }

    const kids = clamp(form.elements.kids.value, 0, 6);
    const adults = clamp(form.elements.adults.value, 0, 4);
    if (coming === "yes" && kids + adults === 0) {
      showError("Please tell us how many children and adults are coming.");
      return;
    }

    if (!RSVP_URL) {
      showError("The RSVP form isn't connected yet. Please message Lily's family directly.");
      return;
    }

    const data = new URLSearchParams({
      child: child.value.trim(),
      coming,
      kids: coming === "yes" ? kids : 0,
      adults: coming === "yes" ? adults : 0,
      names: coming === "yes" ? form.elements.names.value.trim() : "",
      notes: form.elements.notes.value.trim(),
      website: form.elements.website.value,
    });

    submit.disabled = true;
    submit.textContent = "Sending…";

    try {
      const res = await fetch(RSVP_URL, { method: "POST", body: data });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Not saved");

      thanksMsg.textContent =
        coming === "yes"
          ? `We can't wait to see ${child.value.trim()} on Saturday 12 December!`
          : "Sorry you can't make it. Thanks for letting us know!";
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch (err) {
      showError("Your reply didn't send. Check your connection and try again.");
    } finally {
      submit.disabled = false;
      submit.textContent = "Send RSVP";
    }
  });

  document.getElementById("again").addEventListener("click", () => {
    form.reset();
    syncComing();
    thanks.hidden = true;
    form.hidden = false;
    child.focus();
  });

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }
}

function clamp(value, min, max) {
  return Math.min(Number(max), Math.max(Number(min), parseInt(value, 10) || 0));
}
