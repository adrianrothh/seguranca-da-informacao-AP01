const USERS = [
  {
    id: 1,
    name: "Ana Souza",
    email: "aluno@faculdade.local",
    passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
    role: "ALUNO",
    studentId: "202400001"
  },
  {
    id: 2,
    name: "Prof. Carlos Lima",
    email: "professor@faculdade.local",
    passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
    role: "PROFESSOR",
    classes: ["5A", "5B"]
  },
  {
    id: 3,
    name: "Administrador Geral",
    email: "admin@faculdade.local",
    passwordHash: "fc15232916c5f9cd96e2cfe3b3e2b45ee10a889e1b0d36b95f5797f92dd8c93c",
    role: "ADMIN"
  }
];

const STORAGE_KEYS = {
  session: "ocorrencias_sessao",
  occurrences: "ocorrencias_registros",
  audit: "ocorrencias_logs"
};

const INITIAL_OCCURRENCES = [
  {
    id: "OC-1001",
    studentName: "Marina Alves",
    studentId: "202300145",
    studentCpf: "123.456.789-10",
    studentEmail: "marina.alves@email.local",
    studentPhone: "(47) 99999-1010",
    category: "Nota",
    priority: "Média",
    description: "Solicitação de revisão de nota da avaliação bimestral.",
    internalNote: "Verificar com a coordenação antes de responder.",
    status: "Aberta",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-05T18:40:00.000Z"
  },
  {
    id: "OC-1002",
    studentName: "Rafael Martins",
    studentId: "202200771",
    studentCpf: "987.654.321-00",
    studentEmail: "rafael.martins@email.local",
    studentPhone: "(47) 98888-2020",
    category: "Frequência",
    priority: "Alta",
    description: "Aluno contesta lançamento de falta em aula prática.",
    internalNote: "Conferir chamada manual.",
    status: "Em análise",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-05T18:50:00.000Z"
  },
  {
    id: "OC-1003",
    studentName: "Beatriz Costa",
    studentId: "202100441",
    studentCpf: "111.222.333-44",
    studentEmail: "beatriz.costa@email.local",
    studentPhone: "(47) 97777-3030",
    category: "Solicitação administrativa",
    priority: "Crítica",
    description: "Solicitação envolvendo documentação acadêmica e prazo de matrícula.",
    internalNote: "Priorizar atendimento.",
    status: "Aberta",
    createdBy: "admin@faculdade.local",
    createdAt: "2026-05-05T19:00:00.000Z"
  }
];

const loginView        = document.querySelector("#loginView");
const appView          = document.querySelector("#appView");
const loginForm        = document.querySelector("#loginForm");
const occurrenceForm   = document.querySelector("#occurrenceForm");
const logoutBtn        = document.querySelector("#logoutBtn");
const exportBtn        = document.querySelector("#exportBtn");
const searchInput      = document.querySelector("#search");

const sessionBadge       = document.querySelector("#sessionBadge");
const currentUserName    = document.querySelector("#currentUserName");
const currentUserDetails = document.querySelector("#currentUserDetails");
const occurrencesTable   = document.querySelector("#occurrencesTable");
const auditLog           = document.querySelector("#auditLog");
const totalOccurrences   = document.querySelector("#totalOccurrences");
const criticalOccurrences= document.querySelector("#criticalOccurrences");
const lastUpdate         = document.querySelector("#lastUpdate");


async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function getOccurrences() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.occurrences) || "[]");
}

function saveOccurrences(occurrences) {
  localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(occurrences));
}

function getAuditLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || "[]");
}

function saveAuditLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(logs));
}

function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
}

function saveSession(user) {
  
  const { passwordHash, ...safeUser } = user;
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(safeUser));
}

function writeLog(action, detail) {
  const session = getSession();
  const logs = getAuditLogs();

  logs.unshift({
    when: new Date().toISOString(),
    user: session ? session.email : "anonimo",
    role: session ? session.role : "SEM_SESSAO",
    action,
    detail
  });

  saveAuditLogs(logs);
}

function boot() {
  if (!localStorage.getItem(STORAGE_KEYS.occurrences)) {
    localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(INITIAL_OCCURRENCES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.audit)) {
    localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify([
      {
        when: new Date().toISOString(),
        user: "sistema",
        action: "BASE_INICIAL_CRIADA",
        detail: "Dados fictícios carregados no localStorage."
      }
    ]));
  }

  const session = getSession();
  if (session) {
    showApp(session);
  } else {
    showLogin();
  }
}


function showLogin() {
  loginView.classList.remove("hidden");
  appView.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  sessionBadge.textContent = "Sessão não iniciada";
  sessionBadge.classList.add("muted");
}

function showApp(user) {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  sessionBadge.textContent = `${user.name} — ${user.role}`;
  sessionBadge.classList.remove("muted");

  currentUserName.textContent = user.name;
  currentUserDetails.textContent = `${user.email} | Perfil: ${user.role}`;

  applyRoleVisibility(user.role);

  render();
}

function applyRoleVisibility(role) {
  const logSection = document.querySelector("#logSection");
  if (logSection) {
    logSection.classList.toggle("hidden", role !== "ADMIN");
  }

  if (exportBtn) {
    exportBtn.classList.toggle("hidden", role !== "ADMIN");
  }

  const occurrenceFormSection = document.querySelector("#occurrenceFormSection");
  if (occurrenceFormSection) {
    occurrenceFormSection.classList.toggle("hidden", role === "ALUNO");
  }

  const internalNoteSection = document.querySelector("#internalNoteSection");
  if (internalNoteSection) {
    internalNoteSection.classList.toggle("hidden", role === "ALUNO");
  }
}

async function login(email, password) {
  const hash = await hashPassword(password);
  const user = USERS.find(item => item.email === email && item.passwordHash === hash);

  if (!user) {
    alert("Usuário ou senha inválidos.");
    writeLog("LOGIN_FALHOU", `Tentativa para ${email}`);
    return;
  }

  saveSession(user);
  writeLog("LOGIN_OK", `Usuário ${user.email} entrou no sistema.`);
  showApp(getSession());
}

function logout() {
  const session = getSession();
  writeLog("LOGOUT", session ? `${session.email} saiu do sistema.` : "Sessão encerrada.");
  localStorage.removeItem(STORAGE_KEYS.session);
  showLogin();
}

function validateOccurrenceForm(data) {
  const errors = [];

  if (!data.studentName || data.studentName.trim().length < 3) {
    errors.push("Nome do aluno deve ter ao menos 3 caracteres.");
  }

  if (!/^\d{6,12}$/.test(data.studentId)) {
    errors.push("Matrícula deve conter apenas números (6 a 12 dígitos).");
  }

  if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.studentCpf)) {
    errors.push("CPF deve estar no formato 000.000.000-00.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.studentEmail)) {
    errors.push("E-mail inválido.");
  }

  if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.studentPhone)) {
    errors.push("Telefone deve estar no formato (00) 00000-0000.");
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push("Descrição deve ter ao menos 10 caracteres.");
  }

  return errors;
}

function createOccurrence(event) {
  event.preventDefault();

  const session = getSession();

  if (!session || session.role === "ALUNO") {
    alert("Apenas professores e administradores podem registrar ocorrências.");
    return;
  }

  const data = {
    studentName:  document.querySelector("#studentName").value.trim(),
    studentId:    document.querySelector("#studentId").value.trim(),
    studentCpf:   document.querySelector("#studentCpf").value.trim(),
    studentEmail: document.querySelector("#studentEmail").value.trim(),
    studentPhone: document.querySelector("#studentPhone").value.trim(),
    category:     document.querySelector("#category").value,
    priority:     document.querySelector("#priority").value,
    description:  document.querySelector("#description").value.trim(),
    internalNote: document.querySelector("#internalNote").value.trim(),
    privacyAck:   document.querySelector("#privacyAck").checked
  };

  const errors = validateOccurrenceForm(data);
  if (errors.length > 0) {
    alert("Corrija os erros antes de salvar:\n\n" + errors.join("\n"));
    return;
  }

  if (!data.privacyAck) {
    alert("Confirme que pode registrar estes dados antes de salvar.");
    return;
  }

  const occurrence = {
    id: `OC-${Math.floor(Math.random() * 9000) + 1000}`,
    ...data,
    status: "Aberta",
    createdBy: session.email,
    createdAt: new Date().toISOString()
  };

  const occurrences = getOccurrences();
  occurrences.unshift(occurrence);
  saveOccurrences(occurrences);

  writeLog(
    "OCORRENCIA_CRIADA",
    `Criada ocorrência ${occurrence.id} para ${occurrence.studentName} / CPF informado pelo registrante.`
  );

  occurrenceForm.reset();
  render();
}

function deleteOccurrence(id) {
  const session = getSession();

  if (!session || session.role === "ALUNO") {
    alert("Você não tem permissão para excluir ocorrências.");
    return;
  }

  const occurrences = getOccurrences();
  const occurrence = occurrences.find(item => item.id === id);
  const updated = occurrences.filter(item => item.id !== id);

  saveOccurrences(updated);
  writeLog("OCORRENCIA_EXCLUIDA", `Ocorrência ${id} excluída por ${session.email}.`);
  render();
}

function changeStatus(id, status) {
  const session = getSession();

  if (!session || session.role === "ALUNO") {
    alert("Você não tem permissão para alterar o status de ocorrências.");
    return;
  }

  const occurrences = getOccurrences();
  const occurrence = occurrences.find(item => item.id === id);

  if (!occurrence) return;

  occurrence.status = status;
  occurrence.updatedAt = new Date().toISOString();

  saveOccurrences(occurrences);
  writeLog("STATUS_ALTERADO", `Ocorrência ${id} alterada para ${status} por ${session.email}.`);
  render();
}

function exportEverything() {
  const session = getSession();

  if (!session || session.role !== "ADMIN") {
    alert("Apenas administradores podem exportar dados.");
    return;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: { name: session.name, email: session.email, role: session.role },
    occurrences: getOccurrences()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "ocorrencias-export.json";
  anchor.click();

  URL.revokeObjectURL(url);
  writeLog("EXPORTACAO", "Administrador exportou os dados de ocorrências.");
}

function render() {
  const session = getSession();
  const role = session ? session.role : null;
  const term = searchInput.value.toLowerCase();
  let occurrences = getOccurrences();

  if (role === "ALUNO" && session.studentId) {
    occurrences = occurrences.filter(item => item.studentId === session.studentId);
  }

  const filtered = occurrences.filter(item => {
    const content = JSON.stringify(item).toLowerCase();
    return content.includes(term);
  });

  totalOccurrences.textContent = occurrences.length;
  criticalOccurrences.textContent = occurrences.filter(item => item.priority === "Crítica").length;
  lastUpdate.textContent = `Atualizado em ${new Date().toLocaleTimeString("pt-BR")}`;

  occurrencesTable.innerHTML = filtered.map(item => {
    const canAct = role === "ADMIN" || role === "PROFESSOR";
    const canSeeInternal = role === "ADMIN" || role === "PROFESSOR";

    return `
      <tr>
        <td>
          <strong>${escapeHtml(item.studentName)}</strong><br />
          <span class="muted-text">${escapeHtml(item.studentId)}</span>
        </td>
        <td>${escapeHtml(item.studentCpf)}</td>
        <td>
          ${escapeHtml(item.studentEmail)}<br />
          ${escapeHtml(item.studentPhone)}
        </td>
        <td>${escapeHtml(item.category)}</td>
        <td><span class="priority ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span></td>
        <td>${escapeHtml(item.status)}</td>
        <td>
          <strong>Descrição:</strong> ${escapeHtml(item.description)}<br />
          ${canSeeInternal ? `<strong>Obs. interna:</strong> ${escapeHtml(item.internalNote)}` : ""}
        </td>
        <td>
          ${canAct ? `
            <div class="row-actions">
              <button class="btn secondary" onclick="changeStatus('${escapeHtml(item.id)}', 'Em análise')">Em análise</button>
              <button class="btn secondary" onclick="changeStatus('${escapeHtml(item.id)}', 'Resolvida')">Resolver</button>
              <button class="btn danger" onclick="deleteOccurrence('${escapeHtml(item.id)}')">Excluir</button>
            </div>
          ` : '<span class="muted-text">—</span>'}
        </td>
      </tr>
    `;
  }).join("");

  const logSection = document.querySelector("#logSection");
  if (logSection) {
    logSection.classList.toggle("hidden", role !== "ADMIN");
  }

  if (role === "ADMIN") {
    const logs = getAuditLogs();
    if (logs.length === 0) {
      auditLog.innerHTML = `<div class="notice">Nenhum log registrado.</div>`;
    } else {
      auditLog.innerHTML = logs.map(log => `
        <div class="log-item">
          <strong>${escapeHtml(log.when)}</strong><br />
          usuário=${escapeHtml(log.user || "—")} | perfil=${escapeHtml(log.role || "—")} | ação=${escapeHtml(log.action)}<br />
          detalhe=${escapeHtml(log.detail)}
        </div>
      `).join("");
    }
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  login(
    document.querySelector("#email").value,
    document.querySelector("#password").value
  );
});

occurrenceForm.addEventListener("submit", createOccurrence);
logoutBtn.addEventListener("click", logout);

if (exportBtn) {
  exportBtn.addEventListener("click", exportEverything);
}

searchInput.addEventListener("input", render);

window.deleteOccurrence = deleteOccurrence;
window.changeStatus = changeStatus;

boot();