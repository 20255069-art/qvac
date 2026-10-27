# Cómo publicar el sitio

Esta guía es para una persona sin experiencia. El sitio ya está listo: solo hay que subirlo a Cloudflare Pages. Publicar es un paso humano; ningún agente lo hace por ti.

## 1. Una sola vez

1. Crea una cuenta gratuita en https://dash.cloudflare.com/sign-up (plan Free, $0, uso comercial permitido).
2. Abre Git Bash en la raíz del proyecto y ejecuta:

   ```bash
   npx wrangler login
   ```

   Se abre el navegador. Acepta el permiso y vuelve a la terminal.

## 2. Publicar

En la raíz del proyecto, en Git Bash:

```bash
npm run deploy
```

Este comando construye el sitio y sube la carpeta `dist/` al proyecto `reconversion-laboral`, rama `main`.

La primera vez, wrangler crea el proyecto. La dirección queda como `https://reconversion-laboral.pages.dev`. Si ese nombre ya está tomado, usa la dirección que wrangler imprima, que termina en `.pages.dev`.

## 3. Comprobar

1. Abre la dirección en tu celular.
2. Recorre: portada, ocupaciones, una transición y la entrevista.
3. Confirma que aparece el aviso: "Prototipo para el Innovathon Ulima x Tether. No es un sitio oficial del Estado peruano."

## 4. Volver a una versión anterior

- En el panel de Cloudflare Pages, entra a la pestaña *Deployments*, elige un despliegue anterior y pulsa *Rollback to this deployment*.
- O, en Git Bash:

  ```bash
  git checkout paso-15 && npm run deploy && git checkout main
  ```

## 5. Revisar enlaces antes del Demo Day

```bash
npm run verificar-enlaces
```

Necesita internet. Si algún enlace no responde, avisa al equipo.

## 6. Opcional

Puedes guardar capturas de referencia de Stitch en `docs/referencias/*.png`. Son solo referencia visual: los colores y tamaños del sitio salen de `src/styles/global.css`.
