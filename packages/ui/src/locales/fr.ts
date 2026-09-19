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
  signUpForm: {
    title: "Créer votre compte",
    description: "Utilisez votre adresse e-mail et un mot de passe pour commencer.",
    name: "Nom",
    email: "E-mail",
    emailPlaceholder: "nom@exemple.fr",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    createAccount: "Créer un compte",
    creatingAccount: "Création du compte...",
    hasAccount: "Vous avez déjà un compte ?",
    login: "Se connecter",
    errors: {
      nameRequired: "Le nom est obligatoire.",
      invalidEmail: "Saisissez une adresse e-mail valide.",
      passwordLength: "Le mot de passe doit contenir au moins 8 caractères.",
      confirmPasswordRequired: "Confirmez votre mot de passe.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
    },
  },
} satisfies Translations;

export default fr;
