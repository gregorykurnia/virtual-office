import { useEffect, useState } from "react";
import { demoControls } from "../demo";

/**
 * Demo data is intentionally held behind the service boundary. This revision
 * lets query consumers refresh when the local adapter changes state without
 * coupling components to its in-memory implementation.
 */
export function useDemoRevision(): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => demoControls.subscribe(() => setRevision((current) => current + 1)), []);

  return revision;
}
