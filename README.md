# klustr.dev

Source of [klustr.dev](https://klustr.dev), the landing and documentation site for [Klustr](https://github.com/SametKUM/klustr), a Kubernetes desktop client.

The user guides live in [`docs/guide/`](docs/guide) and are rendered at `/docs/<slug>/`. Bugs in Klustr itself belong in the [app repository](https://github.com/SametKUM/klustr/issues); mistakes in the guides or the site belong here.

## Development

```bash
mise install          # Node, pinned in .mise.toml
npm ci
npm run dev           # astro dev server on :4321
npm run typecheck     # astro check
npm run build         # static build to dist/ (GITHUB_TOKEN optional)
```

Without Node on the host, `docker compose up --build` serves the built site on `127.0.0.1:8080` and `docker compose --profile dev up dev` runs the hot-reload dev server on `127.0.0.1:4321`.

Pushes to `main` deploy to GitHub Pages through `.github/workflows/pages.yml`.

## License

The site code is licensed under the [Apache License 2.0](LICENSE). The guides under `docs/guide/` are licensed under [CC BY 4.0](docs/guide/LICENSE). Fonts, icons and other third-party packages keep their own licenses.
