<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git workflow

- **Siempre trabajar sobre `dev`**. Antes de cualquier edición, verificá la branch con `git branch --show-current` y si no estás en `dev`, hacé `git checkout dev && git pull --ff-only origin dev`.
- **Push directo a `origin/dev`** una vez que el feature esté listo y typecheck/lint pasen. No abrir PR a `dev`.
- **NUNCA** commitear ni pushear directo a `main`. El PR `dev → main` lo hace Mateo manualmente cuando ya verificó los cambios en el deploy de desarrollo conectado a `dev`.
- Si por error empezaste en `main`, hacé `git stash -u`, `git checkout dev`, `git pull`, `git stash pop` y resolvé conflictos antes de commitear.
