import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { officeService } from "../demo";
import { useDemoRevision } from "../lib/demoHooks";

export default function PreferencesMenu() {
  const revision = useDemoRevision();
  const [open, setOpen] = useState(false);
  const preferencesQuery = useQuery({
    queryKey: ["preferences", revision],
    queryFn: () => officeService.getPreferences()
  });

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const theme = preferencesQuery.data?.data.theme ?? "system";
    const reducedMotion = preferencesQuery.data?.data.reducedMotion ?? false;
    const systemTheme = theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme === "system" ? systemTheme : theme;
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [preferencesQuery.data?.data.reducedMotion, preferencesQuery.data?.data.theme]);

  const preferences = preferencesQuery.data?.data;

  return (
    <div className="preferences-menu">
      <button
        className="header-button"
        type="button"
        aria-expanded={open}
        aria-controls="preferences-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="header-button__icon" aria-hidden="true">⚙</span>
        <span>Preferences</span>
      </button>
      {open ? (
        <section className="preferences-panel" id="preferences-panel" aria-label="Preferences">
          <div className="preferences-panel__heading">
            <div>
              <p className="eyebrow">Workspace settings</p>
              <h2>Preferences</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Close preferences" onClick={() => setOpen(false)}>×</button>
          </div>
          {preferencesQuery.isPending ? <p className="preferences-panel__state">Loading saved preferences…</p> : null}
          {preferencesQuery.isError ? <p className="preferences-panel__state preferences-panel__state--error" role="alert">Preferences are unavailable. Demo defaults remain active.</p> : null}
          {preferences ? (
            <div className="preferences-panel__fields">
              <label className="preference-field">
                <span>Timezone</span>
                <select
                  value={preferences.timezone}
                  onChange={(event) => void officeService.updatePreferences({ timezone: event.currentTarget.value })}
                >
                  <option value="Asia/Jakarta">Asia/Jakarta · WIB</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </label>
              <label className="preference-field">
                <span>Theme</span>
                <select
                  value={preferences.theme}
                  onChange={(event) => void officeService.updatePreferences({ theme: event.currentTarget.value as typeof preferences.theme })}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="preference-toggle">
                <span>
                  <strong>Reduced motion</strong>
                  <small>Use calmer transitions and no decorative movement.</small>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.reducedMotion}
                  onChange={(event) => void officeService.updatePreferences({ reducedMotion: event.currentTarget.checked })}
                />
              </label>
            </div>
          ) : null}
          <p className="preferences-panel__footnote">Saved in this browser for the demo workspace.</p>
        </section>
      ) : null}
    </div>
  );
}
