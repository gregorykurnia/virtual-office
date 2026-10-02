import { useEffect, useState } from "react";
import { demoControls, DEMO_SCENARIOS } from ".";

export default function DemoScenarioControls() {
  const [snapshot, setSnapshot] = useState(() => demoControls.getSnapshot());

  useEffect(() => demoControls.subscribe(() => setSnapshot(demoControls.getSnapshot())), []);

  return (
    <section className="demo-controls" aria-labelledby="demo-controls-title">
      <div className="demo-controls__intro">
        <p className="eyebrow" id="demo-controls-title">Demo controls</p>
        <p className="demo-controls__summary" id="demo-scenario-summary" aria-live="polite">
          {snapshot.description} <span>{snapshot.agentCount} analysts · {snapshot.taskCount} tasks · {snapshot.reportCount} reports</span>
        </p>
      </div>
      <div className="demo-controls__actions">
        <label className="demo-controls__field">
          <span>Scenario</span>
          <select
            aria-describedby="demo-scenario-summary"
            value={snapshot.scenario}
            onChange={(event) => demoControls.setScenario(event.currentTarget.value as typeof snapshot.scenario)}
          >
            {DEMO_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.label}</option>
            ))}
          </select>
        </label>
        <button className="demo-controls__reset" type="button" onClick={() => demoControls.reset()}>
          Reset demo
        </button>
      </div>
    </section>
  );
}
