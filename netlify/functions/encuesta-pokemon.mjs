// Votos de la encuesta del torneo Pokémon (/encuestas-pokemon).
// GET  /api/encuesta-pokemon  -> { voters: [{ pid, nick, votes }], ideas: [{ key, pid, name, text, createdAt }] }
// POST /api/encuesta-pokemon  <- { id, nick, votes, prev? }   (voto, guardado por nombre)
//                             <- { kind: "idea", id, name, text }     (propuesta)
//                             <- { kind: "idea-delete", id, key }     (borrar la propia)
// Los votos se guardan por nombre (ver keyOf). Cada navegador manda además un
// id privado al azar: su hash (pid) marca las propuestas propias, que sólo ese
// navegador puede borrar.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const DATES = [
  "2026-10-03", "2026-10-04", "2026-10-10", "2026-10-11", "2026-10-17",
  "2026-10-18", "2026-10-24", "2026-10-25", "2026-10-31",
];
const CHOICES = new Set(["yes", "maybe", "no"]);
const MAX_VOTERS = 80;
const MAX_IDEAS = 200;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// Misma regla que en encuestas-pokemon/index.html: mantenerlas iguales.
const slug = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const keyOf = (n) => { const s = slug(n); return s ? "n-" + s : null; };

// Los primeros votos se guardaron por navegador (clave = hash). Se pasan una
// sola vez a clave por nombre; `legacy` guarda la clave vieja para que ese
// navegador reconozca su voto sin volver a escribir el nombre.
async function migrateToNames(store, blobs) {
  const old = blobs.filter((b) => !b.key.startsWith("n-"));
  if (!old.length) return blobs;
  for (const b of old) {
    const rec = await store.get(b.key, { type: "json" });
    const key = rec && keyOf(rec.nick);
    if (key) {
      const current = await store.get(key, { type: "json" });
      if (!current || (current.updatedAt || 0) < (rec.updatedAt || 0)) {
        await store.setJSON(key, { ...rec, pid: key, legacy: b.key });
      }
    }
    await store.delete(b.key);
  }
  return (await store.list()).blobs;
}

export default async (req) => {
  const store = getStore({ name: "encuesta-pokemon", consistency: "strong" });

  const ideasStore = getStore({ name: "encuesta-pokemon-ideas", consistency: "strong" });

  if (req.method === "GET") {
    const [{ blobs: voteBlobs }, { blobs: ideaBlobs }] = await Promise.all([store.list(), ideasStore.list()]);
    const blobs = await migrateToNames(store, voteBlobs);
    const [voters, ideas] = await Promise.all([
      Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }))),
      Promise.all(ideaBlobs.map((b) => ideasStore.get(b.key, { type: "json" }))),
    ]);
    return json({
      voters: voters.filter(Boolean),
      ideas: ideas.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt),
    });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }

    const id = String(body?.id ?? "");
    if (!/^[a-z0-9]{16,40}$/.test(id)) return json({ error: "id inválido" }, 400);
    const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").trim().slice(0, n);

    // Propuestas para el torneo: nombre + comentario
    if (body?.kind === "idea") {
      const pid = createHash("sha256").update(id).digest("hex").slice(0, 16);
      const name = clean(body.name, 24).replace(/\n/g, " ");
      const text = clean(body.text, 400).replace(/\n{3,}/g, "\n\n");
      if (!name || !text) return json({ error: "Faltan el nombre o la propuesta" }, 400);
      const { blobs } = await ideasStore.list();
      if (blobs.length >= MAX_IDEAS) return json({ error: "Ya hay demasiadas propuestas" }, 429);
      const key = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      const idea = { key, pid, name, text, createdAt: Date.now() };
      await ideasStore.setJSON(key, idea);
      return json({ ok: true, idea });
    }
    if (body?.kind === "idea-delete") {
      const pid = createHash("sha256").update(id).digest("hex").slice(0, 16);
      const key = String(body.key ?? "");
      const idea = /^[a-z0-9-]{4,30}$/.test(key) ? await ideasStore.get(key, { type: "json" }) : null;
      if (!idea || idea.pid !== pid) return json({ error: "No podés borrar esa propuesta" }, 403);
      await ideasStore.delete(key);
      return json({ ok: true });
    }

    const nick = clean(body?.nick, 24).replace(/\n/g, " ");
    const votes = {};
    for (const d of DATES) {
      const v = body?.votes?.[d];
      if (CHOICES.has(v)) votes[d] = v;
    }

    // Los votos se guardan por NOMBRE: el mismo nombre (sin importar mayúsculas
    // ni acentos) siempre edita el mismo voto, desde cualquier dispositivo.
    const key = keyOf(nick);
    if (!key) return json({ error: "Escribí un nombre con letras o números" }, 400);

    // Cambio de nombre: se borra el voto guardado con el nombre anterior.
    const prevKey = keyOf(clean(body?.prev, 24));
    if (prevKey && prevKey !== key) await store.delete(prevKey);

    if (!Object.keys(votes).length) {
      await store.delete(key);
      return json({ ok: true, pid: key });
    }

    const existing = await store.get(key);
    if (existing === null) {
      const { blobs } = await store.list();
      if (blobs.length >= MAX_VOTERS) return json({ error: "La encuesta está llena" }, 429);
    }

    await store.setJSON(key, { pid: key, nick, votes, updatedAt: Date.now() });
    return json({ ok: true, pid: key });
  }

  return json({ error: "Método no permitido" }, 405);
};

export const config = { path: "/api/encuesta-pokemon" };
