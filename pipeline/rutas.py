r"""Rutas de la oficina, en un solo lugar.

perfiles/<perfil>/creacion/<slug>/  pieza que Claude crea desde cero (avatar, motion, imágenes)
perfiles/<perfil>/edicion/<slug>/   vídeo armado con los clips que sube el creador (en clips/)
perfiles/<perfil>/edicion/_bandeja/ clips subidos que todavía no tienen vídeo asignado
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def _perfiles():
    """Cada carpeta de perfiles/ con ficha.md es un perfil. El nombre sale del primer título (# ...) de la ficha."""
    salida = {}
    base = RAIZ / "perfiles"
    if base.is_dir():
        for d in sorted(base.iterdir()):
            ficha = d / "ficha.md"
            if d.is_dir() and not d.name.startswith("_") and ficha.exists():
                titulo = next((l[2:].strip() for l in ficha.read_text(encoding="utf-8").splitlines() if l.startswith("# ")), d.name)
                salida[d.name] = titulo
    return salida


PERFILES = _perfiles()
TIPOS = ("creacion", "edicion")
VIDEO_STUDIO = RAIZ / "video-studio"


def piezas():
    """Todas las piezas: [(perfil, tipo, slug, carpeta)]. Ignora carpetas que empiezan con _ (bandejas)."""
    salida = []
    for perfil in PERFILES:
        for tipo in TIPOS:
            base = RAIZ / "perfiles" / perfil / tipo
            if base.is_dir():
                for d in sorted(base.iterdir()):
                    if d.is_dir() and not d.name.startswith("_"):
                        salida.append((perfil, tipo, d.name, d))
    return salida


def buscar(slug: str):
    """(perfil, tipo, carpeta) de una pieza, o None si no existe."""
    for perfil, tipo, s, d in piezas():
        if s == slug:
            return perfil, tipo, d
    return None


def carpeta(slug: str, perfil: str | None = None, tipo: str = "creacion") -> Path:
    """Carpeta de la pieza; si no existe, la ruta donde se crearía (requiere perfil)."""
    hallada = buscar(slug)
    if hallada:
        return hallada[2]
    if perfil not in PERFILES:
        raise SystemExit(f"La pieza '{slug}' no existe todavía: indica --perfil ({' | '.join(PERFILES)})")
    return RAIZ / "perfiles" / perfil / tipo / slug


def mp4(slug: str, d: Path):
    """MP4 final: en la carpeta de la pieza (edición) o en video-studio/projects (creación)."""
    for p in (d / f"{slug}.mp4", d / "final" / f"{slug}.mp4", VIDEO_STUDIO / "projects" / slug / f"{slug}.mp4"):
        if p.exists():
            return p
    return None
