// Detecta árboles del registro cuya posición cae dentro de un polígono de calzada.
// No se mueven (no se inventa su ubicación): se ocultan por defecto y una casilla permite verlos.
// Pueden ser desfases entre el inventario y la cartografía, o separadores que el polígono de vía también cubre.
export function roadIndex(positions, cell = .01) {
  const g = new Map();
  for (let t = 0; t < positions.length / 9; t++) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let k = 0; k < 3; k++) { const x = positions[t * 9 + k * 3], z = positions[t * 9 + k * 3 + 2]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    for (let a = Math.floor(x0 / cell); a <= Math.floor(x1 / cell); a++)
      for (let b = Math.floor(z0 / cell); b <= Math.floor(z1 / cell); b++) { const k = a + ',' + b; if (!g.has(k)) g.set(k, []); g.get(k).push(t); }
  }
  return (x, z) => {
    const list = g.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)); if (!list) return false;
    for (const t of list) {
      const v = positions, ax = v[t * 9], az = v[t * 9 + 2], bx = v[t * 9 + 3], bz = v[t * 9 + 5], cx = v[t * 9 + 6], cz = v[t * 9 + 8];
      const d1 = (x - bx) * (az - bz) - (ax - bx) * (z - bz), d2 = (x - cx) * (bz - cz) - (bx - cx) * (z - cz), d3 = (x - ax) * (cz - az) - (cx - ax) * (z - az);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) return true;
    }
    return false;
  };
}
