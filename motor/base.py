# Registro de recursos de la biblioteca
CATS = {
    '01': '01_LOGOS_Y_MARCA',
    '02': '02_FLECHAS_Y_MARCADORES',
    '03': '03_CAPSULAS_Y_CONTENEDORES',
    '04': '04_ICONOS_INSTITUCIONALES',
    '05': '05_ETIQUETAS_Y_TEXTOS',
    '06': '06_ELEMENTOS_CREATIVOS',
}
CAT_TITULO = {
    '01': 'Logos y marca', '02': 'Flechas y marcadores', '03': 'Cápsulas y contenedores',
    '04': 'Íconos institucionales', '05': 'Etiquetas y textos', '06': 'Elementos creativos',
}
REG, GRUPOS = [], {}

# métodos recomendados para llevar el recurso a Instagram
METODOS = {
    'recortes': 'Recortes (con la versión _RECORTE si la detección falla)',
    'pegar': 'Copiar y pegar el PNG (conserva la semitransparencia)',
    'foto': 'Sticker Foto',
}


def grupo(cat, n, slug, titulo, uso, metodo='recortes', tags=''):
    gid = f'{cat}-{n:02d}'
    GRUPOS[gid] = dict(id=gid, cat=cat, slug=slug, titulo=titulo, uso=uso, metodo=metodo, tags=tags)
    return gid


def recurso(gid, variante, w, h, fn, recorte=None, nota=''):
    """fn(modo) -> svg.  recorte: None (no hace falta / no conviene) o dict(borde='blanco'|'noche', grosor=None, huecos=True)"""
    g = GRUPOS[gid]
    archivo = f"{gid}_{g['slug']}" + (f'_{variante}' if variante else '')
    REG.append(dict(gid=gid, cat=g['cat'], archivo=archivo, variante=variante, w=int(w), h=int(h), fn=fn,
                    recorte=recorte, nota=nota))


REC_B = dict(borde='blanco')      # borde troquelado blanco (elementos oscuros o de color)
REC_N = dict(borde='noche')       # borde troquelado azul noche (elementos claros o blancos)
