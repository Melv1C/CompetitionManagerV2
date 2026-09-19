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
  signUpForm: {
    title: "Maak je account aan",
    description: "Gebruik je e-mailadres en een wachtwoord om te beginnen.",
    name: "Naam",
    email: "E-mail",
    emailPlaceholder: "naam@voorbeeld.nl",
    password: "Wachtwoord",
    confirmPassword: "Bevestig wachtwoord",
    showPassword: "Toon wachtwoord",
    hidePassword: "Verberg wachtwoord",
    createAccount: "Account aanmaken",
    creatingAccount: "Account wordt aangemaakt...",
    hasAccount: "Heb je al een account?",
    login: "Inloggen",
    errors: {
      nameRequired: "Naam is verplicht.",
      invalidEmail: "Voer een geldig e-mailadres in.",
      passwordLength: "Het wachtwoord moet minimaal 8 tekens bevatten.",
      confirmPasswordRequired: "Bevestig je wachtwoord.",
      passwordMismatch: "De wachtwoorden komen niet overeen.",
    },
  },
} satisfies Translations;

export default nl;
