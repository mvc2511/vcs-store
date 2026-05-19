# VYRO — HyperFrames Marketing Content

[HyperFrames](https://hyperframes.heygen.com/) es un framework open-source que convierte HTML/CSS/JS en video. Genera composiciones de video programáticas para marketing de marca.

## Composiciones

| Archivo | Descripción | Resolución |
|---------|-------------|------------|
| `compositions/vyro-brand-intro.html` | Intro animada de VYRO con wordmark y tagline | 1920×1080 |
| `compositions/vyro-product-promo.html` | Showcase de producto con precio y CTA | 1080×1920 |

## Renderizar

```bash
npx hyperframes render compositions/vyro-brand-intro.html --output vyro-brand-intro.mp4
npx hyperframes render compositions/vyro-product-promo.html --output vyro-product-promo.mp4
```

## Preview

```bash
npx hyperframes preview compositions/vyro-brand-intro.html
```

## Skills

Si usás Claude Code, instalá la skill oficial:

```bash
npx skills add heygen-com/hyperframes
```
