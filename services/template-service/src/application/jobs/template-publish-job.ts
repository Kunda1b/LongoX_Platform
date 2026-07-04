import { prisma } from "@longox/db/prisma";
export async function processTemplatePublish(job: { data: any }): Promise<void> {
  console.log("[template-publish] Processing job:", job.data);
}
export default processTemplatePublish;
