# Getting started

Klustr is a pure client: it installs nothing in your cluster and uses the same
`~/.kube/config` your `kubectl` already reads. Launch the app, point it at a
context, and you see a live view of everything that context has permission to see.

## Connecting to a context

1. On launch, Klustr reads `~/.kube/config` and lists every context it finds on
   the **Connections** screen.
2. Click a context to connect. You land on the resource browser with the sidebar
   on the left.
3. The header's **Disconnect** button drops you back to the Connections screen at
   any time.

You can pin a context as the default with **Auto-connect** on its card — Klustr
will connect to it directly on the next launch instead of showing the picker.

Connecting starts only the Namespace and Pod informers up front; every other
resource kind starts watching the first time you open it. Opening a kind you have
no permission to list shows an empty table rather than erroring — Klustr probes
your access on connect and simply hides what you can't see.

## Selecting namespaces

The namespace selector in the header filters every list view:

- Leave it empty for **all namespaces** (the default).
- Pick one or more namespaces to narrow the view. The selection is remembered per
  cluster (and per multi-cluster set) across restarts.
- Press `⌘N` to search namespaces quickly, and star the ones you use most so they
  float to the top.

Switching namespaces only changes what the lists query — it never restarts the
underlying watches, so it's instant.

## Read-only mode

Each context has a per-context **read-only** switch. When it's on, every mutating
action (apply, delete, scale, restart, Helm install/upgrade, sync, …) is blocked
for that context. Use it to browse a production cluster with confidence that no
button can change anything.

## Reading a resource

Click a row and the resource opens in the **inspector** beside the list. The list
stays live and keeps its filter, scroll position and page, and the row you are
reading stays highlighted, so you never lose your place.

- Drag the divider to resize the inspector. Double-click it, or focus it and press
  `Enter`, to go back to the default width. The expand button in the inspector
  header fills the workspace with it, and a window too narrow for both panes shows
  it at full width.
- Beside a narrow inspector the list switches to compact columns. Your saved
  column settings are left as they are.
- The arrows in the inspector header, or `Alt+↑` / `Alt+↓`, step through the
  current filtered and sorted results, across pages. Moving to another resource
  of the same kind keeps the tab you were reading.
- Links inside the inspector open the referenced resource in place; the back
  arrow returns to the previous one and to the tab you were on.
- `F6` moves focus between the list and the inspector, and `Esc` closes it.
- Navigating away from an unapplied YAML edit asks you to **Keep editing** or
  **Discard changes**.

Log, exec and editor sessions keep running while you resize or expand the
inspector.

## Finding things fast

- `⌘K` — command palette: jump to any view or custom resource kind, toggle
  contexts, or open the terminal.
- `⌘P` — search pods by name.
- `⌘N` — namespace search.
- `/` — focus the filter of the current list.
- `?` — keyboard shortcut cheatsheet.

On Linux and Windows, use `Ctrl` in place of `⌘`.

## Next steps

- Connecting to more than one cluster at once: [Multi-context & aggregated mode](multi-context.md).
- Your kubeconfig uses `aws-vault` or another exec credential helper and Klustr
  can't authenticate when launched from the Dock: [Credential helpers](credential-helpers.md).
