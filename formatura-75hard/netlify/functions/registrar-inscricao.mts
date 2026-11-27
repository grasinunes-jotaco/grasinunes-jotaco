import { getStore } from "@netlify/blobs"

// Runs in the background for every verified submission of the site's forms
// and keeps a copy in Blobs so the /painel page can read it.
export default {
  async formSubmitted(event: any) {
    const d = (event && event.data) || {}
    if (!d.nome && !d.email) return
    const quando = new Date().toISOString()
    const id = `${quando.replace(/[^0-9]/g, "")}-${Math.random().toString(36).slice(2, 8)}`
    const registro = {
      id,
      criado_em: quando,
      nome: String(d.nome || "").trim(),
      voce_e: String(d.voce_e || "").trim(),
      quem_convidou: String(d.quem_convidou || "").trim(),
      email: String(d.email || "").trim(),
      telefone: String(d.telefone || "").trim(),
    }
    await getStore("inscricoes").setJSON(`inscritos/${id}`, registro)
  },
}
