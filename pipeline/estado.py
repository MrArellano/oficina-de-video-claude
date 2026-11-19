"""Estado de cada pieza de todos los perfiles: calendario/estado.md (y estado.json).

Uso: python pipeline/estado.py

Detecta solo, por archivos: brief, guion, clips, plataformas, veredicto del editor y vídeo.
Lo que no se puede detectar (aprobada por el creador, publicada) va a mano en calendario/estado-manual.json:
  {"<slug>": {"aprobada": "2026-11-15", "publicada": {"facebook": "2026-11-16", "tiktok": "..."}, "nota": "..."}}
Claude lo actualiza cuando el creador aprueba en el chat.
"""
import json
import sys

from rutas import RAIZ, PERFILES, piezas, mp4


def veredicto(d) -> str:
    p = d / "revision.md"
    if not p.exists():
        return ""
    t = p.read_text(encoding="utf-8").upper()
    for v in ("NO APTA", "APTA CON CAMBIOS", "APTA"):
        if v in t:
            return v
    return "?"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    manual_p = RAIZ / "calendario" / "estado-manual.json"
    manual = json.loads(manual_p.read_text(encoding="utf-8")) if manual_p.exists() else {}
    filas = []
    for perfil, tipo, s, d in piezas():
        video = mp4(s, d)
        m = manual.get(s, {})
        f = {
            "perfil": perfil,
            "tipo": tipo,
            "slug": s,
            "carpeta": str(d.relative_to(RAIZ)),
            "brief": (d / "brief.md").exists(),
            "guion": (d / "guion.md").exists(),
            "clips": len(list((d / "clips").glob("*"))) if (d / "clips").is_dir() else 0,
            "imagenes": (d / "imagenes.md").exists(),
            "plataformas": (d / "plataformas.md").exists(),
            "revision": veredicto(d),
            "video": str(video) if video else "",
            "aprobada": m.get("aprobada", ""),
            "publicada": m.get("publicada", {}),
            "nota": m.get("nota", ""),
        }
        if f["publicada"]:
            f["fase"] = "publicada"
        elif f["aprobada"]:
            f["fase"] = "aprobada, falta publicar"
        elif f["video"]:
            f["fase"] = "vídeo listo, falta aprobación"
        elif f["revision"]:
            f["fase"] = "revisada, falta vídeo"
        elif f["guion"] or f["brief"]:
            f["fase"] = "en producción"
        else:
            f["fase"] = "idea"
        filas.append(f)

    (RAIZ / "calendario" / "estado.json").write_text(json.dumps(filas, ensure_ascii=False, indent=1), encoding="utf-8")
    ok = lambda b: "✔" if b else "·"
    md = ["# Estado de las piezas", "",
          "Generado por `python pipeline/estado.py`. No editar a mano: lo manual va en estado-manual.json.", ""]
    for perfil, nombre in PERFILES.items():
        propias = [f for f in filas if f["perfil"] == perfil]
        md += [f"## {nombre}", ""]
        if not propias:
            md += ["Sin piezas todavía.", ""]
            continue
        md += ["| Slug | Tipo | Brief | Guion | Clips | Plat. | Revisión | Vídeo | Fase | Nota |",
               "|---|---|---|---|---|---|---|---|---|---|"]
        for f in propias:
            md.append(f"| {f['slug']} | {f['tipo']} | {ok(f['brief'])} | {ok(f['guion'])} | {f['clips'] or '·'} | "
                      f"{ok(f['plataformas'])} | {f['revision'] or '·'} | {ok(f['video'])} | {f['fase']} | {f['nota']} |")
        md.append("")
    (RAIZ / "calendario" / "estado.md").write_text("\n".join(md), encoding="utf-8")
    print("\n".join(md[4:]))


if __name__ == "__main__":
    main()
