# Tekton Pipelines

When the `tekton.dev` CRDs are present, Klustr adds a **Tekton** sidebar group with
**PipelineRuns**, **TaskRuns**, **Pipelines** and **Tasks**, plus the
[Triggers](#tekton-triggers) kinds when Tekton Triggers is installed. Each entry
appears only in contexts that serve its CRD, lists update live, and the served API
version is read from the discovered CRD. No `tkn` CLI and no Tekton Dashboard are
involved.

## PipelineRuns

The list shows the Pipeline, the status with the controller's own reason
(`Succeeded`, `Completed`, `PipelineRunTimeout` and so on), a task tally such as
`11 done, 1 failed, 4 skipped`, when the run started and how long it took. Newest
runs come first, and a running run's duration keeps counting.

A PipelineRun's detail joins three things into one **task table**:

- every task of the resolved pipeline, in pipeline order, with its task reference
  and `runAfter` dependencies;
- the TaskRun that executed it, with status and duration (a matrixed task gets one
  row per TaskRun);
- tasks that never ran: **Skipped** with the reason (usually a `when` expression),
  or **Not run** when the pipeline ended first.

Finally tasks get their own table. A row opens its TaskRun, and the back button
returns to the PipelineRun.

Above the table, a **Graph** draws the tasks left to right in dependency order,
from `runAfter` and from result references, each colored by its state. Clicking a
task opens its TaskRun. The detail also lists params, workspaces with their
volume source (`Secret git-credentials`, `PVC template (1Gi)`), results, the
service account and timeout, and links to the Pipeline. Tekton's events for the
run are on the **Events** tab.

## TaskRuns

The list shows the Task, the PipelineRun it belongs to, status, finished and total
steps, and duration. The detail lists each **step** with its state, exit code,
image and duration, and links to the Task, the PipelineRun and the pod.

The **Logs** tab streams the TaskRun's pod with the most useful step preselected:
the running one, else the first that failed, else the last that ran. Tekton deletes
the pods of finished runs when they are pruned; for such a run the tab says the pod
is gone instead of showing an error.

## Pipelines and Tasks

- **Pipelines** — the declared tasks with their task reference (linked to the
  Task), `runAfter` and the number of `when` conditions, plus params with types
  and defaults, workspaces and results. A **Graph** draws the same tasks in
  dependency order, and clicking one opens its Task. The **Runs** tab lists the
  pipeline's runs, newest first.
- **Tasks** — each step with its image or StepAction, command and script, plus
  params, workspaces, results and sidecars.

## Start a pipeline

**Start** on a Pipeline opens a form for a new PipelineRun:

- **Params** — one field per declared param, prefilled with its default. An array
  takes one item per line and an object one `key=value` per line; a param without
  a default is marked required. Params left at their default are not sent, so
  Tekton applies them as the Pipeline declares them.
- **Workspaces** — each workspace binds to a new volume per run (with a size and
  an optional storage class), an empty directory, an existing PVC, a ConfigMap or
  a Secret. An optional workspace can stay unbound.
- **Service account** and **Timeout**, both optional.

Klustr creates the PipelineRun and opens it as soon as its watch is running, so
you follow the run from its first task.

## Cancel and rerun

- **Cancel** appears on an active PipelineRun or TaskRun. It sets `spec.status` the
  way `tkn pipelinerun cancel` and `tkn taskrun cancel` do: cancelling a PipelineRun
  stops its running TaskRuns and skips the finally tasks, and cancelling a TaskRun
  that belongs to a PipelineRun fails that PipelineRun.
- **Rerun** creates a new PipelineRun from the same spec, named
  `<name>-r-<random>`, the naming the Tekton Dashboard uses. It starts right away
  with the same params and workspaces.

Both ask for confirmation first. Start, Cancel and Rerun all respect a context's
[read-only mode](getting-started.md#read-only-mode).

## Tekton Triggers

When the `triggers.tekton.dev` CRDs are present, the Tekton group also lists:

- **EventListeners** — the address the listener serves, its readiness, the
  Deployment and Service it runs as, the service account, and each trigger with
  its bindings, template and interceptor chain. Namespace and label selectors
  show which Triggers a listener picks up.
- **Triggers** — bindings, template and interceptors, and the EventListeners
  that refer to the Trigger by name.
- **TriggerTemplates** — their params and the resources each one creates, by
  kind and name. A PipelineRun or TaskRun in the template links to the Pipeline
  or Task it runs.
- **TriggerBindings** and **ClusterTriggerBindings** — the params they extract
  from an event and the expressions behind them.

A trigger's bindings and template open their own detail.

## Large CI clusters

Tekton copies the whole resolved Task or Pipeline spec into every run's status.
Klustr drops those copies from its cache and reads a run in full only when its
detail is open, which keeps memory in check on clusters with thousands of runs.
Opening a PipelineRun lists just its own TaskRuns, so the cluster-wide TaskRun list
loads only when you open **TaskRuns**. With thousands of TaskRuns, that first load
can take a few seconds; the view shows that it is starting its watch until the list
arrives.
