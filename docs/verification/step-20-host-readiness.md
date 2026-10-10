# Step 20 — Always-on host readiness

Assessment date: 8 October 2026

Status: **In progress — host identity, service accounts, persistent paths, clock synchronization, listeners, host firewall, and root SSH hardening were re-verified on 8 October 2026 (UTC). A read-only OCI pass on 9 October 2026 confirmed the home region, the single instance, the public network path, and an existing available boot-volume backup. Step 20 is not accepted. Still open: a second TCP 22 source that the owner has not explained, an untested restore, an untested recovery route for security-list edits, and approval for the reboot, `rpcbind`, and backup actions.** Provider and Firebase authentication belong to later gates.

This record distinguishes owner-reported details from checks performed on the host. It does not claim that OpenClaw or the application is installed, that provider credentials work, or that live research is running.

## Current closeout verification — 8 October 2026 (23:17 UTC; 9 October 2026 WIB)

This pass used the existing ignored SSH profile and read-only host and instance-metadata checks. It did not use the OCI API or console, because no OCI credentials were available in this environment. Nothing was changed on the host, and no OCI resource was created, modified, or deleted. The Gateway, scheduler, and job configuration were inspected read-only.

### Verified in this pass

| Area | Evidence | Result |
| --- | --- | --- |
| Admin path | `ssh -F .env.step20.ssh.local investment-office` connected as `ubuntu`; passwordless sudo worked. | Verified |
| Host identity continuity | Current ED25519 host key fingerprint is `SHA256:7N6E8YND28YduQGgYWISqx0lliUd1Ek3VSslUOyhCGQ`. The same fingerprint appears in the first-boot cloud-init log, and the key file was created on 7 October 2026 at 08:58 UTC. | Unchanged since first boot; not yet compared with an OCI console record |
| Instance identity | Instance metadata reports region `ap-batam-1`, shape `VM.Standard.A1.Flex` with 2 OCPU and 12 GB memory, state Running, and display name `investment-office`. Identifiers are private in `.env.step20.oci.local`. | Verified from instance metadata |
| VNIC metadata | Metadata reports only the private subnet CIDR (recorded privately). It does not expose the public address, security-list membership, or NSG membership. | Insufficient for ingress verification |
| Listeners | `sshd` listens on TCP 22; the OpenClaw Gateway listens only on `127.0.0.1:18789` and `[::1]:18789`; `rpcbind` (TCP and UDP 111) listens on all interfaces. | Gateway loopback-only; `rpcbind` needs disposition (below) |
| Host firewall | nftables `INPUT` accepts established traffic, loopback, ICMP, and new TCP 22, then rejects other new input. | Verified |
| Service accounts | `investment-office` (no-login, UID 996) and `openclaw` (UID 995) are distinct; each account cannot list the other's private home or state path. | Verified |
| Persistent paths and modes | `/opt/investment-office` and `/etc/investment-office` are `root:investment-office` 750. `/var/lib/investment-office` is 700 for the app account. `/var/lib/openclaw`, its `.openclaw` state, `workspace`, and `/srv/investment-agents` are `openclaw` 700. | Verified |
| Storage | Root `/dev/sda1` is ext4, 45.6 GB, 39 GB free (13% used), with 5% inode use. The underlying disk is 46.6 GB. | Verified; boot-volume backup not verified |
| Time | `timedatectl` reports UTC, `System clock synchronized: yes`, and NTP service active. | Verified |
| Runtime | Node `v26.10.0`, npm `11.19.1`, OpenClaw `2026.9.8`. The `openclaw-gateway` user unit is enabled and active under lingering. | Verified |
| OpenClaw configuration | The config contains no non-loopback URL host. Gateway authentication uses a secret reference; secret values were not read or printed. | No laptop-held endpoint found in the host config |
| SSH daemon | Effective settings: `permitrootlogin no`, `passwordauthentication no`, `kbdinteractiveauthentication no`, `pubkeyauthentication yes`, `allowtcpforwarding yes`. | Root and password login disabled; TCP forwarding remains enabled |
| Patch state | The simulated security-upgrade list is empty. A reboot is pending for the installed kernel `7.0.0-1012-oracle`, while `6.17.0-1020-oracle` is running. | Reboot requires approval (below) |

### Scheduler and job state

- `automations status --json` reports `enabled: false` and no next wake time. The scheduler is therefore off.
- `automations list --all --json` returns five rows, matching the status count and the Step 25 record. The default list hides disabled rows, which explains the earlier one-row result.
- One row is enabled: `memory-core:memory-dreaming-promotion` (`Memory Dreaming Promotion`). It is a runtime-declared memory maintenance job with cron `0 3 * * *`, an isolated `agentTurn` on the bootstrap `main` agent, and `delivery.mode: none`. It was created on 8 October 2026 at 04:11 UTC, and its next run is 9 October 2026 at 03:00 UTC. It is not Investment Office work and is not on the approved roster. Because the global scheduler is off, it cannot fire now. Once the scheduler is enabled, it would start a model turn.
- Four rows are disabled: heartbeat and skill-collection-review jobs for `main` and for `investment-market`. Their creation timeline is not recorded in the project history. Two of them are on Rex's agent, so they must be reconciled before any Investment Office schedule is activated.
- Recurring Investment Office schedules remain absent. This pass did not change any job.

### OCI items still open

Status after the 9 October read-only pass (see the OCI section below): items 1 to 3 were checked, and item 4 was found to exist. The remaining work is items 5 and 6 and the approval-dependent actions. The original list is kept as the pre-pass record:

1. The saved TCP 22 source in each applicable security list and NSG, the source address range, and any broader overlapping rule. The owner-reported `/32` change still has no saved-rule evidence.
2. The tenancy home region. Oracle's Always Free A1 allowance applies only to compute created in the home region. This instance uses the full 2 OCPU and 12 GB allowance, so another A1 instance would exceed it, and a non-home-region instance may not be free.
3. Boot-volume backup policy, existing backups, and the five Always Free volume backups in the home region. The available backup count and capacity must be checked before any backup is created.
4. A manually created boot-volume backup, verified as `AVAILABLE`. Its identifier stays in the ignored local file. Creating a backup is not a restore test.
5. A restore feasibility assessment: target volume, availability domain, capacity, billing, and a non-disruptive path that does not replace the running boot volume. Restore to a separate volume requires approval before creation.
6. A documented recovery route. The OCI console connection and security-list editing path must be verified before any TCP 22 change.

### Actions proposed for approval

- Reboot to apply the pending kernel, after the OCI recovery route is confirmed and the Gateway's post-boot state is checked. This is disruptive.
- Disable the `rpcbind` service and its socket, which the application does not need. Its firewall-blocked exposure would be removed, but a change to a runtime-adjacent host service requires owner approval.
- Decide what to do with the enabled `memory-core` dreaming job. Options include disabling it through the supported OpenClaw interface, accepting it as runtime maintenance with a recorded decision, or changing the memory plugin. It must be resolved before any scheduler activation in Step 34.
- Decide whether TCP forwarding should remain enabled after the access check is complete. It was needed for the tunnel check.

### Step 20 closeout status

**Not accepted.** Accepted in this pass: host identity continuity, service-account isolation, persistent paths, storage and time, host firewall and listeners, root-login hardening, and loopback-only Gateway binding. Still open: OCI ingress verification, home region, backup creation, restore feasibility, recovery-route verification, reboot approval, `rpcbind` disposition, and the `memory-core` job decision.

Later gates, not Step 20 host items: C1 Firebase Admin authorization, Auth/Rules/indexes/migration, authenticated empty-app acceptance, app-to-Gateway worker composition (C2), provider credential and endpoint tests (Steps 21 and 25), and laptop-off application-report proof (Step 29).

## OCI read-only verification — 9 October 2026

Access: an OCI CLI session created through the browser sign-in, using the profile `investment-office-readonly`. The profile name does not limit permissions. The results below come from reads that this identity actually performed. No create, modify, or delete action was run. Identifiers and addresses are private in `.env.step20.oci.local`.

| Item | Result | Status |
| --- | --- | --- |
| Home region | `ap-batam-1` is the tenancy home region and is `READY`. The VM is in the same region. | Verified |
| Instance | Running `VM.Standard.A1.Flex`, 2 OCPU, 12 GB, in availability domain 1. An OCI Search query across the tenancy finds this as the only instance. | Verified; uses the full A1 Always Free allowance |
| Network path | Public subnet. The VNIC has a public address and no NSG is attached. One security list applies: `Default Security List for investment-office-vcn`. | Verified |
| TCP 22 ingress | Two `/32` sources are allowed. One matches this workstation's current public address, and recent SSH logins on the VM came from that address. The other `/32` is not explained by the owner's reports. ICMP is also allowed from `0.0.0.0/0` and from the VCN range. That rule does not open TCP 22. | Partly verified; the extra `/32` needs an owner decision |
| Boot volume | 47 GB, `AVAILABLE`, with no backup policy assigned. | Verified |
| Backup | One manual full boot-volume backup, `AVAILABLE`, created 8 October 2026 at 02:31 UTC. It has about 5 GB of unique data. | Backup exists. Restore not tested. |
| Always Free backup count | 1 of the 5 Always Free volume backups allowed in the home region, per Oracle's documentation. | Within limit |
| Block volumes | None in the instance compartment. | Verified |
| Recovery route | The Oracle sign-in for this tenancy works. The VM has no serial or VNC console connection configured. Editing security lists was not tested, because this profile is read-only. | Partly verified |

### Restore feasibility (not tested)

- A restore creates a new boot volume in the same availability domain. The combined block and boot storage would be about 94 GB, which fits within the 200 GB Always Free storage limit. I did not verify whether backup storage counts toward that limit.
- A restored volume proves only that the backup is readable and restorable. It doesn't prove the volume boots. A bootable test needs a second instance, and this VM already uses the whole A1 allowance, so that test would be billable or would replace this VM.
- The proposed non-disruptive test is to restore to a volume only, confirm that it becomes `AVAILABLE` with the expected size, and then delete the test volume after approval. The running boot volume is not touched.

### Approval packets (nothing below has been run)

**A. Restore test (volume only).** Creates one restored boot volume in the same availability domain, then deletes it after the check. Cost: within the free storage limit, but the cost is not fully verified. Rollback: delete the test volume.

**B. Extra TCP 22 source.** Remove the `/32` that does not match this workstation, only after the owner confirms it is no longer needed. Keep the current address. Rollback: re-add the rule. Before this edit, confirm that a write-capable Oracle sign-in works, because that is the recovery path.

**C. Disable `rpcbind`.**

- Command: `sudo systemctl disable --now rpcbind.socket rpcbind.service`
- Impact: port 111 stops listening. `rpc-statd`, used only for NFS locking, can no longer start. No NFS mounts or NFS fstab entries exist, and `nfs-client.target` does not depend on `rpcbind`.
- Rollback: `sudo systemctl enable --now rpcbind.socket rpcbind.service`

**D. Reboot to kernel `7.0.0-1012-oracle`.** This is disruptive. Before approval, the following must be in place:

- A serial console connection for the VM, created through OCI. This lets the owner pick the previous kernel `6.17.0-1020-oracle` at the boot menu if the new kernel fails. Without it, a failed boot can't be rolled back from the console. Creating the connection is a write action, so it needs approval.
- A fresh boot-volume backup taken before the reboot, which also needs approval.
- Pre-reboot checks: the Gateway is active, the `investment-office` and `openclaw` accounts are intact, and `automations status --json` shows `enabled: false`.
- Post-boot checks: `uname -r` shows the new kernel. The `openclaw` user's `openclaw-gateway.service` is active. `openclaw gateway status --deep` and `openclaw health` pass. `ss -tulnp` shows the Gateway only on loopback. `nft list ruleset` and `sshd -T` match the recorded settings. `systemctl --failed` is empty. `timedatectl` reports NTP synchronized.

**E. Memory-core dreaming job.** No action now. It must be resolved before any scheduler activation, as the instruction for this task says. It does not block host readiness.

**F. SSH TCP forwarding.** Stays enabled, because the private tunnel access depends on it.

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
| Admin and SSH | Public-key SSH works as `ubuntu`; password and keyboard-interactive SSH auth are disabled; TCP forwarding is enabled. On 8 October, direct root SSH was disabled with `/etc/ssh/sshd_config.d/00-investment-office-security.conf` (`PermitRootLogin no`); `sshd -t` passed, the effective value was checked, SSH reloaded, and a new `ubuntu` login plus passwordless sudo succeeded. The local private key mode was corrected from 0644 to 0600. The observed ED25519 host key was accepted on first use but not independently compared with OCI console evidence. The owner reports narrowing OCI TCP/22 to their current public address; a fresh SSH connection succeeded from that address. | Root login disabled and admin path reverified; saved source-rule value remains owner-reported |
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
- Disabled direct root SSH using an SSH configuration drop-in. Syntax validation and effective configuration checks passed, and a fresh `ubuntu` SSH login with passwordless sudo succeeded after reload.
- No persistent listener, public application port, Gateway, app service, or scheduled job was enabled. The one temporary loopback test listener exited after the tunnel check. OpenClaw installation and onboarding belong to Step 21.
- No provider credentials or Firebase credentials were copied to the VM. No model call or research task was run.

## Remaining acceptance work

1. Confirm the saved OCI TCP/22 source CIDR in the console and retain access to the OCI console as the recovery path. The owner reports the source was narrowed to their current address and SSH succeeds from there; the console's saved value was not independently inspected.
2. Verify a boot-volume backup and recovery path in OCI. Check the tenancy home region and current Always Free backup allowance before creating resources; Oracle documents five Always Free volume backups in the home region. Create a backup and wait until it is available, then record its identifier privately. Test restoring it to a new boot volume only after confirming capacity and any possible charges. The tenancy home region is not yet verified.
3. Confirm the intended model and search provider names. From the corresponding service account, test the selected endpoints after server-owned credentials are provisioned in Step 21; never record secret values.
4. Verify Firebase Auth/Firestore with the app's project `virtual-office-77c1d` and an authorized server identity. The local web config does not provide server authorization; current unauthenticated HTTP responses only establish network reachability.
5. Configure application-to-Gateway access only after the supported OpenClaw interface and a loopback-only Gateway are installed and inspected. Keep browser builds and agent workspace free of Gateway credentials.
6. Complete Step 21's controlled agent turn and confirm no credential, browser, search service, or local model needed by the research process depends on the workstation. Prove service persistence across logout/reboot after the recovery path is recorded.

No recurring jobs or public application listener have been created. The app, OpenClaw Gateway, provider authentication, and live-research path are not installed or configured.

## Owner-approved host and job changes — 10 October 2026 (WIB)

The owner's decisions on the open items were: leave the unexplained TCP/22 `/32` unchanged for now; approve the volume-only restore test; approve disabling `rpcbind`; defer the reboot; and turn off the enabled memory job.

- **`rpcbind` disabled (done).** `sudo systemctl disable --now rpcbind.socket rpcbind.service`. Both units are now `disabled` and `inactive`, nothing listens on TCP or UDP 111, the Gateway stayed `active`, and `systemctl --failed` is empty. Rollback: `sudo systemctl enable --now rpcbind.socket rpcbind.service`.
- **Memory dreaming job disabled (done).** `openclaw automations disable` on `memory-core:memory-dreaming-promotion` (job ID `0a4c5b07-…`). Afterwards all five automation records show `enabled=false`, and the scheduler status still reports `enabled: false`. The job's label says it is managed by the memory plugin, so re-check its state after any Gateway restart or plugin update.
- **TCP/22 source (unchanged).** The owner asked to leave it as is. The unexplained `/32` remains open.
- **Restore test (done, volume-only).** The owner signed in with a write-capable profile (`investment-office-write`). The 8 October backup (`investment-office-step20-2026-10-08`, `AVAILABLE`, 47 GB) was restored to a new boot volume `restore-test-2026-10-10` in the same availability domain. It became `AVAILABLE` at 47 GB, then was deleted with `--force` and reached `TERMINATED`. Afterwards the server was `RUNNING`, its own boot volume was `AVAILABLE`, and the backup was still `AVAILABLE`. This proves the backup can be restored to a readable volume. It does not prove the restored disk boots. Charges for the temporary volume were not verified.
- **Reboot (deferred).** Not approved yet. Requires a serial console and a fresh boot-volume backup first.

Step 20 remains **not accepted**. The reboot (deferred), the TCP/22 decision (left unchanged at owner request), and a bootable recovery test are still open.

## References

The host/network sequence was checked against Oracle's [instance details](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/inst-get.htm), [public IP requirements](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingpublicIPs.htm), [security list rules](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/creating-securitylist.htm), [Always Free resource limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm), [boot-volume backup](https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/bootvolumebackups.htm), and [restore procedure](https://docs.oracle.com/en-us/iaas/Content/Block/Tasks/create-restore-bv-boot-volume-backup.htm). Node/SQLite compatibility and the private Gateway posture were checked against the current [OpenClaw Node requirements](https://docs.openclaw.ai/install/node), [Node compatibility table](https://docs.openclaw.ai/install/node-compatibility), and [Linux server guide](https://docs.openclaw.ai/vps).
