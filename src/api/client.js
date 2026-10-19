const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

export async function api(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detalle = data.detail;
    if (Array.isArray(detalle)) {
      throw new Error(detalle.map((d) => d.msg).join(". "));
    }
    throw new Error(detalle || "Ocurrió un error inesperado");
  }
  return data;
}