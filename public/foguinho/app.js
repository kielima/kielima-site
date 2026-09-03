import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: "foguinho" } });
const app = document.getElementById("app");

const ME_KEY = "foguinho_me";
const PING_KEY_PREFIX = "foguinho_last_ping_"; // + connectionId -> "YYYY-MM-DD"

function getMe() {
  const raw = localStorage.getItem(ME_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setMe(me) {
  localStorage.setItem(ME_KEY, JSON.stringify(me));
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("sw.js");
}

async function subscribeToPush(personId) {
  if (!("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await supabase.from("push_subscriptions").upsert(
    {
      person_id: personId,
      endpoint: subscription.endpoint,
      subscription: subscription.toJSON(),
    },
    { onConflict: "endpoint" }
  );
}

async function createPerson(name) {
  const { data, error } = await supabase.from("people").insert({ name }).select("id, name").single();
  if (error) throw error;
  return data;
}

async function redeemInvite(token, me) {
  const { data: invite } = await supabase.from("invites").select("owner_id").eq("token", token).maybeSingle();
  if (!invite || invite.owner_id === me.id) return;

  const { data: owner } = await supabase.from("people").select("id, name").eq("id", invite.owner_id).maybeSingle();
  if (!owner) return;

  await supabase.from("connections").upsert(
    [
      { person_a: me.id, person_b: owner.id, friend_name: owner.name },
      { person_a: owner.id, person_b: me.id, friend_name: me.name },
    ],
    { onConflict: "person_a,person_b", ignoreDuplicates: true }
  );
  toast(`Conectado com ${owner.name} 🔥`);
}

async function listConnections(me) {
  const { data, error } = await supabase
    .from("connections")
    .select("id, person_b, friend_name")
    .eq("person_a", me.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

async function listPingDates(me, connection, year, month) {
  // month é 0-indexado (Date.getMonth())
  const inicio = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const fim = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("pings")
    .select("ping_date")
    .eq("from_id", me.id)
    .eq("to_id", connection.person_b)
    .gte("ping_date", inicio)
    .lte("ping_date", fim);
  if (error) throw error;
  return new Set((data ?? []).map((p) => p.ping_date));
}

async function sendPing(me, connection) {
  const { data, error } = await supabase.functions.invoke("foguinho-send-ping", {
    body: { fromId: me.id, toId: connection.person_b, fromName: me.name },
  });
  if (error) throw error;
  return data;
}

function render(templateId) {
  const tpl = document.getElementById(templateId);
  app.innerHTML = "";
  app.appendChild(tpl.content.cloneNode(true));
}

async function showOnboarding(inviteToken) {
  render("tpl-onboarding");
  const form = document.getElementById("form-name");
  let emViagem = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (emViagem) return; // trava contra duplo clique/duplo submit
    const name = document.getElementById("name").value.trim();
    if (!name) return;
    emViagem = true;
    const botao = form.querySelector("button[type=submit]");
    botao.disabled = true;
    try {
      const person = await createPerson(name);
      setMe(person);
      await registerServiceWorker();
      await subscribeToPush(person.id);
      if (inviteToken) await redeemInvite(inviteToken, person);
      await showHome();
    } catch (err) {
      console.error(err);
      toast("Não deu pra criar seu perfil agora, tenta de novo.");
      emViagem = false;
      botao.disabled = false;
    }
  });
}

async function showHome() {
  const me = getMe();
  render("tpl-home");
  const list = document.getElementById("list-connections");
  const empty = document.getElementById("empty-state");

  const connections = await listConnections(me);
  empty.hidden = connections.length > 0;

  const connTpl = document.getElementById("tpl-connection");
  for (const conn of connections) {
    const node = connTpl.content.cloneNode(true);
    const nameBtn = node.querySelector(".connection-name");
    nameBtn.textContent = conn.friend_name;
    nameBtn.addEventListener("click", () => showHistory(me, conn));
    const fireBtn = node.querySelector(".btn-fire");
    const streakEl = node.querySelector(".streak");

    const lastPing = localStorage.getItem(PING_KEY_PREFIX + conn.id);
    if (lastPing === todayStr()) {
      fireBtn.classList.add("lit");
      fireBtn.disabled = true;
    }

    fireBtn.addEventListener("click", async () => {
      fireBtn.disabled = true;
      try {
        const result = await sendPing(me, conn);
        fireBtn.classList.add("lit");
        localStorage.setItem(PING_KEY_PREFIX + conn.id, todayStr());
        if (result?.streak) {
          streakEl.hidden = false;
          streakEl.textContent = `${result.streak} dia${result.streak > 1 ? "s" : ""} seguido${result.streak > 1 ? "s" : ""}`;
        }
        toast(result?.alreadySentToday ? "Você já pensou nessa pessoa hoje 🔥" : `${conn.friend_name} foi avisado 🔥`);
      } catch (err) {
        console.error(err);
        fireBtn.disabled = false;
        toast("Não deu pra enviar agora, tenta de novo.");
      }
    });

    list.appendChild(node);
  }

  document.getElementById("btn-invite").addEventListener("click", () => showInvite(me));
}

async function showInvite(me) {
  render("tpl-invite");
  const { data, error } = await supabase.from("invites").insert({ owner_id: me.id }).select("token").single();
  const linkInput = document.getElementById("invite-link");
  if (error) {
    toast("Não deu pra gerar o convite agora.");
  } else {
    const url = new URL(window.location.href);
    url.search = `?invite=${data.token}`;
    linkInput.value = url.toString();
  }

  document.getElementById("btn-copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText(linkInput.value);
    toast("Link copiado!");
  });

  if (navigator.share) {
    const shareBtn = document.getElementById("btn-share");
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", () => {
      navigator.share({ title: "foguinho", text: "bora trocar foguinho comigo?", url: linkInput.value });
    });
  }

  document.querySelector(".btn-back").addEventListener("click", showHome);
}

async function showHistory(me, connection) {
  render("tpl-history");
  document.getElementById("history-name").textContent = connection.friend_name;
  document.querySelector(".btn-back").addEventListener("click", showHome);

  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth(); // 0-indexado

  const grid = document.getElementById("cal-grid");
  const monthLabel = document.getElementById("cal-month");
  const dayTpl = document.getElementById("tpl-cal-day");

  async function renderMonth() {
    monthLabel.textContent = `${MESES[mes]} de ${ano}`;
    grid.innerHTML = "";

    let diasComFoguinho;
    try {
      diasComFoguinho = await listPingDates(me, connection, ano, mes);
    } catch (err) {
      console.error(err);
      toast("Não deu pra carregar o calendário agora.");
      diasComFoguinho = new Set();
    }

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = domingo
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const hojeStr = todayStr();

    for (let i = 0; i < primeiroDiaSemana; i++) {
      grid.appendChild(document.createElement("div"));
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const node = dayTpl.content.cloneNode(true);
      const cell = node.querySelector(".cal-day");
      const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      cell.querySelector(".cal-day-number").textContent = dia;
      if (diasComFoguinho.has(dataStr)) {
        cell.classList.add("lit");
      }
      if (dataStr === hojeStr) cell.classList.add("today");
      grid.appendChild(node);
    }
  }

  document.getElementById("cal-prev").addEventListener("click", () => {
    mes -= 1;
    if (mes < 0) { mes = 11; ano -= 1; }
    renderMonth();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    mes += 1;
    if (mes > 11) { mes = 0; ano += 1; }
    renderMonth();
  });

  await renderMonth();
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("invite");
  if (inviteToken) window.history.replaceState({}, "", window.location.pathname);

  const me = getMe();
  if (!me) {
    await showOnboarding(inviteToken);
    return;
  }

  await registerServiceWorker();
  await subscribeToPush(me.id);
  if (inviteToken) await redeemInvite(inviteToken, me);
  await showHome();
}

main();
