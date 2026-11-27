import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })

export default async (req: Request) => {
  const store = getStore({ name: "inscricoes", consistency: "strong" })

  if (req.method === "POST") {
    const { id, presente } = await req.json().catch(() => ({}))
    if (typeof id !== "string" || !/^[0-9a-z-]{6,60}$/.test(id)) return json({ erro: "id" }, 400)
    if (presente) await store.setJSON(`checkin/${id}`, { em: new Date().toISOString() })
    else await store.delete(`checkin/${id}`)
    return json({ ok: true })
  }

  const [{ blobs: ins }, { blobs: chk }] = await Promise.all([
    store.list({ prefix: "inscritos/" }),
    store.list({ prefix: "checkin/" }),
  ])
  const registros = await Promise.all(ins.map((b) => store.get(b.key, { type: "json" })))
  const checkins = await Promise.all(
    chk.map(async (b) => [b.key.slice("checkin/".length), await store.get(b.key, { type: "json" })] as const),
  )
  const mapa = Object.fromEntries(checkins.map(([id, v]) => [id, (v as any)?.em || true]))
  const lista = registros
    .filter(Boolean)
    .map((r: any) => ({ ...r, checkin_em: mapa[r.id] || null }))
    .sort((a: any, b: any) => String(b.criado_em).localeCompare(String(a.criado_em)))
  return json({ inscritos: lista, atualizado_em: new Date().toISOString() })
}

export const config: Config = { path: "/api/painel", method: ["GET", "POST"] }
