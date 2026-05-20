from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.routes import checkout, webhooks, productos, categorias, puntos_entrega, admin_ordenes, mis_ordenes, carrito
from app.core.supabase_client import supabase_admin

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "https://vyro.boutique",
        "https://www.vyro.boutique",
        "https://qa-vyro-boutique.netlify.app",
        "https://qa.vyro.boutique",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response


app.add_middleware(SecurityHeadersMiddleware)

app.include_router(checkout.router)
app.include_router(webhooks.router)
app.include_router(productos.router)
app.include_router(categorias.router)
app.include_router(puntos_entrega.router)
app.include_router(admin_ordenes.router)
app.include_router(mis_ordenes.router)
app.include_router(carrito.router)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    return """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://vyro.boutique/sitemap.xml
"""


@app.get("/sitemap.xml", response_class=Response)
async def sitemap():
    base_url = "https://vyro.boutique"
    urls = [
        f"""  <url>
    <loc>{base_url}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>""",
        f"""  <url>
    <loc>{base_url}/cart</loc>
    <changefreq>weekly</changefreq>
    <priority>0.3</priority>
  </url>""",
        f"""  <url>
    <loc>{base_url}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>""",
    ]
    try:
        products = supabase_admin.table("productos").select("id, nombre, creado_en").execute()
        for p in products.data:
            lastmod = p.get("creado_en", "")[:10] if p.get("creado_en") else ""
            urls.append(f"""  <url>
    <loc>{base_url}/producto/{p["id"]}</loc>
    {"    <lastmod>" + lastmod + "</lastmod>" if lastmod else ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")
    except Exception:
        pass

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""
    return Response(content=xml, media_type="application/xml")
