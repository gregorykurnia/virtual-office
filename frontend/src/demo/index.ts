import { createDemoOfficeService } from "./demoOfficeService";
import { httpOfficeService } from "../services/httpOfficeService";

const demoOffice = createDemoOfficeService();

export const officeService = import.meta.env.VITE_APP_MODE === "live" ? httpOfficeService : demoOffice.service;
export const demoControls = demoOffice.controls;
export { DEMO_SCENARIOS } from "./demoOfficeService";
