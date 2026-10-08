# Step 20 — Always-on host readiness

Assessment date: 8 October 2026

Status: **In progress — host runtime, service identities, persistent paths, clock synchronization, remote egress, SSH tunneling, and an owner-reported SSH source restriction are prepared; provider/Firebase authentication is not configured.**

This record distinguishes owner-reported details from checks performed on the host. It does not claim that OpenClaw or the application is installed, that provider credentials work, or that live research is running.

## Owner-provided Oracle setup details

- Provider: Oracle Cloud; region reported as Batam (`ap-batam-1`); home-region status remains unverified.
- VCN: `investment-office-vcn`; subnet: `investment-office-subnet`.
- Image reported by the owner: `Canonical-Ubuntu-24.04-Minimal-aarch64-2026.09.18-0`.
- Public IPv4 is redacted in this repository. It was confirmed on the primary VNIC and SSH access works.
- Private DNS hostname: `investment-office.investmentoffic.investmentoffic.oraclevcn.com`; it did not resolve from this workstation.
- The owner showed the default security list allowing stateful TCP/22 from `0.0.0.0/0` plus ICMP rules. No NSG names were shown on the primary VNIC. On 8 October the owner reported changing the TCP/22 source to their current public IPv4 `/32`; a fresh SSH connection then succeeded from that same address. The OCI rule's saved value was not independently inspected, so the exact console configuration remains owner-reported. The address is omitted from this repository.

## Verified host inventory and preparation

| Area | Observation and evidence | Status |
| --- | --- | --- |
| OS and architecture | SSH reports Ubuntu 24.04.5 LTS, `aarch64`; account `ubuntu` has passwordless sudo. | Verified |
| Compute and disk | 2 CPUs, 11 GiB RAM, 45.6 GB ext4 root partition (`/dev/sda1`), about 44 GB free at initial inspection. `/`, `/opt`, `/var/lib`, and `/srv` share the boot filesystem; there is no separate data volume or backup policy recorded. | Inventory complete; backup/recovery policy pending |
| Existing services/accounts | Existing Ubuntu/Oracle services include SSH, Oracle Cloud Agent, timesyncd, rpcbind, and system services. No OpenClaw or Investment Office package, running process, or unit file existed before this preparation. Pre-existing `opc` is password-locked and has no sudo rights; `ubuntu` is the active sudo admin. `rpcbind` listens on all interfaces at port 111, while OCI ingress shown to the owner only allows SSH and ICMP. | Existing state recorded; service accounts remain separate |
| Admin and SSH | Public-key SSH works as `ubuntu`; password and keyboard-interactive SSH auth are disabled; TCP forwarding is enabled. Root SSH is currently permitted by key (`PermitRootLogin without-password`). The local private key mode was corrected from 0644 to 0600. The observed ED25519 host key was accepted on first use but not independently compared with OCI console evidence. On 8 October a fresh SSH session succeeded from the owner's current public address after the owner reported narrowing the OCI TCP/22 source to that address. | Connection verified; source-rule value is owner-reported; root key login review remains |
| Second session/private access | A separate SSH session successfully forwarded a temporary loopback-only listener on the VM to the workstation and returned the expected response. The listener exited afterward. This verifies SSH tunnel operation, not a separate recovery route. | Tunnel verified; OCI console remains the recovery path |
| Host firewall | Effective nftables input accepts established traffic, loopback, ICMP, and new TCP/22; other new input is rejected. Egress is allowed except OCI metadata/service-specific restrictions. | Inspected |
| Service identities | Created locked system accounts `investment-office` (no-login shell) and `openclaw`. They are distinct from pre-existing `ubuntu` and `opc` accounts. OpenClaw account has systemd lingering enabled. | Created and checked |
| Runtime | Downloaded Node `v26.10.0` ARM64 from the official Node distribution, checked its archive against the published SHA-256 manifest, and installed it under `/opt/node-v26.10.0-linux-arm64`; `/usr/local/bin` links expose `node`, `npm`, and `npx`. Verified Node `v26.10.0`, npm `11.19.1`, and linked SQLite `3.53.4`. The version and SQLite meet OpenClaw's published Node 26 and WAL-safe SQLite floors. | Installed and validated |
| Dependencies | Installed/confirmed CA certificates, curl, xz, Git, Python 3, and build tools. APT also applied four available package updates; 32 other packages remained held back. | Installed |
| Persistent paths | Code and config: `/opt/investment-office` and `/etc/investment-office` (`root:investment-office`, mode 750). App state: `/var/lib/investment-office` (`investment-office`, mode 700). OpenClaw state: `/var/lib/openclaw/.openclaw` and workspace `/var/lib/openclaw/.openclaw/workspace` (`openclaw`, mode 700). `/srv/investment-agents` is also reserved to `openclaw`, mode 700. Both users ran Node successfully; directory traversal checks confirm cross-account isolation. These paths are on the root boot volume. | Created and checked; backup/reboot restore not tested |
| Time | `systemd-timesyncd` is enabled; `NTPSynchronized=yes`; system timezone is UTC. The app should persist UTC timestamps and display Asia/Jakarta/WIB. | Verified |
| Outbound network | From both service accounts, TLS verification succeeded to Google APIs, OpenAI, Anthropic, Brave Search, and the project Firestore endpoint. Responses were unauthenticated/probe statuses: Google JWK 200, model endpoints 401, Brave Search 422 without query/auth, Firestore 404 without auth. This proves DNS/TLS endpoint reachability only, not API credentials, project/database readiness, or provider functionality. | Basic egress verified; chosen-provider and authenticated checks pending |
| Laptop independence | Host-side outbound probes and remote services run independently of the workstation, but no app/OpenClaw service or credentials have been installed. No live research path exists yet. | Cannot claim complete until later live-path acceptance |

## Changes made in this pass

- Installed the pinned Node runtime and required system packages.
- Created separate application and OpenClaw service accounts, state/config/workspace paths, and OpenClaw user-service lingering.
- No persistent listener, public application port, Gateway, app service, or scheduled job was enabled. The one temporary loopback test listener exited after the tunnel check. OpenClaw installation and onboarding belong to Step 21.
- No provider credentials or Firebase credentials were copied to the VM. No model call or research task was run.

## Remaining acceptance work

1. Confirm the saved OCI TCP/22 source CIDR in the console and retain the OCI console as the recovery path. The owner reports the source was narrowed to their current address and fresh SSH succeeds from that address; the console value was not independently inspected.
2. Decide whether to disable direct root key login; effective SSH configuration currently permits root key authentication (`PermitRootLogin without-password`), while the verified admin path is `ubuntu` plus sudo.
3. Confirm the intended model/search provider names. From the corresponding service account, test the selected endpoints after server-owned credentials are provisioned in Step 21; never record secret values.
4. Verify Firebase Auth/Firestore with the intended project configuration and authorized server identity. Current unauthenticated HTTP responses only establish the network path.
5. Configure application-to-Gateway access only after the supported OpenClaw interface and a loopback-only Gateway are installed and inspected. Keep browser builds and agent workspace free of Gateway credentials.
6. Define and verify a backup/recovery procedure for the boot-volume state, then prove service persistence across logout/reboot in Step 21.
7. Complete Step 21's controlled agent turn and confirm no credential, browser, search service, or local model needed by the research process depends on the workstation.

No recurring jobs or public application listener have been created. The app, OpenClaw Gateway, provider authentication, and live-research path are not installed or configured.

## References

The host/network sequence was checked against Oracle's [instance details](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/inst-get.htm), [public IP requirements](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingpublicIPs.htm), and [security list rules](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/creating-securitylist.htm). Node/SQLite compatibility and the private Gateway posture were checked against the current [OpenClaw Node requirements](https://docs.openclaw.ai/install/node), [Node compatibility table](https://docs.openclaw.ai/install/node-compatibility), and [Linux server guide](https://docs.openclaw.ai/vps).
