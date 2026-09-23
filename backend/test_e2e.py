"""
Suite de pruebas end-to-end para DOM en Línea Municipal — Fase 4.
Ejecuta contra la API en http://api:8000 (dentro del contenedor Docker).

Cubre: flujo completo del trámite + blindaje de la intranet (401 sin JWT).
"""
import httpx
import time

BASE = "http://api:8000"
PASS = 0
FAIL = 0

def ok(nombre):
    global PASS
    PASS += 1
    print(f"  ✅ {nombre}")

def fail(nombre, msg):
    global FAIL
    FAIL += 1
    print(f"  ❌ {nombre}: {msg}")


# ════════════════════════════════════════════════════════════════════
print("\n🧪 PRUEBAS END-TO-END — DOM en Línea Municipal (Fase 4)\n")

# ── 1. Health check ────────────────────────────────────────────────
r = httpx.get(f"{BASE}/health")
if r.status_code == 200 and r.json().get("status") == "ok":
    ok("/health responde 200 + status ok")
else:
    fail("/health", f"status={r.status_code}, body={r.text[:100]}")


# ── 2. Listar catálogo de tipos de trámite (público) ───────────────
r = httpx.get(f"{BASE}/api/tipos-tramite")
if r.status_code == 200:
    tipos = r.json()
    assert isinstance(tipos, list) and len(tipos) >= 1, "catálogo vacío"
    ok(f"GET /api/tipos-tramite → {len(tipos)} tipos cargados")
else:
    fail("GET /api/tipos-tramite", f"status={r.status_code}, body={r.text[:200]}")
    raise SystemExit("No se puede continuar sin catálogo de tipos.")


# ── 3. Login de funcionario (intranet) ────────────────────────────
r = httpx.post(f"{BASE}/api/auth/login", json={"rut": "11111111-1", "password": "dom2026"})
if r.status_code == 200:
    token = r.json()["access_token"]
    ok("POST /auth/login → 200 + JWT")
else:
    fail("POST /auth/login", f"status={r.status_code}, body={r.text[:200]}")
    raise SystemExit("No se puede continuar sin funcionario demo (¿corriste create_tables + seed?).")

AUTH = {"Authorization": f"Bearer {token}"}


# ── 4. Login con clave incorrecta ──────────────────────────────────
r = httpx.post(f"{BASE}/api/auth/login", json={"rut": "11111111-1", "password": "mala"})
if r.status_code == 401:
    ok("POST /auth/login (clave mala) → 401 Credenciales inválidas")
else:
    fail("POST /auth/login (clave mala)", f"esperaba 401, obtuve {r.status_code}")


# ── 5. /auth/me sin header ────────────────────────────────────────
r = httpx.get(f"{BASE}/api/auth/me")
if r.status_code == 401:
    ok("GET /auth/me sin header → 401")
else:
    fail("GET /auth/me sin header", f"esperaba 401, obtuve {r.status_code}")


# ── 6. /auth/me con token ─────────────────────────────────────────
r = httpx.get(f"{BASE}/api/auth/me", headers=AUTH)
if r.status_code == 200 and r.json().get("rut") == "11111111-1":
    ok("GET /auth/me con Bearer → 200 + funcionario")
else:
    fail("GET /auth/me con Bearer", f"status={r.status_code}, body={r.text[:200]}")


# ── 7. BLINDAJE: bandeja sin token ────────────────────────────────
r = httpx.get(f"{BASE}/api/solicitudes/bandeja")
if r.status_code == 401:
    ok("GET /bandeja sin token → 401 (intranet protegida)")
else:
    fail("GET /bandeja sin token", f"esperaba 401, obtuve {r.status_code}")


# ── 8. Ingreso de solicitud (ciudadano, público) ──────────────────
tipo_primero = tipos[0]
ingreso = {
    "solicitante": {
        "rut": "12345678-9",
        "nombres": "Maria Jose Gonzalez",
        "email": "maria.gonzalez@mail.cl"
    },
    "predio": {
        "rol_sii": "1234-56",
        "direccion": "Av. Los Aromos 1234, Lote 5"
    },
    "id_tipo": tipo_primero["id"]
}
r = httpx.post(f"{BASE}/api/solicitudes/ingreso", json=ingreso)
if r.status_code == 201:
    sol = r.json()
    solicitud_id = sol["id"]
    numero_ingreso = sol["numero_ingreso"]
    ok(f"POST /ingreso → 201 | folio={numero_ingreso}, estado={sol['estado_actual']}")
else:
    fail("POST /ingreso", f"status={r.status_code}, body={r.text[:200]}")
    raise SystemExit("No se puede continuar sin solicitud.")


# ── 9. Detalle con token ──────────────────────────────────────────
r = httpx.get(f"{BASE}/api/solicitudes/{solicitud_id}", headers=AUTH)
if r.status_code == 200:
    det = r.json()
    assert det["solicitante_nombres"] == "Maria Jose Gonzalez"
    assert det["predio_rol_sii"] == "1234-56"
    ok(f"GET /solicitudes/{solicitud_id} → detalle correcto (solicitante, predio)")
else:
    fail("GET /solicitudes/{id}", f"status={r.status_code}")


# ── 10. BLINDAJE: detalle sin token ───────────────────────────────
r = httpx.get(f"{BASE}/api/solicitudes/{solicitud_id}")
if r.status_code == 401:
    ok("GET /solicitudes/{id} sin token → 401")
else:
    fail("GET /solicitudes/{id} sin token", f"esperaba 401, obtuve {r.status_code}")


# ── 11. Bandeja de entrada con token ──────────────────────────────
r = httpx.get(f"{BASE}/api/solicitudes/bandeja", params={"departamento": tipo_primero["depto_responsable"]}, headers=AUTH)
if r.status_code == 200:
    bandeja = r.json()
    assert len(bandeja) >= 1
    assert bandeja[0]["id"] == solicitud_id
    ok(f"GET /bandeja ({tipo_primero['depto_responsable']}) → {len(bandeja)} resultado(s)")
else:
    fail("GET /bandeja", f"status={r.status_code}")


# ── 12. Editar trámite (intranet): cambiar email + dirección ──────
r = httpx.put(f"{BASE}/api/solicitudes/{solicitud_id}", headers=AUTH, json={
    "solicitante": {
        "rut": "12345678-9",
        "nombres": "Maria Jose Gonzalez",
        "email": "maria.editada@mail.cl"
    },
    "predio": {
        "rol_sii": "1234-56",
        "direccion": "Av. Los Aromos 9999, Depto 5"
    }
})
if r.status_code == 200:
    edit = r.json()
    assert edit["solicitante_email"] == "maria.editada@mail.cl"
    assert edit["predio_direccion"] == "Av. Los Aromos 9999, Depto 5"
    ok("PUT /solicitudes/{id} → edición de solicitante + predio aplicada")
else:
    fail("PUT /solicitudes/{id}", f"status={r.status_code}, body={r.text[:200]}")


# ── 13. Verificar persistencia de la edición ──────────────────────
r = httpx.get(f"{BASE}/api/solicitudes/{solicitud_id}", headers=AUTH)
if r.status_code == 200:
    pers = r.json()
    assert pers["solicitante_email"] == "maria.editada@mail.cl"
    assert pers["predio_direccion"] == "Av. Los Aromos 9999, Depto 5"
    ok("GET /solicitudes/{id} → edición persistida ✓")
else:
    fail("GET /solicitudes/{id} (persistencia edición)", f"status={r.status_code}")


# ── 14. Cambiar estado → En Revisión (log firmado por el auth) ────
r = httpx.put(f"{BASE}/api/solicitudes/{solicitud_id}/estado", headers=AUTH, json={
    "estado_nuevo": "En Revisión"
})
if r.status_code == 200:
    assert r.json()["estado_actual"] == "En Revisión"
    ok("PUT /estado → Ingresado → En Revisión")
else:
    fail("PUT /estado (En Revisión)", f"status={r.status_code}, body={r.text[:200]}")


# ── 15. Subir PDF (upload público, flujo ciudadano) ───────────────
pdf_content = b"%PDF-1.4 fake content for testing purposes"
files = {"archivo": ("test.pdf", pdf_content, "application/pdf")}
data = {"id_solicitud": solicitud_id, "tipo_documento": "Solicitud firmada"}
r = httpx.post(f"{BASE}/api/documentos/upload", data=data, files=files)
if r.status_code == 201:
    doc = r.json()
    documento_id = doc["id"]
    ok(f"POST /documentos/upload → 201 | id={documento_id}, tipo={doc['tipo_documento']}")
else:
    fail("POST /documentos/upload", f"status={r.status_code}, body={r.text[:200]}")


# ── 16. Listar documentos (con token) ─────────────────────────────
r = httpx.get(f"{BASE}/api/documentos/solicitud/{solicitud_id}", headers=AUTH)
if r.status_code == 200:
    docs = r.json()
    assert len(docs) == 1
    assert docs[0]["id"] == documento_id
    ok(f"GET /documentos/solicitud/{solicitud_id} → 1 documento listado")
else:
    fail("GET /documentos/solicitud/{id}", f"status={r.status_code}")


# ── 17. Obtener el PDF inline (con token) ─────────────────────────
r = httpx.get(f"{BASE}/api/documentos/{documento_id}/archivo", headers=AUTH)
if r.status_code == 200:
    ct = r.headers.get("content-type", "")
    cd = r.headers.get("content-disposition", "")
    assert "application/pdf" in ct, f"content-type inesperado: {ct}"
    assert "inline" in cd, f"content-disposition no es inline: {cd}"
    ok(f"GET /documentos/{documento_id}/archivo → inline PDF ✓")
else:
    fail("GET /documentos/{id}/archivo", f"status={r.status_code}")


# ── 18. Subir segundo documento ───────────────────────────────────
pdf2 = b"%PDF-1.4 second doc"
files2 = {"archivo": ("plano.pdf", pdf2, "application/pdf")}
data2 = {"id_solicitud": solicitud_id, "tipo_documento": "Plano de emplazamiento"}
r = httpx.post(f"{BASE}/api/documentos/upload", data=data2, files=files2)
if r.status_code == 201:
    ok(f"POST /documentos/upload (2do doc) → 201")
else:
    fail("POST /documentos/upload (2do)", f"status={r.status_code}")


# ── 19. Listar documentos (ahora debe haber 2) ────────────────────
r = httpx.get(f"{BASE}/api/documentos/solicitud/{solicitud_id}", headers=AUTH)
if r.status_code == 200:
    docs = r.json()
    assert len(docs) == 2, f"Esperaba 2 documentos, obtuve {len(docs)}"
    ok(f"GET /documentos/solicitud/{solicitud_id} → {len(docs)} documentos ✓")
else:
    fail(" listar documentos post-2do", f"status={r.status_code}")


# ── 20. Aprobar el trámite ────────────────────────────────────────
r = httpx.put(f"{BASE}/api/solicitudes/{solicitud_id}/estado", headers=AUTH, json={
    "estado_nuevo": "Aprobado"
})
if r.status_code == 200:
    assert r.json()["estado_actual"] == "Aprobado"
    ok("PUT /estado → En Revisión → Aprobado")
else:
    fail("PUT /estado (Aprobado)", f"status={r.status_code}, body={r.text[:200]}")


# ── 21. Intento inválido: cambiar a estado inexistente ────────────
r = httpx.put(f"{BASE}/api/solicitudes/{solicitud_id}/estado", headers=AUTH, json={
    "estado_nuevo": "NoExiste"
})
if r.status_code == 400 and "no es válido" in r.text:
    ok("PUT /estado → 400 para estado inexistente (validación funciona)")
else:
    fail("PUT /estado (inválido)", f"esperaba 400/msg válido, obtuve {r.status_code}: {r.text[:120]}")


# ── 22. Intento inválido: repetir mismo estado ────────────────────
r = httpx.put(f"{BASE}/api/solicitudes/{solicitud_id}/estado", headers=AUTH, json={
    "estado_nuevo": "Aprobado"
})
if r.status_code == 400 and "ya está en ese estado" in r.text:
    ok("PUT /estado → 400 para cambio al mismo estado")
else:
    fail("PUT /estado (mismo)", f"esperaba 400/msg correcto, obtuve {r.status_code}: {r.text[:120]}")


# ── 23. Verificar estado final ────────────────────────────────────
r = httpx.get(f"{BASE}/api/solicitudes/{solicitud_id}", headers=AUTH)
if r.status_code == 200:
    final = r.json()
    assert final["estado_actual"] == "Aprobado"
    ok(f"GET /solicitudes/{solicitud_id} → estado final = Aprobado ✓")
else:
    fail("GET /solicitudes/{id} (final)", f"status={r.status_code}")


# ── 24. Solicitud inexistente (con token → 404, sin él → 401) ─────
r = httpx.get(f"{BASE}/api/solicitudes/9999", headers=AUTH)
if r.status_code == 404:
    ok("GET /solicitudes/9999 → 404 (no encontrado)")
else:
    fail("GET /solicitudes/9999", f"esperaba 404, obtuve {r.status_code}")


# ── 25. Documento inexistente (con token) ─────────────────────────
r = httpx.get(f"{BASE}/api/documentos/9999/archivo", headers=AUTH)
if r.status_code == 404:
    ok("GET /documentos/9999/archivo → 404")
else:
    fail("GET /documentos/9999/archivo", f"esperaba 404, obtuve {r.status_code}")


# ── 26. Upload sin PDF (público, validación de tipo) ──────────────
bad_content = b"esto no es un PDF"
files_bad = {"archivo": ("fake.txt", bad_content, "text/plain")}
data_bad = {"id_solicitud": solicitud_id, "tipo_documento": "Basura"}
r = httpx.post(f"{BASE}/api/documentos/upload", data=data_bad, files=files_bad)
if r.status_code == 400:
    ok("POST /documentos/upload (no-PDF) → 400 (validación funciona)")
else:
    fail("POST /documentos/upload (no-PDF)", f"esperaba 400, obtuve {r.status_code}")


# ── 27. BLINDAJE: cambiar estado sin token ────────────────────────
r = httpx.put(f"{BASE}/api/solicitudes/{solicitud_id}/estado", json={
    "estado_nuevo": "Rechazado"
})
if r.status_code == 401:
    ok("PUT /estado sin token → 401 (no puede tocar estados sin sesión)")
else:
    fail("PUT /estado sin token", f"esperaba 401, obtuve {r.status_code}")


# ── 28. BLINDAJE: documentos sin token ────────────────────────────
r = httpx.get(f"{BASE}/api/documentos/solicitud/{solicitud_id}")
if r.status_code == 401:
    ok("GET /documentos/solicitud/{id} sin token → 401")
else:
    fail("GET /documentos/solicitud/{id} sin token", f"esperaba 401, obtuve {r.status_code}")


# ════════════════════════════════════════════════════════════════════
print(f"\n{'='*50}")
print(f"📋 RESUMEN: {PASS} pasaron / {FAIL} fallaron / {PASS+FAIL} total")
print(f"{'='*50}")
if FAIL > 0:
    raise SystemExit(1)
print("🎉 ¡Todas las pruebas pasaron!")
