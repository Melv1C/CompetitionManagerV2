import type { Translations } from "./en";

const nl = {
  loginForm: {
    title: "Inloggen op uw account",
    description: "Voer uw gegevens in om toegang te krijgen tot uw account",
    email: "E-mail",
    emailPlaceholder: "naam@voorbeeld.com",
    password: "Wachtwoord",
    forgotPassword: "Wachtwoord vergeten?",
    login: "Inloggen",
    loggingIn: "Bezig met inloggen...",
    orContinueWith: "of ga verder met",
    noAccount: "Heeft u geen account?",
    signUp: "Registreren",
    providers: {
      google: "Doorgaan met Google",
      github: "Doorgaan met GitHub",
      apple: "Doorgaan met Apple",
      microsoft: "Doorgaan met Microsoft",
      facebook: "Doorgaan met Facebook",
    },
    errors: {
      invalidEmail: "Voer een geldig e-mailadres in.",
      passwordRequired: "Wachtwoord is verplicht.",
    },
  },
} satisfies Translations;

export default nl;
