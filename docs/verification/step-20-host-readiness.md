# Step 20 — Always-on host readiness

Assessment date: 7 October 2026

Status: **Not complete — no target Linux host is available to prepare.**

This assessment records what was verifiable from the current development workstation. It does not claim that a remote host, OpenClaw installation, private network, or provider account does not exist elsewhere.

## Owner-provided Oracle setup details

- Provider: Oracle Cloud; instance creation is in progress, not yet verified as running.
- Selected region: Batam (`ap-batam-1`); home-region status remains unverified.
- VCN name: `investment-office-vcn`.
- Subnet name: `investment-office-subnet`.
- Configured private DNS hostname: `investment-office.investmentoffic.investmentoffic.oraclevcn.com`.
- Public IPv4 address and SSH connectivity: not yet supplied or verified. The private DNS hostname is not a verified public connection address.

The workstation observations below describe the initial assessment before these owner-provided setup details.

## Observed inventory

| Item | Verified observation | Step 20 status |
| --- | --- | --- |
| Current execution machine | macOS 25.2.0, ARM64; this is the owner's laptop environment, not an always-on Linux host. | Does not satisfy the host requirement. |
| Local runtime | Node `v20.20.2`, npm `10.8.2`. The repository pins Node `26.10.0` in `.node-version`. | No compatible server runtime installed or checked. |
| Host target | No Linux VPS address, provider, region, OS image, or authorized SSH target was supplied. No named SSH host is present in the workstation's `~/.ssh/config`. | Pending host selection/access. |
| OpenClaw | `openclaw` is not on this shell's `PATH`. No remote executable, release, service, or Gateway was inspected. | No server installation verified. |
| Private administration | An SSH client is installed. `tailscale` is not on this shell's `PATH`. No private network, remote login, or second SSH session was verified. | Pending on the selected host. Do not tighten ingress before the second access path is proven. |
| Service identities | No remote application or OpenClaw service accounts could be inspected or created. | Create distinct nonroot accounts on the selected Linux host. |
| Network boundaries | The app API example binds to `127.0.0.1:3001`; there is no deployed receiver or Gateway listener to inspect. | Keep Gateway and integration receiver private; expose only the intended private app ingress. |
| Time | The product timezone is `Asia/Jakarta`; no server time service or synchronization state was available to inspect. | Verify time synchronization on the host; persist UTC and display WIB. |
| Persistent storage | No remote volume or runtime directories are configured. Paths such as `/opt/investment-office`, `/var/lib/investment-office`, and `/srv/investment-agents` are examples in the guide, not verified paths. | Select and verify durable app configuration, Gateway state, and workspace storage on the host. |
| Outbound access | No server was available for connectivity checks to model/search providers or Firebase Auth/Firestore. | Verify from the server after host and provider configuration; do not infer access from laptop connectivity. |
| Laptop dependencies | No production research path has been established. The current workspace and local tools run on the laptop. | Ensure the deployed model, search, browser, credentials, and Gateway do not depend on the owner's devices. |

## Required next actions

1. Select an existing authorized Linux VPS and provide its SSH target and OS, or select a provider/region and monthly budget for a new host.
2. Inspect the host and its current services before changing it; record provider, instance, OS, resources, runtime/service paths, and storage.
3. Create separate nonroot application and OpenClaw service identities and install the repository's pinned compatible Node runtime.
4. Establish private administration, prove a second working session, then restrict ingress. Keep the Gateway and integration receiver private.
5. Verify clock synchronization, persistent paths, required outbound provider/Firebase connectivity, and that no required component depends on the laptop.

No accounts, infrastructure, firewall rules, services, or credentials were changed during this assessment. The next step depends on the owner identifying an authorized host or giving provider, region, and budget constraints.

The network and storage guidance was checked against the [official OpenClaw Linux server guide](https://docs.openclaw.ai/vps) on the assessment date. Its secure default keeps Gateway state on the server and the Gateway itself on loopback, accessed through SSH tunneling or a private network.
