export type Currency = "EUR";

export type Money = {
  amountCents: number;
  currency: Currency;
};

export function createMoney(amountCents: number, currency: Currency = "EUR"): Money {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error("Money amount must be a non-negative integer number of cents");
  }
  return { amountCents, currency };
}

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new Error("Cannot add money values with different currencies");
  }
  return createMoney(left.amountCents + right.amountCents, left.currency);
}
