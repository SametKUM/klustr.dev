# Kyverno & policy reports

When Kyverno's CRDs are present, Klustr adds a **Kyverno** sidebar group. Each entry
appears only in contexts that serve its CRD, and the served API versions are read
from the discovered CRDs. The integration is read-only: Klustr shows policies,
exceptions and reports and changes none of them.

## ClusterPolicies and Policies

The lists show each policy's title, category and severity (from the
`policies.kyverno.io/*` annotations the Kyverno policy library sets), its validate
action, its rule counts, whether it runs in background scans, and whether Kyverno
reports it **Ready**.

The action is resolved per rule: a rule's `validate.failureAction` wins over the
deprecated policy-wide `validationFailureAction`, and Kyverno's default is
**Audit**. A policy that mixes the two shows **Mixed**.

A policy's detail lists every rule with its type (`validate` with `pattern`,
`anyPattern`, `deny`, `cel`, `podSecurity` and so on, or `mutate`, `generate`,
`verifyImages`), its action, its message and a summary of what it matches and
excludes, such as `Pod · namespaces: kube-system, kyverno`. It also shows whether
the policy runs on admission, and:

- **Autogen rules** — the `autogen-…` rules Kyverno derives from Pod rules for
  Deployments, Jobs and the other Pod controllers. Reports and exceptions refer to
  rules by these names.
- Whether Kyverno generated a ValidatingAdmissionPolicy for the policy, or why not.
- Kyverno's `PolicyViolation` events for the policy on the **Events** tab.

## CEL policies

Each of Kyverno's CEL policy kinds (`policies.kyverno.io`) has its own entry, next
to its namespaced variant (**Namespaced ValidatingPolicies**, **Namespaced
MutatingPolicies** and so on). Every detail shows the resources the policy matches,
namespace and object selectors, match conditions, variables and the policy's
conditions. The views apply the controller's defaults, so a field the policy leaves
out reads the way Kyverno treats it.

- **ValidatingPolicies** — their actions (Deny, Audit, Warn) and each validation's
  CEL expression and message. A policy without `validationActions` is **Deny**.
- **ImageValidatingPolicies** — the images they match and the image extractors,
  the attestors they trust (cosign keys, keyless identities and certificates, or
  Notary) and the attestations they check, whether a signature is
  required, digest handling, registry credentials and the failure policy.
- **MutatingPolicies** — each mutation with its patch type and expression, the
  target resources and conditions, whether they mutate existing resources in the
  background as well as on admission, and the reinvocation policy.
- **GeneratingPolicies** — the triggers and what each one generates, whether the
  generated objects are kept in sync, and whether existing triggers are processed
  too. **On policy delete** says whether the generated objects stay: Kyverno keeps
  them unless the policy synchronizes.
- **DeletingPolicies** — the schedule with the last and next run, the conditions
  under which matched resources are deleted, and the deletion propagation. The
  next run comes from Kyverno's own cron parser, in UTC.

## PolicyExceptions

Each exception lists the policies and rules it exempts, linked to the policy, and
what it applies to, including any pod security controls it relaxes.

## Policy reports

**PolicyReports** and **ClusterPolicyReports** are the Kubernetes Policy Working
Group's `wgpolicyk8s.io` reports. Kyverno writes one per resource, so the list names
the resource and counts its results; the reports with the most failures come first.
A report's detail lists the results worst first (fail, error, warn, skip, pass),
links to the resource it is about, and links each Kyverno result to the policy that
produced it.

Two links connect policies and resources:

- **Violations** — when the cluster has the report CRDs, every policy's detail has
  a tab listing the resources it fails or warns on, across all reports. Each row
  opens the resource. DeletingPolicies have no such tab.
- **Policy** — when Kyverno keeps a report for a built-in resource, that resource's
  detail gets a **Policy** tab, with the number of failing results on the tab
  itself. Resources without a report show no such tab. Kyverno names each report
  after its resource's UID, so this lookup is a single request.

## When the reports are empty

Kyverno's reports controller writes the reports. If it is disabled, the report
views stay empty, policies show no violations, and resources show no **Policy**
tab, while the policies themselves still enforce or audit. Audit failures may still
show up as `PolicyViolation` events on the policy's **Events** tab.
