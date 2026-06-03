export function formatDateDDMMYYYY(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  try {
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch (e) {
    // Fallback
    const yy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${dd}/${mm}/${yy}`
  }
}

export default formatDateDDMMYYYY
