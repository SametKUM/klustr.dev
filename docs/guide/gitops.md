# GitOps: Argo CD & Flux

Klustr drives both Argo CD and Flux **through the Kubernetes API** — no
`argocd-server` ingress, no Argo login, and no `argocd` or `flux` CLI on your PATH.
The only requirement is that your kubeconfig user can update the relevant resources.

Each integration's sidebar group appears only when its CRDs are detected on the
cluster, so nothing clutters the sidebar on a cluster that doesn't run it.

## Argo CD

Shown when the `applications.argoproj.io` CRD is present.

- **List** — Applications with Sync / Health status pills, watch-backed.
- **Sync** — implemented as the same PATCH (`operation.sync`) that `argocd app sync`
  issues.
- **Refresh** — flips the `argocd.argoproj.io/refresh` annotation.
- **Rollback** and cascade-aware **Delete** are available from the Application.
- **Resources tab** — the Application detail reads `.status.resources` and lists
  every managed object. Each row deep-links into Klustr's normal detail panel, so
  you can drill `App → Deployment → Pod → Logs` without leaving the dialog.

## Flux CD

Klustr covers the Flux toolkit kinds: Kustomization, HelmRelease, GitRepository,
HelmRepository, OCIRepository, Bucket, Provider, Alert and Receiver.

- Each shows its Ready state (**Ready**, **Not ready**, **Unknown**, or
  **Suspended** while suspended), conditions, source, and applied revision.
- **Reconcile** and **Suspend / Resume** buttons hit the standard Flux annotations —
  again, no `flux` CLI involved.

### Image automation

When the `image.toolkit.fluxcd.io` CRDs are present, the Flux group also lists the
image automation kinds:

- **ImageRepositories** — the image, the registry provider, when it was last
  scanned and how many tags it found, with the latest tags and the exclusion
  patterns in the detail.
- **ImagePolicies** — the repository a policy reads, its policy type (semver,
  alphabetical or numerical) with the range or order, the tag filter, and the
  image it selected: tag, digest and the previous pick.
- **ImageUpdateAutomations** — the Git source, checkout and push branches, the
  update path and strategy, and the last run, push and commit.

References between them open the referenced object, across namespaces too. An
ImagePolicy has no reconcile of its own: reconcile its ImageRepository to rescan
tags, and the policy follows. Suspend needs the `v1` ImagePolicy API, the first
that has the field.

> All sync / reconcile / suspend actions respect a context's
> [read-only mode](getting-started.md#read-only-mode).
