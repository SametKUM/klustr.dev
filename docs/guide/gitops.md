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
  every managed object. Each row opens that object in the inspector, so you can
  drill `App → Deployment → Pod → Logs` and return with the back arrow in its
  header.

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

## Which tool manages a resource

Argo CD, Flux and Helm set no ownerReference on what they deploy; the only record
is the labels and annotations they stamp. Klustr reads them and shows a chip in
the detail header for each tool that manages the resource:

- **Argo CD** — from the `argocd.argoproj.io/tracking-id` annotation (the default
  since Argo CD 3.0), or from the `app.kubernetes.io/instance` label once the
  Application's status lists the object. Helm charts set the same label, so it
  counts only with that confirmation.
- **Flux** — the Kustomization or HelmRelease named by the
  `kustomize.toolkit.fluxcd.io/*` or `helm.toolkit.fluxcd.io/*` labels.
- **Helm** — the release named by the `meta.helm.sh/release-name` and
  `meta.helm.sh/release-namespace` annotations.

A chip opens its owner. An Argo CD Application often runs in a different cluster
from the resources it deploys; when that cluster is one of your active contexts,
the chip opens the Application there. Chips follow ownership changes live, without
reopening the resource.

### Edits the owner will revert

The YAML tab's **Edit** and the **Scale** dialog warn before you apply a change
that the owner will undo, for example *Argo CD Application argocd/shop will revert this change because
self-heal is on. Change it in the source instead.* The warning appears for:

- an Argo CD Application with automated sync and self-heal, except for fields in
  its `ignoreDifferences`, so scaling a Deployment whose replicas Argo CD ignores
  does not warn;
- a Flux Kustomization, which reapplies its objects on every interval, unless the
  object opts out with `kustomize.toolkit.fluxcd.io/reconcile: disabled` or
  `kustomize.toolkit.fluxcd.io/ssa: IfNotPresent` / `Ignore`;
- a Flux HelmRelease with drift detection enabled, except for its ignore rules and
  objects marked `helm.toolkit.fluxcd.io/driftDetection: disabled`.

Opt-outs count as a label or an annotation. A suspended owner gives no warning,
since it reverts nothing until it is resumed.
