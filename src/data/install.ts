import { LATEST_RELEASE_URL, RELEASES_URL, SITE } from '../lib/site'

export type Brand = 'apple' | 'archlinux' | 'ubuntu' | 'linux' | 'windows' | 'source'

export type InstallTab = {
  id: 'mac' | 'arch' | 'deb' | 'win' | 'build'
  label: string
  brand: Exclude<Brand, 'linux'>
  html: string
}

const P = '<span class="prompt">$ </span>'
const PS = '<span class="prompt">PS&gt; </span>'
const C = (text: string) => `<span class="comment">${text}</span>`

// Each command block is HTML for a `pre.cmd`: a prompt span starts a copyable
// command, a comment span is a free note, and a trailing backslash continues
// the command on the next line. CommandBlock splits it into per-command rows.
export const INSTALL_TABS: InstallTab[] = [
  {
    id: 'mac',
    label: 'macOS',
    brand: 'apple',
    html: `${P}brew tap sametkum/klustr
${P}brew install klustr`,
  },
  {
    id: 'arch',
    label: 'Arch',
    brand: 'archlinux',
    html: `${P}paru -S klustr-bin   ${C('# or: yay -S klustr-bin')}`,
  },
  {
    id: 'deb',
    label: 'Debian / Ubuntu',
    brand: 'ubuntu',
    html: `${P}V=$(curl -fsSL https://api.github.com/repos/${SITE.repo}/releases/latest \\
    | grep -oP '"tag_name":\\s*"\\K[^"]+')
${P}curl -LO https://github.com/${SITE.repo}/releases/download/$V/klustr_\${V#v}_amd64.deb
${P}sudo apt install ./klustr_\${V#v}_amd64.deb`,
  },
  {
    id: 'win',
    label: 'Windows',
    brand: 'windows',
    html: `${PS}$V = (Invoke-RestMethod https://api.github.com/repos/${SITE.repo}/releases/latest).tag_name
${PS}Invoke-WebRequest "https://github.com/${SITE.repo}/releases/download/$V/klustr-$V-windows-amd64.zip" -OutFile klustr.zip
${PS}Expand-Archive klustr.zip "$env:LOCALAPPDATA\\Programs\\Klustr" -Force
${PS}&amp; "$env:LOCALAPPDATA\\Programs\\Klustr\\klustr.exe"`,
  },
  {
    id: 'build',
    label: 'Build',
    brand: 'source',
    html: `${P}mise install   ${C('# Go, Node, Wails CLI')}
${P}wails dev`,
  },
]

export const MAC_MANUAL = `${P}tar -xzf klustr-*-darwin-arm64.tar.gz
${P}mv klustr.app /Applications/
${P}open /Applications/klustr.app`

export const ARCH_HELPERS = `${P}paru -S klustr-bin
${C('# or')}
${P}yay -S klustr-bin`

export const LINUX_TARBALL = `${P}tar -xzf klustr-*-linux-amd64.tar.gz
${P}install -Dm755 klustr ~/.local/bin/klustr`

export const FROM_SOURCE = `${P}mise install
${P}wails dev`

export const BUILD_RELEASE = `${P}mise install
${P}wails build -trimpath -clean`

export const BREW_UPGRADE = `${P}brew upgrade klustr`

export const AUR_UPGRADE = `${P}paru -Syu`

export const VERIFY_DOWNLOAD = `${P}V=$(curl -fsSL https://api.github.com/repos/${SITE.repo}/releases/latest \\
    | grep -oP '"tag_name":\\s*"\\K[^"]+')
${P}curl -LO https://github.com/${SITE.repo}/releases/download/$V/SHA256SUMS
${P}sha256sum -c --ignore-missing SHA256SUMS   ${C('# macOS: shasum -a 256 -c --ignore-missing SHA256SUMS')}
${P}gh attestation verify klustr-$V-linux-amd64.tar.gz --repo ${SITE.repo}`

// The install page and its markdown version both render from the copy below,
// so a step changed here changes both. Prose fields are inline markdown.
export type InstallStep = { label: string } | { lead: string } | { command: string } | { note: string }

export type InstallPlatform = {
  id: string
  title: string
  brand: Brand
  iconSize: string
  summary: string
  steps: InstallStep[]
}

const tab = (id: InstallTab['id']) => INSTALL_TABS.find((t) => t.id === id)!.html

export const INSTALL_PAGE = {
  title: 'Install Klustr on macOS, Linux and Windows',
  description:
    'Install Klustr on macOS with Homebrew or the notarized app bundle, on Arch from the AUR, on Debian and Ubuntu from the .deb, on any Linux from the tarball, or on Windows from the zip. Verify downloads with SHA256SUMS and build provenance.',
  lede: (version?: string) =>
    `Every release is built by CI from a tagged commit and published on GitHub Releases${version ? `; the current version is ${version}` : ''}. Pick your platform, then point Klustr at a kubeconfig context.`,
}

export const INSTALL_PLATFORMS: InstallPlatform[] = [
  {
    id: 'macos',
    title: 'macOS',
    brand: 'apple',
    iconSize: '1.2rem',
    summary: 'Apple Silicon. Signed with a Developer ID certificate and notarized by Apple.',
    steps: [
      { label: 'Homebrew' },
      { command: tab('mac') },
      { note: 'After the initial tap, `brew search klustr` and `brew info klustr` find it like any other formula.' },
      { label: 'Manual' },
      { lead: `Download the darwin-arm64 tarball from the [latest release](${LATEST_RELEASE_URL}), then:` },
      { command: MAC_MANUAL },
      { note: 'Gatekeeper opens the notarized bundle directly, even offline.' },
    ],
  },
  {
    id: 'arch',
    title: 'Arch, CachyOS, Manjaro',
    brand: 'archlinux',
    iconSize: '1.2rem',
    summary: 'AUR package klustr-bin, bumped automatically on every release.',
    steps: [
      { command: ARCH_HELPERS },
      { note: 'The PKGBUILD uses the prebuilt release tarball, so the install completes in seconds.' },
    ],
  },
  {
    id: 'debian',
    title: 'Debian, Ubuntu',
    brand: 'ubuntu',
    iconSize: '1.2rem',
    summary: 'amd64 .deb attached to every release.',
    steps: [
      { command: tab('deb') },
      {
        note: 'The package pulls in webkit2gtk-4.1 and gtk-3 automatically and registers a desktop entry. Run the three commands one at a time; the first one resolves the latest tag.',
      },
    ],
  },
  {
    id: 'linux',
    title: 'Linux tarball',
    brand: 'linux',
    iconSize: '1.25rem',
    summary: 'amd64, for any distribution that ships the runtime libraries.',
    steps: [
      { lead: `Download the linux-amd64 tarball from the [latest release](${LATEST_RELEASE_URL}), then:` },
      { command: LINUX_TARBALL },
    ],
  },
  {
    id: 'windows',
    title: 'Windows',
    brand: 'windows',
    iconSize: '1.2rem',
    summary: 'amd64 zip, tested on Windows 11. Not code-signed yet.',
    steps: [
      { command: tab('win') },
      {
        note: 'Run the commands one at a time in PowerShell; the first one resolves the latest tag. Klustr renders through the WebView2 runtime that ships with Windows 11.',
      },
      {
        note: 'Downloaded with a browser instead, the unsigned `klustr.exe` gets a SmartScreen warning on first launch: choose More info, then Run anyway. With Smart App Control on, Windows blocks unsigned apps outright.',
      },
    ],
  },
  {
    id: 'source',
    title: 'Build from source',
    brand: 'source',
    iconSize: '1.1rem',
    summary: 'mise pins Go, Node and the Wails CLI; one command installs all three.',
    steps: [{ command: BUILD_RELEASE }],
  },
]

export const INSTALL_UPDATE = {
  id: 'update',
  title: 'Updating',
  intro: 'Klustr checks GitHub Releases for a newer version and tells you when one exists; it never replaces itself.',
  channels: [
    { label: 'Homebrew', command: BREW_UPGRADE },
    { label: 'AUR', command: AUR_UPGRADE },
  ],
  note: 'The .deb, the tarballs and the Windows zip are replaced by downloading the new release.',
}

export const INSTALL_VERIFY = {
  id: 'verify',
  title: 'Verify a download',
  intro:
    "Every release ships a SHA256SUMS file, and each asset carries build provenance that ties it to the commit and workflow run that produced it. Swap the asset name for the one you downloaded. On Windows, `Get-FileHash` prints the SHA-256 to compare with the zip's line in SHA256SUMS.",
  command: VERIFY_DOWNLOAD,
}

export const INSTALL_REQUIREMENTS = {
  id: 'requirements',
  title: 'Requirements',
  items: [
    'A kubeconfig. Klustr reads `~/.kube/config` and honors `KUBECONFIG`; if kubectl works, Klustr works.',
    'macOS on Apple Silicon.',
    'Linux amd64 with `webkit2gtk-4.1` and `gtk-3`. Ubuntu 24.04+, Fedora 39+ and Arch ship them; Ubuntu 22.04 needs `libwebkit2gtk-4.1-0 libgtk-3-0` first.',
    'Windows 11 on amd64, which ships the WebView2 runtime.',
    'Nothing in the cluster. Klustr installs no agent, operator or CRD.',
  ],
  note: `All assets, including older versions, are on [GitHub Releases](${RELEASES_URL}).`,
}
