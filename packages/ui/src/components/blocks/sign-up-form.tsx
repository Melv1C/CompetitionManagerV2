import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

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
} from "@/components/ui";
import { cn } from "@/lib/utils";

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const createSignUpFormSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().trim().min(1, t("signUpForm.errors.nameRequired")),
      email: z.email(t("signUpForm.errors.invalidEmail")),
      password: z.string().trim().min(8, t("signUpForm.errors.passwordLength")),
      confirmPassword: z.string().trim().min(1, t("signUpForm.errors.confirmPasswordRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      error: t("signUpForm.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

interface SignUpFormProps {
  onSubmit?: (name: string, email: string, password: string) => void | Promise<void>;
  onLogin?: () => void;
  title?: string;
  description?: string;
  schema?: z.ZodType<SignUpFormValues>;
  className?: string;
}

function SignUpForm({ onSubmit, onLogin, title, description, schema, className }: SignUpFormProps) {
  const { t } = useTranslation("ui");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const translatedSchema = createSignUpFormSchema(t);
  const resolvedSchema = schema ?? translatedSchema;
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(resolvedSchema as typeof translatedSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleFormSubmit = async (data: SignUpFormValues) => {
    try {
      setError(null);
      setIsLoading(true);
      await onSubmit?.(data.name, data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md border-0 bg-white shadow-[0_24px_80px_rgba(18,54,84,0.12)] ring-1 ring-[#123654]/10",
        className,
      )}
    >
      <CardHeader className="px-6 pt-3 text-left sm:px-8">
        <CardTitle className="text-2xl font-semibold tracking-[-0.025em]">
          {title ?? t("signUpForm.title")}
        </CardTitle>
        <CardDescription className="leading-6">
          {description ?? t("signUpForm.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <form id="sign-up-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
          <FieldGroup className="gap-5">
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-name">{t("signUpForm.name")}</FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-name"
                    autoComplete="name"
                    disabled={isLoading}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-email">{t("signUpForm.email")}</FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-email"
                    type="email"
                    placeholder={t("signUpForm.emailPlaceholder")}
                    autoComplete="email"
                    disabled={isLoading}
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
                  <FieldLabel htmlFor="sign-up-password">{t("signUpForm.password")}</FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="sign-up-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      disabled={isLoading}
                      aria-label={
                        showPassword ? t("signUpForm.hidePassword") : t("signUpForm.showPassword")
                      }
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-confirm-password">
                    {t("signUpForm.confirmPassword")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={isLoading}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#123654] hover:bg-[#1b486c]"
              disabled={isLoading}
            >
              {isLoading ? t("signUpForm.creatingAccount") : t("signUpForm.createAccount")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-[#123654]/10 bg-[#f7fafb] px-6 py-4 sm:px-8">
        <p className="text-muted-foreground text-sm">
          {t("signUpForm.hasAccount")}{" "}
          <button
            type="button"
            onClick={onLogin}
            className="font-medium text-[#123654] underline-offset-4 hover:underline"
            disabled={isLoading}
          >
            {t("signUpForm.login")}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}

export { SignUpForm, createSignUpFormSchema, type SignUpFormProps, type SignUpFormValues };
