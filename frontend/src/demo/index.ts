import { createDemoOfficeService } from "./demoOfficeService";

const demoOffice = createDemoOfficeService();

export const officeService = demoOffice.service;
export const demoControls = demoOffice.controls;
export { DEMO_SCENARIOS } from "./demoOfficeService";
