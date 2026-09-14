const en = {
  loginForm: {
    title: "Login to your account",
    description: "Enter your credentials to access your account",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Password",
    forgotPassword: "Forgot password?",
    login: "Login",
    loggingIn: "Logging in...",
    orContinueWith: "or continue with",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    providers: {
      google: "Continue with Google",
      github: "Continue with GitHub",
      apple: "Continue with Apple",
      microsoft: "Continue with Microsoft",
      facebook: "Continue with Facebook",
    },
    errors: {
      invalidEmail: "Please enter a valid email address.",
      passwordRequired: "Password is required.",
    },
  },
  signUpForm: {
    title: "Create your account",
    description: "Use your email and a password to get started.",
    name: "Name",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Password",
    confirmPassword: "Confirm password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    createAccount: "Create account",
    creatingAccount: "Creating account...",
    hasAccount: "Already have an account?",
    login: "Log in",
    errors: {
      nameRequired: "Name is required.",
      invalidEmail: "Enter a valid email address.",
      passwordLength: "Password must be at least 8 characters.",
      confirmPasswordRequired: "Confirm your password.",
      passwordMismatch: "Passwords do not match.",
    },
  },
} as const;

type WidenTranslationValues<T> = {
  [Key in keyof T]: T[Key] extends string ? string : WidenTranslationValues<T[Key]>;
};

export type Translations = WidenTranslationValues<typeof en>;

export default en;
