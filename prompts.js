/* PromptCrafter — lógica para construir prompts */
"use strict";

function lines(str){ return (str || "").split(/\r?\n/).map(s=>s.trim()).filter(Boolean); }

/** Construye un prompt para chat/texto con marco ASPECTS + loop de calidad */
function buildChatPrompt(s){
  const ex = lines(s.examples).map((e,i)=>`Ejemplo ${i+1}: ${e}`).join("\n");
  const expert = s.expertMode ? `
Reglas de calidad y diálogo:
- Si falta información para ser preciso, formula preguntas numeradas y espera respuesta antes de continuar.
- Al final, incluye una sección "Checklist" verificando requisitos, formato y restricciones.
- Si detectas ambigüedad o conflicto, explica la suposición adoptada y ofrece alternativas breves.
- No inventes datos; si no hay fuentes, dilo y propone cómo conseguirlas.
` : "";

  return `Tu papel: ${s.role || "Experto/a en el tema solicitado"}.

Objetivo principal:
${s.task}

Contexto y meta:
${s.context}

Datos disponibles:
${s.data || "—"}

Público objetivo: ${s.audience || "general"}
Tono/estilo: ${s.tone || "claro y directo"}
Longitud/Profundidad: ${s.length || "ajustado a lo esencial"}
Formato de salida: ${s.format || "texto estructurado con subtítulos y bullets"}
Palabras clave: ${s.keywords || "—"}
Restricciones/criterios: ${s.constraints || "—"}
Herramientas/recursos: ${s.tools || "—"}
Idioma: ${s.language === "en" ? "English" : "Español"}

${ex ? "Ejemplos:\n" + ex + "\n" : ""}
Proceso sugerido:
1) Comprende el objetivo y el contexto.
2) Esboza la estructura de salida.
3) Redacta la respuesta cumpliendo formato/tono/longitud.
4) Revisa con la checklist de criterios y mejora lo necesario.

${expert}`.trim();
}

/** Construye un prompt de investigación/resumen con citas y pasos */
function buildResearchPrompt(s){
  const expert = s.expertMode ? "- Antes de sintetizar, valida fechas y define fiabilidad de cada fuente.\n- Señala brechas/limitaciones y su impacto en la conclusión.\n" : "";
  return `Actúa como analista de investigación.
Tarea: ${s.task}
Contexto: ${s.context}
Alcance: ${s.length || "breve pero riguroso"}
Formato: ${s.format || "Resumen con bullets + tabla de fuentes (título, fecha, enlace, fiabilidad 1–5)"}
Criterios: ${s.constraints || "Fechas claras; evita afirmaciones no verificadas."}
Idioma: ${s.language === "en" ? "English" : "Español"}

Datos disponibles:
${s.data || "—"}

Procedimiento:
- Identifica preguntas clave y términos.
- Sintetiza puntos principales en secciones temáticas.
- Añade recomendaciones/implicaciones prácticas.
${expert}
Checklist final: claridad, citas, sesgos detectados, acciones prácticas.`;
}

/** Construye un prompt para generación/refactor de código */
function buildCodePrompt(s){
  return `Actúa como desarrollador/a senior.
Tarea: ${s.task}
Lenguaje/stack preferido: ${s.keywords || "especifica si es necesario"}
Contexto/arquitectura: ${s.context || "—"}
Código o contrato de interfaces disponible:
${s.data || "—"}

Requisitos y restricciones: ${s.constraints || "pruebas, legibilidad, manejo de errores"}
Formato de salida: ${s.format || "bloques de código autocontenidos + explicación breve"}
Estilo/guías: ${s.tone || "limpio, idiomático, con comentarios donde aporte valor"}
Longitud: ${s.length || "lo necesario"}
Idioma: ${s.language === "en" ? "English" : "Español"}

Si falta información, pregunta primero con una lista numerada. Incluye tests mínimos cuando aplique.`;
}

/** Construye un prompt de marketing/copy */
function buildMarketingPrompt(s){
  return `Actúa como copywriter.
Producto/servicio: ${s.task}
Contexto/beneficio clave: ${s.context}
Público: ${s.audience || "definir buyer persona"}
Tono: ${s.tone || "cercano y profesional"}
Formato: ${s.format || "post para IG con gancho, cuerpo y CTA + 10 hashtags"}
Longitud: ${s.length || "80–150 palabras"}
Palabras clave: ${s.keywords || "—"}
Diferenciales/pruebas sociales: ${s.data || "—"}
Restricciones: ${s.constraints || "sin claims sanitarios, sin mayúsculas excesivas"}
Idioma: ${s.language === "en" ? "English" : "Español"}

Estructura: [Hook breve] → [Beneficio] → [Prueba/Detalle] → [CTA]. Añade 3 variantes del hook.`;
}

/** Construye prompt para imagen (texto → imagen) */
function buildImagePrompt(s){
  // Convierte algunas palabras clave a una línea estilística
  const style = s.tone || "cinemático, realista, iluminación suave";
  const lens = s.keywords || "50mm, profundidad de campo, alto detalle";
  const format = s.format || "composición equilibrada, enfoque nítido";
  return `[Descripción principal]: ${s.task}. 
[Contexto/Escenario]: ${s.context || "—"}
[Detalles concretos]: ${s.data || "—"}
[Estilo]: ${style}. 
[Indicaciones técnicas]: ${lens}; ${format}.
[Paleta aproximada]: ${s.audience || "neutros con acento"}
[Evitar]: ${s.constraints || "texto superpuesto, marcas de agua"}
[Variaciones]: 3 versiones con cambios sutiles.
Idioma del prompt: ${s.language === "en" ? "English" : "Español"}`;
}

function buildPrompt(state){
  switch(state.template){
    case "research": return buildResearchPrompt(state);
    case "code": return buildCodePrompt(state);
    case "marketing": return buildMarketingPrompt(state);
    case "image": return buildImagePrompt(state);
    case "chat":
    default: return buildChatPrompt(state);
  }
}

if (typeof module !== "undefined") module.exports = { buildPrompt };
