// main.js (robusto, detecta claves reales del JSON)
const API_DATOS = "https://raw.githubusercontent.com/CesarMCuellarCha/apis/main/SENA-CTPI.matriculados.json";

// DOM
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const userNameSpan = document.getElementById("userName");
const fichaSelect = document.getElementById("fichaSelect");
const aprendicesTable = document.getElementById("aprendicesTable");

let datos = [];
let usuarioActivo = null;

// --- util: buscar la clave que contiene una palabra (insensible a mayúsc/minús)
function findKey(obj, part) {
  if (!obj) return null;
  const keys = Object.keys(obj);
  const lower = key => key.toLowerCase();
  const found = keys.find(k => lower(k).includes(part.toLowerCase()));
  return found || null;
}

// --- cargar datos
async function cargarDatos() {
  try {
    const r = await fetch(API_DATOS);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    datos = await r.json();
    if (!Array.isArray(datos) || datos.length === 0) {
      console.warn("JSON cargado pero vacío o no es array", datos);
      return;
    }
    console.log("✅ Datos cargados:", datos.length, "registros");
    console.log("Ejemplo de registro:", datos[0]);
  } catch (err) {
    console.error("❌ Error cargando API:", err);
    alert("No se pudo cargar la información. Revisa la consola.");
  }
}

// --- login (puedes reemplazar la validación por buscar en 'datos' si prefieres)
function login(email, password) {
  // validación simple solicitada: correo y clave de ejemplo
  if (email === "melvacb23@gmail.com" && password === "1234") {
    usuarioActivo = { email };
    sessionStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
    return true;
  }
  return false;
}

// --- mostrar/ocultar
function mostrarLogin() {
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}
function mostrarApp() {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  userNameSpan.textContent = usuarioActivo.email;
  poblarFichasDetectandoClaves();
}

// --- poblar fichas (detectando la clave real)
function poblarFichasDetectandoClaves() {
  if (!datos || datos.length === 0) {
    console.warn("No hay datos para poblar fichas");
    fichaSelect.innerHTML = `<option value="">Seleccione...</option>`;
    return;
  }

  // detectar la clave que corresponde a ficha (p. ej. 'Ficha' o 'ficha')
  const sample = datos[0];
  const fichaKey = findKey(sample, "ficha");
  const docKey   = findKey(sample, "document");
  const nombreKey= findKey(sample, "nombre") || findKey(sample, "nombreaprendiz") || findKey(sample, "aprendiz");
  const programaKey = findKey(sample, "program");
  const nivelKey = findKey(sample, "nivel");
  const estadoKey = findKey(sample, "estado");

  console.log("🔎 Claves detectadas:", { fichaKey, docKey, nombreKey, programaKey, nivelKey, estadoKey });

  // generar conjunto de fichas (limpiando valores nulos/vacíos)
  const rawFichas = datos.map(d => {
    const v = fichaKey ? (d[fichaKey]) : (d.ficha || d.Ficha || "");
    return (v === null || v === undefined) ? "" : String(v).trim();
  });
  const fichasUnicasArr = [...new Set(rawFichas.filter(Boolean))].sort();

  // poblar select
  fichaSelect.innerHTML = `<option value="">Seleccione...</option>`;
  fichasUnicasArr.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    fichaSelect.appendChild(opt);
  });

  // guardar las claves detectadas para usar en la tabla
  fichaSelect.dataset.keys = JSON.stringify({ fichaKey, docKey, nombreKey, programaKey, nivelKey, estadoKey });
}

// --- mostrar aprendices usando las claves detectadas
function mostrarAprendicesConClaves(ficha) {
  aprendicesTable.innerHTML = "";
  if (!ficha) return;

  // recuperar claves detectadas
  const keysJson = fichaSelect.dataset.keys;
  const keys = keysJson ? JSON.parse(keysJson) : {};
  const { fichaKey, docKey, nombreKey, programaKey, nivelKey, estadoKey } = keys;

  // filtrar por ficha (tenemos que comparar como string)
  const filtrados = datos.filter(d => {
    const val = fichaKey ? d[fichaKey] : (d.Ficha || d.ficha || "");
    return String(val).trim() === String(ficha).trim();
  });

  if (filtrados.length === 0) {
    aprendicesTable.innerHTML = `<tr><td colspan="5">No hay aprendices para la ficha seleccionada.</td></tr>`;
    return;
  }

  filtrados.forEach(a => {
    const doc   = docKey ? (a[docKey] ?? a.Documento ?? a.documento ?? "") : (a.Documento ?? a.documento ?? "");
    const nom   = nombreKey ? (a[nombreKey] ?? "") : (a.Nombre ?? a.nombre ?? "");
    const prog  = programaKey ? (a[programaKey] ?? "") : (a.Programa ?? a.programa ?? "");
    const niv   = nivelKey ? (a[nivelKey] ?? "") : (a.Nivel ?? a.nivel ?? "");
    const est   = estadoKey ? (a[estadoKey] ?? "") : (a.Estado ?? a.estado ?? "");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${doc}</td>
      <td>${nom}</td>
      <td>${prog}</td>
      <td>${niv}</td>
      <td>${est}</td>
    `;
    aprendicesTable.appendChild(tr);
  });
}

// --- eventos
btnLogin.addEventListener("click", (ev) => {
  ev.preventDefault();
  const email = emailInput.value.trim();
  const pass  = passInput.value.trim();

  if (login(email, pass)) {
    mostrarApp();
  } else {
    alert("Usuario o contraseña incorrectos (usa melvacb23@gmail.com / 1234)");
    console.log("Intento login:", email, pass);
  }
});

btnLogout.addEventListener("click", () => {
  usuarioActivo = null;
  sessionStorage.removeItem("usuarioActivo");
  mostrarLogin();
});

fichaSelect.addEventListener("change", (e) => {
  mostrarAprendicesConClaves(e.target.value);
});

// --- inicio
document.addEventListener("DOMContentLoaded", async () => {
  await cargarDatos();
  // si hay sesión guardada
  const guardado = sessionStorage.getItem("usuarioActivo");
  if (guardado) {
    usuarioActivo = JSON.parse(guardado);
    mostrarApp();
  } else {
    mostrarLogin();
  }
});