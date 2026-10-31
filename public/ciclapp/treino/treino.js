// Treino na web: lê e edita as fichas e mostra o histórico que o app Android
// sincroniza em users/{uid}/workouts e users/{uid}/workout_sessions
// (WorkoutSyncWorker / WorkoutFirestoreMapper no app). Mudar o formato dos
// documentos aqui exige mudar o mapper lá também.
import { app, $, escapeHtml, iniciarLogin, SUPABASE_URL, SUPABASE_ANON_KEY } from "../comum.js";
import {
  getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, limit,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const db = getFirestore(app);
const ABAS = ["fichas", "historico", "evolucao"];

let uid = null;
let fichas = [];
let sessoes = [];
let carregado = { fichas: false, sessoes: false };
let editando = null;
let cancelarAssinaturas = [];
let exercicioEvolucao = null;
let filtroFicha = "";

let aba = ABAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "fichas";

iniciarLogin({
  aoEntrar(user) {
    uid = user.uid;
    assinar();
    render();
  },
  aoSair() {
    cancelarAssinaturas.forEach((f) => f());
    cancelarAssinaturas = [];
    uid = null;
    fichas = [];
    sessoes = [];
    carregado = { fichas: false, sessoes: false };
    editando = null;
  },
});

document.querySelectorAll("#abas button").forEach((b) => {
  b.addEventListener("click", () => {
    if (editando && !confirm("Descartar as alterações da ficha?")) return;
    editando = null;
    aba = b.dataset.aba;
    history.replaceState(null, "", "#" + aba);
    render();
  });
});

function assinar() {
  cancelarAssinaturas.forEach((f) => f());
  const falha = (e) => {
    $("content").innerHTML = `<p class="erro">Não consegui ler os dados: ${escapeHtml(e.message)}</p>`;
  };
  cancelarAssinaturas = [
    onSnapshot(collection(db, "users", uid, "workouts"), (snap) => {
      fichas = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || (a.name || "").localeCompare(b.name || ""));
      carregado.fichas = true;
      if (!editando) render();
    }, falha),
    onSnapshot(query(collection(db, "users", uid, "workout_sessions"), orderBy("startedAt", "desc"), limit(500)), (snap) => {
      sessoes = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.completed);
      carregado.sessoes = true;
      if (!editando) render();
    }, falha),
  ];
}

function render() {
  document.querySelectorAll("#abas button").forEach((b) => b.classList.toggle("active", b.dataset.aba === aba));
  const main = $("content");
  if (editando) return renderEditor(main);
  if (aba === "fichas") return renderFichas(main);
  if (aba === "historico") return renderHistorico(main);
  return renderEvolucao(main);
}

// ─── Formatação ──────────────────────────────────────────────────────────────

const kg = (v) => (v == null || v === "" ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`);
const data = (ms) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dataHora = (ms) => new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const reps = (s) => parseInt(s, 10) || 0;
// Os grupos do catálogo vêm como "Peito: porção média/esternal (~95%)…"; para agrupar, só o nome.
const grupo = (g) => (g ? String(g).split(":")[0].split("(")[0].trim() : "Sem grupo");

function duracao(s) {
  if (!s.endedAt || !s.startedAt) return "";
  const min = Math.round((s.endedAt - s.startedAt) / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

function aviso(texto) {
  return `<p class="muted">${texto}</p>`;
}

// ─── Fichas ──────────────────────────────────────────────────────────────────

function renderFichas(main) {
  if (!carregado.fichas) {
    main.innerHTML = aviso("Carregando…");
    return;
  }
  main.innerHTML = `
    <div class="linha-acoes" style="justify-content:space-between;margin-bottom:12px">
      <button class="primary" id="nova-ficha">Nova ficha</button>
      <span class="muted">O que você muda aqui chega ao app quando ele abrir o treino (ou em até 1 hora).</span>
    </div>
    ${fichas.length ? "" : aviso("Nenhuma ficha ainda. As fichas do app aparecem aqui depois que ele sincronizar: abra a parte de treino no celular com internet.")}
    ${fichas.map(cartaoFicha).join("")}
  `;
  $("nova-ficha").onclick = () => abrirEditor(null);
  main.querySelectorAll("[data-editar]").forEach((b) => {
    b.onclick = () => abrirEditor(fichas.find((f) => f.id === b.dataset.editar));
  });
  main.querySelectorAll("[data-apagar]").forEach((b) => {
    b.onclick = () => apagarFicha(fichas.find((f) => f.id === b.dataset.apagar));
  });
}

function cartaoFicha(f) {
  const exs = f.exercises || [];
  const detalhes = [f.type, `${exs.length} exercício${exs.length === 1 ? "" : "s"}`];
  if (f.updatedAt) detalhes.push(`atualizada em ${data(f.updatedAt)}${f.updatedBy === "web" ? " pela web" : " pelo app"}`);
  return `
    <div class="card">
      <div class="ficha-topo">
        <div>
          <h3>${escapeHtml(f.name || "(sem nome)")}</h3>
          <div class="muted">${detalhes.filter(Boolean).map(escapeHtml).join(" · ")}</div>
          ${f.description ? `<p>${escapeHtml(f.description)}</p>` : ""}
        </div>
        <div class="linha-acoes">
          <button data-editar="${escapeHtml(f.id)}">Editar</button>
          <button class="perigo" data-apagar="${escapeHtml(f.id)}">Apagar</button>
        </div>
      </div>
      ${exs.length ? `
      <div class="tabela"><table>
        <thead><tr><th>#</th><th>Exercício</th><th>Grupo</th><th>Séries × reps</th><th>Carga</th><th>Observação</th></tr></thead>
        <tbody>
          ${exs.map((e, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(e.exerciseName)}</td>
              <td title="${escapeHtml(e.primaryMuscleGroup)}">${escapeHtml(grupo(e.primaryMuscleGroup))}</td>
              <td>${escapeHtml(e.sets)} × ${escapeHtml(e.reps)}</td>
              <td>${kg(e.weightKg)}</td>
              <td>${escapeHtml(e.notes || "")}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>` : ""}
    </div>`;
}

async function apagarFicha(f) {
  if (!f || !confirm(`Apagar a ficha "${f.name}"? Ela também some do app. O histórico de sessões continua.`)) return;
  try {
    await deleteDoc(doc(db, "users", uid, "workouts", f.id));
  } catch (e) {
    alert("Não consegui apagar: " + e.message);
  }
}

// ─── Editor de ficha ─────────────────────────────────────────────────────────

function abrirEditor(ficha) {
  editando = ficha
    ? structuredClone({ ...ficha, exercises: ficha.exercises || [] })
    : {
        id: crypto.randomUUID(),
        name: "",
        type: "Musculação",
        description: "",
        createdAt: new Date().toISOString().slice(0, 10),
        exercises: [],
        nova: true,
      };
  render();
}

function novoExercicio(dados) {
  return {
    id: crypto.randomUUID(),
    exerciseName: "",
    primaryMuscleGroup: "",
    secondaryMuscleGroup: null,
    recoveryMinHours: null,
    recoveryTotalHours: null,
    recoveryMinHoursLight: null,
    recoveryTotalHoursLight: null,
    sourceType: "custom",
    sourceId: null,
    sets: 3,
    reps: "12",
    weightKg: null,
    notes: "",
    ...dados,
  };
}

function renderEditor(main) {
  const f = editando;
  main.innerHTML = `
    <div class="card editor">
      <h3>${f.nova ? "Nova ficha" : "Editar ficha"}</h3>
      <label for="ed-nome">Nome</label>
      <input type="text" id="ed-nome" value="${escapeHtml(f.name)}" placeholder="Ex.: Treino A — peito e tríceps" />
      <label for="ed-tipo">Tipo</label>
      <input type="text" id="ed-tipo" list="tipos" value="${escapeHtml(f.type)}" />
      <label for="ed-desc">Descrição</label>
      <textarea id="ed-desc">${escapeHtml(f.description)}</textarea>

      <label>Exercícios (${f.exercises.length})</label>
      ${f.exercises.length ? `
      <div class="tabela"><table>
        <thead><tr><th>Exercício</th><th>Grupo muscular</th><th>Séries</th><th>Reps</th><th>Carga (kg)</th><th>Observação</th><th></th></tr></thead>
        <tbody>
          ${f.exercises.map((e, i) => `
            <tr data-i="${i}">
              <td><input data-campo="exerciseName" value="${escapeHtml(e.exerciseName)}" /></td>
              <td><input data-campo="primaryMuscleGroup" value="${escapeHtml(e.primaryMuscleGroup)}" title="${escapeHtml(e.primaryMuscleGroup)}" /></td>
              <td class="num"><input data-campo="sets" type="number" min="1" step="1" value="${escapeHtml(e.sets)}" /></td>
              <td class="num"><input data-campo="reps" value="${escapeHtml(e.reps)}" /></td>
              <td class="num"><input data-campo="weightKg" type="number" min="0" step="0.5" value="${e.weightKg ?? ""}" /></td>
              <td><input data-campo="notes" value="${escapeHtml(e.notes || "")}" /></td>
              <td><div class="linha-acoes" style="flex-wrap:nowrap">
                <button class="mini" data-mover="-1" title="Subir" ${i === 0 ? "disabled" : ""}>↑</button>
                <button class="mini" data-mover="1" title="Descer" ${i === f.exercises.length - 1 ? "disabled" : ""}>↓</button>
                <button class="mini perigo" data-remover title="Remover">✕</button>
              </div></td>
            </tr>`).join("")}
        </tbody>
      </table></div>` : aviso("Nenhum exercício ainda.")}

      <label for="ed-busca">Adicionar exercício do catálogo</label>
      <div class="linha-acoes">
        <input type="text" id="ed-busca" placeholder="Buscar pelo nome (ex.: supino)" style="flex:1;min-width:180px" />
        <button id="ed-livre">Adicionar exercício livre</button>
      </div>
      <div id="ed-resultados" class="resultados"></div>

      <p id="ed-erro" class="erro"></p>
      <div class="linha-acoes">
        <button class="primary" id="ed-salvar">Salvar</button>
        <button id="ed-cancelar">Cancelar</button>
      </div>
    </div>`;

  $("ed-nome").oninput = (e) => (f.name = e.target.value);
  $("ed-tipo").oninput = (e) => (f.type = e.target.value);
  $("ed-desc").oninput = (e) => (f.description = e.target.value);

  main.querySelectorAll("tr[data-i]").forEach((tr) => {
    const i = Number(tr.dataset.i);
    tr.querySelectorAll("input[data-campo]").forEach((inp) => {
      inp.oninput = () => (f.exercises[i][inp.dataset.campo] = inp.value);
    });
    tr.querySelectorAll("[data-mover]").forEach((b) => {
      b.onclick = () => {
        const j = i + Number(b.dataset.mover);
        [f.exercises[i], f.exercises[j]] = [f.exercises[j], f.exercises[i]];
        render();
      };
    });
    tr.querySelector("[data-remover]").onclick = () => {
      f.exercises.splice(i, 1);
      render();
    };
  });

  let espera = null;
  $("ed-busca").oninput = (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => buscarCatalogo(e.target.value), 300);
  };
  $("ed-livre").onclick = () => {
    f.exercises.push(novoExercicio({}));
    render();
    const inputs = main.querySelectorAll('input[data-campo="exerciseName"]');
    inputs[inputs.length - 1]?.focus();
  };
  $("ed-salvar").onclick = salvarFicha;
  $("ed-cancelar").onclick = () => {
    editando = null;
    render();
  };
}

async function buscarCatalogo(termo) {
  const alvo = $("ed-resultados");
  termo = termo.trim();
  if (!alvo) return;
  if (!termo) {
    alvo.innerHTML = "";
    return;
  }
  alvo.innerHTML = aviso("Buscando…");
  // Mesma consulta do app (SupabaseExerciseRepository): catálogo público, só leitura.
  const colunas = "id,name,category,primary_muscle_group,secondary_muscle_group," +
    "recovery_min_hours,recovery_total_hours,recovery_min_hours_light,recovery_total_hours_light";
  const url = `${SUPABASE_URL}/rest/v1/exercises?select=${colunas}` +
    `&name=ilike.*${encodeURIComponent(termo)}*&order=name&limit=25`;
  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY } });
    if (!res.ok) throw new Error("Supabase respondeu " + res.status);
    const lista = await res.json();
    if (!editando || $("ed-busca")?.value.trim() !== termo) return;
    if (!lista.length) {
      alvo.innerHTML = aviso("Nada encontrado. Use “Adicionar exercício livre”.");
      return;
    }
    alvo.innerHTML = lista.map((x, i) => `
      <button data-r="${i}"><strong>${escapeHtml(x.name)}</strong>
        <span class="muted"> · ${escapeHtml(grupo(x.primary_muscle_group))}</span></button>`).join("");
    alvo.querySelectorAll("[data-r]").forEach((b) => {
      b.onclick = () => {
        const x = lista[Number(b.dataset.r)];
        editando.exercises.push(novoExercicio({
          exerciseName: x.name,
          primaryMuscleGroup: x.primary_muscle_group || "",
          secondaryMuscleGroup: x.secondary_muscle_group,
          recoveryMinHours: x.recovery_min_hours,
          recoveryTotalHours: x.recovery_total_hours,
          recoveryMinHoursLight: x.recovery_min_hours_light,
          recoveryTotalHoursLight: x.recovery_total_hours_light,
          sourceType: "remote",
          sourceId: String(x.id),
        }));
        render();
      };
    });
  } catch (e) {
    alvo.innerHTML = `<p class="erro">Não consegui buscar no catálogo: ${escapeHtml(e.message)}</p>`;
  }
}

async function salvarFicha() {
  const f = editando;
  const erro = $("ed-erro");
  if (!f.name.trim()) {
    erro.textContent = "Dê um nome à ficha.";
    return;
  }
  if (f.exercises.some((e) => !String(e.exerciseName).trim())) {
    erro.textContent = "Todo exercício precisa de um nome (ou remova a linha vazia).";
    return;
  }
  const numero = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const dados = {
    name: f.name.trim(),
    type: (f.type || "").trim(),
    description: f.description || "",
    createdAt: f.createdAt || new Date().toISOString().slice(0, 10),
    exercises: f.exercises.map((e) => ({
      id: e.id || crypto.randomUUID(),
      exerciseName: String(e.exerciseName).trim(),
      primaryMuscleGroup: e.primaryMuscleGroup || "",
      secondaryMuscleGroup: e.secondaryMuscleGroup ?? null,
      recoveryMinHours: e.recoveryMinHours ?? null,
      recoveryTotalHours: e.recoveryTotalHours ?? null,
      recoveryMinHoursLight: e.recoveryMinHoursLight ?? null,
      recoveryTotalHoursLight: e.recoveryTotalHoursLight ?? null,
      sourceType: e.sourceType || "custom",
      sourceId: e.sourceId ?? null,
      sets: Math.max(1, Math.round(numero(e.sets) ?? 3)),
      reps: String(e.reps ?? "").trim() || "12",
      weightKg: numero(e.weightKg),
      notes: e.notes || "",
    })),
    updatedAt: Date.now(),
    updatedBy: "web",
  };
  $("ed-salvar").disabled = true;
  try {
    await setDoc(doc(db, "users", uid, "workouts", f.id), dados);
    editando = null;
    render();
  } catch (e) {
    erro.textContent = "Não consegui salvar: " + e.message;
    $("ed-salvar").disabled = false;
  }
}

// ─── Histórico ───────────────────────────────────────────────────────────────

function renderHistorico(main) {
  if (!carregado.sessoes) {
    main.innerHTML = aviso("Carregando…");
    return;
  }
  if (!sessoes.length) {
    main.innerHTML = aviso("Nenhum treino concluído sincronizado ainda. As sessões aparecem aqui depois que você encerra um treino no app com internet.");
    return;
  }
  const nomes = [...new Map(sessoes.map((s) => [s.workoutId, s.workoutName || "(ficha removida)"])).entries()];
  const lista = filtroFicha ? sessoes.filter((s) => s.workoutId === filtroFicha) : sessoes;
  main.innerHTML = `
    <div class="linha-acoes" style="margin-bottom:12px">
      <label for="filtro-ficha" class="muted">Ficha</label>
      <select id="filtro-ficha">
        <option value="">Todas (${sessoes.length})</option>
        ${nomes.map(([id, nome]) => `<option value="${escapeHtml(id)}" ${id === filtroFicha ? "selected" : ""}>${escapeHtml(nome)}</option>`).join("")}
      </select>
    </div>
    ${lista.map(cartaoSessao).join("")}`;
  $("filtro-ficha").onchange = (e) => {
    filtroFicha = e.target.value;
    render();
  };
}

function cartaoSessao(s) {
  const exs = s.exercises || [];
  const series = exs.flatMap((e) => (e.sets || []).filter((x) => x.completed));
  const volume = series.reduce((t, x) => t + reps(x.repsDone) * (x.weightUsed || 0), 0);
  const info = [dataHora(s.startedAt), duracao(s), s.intensity, s.perceivedEffort != null ? `esforço ${s.perceivedEffort}/10` : ""];
  return `
    <div class="card">
      <h3>${escapeHtml(s.workoutName || "(ficha removida)")}</h3>
      <div class="muted">${info.filter(Boolean).map(escapeHtml).join(" · ")}</div>
      <details>
        <summary class="muted">${exs.length} exercício(s) · ${series.length} série(s) · volume ${kg(volume)}</summary>
        <div class="tabela"><table>
          <thead><tr><th>Exercício</th><th>Séries feitas</th><th>Próxima carga</th></tr></thead>
          <tbody>
            ${exs.map((e) => `
              <tr>
                <td>${escapeHtml(e.exerciseName || "(exercício removido)")}</td>
                <td>${(e.sets || []).filter((x) => x.completed).map((x) =>
                  `${escapeHtml(x.repsDone ?? "?")} × ${kg(x.weightUsed)}${x.rir != null ? ` <span class="muted">RIR ${x.rir === 4 ? "4+" : x.rir}</span>` : ""}`
                ).join("<br>") || "—"}</td>
                <td>${escapeHtml(e.idealNextWeight || "")}</td>
              </tr>`).join("")}
          </tbody>
        </table></div>
      </details>
    </div>`;
}

// ─── Evolução ────────────────────────────────────────────────────────────────

function renderEvolucao(main) {
  if (!carregado.sessoes) {
    main.innerHTML = aviso("Carregando…");
    return;
  }
  if (!sessoes.length) {
    main.innerHTML = aviso("A evolução aparece quando houver treinos concluídos sincronizados pelo app.");
    return;
  }

  // Por exercício: em cada sessão, a maior carga e o volume (reps × kg).
  const porExercicio = new Map();
  for (const s of sessoes) {
    for (const e of s.exercises || []) {
      const feitas = (e.sets || []).filter((x) => x.completed && x.weightUsed != null);
      if (!feitas.length || !e.exerciseName) continue;
      const melhor = feitas.reduce((a, b) => (b.weightUsed > a.weightUsed || (b.weightUsed === a.weightUsed && reps(b.repsDone) > reps(a.repsDone)) ? b : a));
      const ponto = {
        quando: s.startedAt,
        carga: melhor.weightUsed,
        reps: reps(melhor.repsDone),
        volume: feitas.reduce((t, x) => t + reps(x.repsDone) * x.weightUsed, 0),
      };
      if (!porExercicio.has(e.exerciseName)) porExercicio.set(e.exerciseName, []);
      porExercicio.get(e.exerciseName).push(ponto);
    }
  }
  const nomes = [...porExercicio.keys()].sort((a, b) => porExercicio.get(b).length - porExercicio.get(a).length || a.localeCompare(b));
  if (!exercicioEvolucao || !porExercicio.has(exercicioEvolucao)) exercicioEvolucao = nomes[0] || null;
  const pontos = exercicioEvolucao ? porExercicio.get(exercicioEvolucao).slice().sort((a, b) => a.quando - b.quando) : [];

  main.innerHTML = `
    <div class="card">
      <h3>Carga por exercício</h3>
      ${nomes.length ? `
      <div class="linha-acoes" style="margin:8px 0">
        <select id="ev-exercicio">
          ${nomes.map((n) => `<option ${n === exercicioEvolucao ? "selected" : ""}>${escapeHtml(n)}</option>`).join("")}
        </select>
      </div>
      ${graficoLinha(pontos.map((p) => ({ x: p.quando, y: p.carga })), (v) => `${v.toLocaleString("pt-BR")} kg`)}
      <details>
        <summary class="muted">${pontos.length} sessão(ões) com carga registrada</summary>
        <div class="tabela"><table>
          <thead><tr><th>Data</th><th>Maior carga</th><th>Reps nessa carga</th><th>Volume</th></tr></thead>
          <tbody>${pontos.slice().reverse().map((p) => `
            <tr><td>${data(p.quando)}</td><td>${kg(p.carga)}</td><td>${p.reps}</td><td>${kg(p.volume)}</td></tr>`).join("")}
          </tbody>
        </table></div>
      </details>` : aviso("Nenhuma série com carga registrada ainda.")}
    </div>
    <div class="card">
      <h3>Volume semanal</h3>
      <div class="muted">Soma de repetições × carga de todas as séries concluídas, nas últimas 12 semanas.</div>
      ${graficoBarras(volumeSemanal())}
    </div>
    <div class="card">
      <h3>Séries por grupo muscular — últimos 7 dias</h3>
      ${seriesPorGrupo()}
    </div>`;

  $("ev-exercicio")?.addEventListener("change", (e) => {
    exercicioEvolucao = e.target.value;
    render();
  });
}

function inicioDaSemana(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

function volumeSemanal() {
  const semanas = [];
  const atual = inicioDaSemana(Date.now());
  for (let i = 11; i >= 0; i--) {
    const d = new Date(atual);
    d.setDate(d.getDate() - 7 * i);
    semanas.push({ x: d.getTime(), y: 0 });
  }
  const indice = new Map(semanas.map((s, i) => [s.x, i]));
  for (const s of sessoes) {
    const i = indice.get(inicioDaSemana(s.startedAt));
    if (i == null) continue;
    for (const e of s.exercises || []) {
      for (const x of e.sets || []) {
        if (x.completed && x.weightUsed != null) semanas[i].y += reps(x.repsDone) * x.weightUsed;
      }
    }
  }
  return semanas;
}

function seriesPorGrupo() {
  const desde = Date.now() - 7 * 24 * 3600 * 1000;
  const contagem = new Map();
  for (const s of sessoes) {
    if (s.startedAt < desde) continue;
    for (const e of s.exercises || []) {
      const n = (e.sets || []).filter((x) => x.completed).length;
      if (!n) continue;
      const g = grupo(e.primaryMuscleGroup);
      contagem.set(g, (contagem.get(g) || 0) + n);
    }
  }
  if (!contagem.size) return aviso("Nenhuma série concluída nos últimos 7 dias.");
  const max = Math.max(...contagem.values());
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `
    <div class="barra-h">
      <span>${escapeHtml(g)}</span>
      <div class="trilho"><span style="width:${(n / max) * 100}%"></span></div>
      <span>${n}</span>
    </div>`).join("");
}

// ─── Gráficos (SVG simples, sem biblioteca) ──────────────────────────────────

const L = 600, A = 220, M = { esq: 52, dir: 12, topo: 12, base: 28 };

function escala(min, max, a, b) {
  if (max === min) return () => (a + b) / 2;
  return (v) => a + ((v - min) / (max - min)) * (b - a);
}

function graficoLinha(pontos, formatar) {
  if (pontos.length < 2) {
    return pontos.length ? aviso(`Uma sessão só: ${formatar(pontos[0].y)} em ${data(pontos[0].x)}.`) : "";
  }
  const ys = pontos.map((p) => p.y);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const folga = (yMax - yMin) * 0.1 || 1;
  const fy = escala(yMin - folga, yMax + folga, A - M.base, M.topo);
  const fx = escala(pontos[0].x, pontos[pontos.length - 1].x, M.esq, L - M.dir);
  const caminho = pontos.map((p, i) => `${i ? "L" : "M"}${fx(p.x).toFixed(1)},${fy(p.y).toFixed(1)}`).join(" ");
  const marcas = [yMin, (yMin + yMax) / 2, yMax];
  return `
    <svg class="grafico" viewBox="0 0 ${L} ${A}" role="img" aria-label="Evolução da carga">
      ${marcas.map((v) => `
        <line class="eixo" x1="${M.esq}" x2="${L - M.dir}" y1="${fy(v)}" y2="${fy(v)}" />
        <text x="${M.esq - 6}" y="${fy(v) + 4}" text-anchor="end">${escapeHtml(formatar(Math.round(v * 10) / 10))}</text>`).join("")}
      <text x="${M.esq}" y="${A - 8}">${data(pontos[0].x)}</text>
      <text x="${L - M.dir}" y="${A - 8}" text-anchor="end">${data(pontos[pontos.length - 1].x)}</text>
      <path class="linha" d="${caminho}" />
      ${pontos.map((p) => `<circle class="ponto" cx="${fx(p.x)}" cy="${fy(p.y)}" r="3.5"><title>${data(p.x)}: ${escapeHtml(formatar(p.y))}</title></circle>`).join("")}
    </svg>`;
}

function graficoBarras(barras) {
  const max = Math.max(...barras.map((b) => b.y));
  if (!max) return aviso("Sem volume registrado nas últimas 12 semanas.");
  const largura = (L - M.esq - M.dir) / barras.length;
  const fy = escala(0, max, A - M.base, M.topo);
  return `
    <svg class="grafico" viewBox="0 0 ${L} ${A}" role="img" aria-label="Volume semanal">
      <line class="eixo" x1="${M.esq}" x2="${L - M.dir}" y1="${fy(0)}" y2="${fy(0)}" />
      <text x="${M.esq - 6}" y="${fy(max) + 4}" text-anchor="end">${Math.round(max).toLocaleString("pt-BR")}</text>
      <text x="${M.esq - 6}" y="${fy(0) + 4}" text-anchor="end">0</text>
      ${barras.map((b, i) => {
        const x = M.esq + i * largura + largura * 0.15;
        const y = fy(b.y);
        return `<rect class="barra" x="${x}" y="${y}" width="${largura * 0.7}" height="${fy(0) - y}" rx="3">
          <title>Semana de ${data(b.x)}: ${Math.round(b.y).toLocaleString("pt-BR")} kg</title></rect>
          ${i % 3 === 0 ? `<text x="${x}" y="${A - 8}">${new Date(b.x).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</text>` : ""}`;
      }).join("")}
    </svg>`;
}
