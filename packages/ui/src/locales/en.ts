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
} as const;

type WidenTranslationValues<T> = {
  [Key in keyof T]: T[Key] extends string ? string : WidenTranslationValues<T[Key]>;
};

export type Translations = WidenTranslationValues<typeof en>;

export default en;
