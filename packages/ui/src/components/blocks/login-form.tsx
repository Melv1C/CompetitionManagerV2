import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { AppleIcon, FacebookIcon, GithubIcon, GoogleIcon, MicrosoftIcon } from "@/components/icons";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Separator,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type LoginFormValues = {
  email: string;
  password: string;
};

const createLoginFormSchema = (t: (key: string) => string) =>
  z.object({
    email: z.email(t("loginForm.errors.invalidEmail")),
    password: z.string().trim().min(1, t("loginForm.errors.passwordRequired")),
  });

type LoginProvider = "google" | "github" | "apple" | "microsoft" | "facebook";

interface LoginFormProps {
  /** Callback when form is submitted with email and password. Can throw an error that will be caught and displayed. */
  onSubmit?: (email: string, password: string) => void | Promise<void>;
  /** Callback when a social provider login button is clicked */
  onProviderLogin?: (provider: LoginProvider) => void;
  /** Callback when forgot password link is clicked */
  onForgotPassword?: () => void;
  /** Callback when sign up link is clicked */
  onSignUp?: () => void;
  /** Social login providers to display */
  providers?: LoginProvider[];
  /** Show the forgot password link */
  showForgotPassword?: boolean;
  /** Show the sign up link */
  showSignUp?: boolean;
  /** Custom title for the login form */
  title?: string;
  /** Custom description for the login form */
  description?: string;
  /** Custom validation schema (overrides default and translated schema) */
  schema?: z.ZodType<LoginFormValues>;
  /** Additional class name for the card container */
  className?: string;
}

const providerIcons: Record<LoginProvider, React.ReactNode> = {
  google: <GoogleIcon className="size-4 p-0" />,
  github: <GithubIcon className="size-4 p-0" />,
  apple: <AppleIcon className="size-4 p-0" />,
  microsoft: <MicrosoftIcon className="size-4 p-0" />,
  facebook: <FacebookIcon className="size-4 p-0" />,
};

function LoginForm({
  onSubmit,
  onProviderLogin,
  onForgotPassword,
  onSignUp,
  providers = [],
  showForgotPassword = true,
  showSignUp = true,
  title,
  description,
  schema,
  className,
}: LoginFormProps) {
  const { t } = useTranslation("ui");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const translatedSchema = createLoginFormSchema(t);
  const resolvedSchema = schema ?? translatedSchema;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(resolvedSchema as typeof translatedSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleFormSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      setIsLoading(true);
      await onSubmit?.(data.email, data.password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const displayTitle = title ?? t("loginForm.title");
  const displayDescription = description ?? t("loginForm.description");

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{displayTitle}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
          <FieldGroup className="gap-6">
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">{t("loginForm.email")}</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    placeholder={t("loginForm.emailPlaceholder")}
                    disabled={isLoading}
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="login-password">{t("loginForm.password")}</FieldLabel>
                    {showForgotPassword && (
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-muted-foreground hover:text-primary ml-auto text-sm underline-offset-4 hover:underline"
                        disabled={isLoading}
                      >
                        {t("loginForm.forgotPassword")}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      {...field}
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      disabled={isLoading}
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      disabled={isLoading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("loginForm.loggingIn") : t("loginForm.login")}
            </Button>
            {providers.length > 0 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card text-muted-foreground px-2">
                      {t("loginForm.orContinueWith")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {providers.map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => onProviderLogin?.(provider)}
                      disabled={isLoading}
                    >
                      {providerIcons[provider]}
                      {t(`loginForm.providers.${provider}`)}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      {showSignUp && (
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            {t("loginForm.noAccount")}{" "}
            <button
              type="button"
              onClick={onSignUp}
              className="text-primary underline-offset-4 hover:underline"
              disabled={isLoading}
            >
              {t("loginForm.signUp")}
            </button>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export { LoginForm, type LoginFormProps, type LoginFormValues, type LoginProvider };
