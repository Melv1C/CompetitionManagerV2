export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
};

export function createTransactionalEmail(input: TransactionalEmail): TransactionalEmail {
  if (!input.to.includes("@")) {
    throw new Error("Transactional email recipient must be a valid email address");
  }
  return { ...input };
}
