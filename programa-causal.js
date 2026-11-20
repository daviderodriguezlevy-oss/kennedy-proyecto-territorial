const circuits = [{"name": "R1 · Acumulación de vehículos", "nodes": ["Vehículos en espera", "Ocupación de accesos", "Dificultad de maniobra", "Tiempo de atención"], "signs": ["+", "+", "+", "+"], "text": "Más vehículos ocupan accesos. Si comparten espacio con las maniobras, la operación tarda más y la cola aumenta. El circuito refuerza la saturación. Patios, accesos y muelles son el soporte arquitectónico de esta relación.", "condition": "Condición del mecanismo: accesos y maniobras comparten espacio. La intensidad depende de la geometría y la operación."}, {"name": "B1 · Atención de la carga", "nodes": ["Vehículos esperando", "Ocupación de muelles libres", "Servicios completados", "Salida de vehículos"], "signs": ["+", "+", "+", "−"], "text": "Una cola permite ocupar los muelles disponibles. Los servicios terminados permiten que los vehículos salgan y disminuyen la cola. La compensación está limitada por personal, equipos, muelles y duración de cada servicio.", "condition": "Capacidad efectiva: la menor capacidad entre acceso, descarga, traslado interno y despacho."}, {"name": "B2 · Recursos del hábitat", "nodes": ["Alimento disponible", "Oportunidades de alimentación", "Consumo de recursos", "Agotamiento del recurso"], "signs": ["+", "+", "+", "−"], "text": "La disponibilidad de alimento permite consumo. El consumo reduce los recursos restantes. La regeneración repone recursos con una demora. Las especies ajustan permanencia y desplazamiento según disponibilidad y perturbación.", "condition": "Regeneración y consumo requieren tasas propias del recurso y del grupo biológico representado."}, {"name": "B3 · Regulación hídrica", "nodes": ["Agua almacenada", "Nivel de agua", "Descarga por salida funcional", "Volumen evacuado"], "signs": ["+", "+", "+", "−"], "text": "El almacenamiento eleva el nivel. Una salida funcional permite descargar agua y reducir el volumen almacenado. Lluvia, escorrentía, infiltración y obstrucción alteran el balance.", "condition": "La descarga depende de capacidad, nivel y condiciones de salida. El suelo saturado limita la infiltración."}];
const host = document.getElementById('pc-diagram');
if (host) {
  const positions = [[180,80],[500,80],[500,300],[180,300]];
  const paths = ['M 290 80 C 330 30 350 30 390 80','M 500 112 C 590 150 590 230 500 268','M 390 300 C 350 350 330 350 290 300','M 180 268 C 90 230 90 150 180 112'];
  const signs = [[340,43],[575,190],[340,350],[105,190]];
  function selectCircuit(index) {
    const circuit = circuits[index];
    document.getElementById('pc-loop-name').textContent = circuit.name;
    document.getElementById('pc-loop-text').textContent = circuit.text;
    document.getElementById('pc-loop-condition').textContent = circuit.condition;
    const edges = paths.map((path,i) => `<path d="${path}" fill="none" stroke="#8caeaf" stroke-width="2" marker-end="url(#pc-arrow)"/><text x="${signs[i][0]}" y="${signs[i][1]}" fill="#d1e2d8" font-size="24" text-anchor="middle">${circuit.signs[i]}</text>`).join('');
    const nodes = circuit.nodes.map((name,i) => {
      const words = name.split(' ');
      const middle = Math.ceil(words.length/2);
      return `<rect x="${positions[i][0]-110}" y="${positions[i][1]-30}" width="220" height="60" rx="8" fill="#182930" stroke="#557275"/><text x="${positions[i][0]}" y="${positions[i][1]-5}" fill="#e0eae7" font-size="15" text-anchor="middle"><tspan x="${positions[i][0]}">${words.slice(0,middle).join(' ')}</tspan><tspan x="${positions[i][0]}" dy="21">${words.slice(middle).join(' ')}</tspan></text>`;
    }).join('');
    host.innerHTML = `<svg viewBox="0 0 680 390" role="img" aria-label="${circuit.name}. ${circuit.text}"><defs><marker id="pc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" fill="#a5c5c2"/></marker></defs>${edges}${nodes}<text x="340" y="200" fill="#bed8d0" font-size="30" text-anchor="middle">${circuit.name.split(' · ')[0]}</text></svg>`;
    document.querySelectorAll('[data-loop]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.loop)===index)));
  }
  document.querySelectorAll('[data-loop]').forEach(button => button.addEventListener('click',()=>selectCircuit(Number(button.dataset.loop))));
  selectCircuit(0);
}
