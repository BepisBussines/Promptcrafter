/* PromptCrafter — comportamiento de la app */
"use strict";

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const storeKey = "promptcrafter.v1.history";

const state = {
  template: "chat",
  language: "es",
  role: "", task: "", context: "", data: "",
  format:"", constraints:"", tone:"", length:"",
  audience:"", examples:"", tools:"", keywords:"",
  expertMode:false,
};

function readForm(){
  state.template = $("#template").value;
  state.language = $("#language").value;
  state.role = $("#role").value.trim();
  state.task = $("#task").value.trim();
  state.context = $("#context").value.trim();
  state.data = $("#data").value.trim();
  state.format = $("#format").value.trim();
  state.constraints = $("#constraints").value.trim();
  state.tone = $("#tone").value.trim();
  state.length = $("#length").value.trim();
  state.audience = $("#audience").value.trim();
  state.examples = $("#examples").value;
  state.tools = $("#tools").value.trim();
  state.keywords = $("#keywords").value.trim();
  state.expertMode = $("#expertMode").checked;
}

function qualityScore(){
  // Heurística sencilla: suma pesos por campos rellenados y diversidad
  const filled = ["task","context","format","constraints","tone","length","audience"]
    .map(k => state[k] && state[k].length > 2 ? 1 : 0)
    .reduce((a,b)=>a+b,0);
  const extras = ["role","data","examples","tools","keywords"].map(k => state[k] ? 1 : 0).reduce((a,b)=>a+b,0);
  let score = (filled*10) + (extras*5);
  if(state.expertMode) score += 10;
  if((state.task||"").length > 30) score += 5;
  return Math.max(0, Math.min(100, score));
}

function renderQuality(){
  const q = qualityScore();
  $("#quality").value = q;
  $("#qualityText").textContent = q + "%";
  const tips = [];
  if(!state.task) tips.push("Define una tarea principal concreta.");
  if(!state.context) tips.push("Añade contexto: objetivo, para quién, dónde se usa.");
  if(!state.format) tips.push("Indica el formato exacto de salida.");
  if(!state.constraints) tips.push("Agrega 2–3 restricciones o criterios de éxito.");
  if(!state.tone) tips.push("Indica tono/estilo (p. ej. profesional, cercano…).");
  if(!state.length) tips.push("Acota la longitud (p. ej. 120–160 palabras).");
  if(!state.audience) tips.push("Especifica el público objetivo.");
  const el = $("#suggestions");
  el.innerHTML = "";
  tips.forEach(t => {
    const div = document.createElement("div");
    div.className = "tip";
    div.textContent = "Sugerencia: " + t;
    el.appendChild(div);
  });
}

function generate(){
  readForm();
  const prompt = buildPrompt(state);
  $("#output").value = prompt;
  renderQuality();
}

function copy(text){
  if(!navigator.clipboard){
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand("copy"); ta.remove();
    return;
  }
  navigator.clipboard.writeText(text);
}

function titleFromState(s){
  const t = (s.task || "Prompt").slice(0, 60);
  const tag = s.template;
  return `[${tag}] ${t}`;
}

function loadHistory(){
  try{
    const arr = JSON.parse(localStorage.getItem(storeKey) || "[]");
    return Array.isArray(arr) ? arr : [];
  }catch{ return []; }
}

function saveHistory(arr){
  localStorage.setItem(storeKey, JSON.stringify(arr));
}

function onSave(){
  readForm();
  const prompt = $("#output").value.trim();
  if(!prompt) return;
  const item = {
    title: titleFromState(state),
    prompt,
    state: {...state},
    createdAt: Date.now(),
  };
  const history = loadHistory();
  history.unshift(item);
  saveHistory(history);
  renderHistory();
}

function renderHistory(){
  const history = loadHistory();
  const cont = $("#history");
  cont.innerHTML = "";
  const tpl = document.getElementById("tplHistoryItem");
  history.forEach((item, idx)=>{
    const node = tpl.content.cloneNode(true);
    node.querySelector(".title").textContent = item.title;
    node.querySelector("pre.body").textContent = item.prompt;
    const btnCopy = node.querySelector("button.copy");
    const btnLoad = node.querySelector("button.load");
    const btnDelete = node.querySelector("button.delete");
    btnCopy.addEventListener("click", ()=> copy(item.prompt));
    btnLoad.addEventListener("click", ()=>{
      Object.assign(state, item.state);
      // Rellena el formulario
      $("#template").value = state.template;
      $("#language").value = state.language;
      $("#role").value = state.role;
      $("#task").value = state.task;
      $("#context").value = state.context;
      $("#data").value = state.data;
      $("#format").value = state.format;
      $("#constraints").value = state.constraints;
      $("#tone").value = state.tone;
      $("#length").value = state.length;
      $("#audience").value = state.audience;
      $("#examples").value = state.examples;
      $("#tools").value = state.tools;
      $("#keywords").value = state.keywords;
      $("#expertMode").checked = !!state.expertMode;
      $("#output").value = item.prompt;
      renderQuality();
      window.scrollTo({top:0, behavior:"smooth"});
    });
    btnDelete.addEventListener("click", ()=>{
      const h = loadHistory();
      h.splice(idx,1);
      saveHistory(h);
      renderHistory();
    });
    cont.appendChild(node);
  });
}

function onPreset(name){
  const presets = {
    copy: {
      template:"marketing", tone:"cercano, en 2ª persona", format:"post IG con gancho + CTA + 10 hashtags",
      length:"100–130 palabras", audience:"clientes locales", task:"Promocionar servicio de limpieza de coches a domicilio",
      context:"Destacar que es ecológico, sin agua, y sin mover el coche.", keywords:"El Prat de Llobregat, detailing, eco",
      constraints:"sin mayúsculas excesivas; sin promesas de resultados imposibles", data:"WhatsApp: +34 676 770 286"
    },
    research: {
      template:"research", tone:"riguroso pero claro", format:"resumen con bullets + tabla de fuentes",
      length:"200–300 palabras", audience:"público general", task:"Estado actual de las citas previas en SEPE/DNI/DGT",
      context:"Explicar problemas y soluciones prácticas", constraints:"fechas exactas; evita rumores", keywords:"España, trámites"
    },
    code: {
      template:"code", tone:"limpio y comentado", format:"bloques de código + explicación breve",
      length:"conciso", audience:"dev junior", task:"Crear función JS para validar formularios en web",
      context:"Campos: nombre, email, mensaje", constraints:"sin librerías", keywords:"JavaScript, Regex"
    },
    image: {
      template:"image", tone:"estilo editorial, iluminación suave", format:"encuadre vertical 4:5, composición centrada",
      length:"—", audience:"paleta cálida con acentos teal", task:"Coche recién detallado bajo luz de atardecer",
      context:"Primer plano de gotas tipo 'beading' en capó", constraints:"evitar texto; sin marcas",
      keywords:"85mm, bokeh suave, alta nitidez", data:"Suelo húmedo reflejando luces urbanas"
    },
    seo: {
      template:"chat", tone:"didáctico", format:"brief con tabla de keywords (KW, intención, volumen aprox., dificultad)",
      length:"lista priorizada", audience:"negocio local", task:"Plan SEO para peluquería en El Prat",
      context:"Servicios: corte, color, peinados boda", constraints:"enfocado a intención local", keywords:"map pack, reseñas"
    }
  };
  const p = presets[name];
  if(!p) return;
  Object.keys(p).forEach(k=>{
    const el = $("#"+k);
    if(el){
      if(el.type === "checkbox") el.checked = !!p[k];
      else el.value = p[k];
    }
  });
  readForm(); renderQuality();
}

function clearForm(){
  $$("#template, #language, #role, #task, #context, #data, #format, #constraints, #tone, #length, #audience, #examples, #tools, #keywords")
    .forEach(el => el.value = "");
  $("#template").value = "chat";
  $("#language").value = "es";
  $("#expertMode").checked = false;
  $("#output").value = "";
  renderQuality();
}

function exportHistory(){
  const data = {
    type: "promptcrafter-export",
    version: 1,
    history: loadHistory()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = $("#btnExport");
  a.download = "promptcrafter-history.json";
  a.href = url;
}

function importHistory(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(data && data.history && Array.isArray(data.history)){
        const current = loadHistory();
        saveHistory([ ...data.history, ...current ]);
        renderHistory();
        alert("Historial importado.");
      }else{
        alert("Archivo no válido.");
      }
    }catch(e){
      alert("Error al leer el archivo.");
    }
  };
  reader.readAsText(file);
}

function shareLink(){
  readForm();
  const params = new URLSearchParams();
  Object.entries(state).forEach(([k,v])=>{
    if(!v) return;
    params.set(k, v);
  });
  const url = location.origin + location.pathname + "?" + params.toString();
  if(navigator.share){
    navigator.share({ title:"PromptCrafter", text:"Mi configuración de Prompt", url });
  }else{
    copy(url);
    alert("Enlace copiado al portapapeles.");
  }
}

function loadFromURL(){
  const params = new URLSearchParams(location.search);
  if(!params.size) return;
  for(const [k,v] of params){
    if($("#"+k)){
      if($("#"+k).type === "checkbox") $("#"+k).checked = v === "true";
      else $("#"+k).value = v;
    }
  }
  readForm(); renderQuality();
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  $("#btnInstall").style.display = "inline-flex";
});
$("#btnInstall").addEventListener("click", async ()=>{
  if(deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
});

// Eventos
$("#btnGenerate").addEventListener("click", generate);
$("#btnCopy").addEventListener("click", ()=> copy($("#output").value));
$("#btnSave").addEventListener("click", onSave);
$("#btnClear").addEventListener("click", clearForm);
$("#btnShare").addEventListener("click", shareLink);
$("#btnExport").addEventListener("click", exportHistory);
$("#fileImport").addEventListener("change", e=>{
  if(e.target.files && e.target.files[0]) importHistory(e.target.files[0]);
});
$$(".chip").forEach(b => b.addEventListener("click", ()=> onPreset(b.dataset.preset)));

// Render inicial
renderHistory();
renderQuality();
loadFromURL();
