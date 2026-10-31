# Platform integrations: cert-manager, Istio, Karpenter & KEDA

Beyond [GitOps](gitops.md) and [Gateway API](gateway-api.md), Klustr promotes a
few more CRD families from the generic [Custom Resources](custom-resources.md)
browser to first-class, typed views. Each sidebar group appears only when its
CRDs are detected in an active context, so nothing clutters a cluster that
doesn't run it. Each reads its CRDs at the API version the cluster serves, so it
tracks whichever release the cluster runs.

A **Ready** column reads the same in every integration: **Ready**, **Not ready**
or **Unknown**, from the resource's Ready condition.

All mutating actions below respect a context's
[read-only mode](getting-started.md#read-only-mode).

## cert-manager

Shown when the `cert-manager.io` CRDs are present.

- **Certificates** — ready state and expiry at a glance.
- **Issuers / ClusterIssuers** — the one-of spec (`acme` / `ca` / `selfSigned` /
  `vault` / `venafi`) is collapsed into a single **Type** column; ACME issuers
  also show their server and email.
- **Issuance chain** — a Certificate's detail drills down the full chain,
  `Certificate → CertificateRequest → Order → Challenge`, each as a tab whose
  rows deep-link into the matching detail. When issuance is stuck, this is where
  you see which step failed and why.
- **Renew** — one click, no `cmctl` on your PATH.

## Istio

Shown when Istio's `networking.istio.io` and `security.istio.io` CRDs are
present.

- **VirtualServices** — hosts, gateways and every HTTP, TLS and TCP route as a
  match with weighted destinations.
- **DestinationRules** — host, TLS mode, load balancer and subsets.
- **Gateways** — servers with their ports, hosts and TLS credential, the gateway
  proxy pods the selector matches, and the VirtualServices bound to the gateway.
- **ServiceEntries** — hosts, addresses, ports, location, resolution, endpoints
  and the namespaces the entry is exported to.
- **Sidecars** — the workloads a Sidecar applies to, its ingress listeners,
  egress hosts and outbound traffic policy.
- **AuthorizationPolicies** — action, rules and the workloads they select. An
  `ALLOW` policy without rules reads **Allows no requests (default deny)**.
- **RequestAuthentications** — JWT issuers, audiences and keys, where the token
  is read from and whether it is forwarded, and the workloads they select.
- **PeerAuthentications** — mTLS mode, port-level overrides and selector.

Links connect the mesh config to what it routes:

- A VirtualService's hosts and destinations and a DestinationRule's host open
  their Service. Short names resolve the way Istio resolves them, relative to the
  resource's namespace.
- Each DestinationRule subset lists the pods its labels select.
- A VirtualService's gateways open the Istio Gateway they name.
- AuthorizationPolicies, RequestAuthentications and Sidecars list the pods they
  select. A selector policy in Istio's root namespace applies **in all
  namespaces**.

The links follow Services and Pods live, so a subset's pods update during a
rollout or scale.

## Karpenter

Shown when the `karpenter.sh` CRDs are present.

- **NodePools** — weight, node class, consolidation policy, CPU / memory limits
  and current usage, node count and ready state.
- **NodeClaims** — provisioning status for the nodes Karpenter is bringing up.
- **EC2NodeClasses** — shown when the AWS provider's `karpenter.k8s.aws` CRDs are
  present: readiness, AMI family, IAM role and instance profile, and the subnets,
  security groups and AMIs the selector terms resolved to, each AMI with its
  requirements. A NodePool's or NodeClaim's node class opens its EC2NodeClass.

### Why a node is not disrupted

Karpenter-managed nodes and NodeClaims have a **Disruption** tab that answers
"why isn't Karpenter removing this node?". It lists what holds the node right now:

- `karpenter.sh/do-not-disrupt` on the node, its NodeClaim or one of its pods,
  including the duration form;
- PodDisruptionBudgets that allow no eviction, or that overlap on one pod;
- the NodePool's disruption budgets that are active now, with the nodes already
  being disrupted subtracted;
- `consolidateAfter` set to `Never` or still cooling down, a `WhenEmpty` policy
  on a node that still runs pods, and a NodeClaim that is not initialized.

Each blocker names the disruption reasons it holds back, so the headline can say,
for example, that the node will not be consolidated but can still be replaced
when it drifts. The tab also shows the NodePool's consolidation and expiry
settings, its budgets with their schedules (in UTC), and Karpenter's own
disruption events for the node, its NodeClaim and its NodePool.

When your access does not include Pods or PodDisruptionBudgets in every
namespace, the tab says it cannot tell rather than reporting that nothing blocks
the node. On a cluster running Karpenter, every node has the tab; one Karpenter
does not manage says so.

## KEDA

Shown when the `keda.sh` CRDs are present.

- **ScaledObjects** — target workload, replica range, triggers, and the
  **Ready**, **Active**, **Fallback** and **Paused** state. A one-direction pause
  (`paused-scale-in` or `paused-scale-out`) shows as such. The detail lists each
  trigger with its metric and authentication, the scaling settings (polling
  interval, cooldowns, fallback, the formula that combines several scalers), and
  links to the HPA KEDA created.
- **ScaledJobs** — triggers, scaling strategy and the job template, with a
  **Jobs** tab listing the Jobs KEDA started.
- **TriggerAuthentications** and **ClusterTriggerAuthentications** — the
  sources each one reads credentials from (Secrets, ConfigMaps, environment
  variables, bound service account tokens, pod identity, HashiCorp Vault, Azure
  Key Vault, AWS Secrets Manager, GCP Secret Manager) and the ScaledObjects and
  ScaledJobs that use it. Klustr never reads a secret value; a Vault token
  written into the spec shows as **token in spec**.

**Pause** on a ScaledObject either keeps the current replica count or scales to
a number you give and holds it there, through KEDA's
`autoscaling.keda.sh/paused` and `paused-replicas` annotations. ScaledJobs pause
and resume as a whole. **Resume** clears every pause annotation, the
one-direction ones included.

### KEDA-managed HPAs

A KEDA-managed HPA is a vanilla HorizontalPodAutoscaler whose metrics are all
`External` and named `s0-…`, `s1-…` — without help they render as a wall of
identical "external" rows. Klustr maps each back to its ScaledObject trigger and
relabels it with the real trigger type plus the metadata that predicts scaling
(Prometheus metric + threshold, cron schedule, Kafka topic + lag, and so on).

Open a KEDA-owned HPA under **Config → HorizontalPodAutoscalers** and the
Targets read as real triggers instead of opaque external metrics.
