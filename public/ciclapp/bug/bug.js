// Formulário "Reportar bug" do site (tarefa #1685). Envia para a Edge Function
// `report-bug`, que confere o login do Firebase e a lista BUG_REPORT_EMAILS e cria
// a tarefa no projeto "ciclapp" do app de produtividade. Nenhuma chave de escrita
// mora aqui: só o anon key (público) e o token do próprio login.
import { $, iniciarLogin, SUPABASE_URL, SUPABASE_ANON_KEY } from "../comum.js";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/report-bug`;
let usuario = null;

iniciarLogin({
  aoEntrar(user) { usuario = user; },
  aoSair() { usuario = null; },
});

function status(texto, tipo = "") {
  const el = $("bug-status");
  el.textContent = texto;
  el.className = tipo || "muted";
}

$("bug-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const titulo = $("bug-titulo").value.trim();
  const descricao = $("bug-descricao").value.trim();
  if (!titulo || !descricao) {
    status("Preencha o título e a descrição.", "erro");
    return;
  }
  if (!usuario) {
    status("Faça login novamente.", "erro");
    return;
  }

  const botao = $("bug-enviar");
  botao.disabled = true;
  status("Enviando…");
  try {
    const token = await usuario.getIdToken();
    const resp = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + token },
      body: JSON.stringify({
        titulo,
        descricao: `${descricao}\n\nPágina: ${document.referrer || location.href}\nNavegador: ${navigator.userAgent}`,
        origem: "site",
        email: usuario.email || "",
      }),
    });
    const dados = await resp.json().catch(() => ({}));
    if (resp.ok && dados.success) {
      status(`Recebido! Virou a tarefa #${dados.data?.task_id ?? "?"}. Valeu!`, "ok");
      $("bug-form").reset();
    } else {
      status(dados.error || `Erro ${resp.status}.`, "erro");
    }
  } catch (e) {
    status("Falha ao enviar: " + e.message, "erro");
  } finally {
    botao.disabled = false;
  }
});
