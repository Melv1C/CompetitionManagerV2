import * as z from "zod";

import { DisciplineMeasurementSchema } from "../generated/prisma-zod/schemas/enums/DisciplineMeasurement.schema";
import { DisciplineSchema } from "../generated/prisma-zod/schemas/models/Discipline.schema";
import { DisciplineTranslationSchema } from "../generated/prisma-zod/schemas/models/DisciplineTranslation.schema";

const OrganizationDisciplineTranslation$ = DisciplineTranslationSchema.pick({
  locale: true,
  name: true,
  abbreviation: true,
}).extend({
  name: DisciplineTranslationSchema.shape.name.trim().min(1).max(160),
  abbreviation: z.string().trim().max(40).nullable(),
});

export const CreateOrganizationDiscipline$ = DisciplineSchema.pick({
  code: true,
  measurement: true,
})
  .extend({
    code: DisciplineSchema.shape.code
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{1,79}$/),
    measurement: DisciplineMeasurementSchema,
    translations: z.array(OrganizationDisciplineTranslation$).min(1).max(3),
  })
  .refine(
    ({ translations }) =>
      new Set(translations.map(({ locale }) => locale)).size === translations.length,
    { message: "Use each locale once", path: ["translations"] },
  );
export type CreateOrganizationDiscipline = z.infer<typeof CreateOrganizationDiscipline$>;
