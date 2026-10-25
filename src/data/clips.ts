export type Clip = {
  id: string
  title: string
  theme: string
  src: string
  poster: string
}

const clip = (id: string, title: string, theme: string): Clip => ({
  id,
  title,
  theme,
  src: `/clips/${id}.mp4`,
  poster: `/clips/${id}.webp`,
})

// Silent loops of 15 to 30 seconds, recorded from the same kind fixtures as
// the screenshots. A workflow tab plays the clip with its own id; the
// capability cards listed in CAPABILITY_CLIPS get a Watch button.
export const CLIPS: Clip[] = [
  clip('multi-context', 'Two clusters, one live list', 'dracula'),
  clip('debugging', 'Diagnosis, logs and a debug container', 'one-dark'),
  clip('helm', 'Upgrade after a dry-run, then roll back', 'monokai-light'),
  clip('argocd', 'Argo CD Applications and sync', 'one-light'),
  clip('flux', 'Flux reconcile, suspend and resume', 'monokai'),
  clip('tekton', 'Tekton runs, task graph and rerun', 'tokyo-night'),
  clip('gateway', 'HTTPRoute rules and Gateway listeners', 'nord'),
  clip('cert-manager', 'Certificate to challenge, and renew', 'nord-light'),
  clip('kyverno', 'Policy violations, from both ends', 'monokai'),
  clip('istio', 'VirtualServices, DestinationRules and mTLS', 'one-light'),
  clip('karpenter', 'NodePools, NodeClaims and disruption', 'tokyo-night'),
  clip('keda', 'ScaledObjects and the HPAs they drive', 'nord-light'),
  clip('access-review', 'Effective permissions of a ServiceAccount', 'nord'),
  clip('safe-changes', 'Server-side diff, then read-only mode', 'default-dark'),
  clip('node-drain', 'PDB-aware drain with live progress', 'dracula'),
  clip('port-forward', 'Port-forward and the terminal drawer', 'one-dark'),
]

export const CAPABILITY_CLIPS: Record<string, string> = {
  'Access Review': 'access-review',
  'YAML, scale and rollout': 'safe-changes',
  Nodes: 'node-drain',
  'Terminal drawer': 'port-forward',
}

export const clipById = (id: string | undefined) => CLIPS.find((c) => c.id === id)

export const DEMO_TITLE = 'Live view across two contexts, captured from real clusters'
