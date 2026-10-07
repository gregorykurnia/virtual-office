# Step 20 — Always-on host readiness

Assessment date: 7 October 2026

Status: **In progress — Oracle VM details are available, but SSH access timed out before host inspection.**

This assessment records what was verifiable from the current development workstation. It does not claim that a remote host, OpenClaw installation, private network, or provider account does not exist elsewhere.

## Owner-provided Oracle setup details

- Provider: Oracle Cloud; the owner now reports that the VM has been created. Its running state has not been verified.
- Selected region: Batam (`ap-batam-1`); home-region status remains unverified.
- VCN name: `investment-office-vcn`.
- Subnet name: `investment-office-subnet`.
- Configured private DNS hostname: `investment-office.investmentoffic.investmentoffic.oraclevcn.com`.
- Image reported by the owner: `Canonical-Ubuntu-24.04-Minimal-aarch64-2026.09.18-0`; the OCI instance record has not been inspected.
- Public IPv4 supplied by the owner: redacted in this repository. SSH to TCP port 22 from the workstation timed out; no SSH session was established.
- Expected SSH login: `ubuntu`, based on OCI's default for Ubuntu platform images; not yet authenticated.
- The private DNS hostname did not resolve from this workstation and is not a verified public connection address.

The workstation observations below include this follow-up preflight. The local Step 20 key-path configuration names both private and public key files; both files exist and are readable. Key contents and local paths were not recorded.

## Observed inventory

| Item | Verified observation | Step 20 status |
| --- | --- | --- |
| Current execution machine | macOS 25.2.0, ARM64; this is the owner's laptop environment, not an always-on Linux host. | Does not satisfy the host requirement. |
| Local runtime | Node `v20.20.2`, npm `10.8.2`. The repository pins Node `26.10.0` in `.node-version`. | No compatible server runtime installed or checked. |
| Host target | Owner reports an Oracle Cloud VM with the image and public IPv4 above. OCI running state and VNIC attachment have not been verified. | Host selected; connection pending. |
| SSH route | A read-only SSH connection attempt to the supplied public IPv4 on TCP port 22 timed out, including an attempt outside the shell sandbox. The private DNS hostname did not resolve from this workstation. | No SSH handshake or host inventory yet; inspect OCI state, routing, and ingress. |
| Local SSH key | The ignored local Step 20 configuration points to existing readable private/public key files. Their values and paths were not included in this record. | Key files are available locally; authorization by the VM is unverified. |
| OpenClaw | `openclaw` is not on this shell's `PATH`. No remote executable, release, service, or Gateway was inspected. | No server installation verified. |
| Private administration | An SSH client is installed. `tailscale` is not on this shell's `PATH`. No private network, remote login, or second SSH session was verified. | Pending on the selected host. Do not tighten ingress before the second access path is proven. |
| Service identities | No remote application or OpenClaw service accounts could be inspected or created. | Create distinct nonroot accounts on the selected Linux host. |
| Network boundaries | The app API example binds to `127.0.0.1:3001`; there is no deployed receiver or Gateway listener to inspect. | Keep Gateway and integration receiver private; expose only the intended private app ingress. |
| Time | The product timezone is `Asia/Jakarta`; no server time service or synchronization state was available to inspect. | Verify time synchronization on the host; persist UTC and display WIB. |
| Persistent storage | No remote volume or runtime directories are configured. Paths such as `/opt/investment-office`, `/var/lib/investment-office`, and `/srv/investment-agents` are examples in the guide, not verified paths. | Select and verify durable app configuration, Gateway state, and workspace storage on the host. |
| Outbound access | No server was available for connectivity checks to model/search providers or Firebase Auth/Firestore. | Verify from the server after host and provider configuration; do not infer access from laptop connectivity. |
| Laptop dependencies | No production research path has been established. The current workspace and local tools run on the laptop. | Ensure the deployed model, search, browser, credentials, and Gateway do not depend on the owner's devices. |

## Required next actions

1. In OCI, verify the VM is running and the supplied public IPv4 is attached to its primary VNIC. Check that the subnet has a route to an Internet Gateway and inspect both attached security lists and Network Security Groups for SSH ingress.
2. Inspect the attached security lists and NSGs before changing rules. If public SSH is intended and no current rule permits it, add stateful TCP port 22 ingress from the owner's current public client address (`/32`); do not open it to all IPv4 sources or remove an existing working rule before a second access path is proven. If the VM is private-only, establish an authorized private route such as OCI Bastion, VPN, or Tailscale instead.
3. Once TCP/22 is reachable, retry the read-only inventory before changing the host. If OCI network settings appear correct but SSH still times out, inspect `sshd` and the host firewall through OCI's console/serial access.
4. After successful login, record OS, architecture, resources, users, existing runtimes/services, network listeners, storage, and time synchronization before creating service identities or installing runtimes.
5. Establish private administration and prove a second working connection before tightening existing ingress. Keep the Gateway and integration receiver private.
6. Verify clock synchronization, persistent paths, required outbound provider/Firebase connectivity, and that no required component depends on the laptop.

No accounts, infrastructure, firewall rules, services, or credentials were changed during this assessment. The next step is to resolve the Oracle-side network path or use a private access route, then repeat the read-only inventory.

The host/network sequence was checked against Oracle's [instance details](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/inst-get.htm), [public IP requirements](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingpublicIPs.htm), and [security list rules](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/creating-securitylist.htm). The network and storage guidance was also checked against the [official OpenClaw Linux server guide](https://docs.openclaw.ai/vps), whose secure default keeps Gateway state on the server and the Gateway itself on loopback, accessed through SSH tunneling or a private network.
