# Private VM access

Run this from the project directory:

```bash
ssh -F .env.step20.ssh.local investment-office
```

The project alias is in `.env.step20.ssh.local`. Its target, account, key path, and alias are also saved in `.env.step20.local`. Both files are ignored by Git and have mode `0600`. Inspect them locally when connection details are needed; keep their values out of committed documentation. A plain `ssh investment-office` requires a separately configured global SSH alias.

The recovered connection was verified on 8 October 2026: public-key SSH as `ubuntu` succeeded, and the server's OpenClaw executable reported `2026.9.8`. Earlier setup stored the key path in the ignored environment file and the target in `/private/tmp/office-step20-ssh.py`; the project files now retain both so access does not depend on that temporary helper.

After connecting, inspect OpenClaw under its service account:

```bash
sudo -u openclaw -H /var/lib/openclaw/.local/bin/openclaw agents list --json
```

If SSH times out, check the VM's current public address and the existing OCI TCP/22 source rule against the workstation's current administrative source. Use the OCI console as the recovery path described in the host-readiness record. Do not accept a changed SSH host key without verifying the host identity.
