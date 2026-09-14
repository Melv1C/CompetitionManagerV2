import type { Translations } from "./en";

const fr = {
  loginForm: {
    title: "Connexion à votre compte",
    description: "Entrez vos identifiants pour accéder à votre compte",
    email: "Email",
    emailPlaceholder: "nom@exemple.com",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    login: "Se connecter",
    loggingIn: "Connexion en cours...",
    orContinueWith: "ou continuer avec",
    noAccount: "Vous n'avez pas de compte ?",
    signUp: "S'inscrire",
    providers: {
      google: "Continuer avec Google",
      github: "Continuer avec GitHub",
      apple: "Continuer avec Apple",
      microsoft: "Continuer avec Microsoft",
      facebook: "Continuer avec Facebook",
    },
    errors: {
      invalidEmail: "Veuillez saisir une adresse e-mail valide.",
      passwordRequired: "Le mot de passe est requis.",
    },
  },
} satisfies Translations;

export default fr;
