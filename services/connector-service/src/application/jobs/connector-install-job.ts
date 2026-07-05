import { prisma } from "@longox/db/prisma";
export async function processConnectorInstall(job: {
  data: any;
}): Promise<void> {
  console.log("[connector-install] Processing job:", job.data);
}
export default processConnectorInstall;
