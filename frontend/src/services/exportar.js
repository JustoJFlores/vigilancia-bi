// frontend/src/services/exportar.js

export function exportarCSV(datos, nombreArchivo) {
  if (!datos || datos.length === 0) return

  const columnas = Object.keys(datos[0])
  const encabezado = columnas.join(',')
  const filas = datos.map(row =>
    columnas.map(col => {
      const val = row[col]
      // Si el valor tiene comas o comillas, lo envolvemos en comillas
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val ?? ''
    }).join(',')
  )

  const csv = [encabezado, ...filas].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `${nombreArchivo}_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}