r"""Revisa la PC y las cuentas antes de usar la oficina, y decide qué usar: lo de pago si hay acceso, lo gratis si no.

Uso:
  python pipeline/revisar_equipo.py              revisión completa (comprueba en línea las claves de ElevenLabs y Gemini)
  python pipeline/revisar_equipo.py --instalar   además instala lo GRATIS que falte (paquetes de Python, npm, navegador de Remotion)
  python pipeline/revisar_equipo.py --hook       lo corre Claude Code al abrir la sesión: solo la primera vez
                                                 (o si pasaron 7 días); si no, no hace nada

Deja el resultado en .equipo.json (fuera de git), que leen los comandos y los agentes:
  "modos": {"voces": "elevenlabs" | "edge-tts", "imagenes_ia": "vertex" | "gemini-api" | "ninguna", "ram_gb": 8, ...}
Nunca imprime el valor de una clave: solo si existe y si funciona.

De pago (opcionales, cada quien con su cuenta):
  - ElevenLabs (voces): ELEVENLABS_API_KEY en video-studio/.env.local o en el entorno.
  - Gemini (imágenes IA), una de dos:
      Vertex AI: gcloud auth application-default login + GOOGLE_CLOUD_PROJECT
      API de Gemini (AI Studio): GEMINI_API_KEY en .env.local (raíz) o en el entorno. Ojo: el nivel gratis no genera
      imágenes; hace falta activar la facturación en AI Studio.
Si no hay acceso: voces gratis con edge-tts (Microsoft, necesita internet) y sin imágenes IA (fotos propias o Wikimedia).
"""
import argparse
import datetime
import importlib.util
import json
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
VS = RAIZ / "video-studio"
SALIDA = RAIZ / ".equipo.json"
PIP_GRATIS = {"numpy": "numpy", "edge_tts": "edge-tts", "faster_whisper": "faster-whisper", "requests": "requests"}
WINDOWS = platform.system() == "Windows"


def leer_env(ruta):
    """Lee un .env sin imprimirlo; no pisa variables que ya existan."""
    if not ruta.exists():
        return
    for linea in ruta.read_text(encoding="utf-8", errors="ignore").splitlines():
        linea = linea.strip()
        if linea and not linea.startswith("#") and "=" in linea:
            k, v = linea.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def correr(cmd, timeout=20):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, shell=WINDOWS and isinstance(cmd, str))
        return r.returncode, (r.stdout or r.stderr).strip()
    except (OSError, subprocess.TimeoutExpired) as e:
        return -1, str(e)


def version(cmd):
    exe = shutil.which(cmd[0])
    if not exe:
        return None
    code, out = correr([exe] + cmd[1:])
    return out.splitlines()[0] if code == 0 and out else None


def ffmpeg():
    """ffmpeg del PATH o el de winget (Windows)."""
    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        return version(["ffmpeg", "-version"])
    base = Path.home() / "AppData/Local/Microsoft/WinGet/Packages"
    for p in base.glob("Gyan.FFmpeg*/**/bin/ffmpeg.exe"):
        return f"{p.parent} (winget, fuera del PATH)"
    return None


def ram_gb():
    try:
        if WINDOWS:
            import ctypes

            class M(ctypes.Structure):
                _fields_ = [("l", ctypes.c_ulong), ("c", ctypes.c_ulong), ("t", ctypes.c_ulonglong)] + \
                           [(f"x{i}", ctypes.c_ulonglong) for i in range(6)]
            m = M(); m.l = ctypes.sizeof(M)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
            return round(m.t / 2**30)
        if platform.system() == "Darwin":
            return round(int(subprocess.check_output(["sysctl", "-n", "hw.memsize"])) / 2**30)
        return round(os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 2**30)
    except Exception:
        return None


def navegador_remotion():
    """Remotion descarga su propio Chrome headless la primera vez; está en node_modules/.remotion."""
    return any((VS / "node_modules" / ".remotion").glob("chrome-headless-shell*")) if (VS / "node_modules").is_dir() else False


def revisar_elevenlabs(en_linea):
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not key:
        return {"ok": False, "detalle": "sin clave (ELEVENLABS_API_KEY en video-studio/.env.local)"}
    if not en_linea:
        return {"ok": True, "detalle": "clave presente (sin comprobar)"}
    try:
        import requests
    except ImportError:
        return {"ok": False, "detalle": "falta el paquete requests para comprobar la clave"}
    try:
        r = requests.get("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": key}, timeout=15)
    except Exception as e:
        return {"ok": False, "detalle": f"sin conexión con ElevenLabs ({type(e).__name__})"}
    if r.status_code == 200:
        d = r.json()
        quedan = max(0, int(d.get("character_limit", 0)) - int(d.get("character_count", 0)))
        if quedan < 500:
            return {"ok": False, "detalle": f"clave válida pero sin saldo (quedan {quedan} caracteres este mes)", "caracteres": quedan}
        return {"ok": True, "detalle": f"clave válida, plan {d.get('tier', '?')}, quedan {quedan:,} caracteres este mes", "caracteres": quedan}
    texto = r.text[:300]
    if r.status_code == 401 and "missing_permissions" in texto:
        return {"ok": True, "detalle": "clave válida (sin permiso para leer el saldo: dale 'User: read' para verlo)"}
    return {"ok": False, "detalle": f"la clave no funciona (HTTP {r.status_code})"}


def adc_existe():
    rutas = [Path(os.environ.get("APPDATA", "")) / "gcloud/application_default_credentials.json",
             Path.home() / ".config/gcloud/application_default_credentials.json"]
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        rutas.append(Path(os.environ["GOOGLE_APPLICATION_CREDENTIALS"]))
    return any(p.is_file() for p in rutas)


def revisar_gemini(en_linea):
    """Prueba gratis (lista modelos). No genera imágenes: eso cuesta."""
    hay_sdk = importlib.util.find_spec("google.genai") is not None if importlib.util.find_spec("google") else False
    proyecto = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    api_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    if not (proyecto and adc_existe()) and not api_key:
        faltan = "sin GEMINI_API_KEY ni Vertex (GOOGLE_CLOUD_PROJECT + gcloud auth application-default login)"
        return {"ok": False, "modo": "ninguna", "detalle": faltan}
    if not hay_sdk:
        return {"ok": False, "modo": "ninguna", "detalle": "hay credenciales pero falta el paquete: pip install google-genai"}
    modo = "vertex" if proyecto and adc_existe() else "gemini-api"
    if not en_linea:
        return {"ok": True, "modo": modo, "detalle": "credenciales presentes (sin comprobar)"}
    try:
        from google import genai
        cliente = (genai.Client(vertexai=True, project=proyecto, location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"))
                   if modo == "vertex" else genai.Client(api_key=api_key))
        next(iter(cliente.models.list()))
    except Exception as e:
        texto = str(e)
        if modo == "vertex" and "has not been used in project" in texto and proyecto not in texto.split("has not been used in project")[1][:80]:
            return {"ok": False, "modo": "ninguna", "detalle": "vertex: tus credenciales cobran a otro proyecto (quota project). Arréglalo con: "
                    f"gcloud auth application-default set-quota-project {proyecto}"}
        if "has not been used in project" in texto or "SERVICE_DISABLED" in texto:
            return {"ok": False, "modo": "ninguna", "detalle": f"{modo}: la API está apagada. Actívala con: gcloud services enable aiplatform.googleapis.com"}
        msg = texto.splitlines()[0][:160]
        return {"ok": False, "modo": "ninguna", "detalle": f"{modo}: no responde ({msg})"}
    nota = " (recuerda: con la API de Gemini, las imágenes requieren facturación activa)" if modo == "gemini-api" else ""
    return {"ok": True, "modo": modo, "detalle": f"{modo}: acceso confirmado{nota}"}


def revisar(en_linea=True):
    leer_env(VS / ".env.local")
    leer_env(RAIZ / ".env.local")
    py_ok = sys.version_info >= (3, 10)
    nodo = version(["node", "--version"])
    nodo_ok = bool(nodo) and int(nodo.lstrip("v").split(".")[0]) >= 18
    faltan_pip = [pkg for mod, pkg in PIP_GRATIS.items() if importlib.util.find_spec(mod) is None]
    ff = ffmpeg()
    nm = (VS / "node_modules" / "remotion").is_dir() and (VS / "node_modules" / "@twemoji" / "svg").is_dir()
    nav = navegador_remotion()
    ram = ram_gb()

    gratis = [
        ("Python 3.10+", py_ok, platform.python_version(), "winget install Python.Python.3.12"),
        ("Node.js 18+", nodo_ok, nodo or "no está", "winget install OpenJS.NodeJS.LTS"),
        ("ffmpeg y ffprobe", bool(ff), ff or "no está", "winget install Gyan.FFmpeg  (y abre otra terminal)"),
        ("Paquetes de Python", not faltan_pip, "ok" if not faltan_pip else "faltan: " + ", ".join(faltan_pip),
         f"{Path(sys.executable).name} -m pip install " + " ".join(faltan_pip or PIP_GRATIS.values())),
        ("video-studio/node_modules", nm, "ok" if nm else "sin instalar", "cd video-studio && npm install"),
        ("Navegador de Remotion", nav, "ok" if nav else "se descarga en el primer render (~100 MB)",
         "cd video-studio && npx remotion browser ensure"),
    ]
    once = revisar_elevenlabs(en_linea)
    gem = revisar_gemini(en_linea)
    modos = {
        "voces": "elevenlabs" if once["ok"] else "edge-tts",
        "imagenes_ia": gem["modo"] if gem["ok"] else "ninguna",
        "ram_gb": ram,
        "render": "REMOTION_CONCURRENCY=1 REMOTION_CHUNK=300" if (ram or 0) <= 12 else "normal",
    }
    datos = {
        "fecha": datetime.datetime.now().isoformat(timespec="minutes"),
        "sistema": f"{platform.system()} {platform.release()}",
        "gratis": [{"que": q, "ok": ok, "detalle": d, "instalar": i} for q, ok, d, i in gratis],
        "pago": {"elevenlabs": once, "gemini": gem},
        "modos": modos,
        "listo": all(ok for _, ok, _, _ in gratis[:5]),
    }
    SALIDA.write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")
    return datos


def informe(d, breve=False):
    v = lambda ok: "OK " if ok else "FALTA"
    lineas = [f"Revisión del equipo ({d['fecha']}, {d['sistema']}, RAM {d['modos']['ram_gb'] or '?'} GB)", ""]
    lineas.append("Herramientas gratis:")
    for g in d["gratis"]:
        lineas.append(f"  [{v(g['ok'])}] {g['que']}: {g['detalle']}")
        if not g["ok"]:
            lineas.append(f"          → {g['instalar']}")
    lineas += ["", "Servicios de pago (opcionales):"]
    e, gm = d["pago"]["elevenlabs"], d["pago"]["gemini"]
    lineas.append(f"  [{'OK ' if e['ok'] else 'NO '}] ElevenLabs (voces): {e['detalle']}")
    lineas.append(f"  [{'OK ' if gm['ok'] else 'NO '}] Gemini (imágenes IA): {gm['detalle']}")
    m = d["modos"]
    lineas += ["", "La oficina usará:"]
    lineas.append("  Voces: ElevenLabs" if m["voces"] == "elevenlabs" else
                  "  Voces: edge-tts, GRATIS (voces de Microsoft; necesitan internet). Si algún día pones ELEVENLABS_API_KEY, se usa sola.")
    lineas.append(f"  Imágenes IA: Gemini por {m['imagenes_ia']} (siempre con tu permiso, cuesta dinero)" if m["imagenes_ia"] != "ninguna" else
                  "  Imágenes IA: NO. Se usan tus fotos y clips, o imágenes libres de Wikimedia Commons con su crédito.")
    lineas.append(f"  Render: {m['render']}")
    if not d["listo"]:
        lineas += ["", "Faltan herramientas básicas: instálalas antes de hacer vídeos (o corre con --instalar lo gratis)."]
    if breve:
        lineas += ["", "[Para Claude] Resume esto al usuario en 3–5 líneas al empezar: qué falta instalar (con el comando),",
                   "y que donde no hay servicio de pago se usará la alternativa gratis. Ofrece instalar lo que falte."]
    return "\n".join(lineas)


def instalar(d):
    """Solo lo gratis y local. Lo de pago (claves, logins) lo hace la persona."""
    for g in d["gratis"]:
        if g["ok"]:
            continue
        if g["que"] == "Paquetes de Python":
            faltan = [p for m, p in PIP_GRATIS.items() if importlib.util.find_spec(m) is None]
            print("→ pip install", *faltan)
            subprocess.run([sys.executable, "-m", "pip", "install", *faltan])
        elif g["que"] == "video-studio/node_modules" and shutil.which("npm"):
            print("→ npm install (video-studio)")
            subprocess.run("npm install", cwd=VS, shell=True)
        elif g["que"] == "Navegador de Remotion" and shutil.which("npx") and (VS / "node_modules").is_dir():
            print("→ npx remotion browser ensure")
            subprocess.run("npx remotion browser ensure", cwd=VS, shell=True)
        else:
            print(f"→ {g['que']}: instálalo tú con: {g['instalar']}")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    p = argparse.ArgumentParser()
    p.add_argument("--hook", action="store_true", help="solo si no hay revisión o tiene más de 7 días")
    p.add_argument("--instalar", action="store_true", help="instala lo gratis que falte")
    p.add_argument("--sin-red", action="store_true", help="no comprobar las claves en línea")
    a = p.parse_args()

    if a.hook and SALIDA.exists():
        try:
            fecha = datetime.datetime.fromisoformat(json.loads(SALIDA.read_text(encoding="utf-8"))["fecha"])
            if datetime.datetime.now() - fecha < datetime.timedelta(days=7):
                return
        except Exception:
            pass
    d = revisar(en_linea=not a.sin_red)
    if a.instalar:
        instalar(d)
        d = revisar(en_linea=not a.sin_red)
    print(informe(d, breve=a.hook))


if __name__ == "__main__":
    main()
