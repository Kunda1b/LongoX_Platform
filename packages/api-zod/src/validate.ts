import { ZodType } from "zod";
import * as schemas from "./index";

const schemaEntries = (Object.entries(schemas) as Array<[string, unknown]>).filter(
  ([, candidate]) => candidate instanceof ZodType,
);

if (schemaEntries.length === 0) {
  throw new Error("No Zod schemas were exported from @longox/api-zod.");
}

console.log(`Validated ${schemaEntries.length} Zod schemas from @longox/api-zod.`);
process.exit(0);
