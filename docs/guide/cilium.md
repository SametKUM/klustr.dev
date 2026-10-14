# Cilium

When Cilium's CRDs are present, Klustr adds a **Cilium** sidebar group with
views for 14 `cilium.io` kinds. Each entry appears only in contexts that serve its
CRD, and each is read at the API version the cluster serves, so `v2` and
`v2alpha1` kinds sit side by side.

## The lists

Every list has a **Reported status** column, the CRD's conditions as
`Type=Status`; endpoints show their state there instead. Two more columns are
chosen per kind:

- **NetworkPolicies** and **ClusterwideNetworkPolicies** — the endpoint or node
  selector, and the number of ingress, egress and deny rules.
- **Endpoints** — the endpoint's addresses and its security identity.
- **Nodes** — the pod CIDRs and how many IPs are allocated.
- **Identities** — the security labels.
- **CIDRGroups** — the external CIDRs.
- **LoadBalancerIPPools** — the IP blocks and the service selector.
- **L2AnnouncementPolicies** — the service and node selectors.
- **EgressGatewayPolicies** — the destination CIDRs and the selectors.
- **BGPClusterConfigs**, **BGPPeerConfigs**, **BGPAdvertisements**,
  **BGPNodeConfigs** and **BGPNodeConfigOverrides** — the node selector or node,
  and the BGP instances, address families, advertisement types or overrides.

## Network policies

A policy's detail splits it into two tables:

- **Traffic rules** — one row per ingress, egress and deny rule: the peers
  (endpoints, entities, CIDRs with their exceptions, CIDR groups, FQDNs), ports and
  port ranges, ICMP types, and L7 matches such as HTTP method, path and headers.
- **Policy selectors** — the endpoint or node selector of each rule set and its
  default-deny settings for ingress and egress.

A ClusterwideNetworkPolicy reads the same way, including its node selectors.

## Endpoints, nodes and identities

- An **endpoint** shows its state, endpoint ID, security identity and labels, the
  node it runs on, the identities its policy allows in each direction, its named
  ports, and any controllers that keep failing with their last error.
- A **node** shows its pod CIDRs, health addresses, IPAM pre-allocation and
  limits, its node addresses, and its allocated and available IPs.
- An **identity** shows its security labels; a **CIDR group** its external CIDRs.

## IP pools, L2 announcements and egress gateways

- **LoadBalancerIPPools** — the IP blocks, the service selector, and the total,
  used and available IPs Cilium reports.
- **L2AnnouncementPolicies** — the service and node selectors, the interfaces, and
  whether external and LoadBalancer IPs are announced.
- **EgressGatewayPolicies** — the destination and excluded CIDRs and the egress
  gateways with their node selectors.

## BGP

- **BGPClusterConfigs** — the node selector and the BGP instances with their peers.
- **BGPPeerConfigs** — transport and timers, graceful restart, eBGP multihop TTL,
  the address families with their advertisements, and the authentication Secret
  by name.
- **BGPAdvertisements** — what each advertisement announces.
- **BGPNodeConfigs** and **BGPNodeConfigOverrides** — the per-node instances and
  overrides, and the peers and routes Cilium reports for the node.

## Related resources and what stays out

A detail's **Related resources** section links to the objects it names
explicitly, such as an endpoint's Pod, a node's Node, a policy's CIDR groups and
TLS Secrets, or a peer config's authentication Secret, in the same context.

Klustr projects only the fields above and never shows a raw spec: BGP
authentication and policy TLS settings can point at secret material, so a Secret
appears by name only. Cilium has no actions of its own here; YAML edit and delete
work as for any custom resource and respect a context's
[read-only mode](getting-started.md#read-only-mode).
