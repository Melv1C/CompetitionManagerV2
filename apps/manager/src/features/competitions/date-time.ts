export function instantToZonedInput(instant: string | null, timeZone: string) {
  if (!instant) return "";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(instant))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function zonedInputToInstant(localValue: string, timeZone: string) {
  if (!localValue) return null;
  const match = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desired;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const rendered = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    guess += desired - rendered;
  }
  const instant = new Date(guess).toISOString();
  return instantToZonedInput(instant, timeZone) === localValue ? instant : null;
}

export function requireValidZonedDate(localValue: string, timeZone: string, label: string) {
  const instant = zonedInputToInstant(localValue, timeZone);
  if (!instant) {
    throw new Error(`${label} is not a valid local time in ${timeZone}. Choose another time.`);
  }
  return new Date(instant);
}
