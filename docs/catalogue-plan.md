# Belgian Athletics catalogue plan

This document records the agreed decisions and the first implementation of the Discipline and Athlete Category catalogue.

## Scope

- The first catalogue serves Belgian Athletics competitions across LBFA and Atletiek Vlaanderen. The product displays "Belgian Athletics" and retains `LRBA` as the stored provider identifier.
- The platform maintains a curated catalogue. Organizations may add Disciplines scoped to their own Organization.
- Discipline and Athlete Category provisioning belong to the same delivery so that managers can create and publish Competitions using real catalogue data.

## Disciplines

- Each hurdle height, hurdle spacing, and implement weight that changes the rules identifies a separate Discipline. [ADR 0021](./adr/0021-equipment-variants-are-distinct-disciplines.md) records the identity decision.
- The 88 definitions in the [original catalogue](https://github.com/Melv1C/CompetitionManagerSaaS/blob/main/apps/events-api/src/epreuves.json) are candidates for review against current Belgian rules, not an automatic import.
- Include supported relay Disciplines in the first usable catalogue. Add combined Disciplines when combined Event setup is ready.
- Platform entries have English, French, and Dutch translations. Organization entries may start with one translation and use a clear fallback in other locales.

## Athlete Categories

- The first delivery includes a reusable Athlete Category catalogue. Categories are not duplicated for each Athletics Season. [ADR 0022](./adr/0022-athlete-categories-reused-across-seasons.md) records this boundary.
- `getAgeBand(birthDate, referenceDate)` returns a base band such as BEN, PUP, or MIN. Gender then selects the full catalogue Athlete Category, such as BEN M or BEN F. For a Competition Event, the reference date is its first scheduled Round.
- Review category definitions against the relevant Belgian Athletics, LBFA, and Atletiek Vlaanderen sources rather than copying the 46 legacy rows without review.
- In this product, U23 and Senior are mutually exclusive categories. A 22-year-old Athlete is U23.
- Non-Masters age groups follow birth year within the Athletics Season. Masters bands begin on their respective birthdays.
- Competition Event eligibility explicitly lists every admitted Athlete Category. A U23 Athlete may enter an Event that also admits Seniors when U23 is listed, and remains U23 on the entry.

The proposed age bands are KAN 6 to 7, BEN 8 to 9, PUP 10 to 11, MIN 12 to 13, CAD 14 to 15, SCO 16 to 17, JUN 18 to 19, ESP/U23 20 to 22, and SEN from 23 until Masters begins. Athletes younger than six have no category. The legacy function assigned younger children to KAN, but current federation lists start KAN at six. Masters use five-year bands beginning on the actual 35th birthday. Non-Masters age is calculated from the Athletics Season's ending year and birth year; the LRBA season changes on November 1 in V2.

## Implemented delivery

- `getAgeBand` and `getAthleteCategoryCode` calculate the standard category from birth and reference dates. The calculation uses the November 1 season boundary and actual Masters birthdays. Registration flows can call this function when they are implemented.
- Athlete Categories no longer belong to a season. Existing category IDs and Event/Entry references survive the migration. If old season-specific rows share a code, later rows receive a legacy-suffixed code to preserve their distinct history.
- `bun --filter api run sync-json-data` provisions three LRBA seasons (2025–2028), the 46 standard gender-specific categories, and an initial set of translated Disciplines. API startup runs the command after migrations. It only fills missing records and translations; it never changes a referenced Discipline's measurement or names.
- The first Discipline set covers common track races, specified hurdles and steeple, jumps, throwing weights, and five relay distances. Combined Events, race walking, and rarer races remain future catalogue review items. The catalogue does not claim to encode category-specific Event eligibility; managers choose eligible categories on each Event.
- Managers can add an Organization Discipline while editing a Competition Event. The code and name should contain any defining equipment specification. A translation in the Competition locale is required; a fallback translation is labelled in other locales.

## Sources for review

- [Legacy category data and AthleticsManager IDs](https://github.com/Melv1C/CompetitionManager/blob/main/backend/src/data/categories.json)
- [LBFA 2025-2026 category sheet](https://www.lbfa.be/uploads/pdf/2025/Categories_saison_2025-2026.pdf)
- [Atletiek Vlaanderen 2025-2026 category list](https://www.atletiek.be/competitie/atleten/lidmaatschap)
- [LBFA event specifications, January 2026](https://www.lbfa.be/uploads/pdf/2026/Epreuves_autorisees_et_caracteristiques_060126.pdf)
