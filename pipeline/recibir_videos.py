r"""Página de subida por Wi-Fi: del teléfono a la carpeta del perfil, sin internet.

Uso:
  python pipeline/recibir_videos.py --perfil <perfil> --video <slug>   → perfiles/<perfil>/edicion/<slug>/clips/
  python pipeline/recibir_videos.py --perfil <perfil>                  → perfiles/<perfil>/edicion/_bandeja/
  (opcional: --puerto 8000)

Modo fijo (página de casa para un colaborador que no usa Claude Code: llena el brief y sube sus clips):
  python pipeline/recibir_videos.py --perfil <perfil> --fijo --puerto 8001 --desde 08:00 --hasta 23:00
  (puedes lanzarlo con una tarea programada de Windows al iniciar sesión)
  El código no cambia (vive en pipeline/.codigo-subida-<perfil>, fuera de git) y cada subida elige su vídeo con
  ?video=<slug> en la dirección (sin él, va a la bandeja). Fuera del horario no arranca y a la hora --hasta se apaga.

Imprime la dirección (http://<ip-de-la-PC>:8000) y un código de 6 dígitos.
En el teléfono (misma red Wi-Fi) abre la dirección, escribe el código y elige los vídeos.
Los archivos se guardan por partes directo a disco (sirve para 4K de varios GB)
y nunca reemplaza uno existente. Ctrl+C para apagarla.
"""
import argparse
import datetime
import sys
import threading
import hmac
import json
import pathlib
import re
import secrets
import socket
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from rutas import PERFILES  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = None  # se fija en main(): perfiles/<perfil>/edicion/<video>/clips o .../_bandeja
BASE = None     # perfiles/<perfil>/edicion (modo fijo: cada subida elige su vídeo)
PERFIL = ""
SLUG = re.compile(r"[a-z0-9][a-z0-9-]{1,60}")
BLOQUE = 1024 * 1024
EXTENSIONES = {".mp4", ".mov", ".m4v", ".mkv", ".3gp", ".webm", ".jpg", ".jpeg", ".png", ".heic", ".wav", ".m4a", ".mp3"}

PAGINA = """<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Subir clips</title>
<style>
body{font-family:system-ui,sans-serif;background:#1d1712;color:#f4ead8;margin:0;padding:20px;max-width:560px;margin:auto}
h1{color:#e8823a;font-size:1.4rem}input,button{font-size:1.1rem;padding:12px;border-radius:10px;border:0;width:100%;box-sizing:border-box;margin:6px 0}
input{background:#33281f;color:#f4ead8}button{background:#e8823a;color:#1d1712;font-weight:700}
button:disabled{opacity:.5}.f{background:#2a211a;border-radius:10px;padding:10px;margin:8px 0;font-size:.9rem;word-break:break-all}
.b{height:8px;background:#33281f;border-radius:4px;margin-top:6px;overflow:hidden}.b i{display:block;height:100%;width:0;background:#e8823a}
.ok{color:#9fd18b}.mal{color:#ff8a7a}
</style></head><body>
<h1>Subir clips a la oficina</h1><p id="v" style="opacity:.8"></p>
<input id="c" inputmode="numeric" maxlength="6" placeholder="Código de 6 dígitos">
<input id="a" type="file" multiple accept="image/*,video/*">
<p style="font-size:.85rem;opacity:.75">iPhone: toca <b>Fototeca</b>. Si arriba aparece <b>Opciones</b>, elige <b>Actual</b> para que los vídeos no se compriman.</p>
<button id="s">Subir</button><div id="l"></div>
<script>
const $=id=>document.getElementById(id);
const q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.slice(1));
const video=q.get('video')||'';if(h.get('k'))localStorage.setItem('codigo',h.get('k'));
$('v').textContent=video?'Para el vídeo: '+video:'';
$('c').value=localStorage.getItem('codigo')||'';
function subir(f,codigo){return new Promise(res=>{
  const d=document.createElement('div');d.className='f';d.innerHTML='<span></span><div class="b"><i></i></div>';
  d.firstChild.textContent=f.name+' ('+(f.size/1048576).toFixed(0)+' MB)';$('l').appendChild(d);
  const x=new XMLHttpRequest();x.open('POST','/subir?nombre='+encodeURIComponent(f.name)+(video?'&video='+encodeURIComponent(video):''));
  x.setRequestHeader('X-Codigo',codigo);
  x.upload.onprogress=e=>{if(e.lengthComputable)d.querySelector('i').style.width=(100*e.loaded/e.total)+'%'};
  x.onload=()=>{let r={};try{r=JSON.parse(x.responseText)}catch(e){}
    const s=document.createElement('div');
    if(x.status==200){s.className='ok';s.textContent='Listo: '+r.guardado}else{s.className='mal';s.textContent='Error: '+(r.error||x.status)}
    d.appendChild(s);res()};
  x.onerror=()=>{const s=document.createElement('div');s.className='mal';s.textContent='Se cortó la conexión';d.appendChild(s);res()};
  x.send(f)})}
$('s').onclick=async()=>{const codigo=$('c').value.trim(),fs=[...$('a').files];if(!fs.length)return;
  localStorage.setItem('codigo',codigo);$('s').disabled=true;
  for(const f of fs)await subir(f,codigo);$('s').disabled=false};
</script></body></html>"""


PAGINA_FIJA = pathlib.Path(__file__).with_name("pagina_subida.html")


def hacer_slug(texto):
    import unicodedata
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:50] or "video"


def lista_videos():
    """Vídeos del perfil con brief del colaborador, el más nuevo primero."""
    salida = []
    for d in BASE.iterdir():
        j = d / "brief-colaborador.json"
        if d.is_dir() and j.exists():
            b = json.loads(j.read_text(encoding="utf-8"))
            clips = sum(1 for f in (d / "clips").glob("*") if f.is_file() and not f.name.endswith(".part"))
            salida.append({"slug": d.name, "titulo": b.get("titulo", d.name), "enviado": b.get("enviado", ""), "clips": clips})
    return sorted(salida, key=lambda v: v["enviado"], reverse=True)


def brief_md(slug, b):
    lista = lambda v: ", ".join(v) if isinstance(v, list) else (v or "")
    return f"""# Brief — {b['titulo']}
Lo llenó el colaborador en la página de casa el {b['enviado']}. Claude completa lo que falte al producir.

Perfil: {PERFIL} · Tipo: edición · Slug: {slug}
Pilar: {b.get('pilar') or '(sin elegir)'}
Tema / sentimiento: {b.get('trata') or '(vacío)'} — quiere que sientan: {lista(b.get('sentir')) or '(sin elegir)'}
Plataformas y formato: {lista(b.get('redes'))} · vertical 9:16
Audio: {b.get('audio')}
Personas y permisos: {lista(b.get('personas')) or 'nadie marcado'} (menores → difuminar siempre)
No debe salir: {b.get('no_salir') or '(nada indicado)'}
Datos a mostrar (con fuente: el colaborador): {b.get('datos') or '(ninguno)'}
Estilo elegido: {b.get('estilo')}
Referencia: {b.get('referencia') or '(ninguna)'}
Duración: (Claude decide según clips)
Fecha deseada: {b.get('fecha_deseada') or '(sin fecha)'}
Decidido por defecto (sin preguntar):
"""


def ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.168.0.1", 9))  # no envía nada; solo elige la interfaz de la red local
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def nombre_seguro(nombre, carpeta):
    nombre = pathlib.PurePath(nombre.replace("\\", "/")).name
    nombre = re.sub(r"[^\w.\- ]", "_", nombre).strip(" .") or "clip"
    base, ext = pathlib.Path(nombre).stem, pathlib.Path(nombre).suffix.lower()
    destino = carpeta / f"{base}{ext}"
    n = 1
    while destino.exists() or destino.with_suffix(destino.suffix + ".part").exists():
        destino = carpeta / f"{base}-{n}{ext}"
        n += 1
    return destino, ext


class Manejador(BaseHTTPRequestHandler):
    codigo = ""

    def responder(self, estado, cuerpo, tipo="application/json"):
        datos = cuerpo.encode("utf-8")
        self.send_response(estado)
        self.send_header("Content-Type", f"{tipo}; charset=utf-8")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def autorizado(self):
        return hmac.compare_digest(self.headers.get("X-Codigo", ""), self.codigo)

    def do_GET(self):
        ruta = urllib.parse.urlparse(self.path).path
        if ruta in ("/", "/index.html"):
            pagina = PAGINA_FIJA.read_text(encoding="utf-8") if BASE is not None else PAGINA
            self.responder(200, pagina, "text/html")
        elif ruta == "/videos" and BASE is not None:
            if not self.autorizado():
                return self.responder(403, json.dumps({"error": "código incorrecto"}))
            self.responder(200, json.dumps(lista_videos(), ensure_ascii=False))
        else:
            self.responder(404, json.dumps({"error": "no existe"}))

    def guardar_brief(self):
        try:
            largo = int(self.headers.get("Content-Length", "0"))
            if not 0 < largo <= 64 * 1024:
                raise ValueError
            b = json.loads(self.rfile.read(largo).decode("utf-8"))
            titulo = str(b.get("titulo", "")).strip()[:80]
            if not titulo:
                raise ValueError
        except Exception:
            return self.responder(400, json.dumps({"error": "brief inválido"}))
        slug = hacer_slug(titulo)
        n = 2
        while (BASE / slug / "brief.md").exists():
            slug = f"{hacer_slug(titulo)}-{n}"
            n += 1
        carpeta = BASE / slug
        (carpeta / "clips").mkdir(parents=True, exist_ok=True)
        campos = {k: b.get(k) for k in ("titulo", "pilar", "trata", "sentir", "estilo", "referencia", "audio",
                                         "personas", "no_salir", "datos", "redes", "fecha_deseada")}
        campos["titulo"] = titulo
        campos["enviado"] = datetime.datetime.now().isoformat(timespec="minutes")
        campos["estado"] = "nuevo"
        (carpeta / "brief-colaborador.json").write_text(json.dumps(campos, ensure_ascii=False, indent=1), encoding="utf-8")
        (carpeta / "brief.md").write_text(brief_md(slug, campos), encoding="utf-8")
        print(f"  ✎ brief nuevo: {slug}", flush=True)
        self.responder(200, json.dumps({"slug": slug}))

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if url.path not in ("/subir", "/brief") or (url.path == "/brief" and BASE is None):
            return self.responder(404, json.dumps({"error": "no existe"}))
        if not self.autorizado():
            return self.responder(403, json.dumps({"error": "código incorrecto"}))
        if url.path == "/brief":
            return self.guardar_brief()
        try:
            largo = int(self.headers.get("Content-Length", ""))
        except ValueError:
            return self.responder(411, json.dumps({"error": "falta el tamaño"}))
        qs = urllib.parse.parse_qs(url.query)
        nombre = qs.get("nombre", ["clip"])[0]
        carpeta = DESTINO
        video = qs.get("video", [""])[0]
        if BASE is not None:
            carpeta = BASE / video / "clips" if SLUG.fullmatch(video) else BASE / "_bandeja"
            carpeta.mkdir(parents=True, exist_ok=True)
        destino, ext = nombre_seguro(nombre, carpeta)
        if ext not in EXTENSIONES:
            return self.responder(415, json.dumps({"error": f"tipo no permitido: {ext or 'sin extensión'}"}))

        parcial = destino.with_suffix(destino.suffix + ".part")
        restante = largo
        try:
            with open(parcial, "wb") as f:
                while restante > 0:
                    trozo = self.rfile.read(min(BLOQUE, restante))
                    if not trozo:
                        raise ConnectionError("conexión cortada")
                    f.write(trozo)
                    restante -= len(trozo)
            parcial.rename(destino)
        except Exception as e:
            parcial.unlink(missing_ok=True)
            print(f"  ✗ {nombre}: {e}")
            return
        print(f"  ✓ {destino.parent.parent.name if BASE else ''}/{destino.name} ({largo / 1048576:.0f} MB)", flush=True)
        self.responder(200, json.dumps({"guardado": destino.name}))

    def log_message(self, *args):
        pass  # sin ruido en la consola; solo se imprimen las subidas


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--perfil", required=True, choices=list(PERFILES))
    p.add_argument("--video", help="slug del vídeo a editar; sin él, va a la bandeja del perfil")
    p.add_argument("--puerto", type=int, default=8000)
    p.add_argument("--fijo", action="store_true", help="código fijo y vídeo elegido en cada subida (?video=)")
    p.add_argument("--desde", default="08:00", help="con --hasta: no arranca antes de esta hora")
    p.add_argument("--hasta", help="HH:MM: se apaga sola a esa hora (y no arranca fuera de --desde/--hasta)")
    a = p.parse_args()

    if a.video and not SLUG.fullmatch(a.video):
        p.error("--video debe ser un slug: minúsculas, números y guiones")
    global DESTINO, BASE, PERFIL
    PERFIL = a.perfil
    base = RAIZ / "perfiles" / a.perfil / "edicion"
    DESTINO = base / a.video / "clips" if a.video else base / "_bandeja"
    DESTINO.mkdir(parents=True, exist_ok=True)
    if a.fijo:
        BASE = None if a.video else base
        archivo = pathlib.Path(__file__).with_name(f".codigo-subida-{a.perfil}")
        if not archivo.exists():
            archivo.write_text(f"{secrets.randbelow(10**6):06d}", encoding="utf-8")
        Manejador.codigo = archivo.read_text(encoding="utf-8").strip()
    else:
        Manejador.codigo = f"{secrets.randbelow(10**6):06d}"
    servidor = ThreadingHTTPServer(("0.0.0.0", a.puerto), Manejador)
    if a.hasta:
        ahora = datetime.datetime.now()
        h_ini = datetime.datetime.combine(ahora.date(), datetime.time.fromisoformat(a.desde))
        h_fin = datetime.datetime.combine(ahora.date(), datetime.time.fromisoformat(a.hasta))
        if not h_ini <= ahora < h_fin:
            servidor.server_close()
            sys.exit(f"Fuera de horario ({a.desde}–{a.hasta}); no arranco.")
        threading.Timer((h_fin - ahora).total_seconds(), servidor.shutdown).start()
        print(f"Encendida hasta las {a.hasta}", flush=True)
    print(f"Abre en el teléfono: http://{ip_local()}:{a.puerto}", flush=True)
    print(f"Código: {Manejador.codigo}", flush=True)
    print(f"Guardando en: {BASE / '<video>' / 'clips' if BASE else DESTINO}  (Ctrl+C para apagar)", flush=True)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
