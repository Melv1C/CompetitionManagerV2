import type { i18n as I18nInstance } from "i18next";
import i18n from "i18next";
import { useEffect, useState, type ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import { Toaster, TooltipProvider } from "@/components/ui";
import * as locales from "@/locales";
import type { SupportedLanguage } from "@/types";

type I18nConfig =
  | {
      instance: I18nInstance;
      overrides?: Record<string, Record<string, string>>;
      locale?: never;
    }
  | {
      locale: SupportedLanguage;
      overrides?: Record<string, string>;
      instance?: never;
    };

type ProviderProps = {
  children: ReactNode;
  hasToaster?: boolean;
  i18nConfig?: I18nConfig;
  loadingComponent?: ReactNode;
};

/**
 * Provider for UI core components.
 *
 * @example
 * ```tsx
 * <UICoreProvider>
 *   <App />
 * </UICoreProvider>
 * ```
 */
export function UICoreProvider({
  children,
  hasToaster = true,
  i18nConfig = { locale: "en" },
  loadingComponent = null,
}: ProviderProps) {
  const [localInstance] = useState(() => (!i18nConfig.instance ? i18n.createInstance() : null));
  const instance = i18nConfig.instance || localInstance!;

  const [isReady, setIsReady] = useState(() => !(i18nConfig.locale && !instance.isInitialized));

  useEffect(() => {
    if (i18nConfig.locale && !instance.isInitialized) {
      instance
        .use(initReactI18next)
        .init({
          lng: i18nConfig.locale,
          fallbackLng: i18nConfig.locale,
          defaultNS: "ui",
          resources: {},
          interpolation: {
            escapeValue: false,
          },
        })
        .then(() => {
          setIsReady(true);
        });
    }
  }, [i18nConfig, instance]);

  useEffect(() => {
    if (i18nConfig.locale) {
      // Mode with locale
      const baseTranslations = locales[i18nConfig.locale] ?? {};
      const mergedTranslations = i18nConfig.overrides
        ? { ...baseTranslations, ...i18nConfig.overrides }
        : baseTranslations;

      instance.addResourceBundle(i18nConfig.locale, "ui", mergedTranslations, true, true);
      instance.changeLanguage(i18nConfig.locale);
    } else if (i18nConfig.instance) {
      // Mode with instance
      for (const [lng, resources] of Object.entries(locales)) {
        const languageOverrides = i18nConfig.overrides?.[lng];

        if (instance.hasResourceBundle(lng, "ui") && !languageOverrides) {
          continue;
        }

        const mergedResources = languageOverrides
          ? { ...resources, ...languageOverrides }
          : resources;

        instance.addResourceBundle(lng, "ui", mergedResources, true, true);
      }

      // Add any additional languages from overrides (not in supported locales)
      if (i18nConfig.overrides) {
        const supportedLanguages = Object.keys(locales);
        for (const [lng, resources] of Object.entries(i18nConfig.overrides)) {
          if (supportedLanguages.includes(lng)) continue;
          instance.addResourceBundle(lng, "ui", resources, true, true);
        }
      }
    }
  }, [i18nConfig, instance]);

  if (!isReady || !instance.isInitialized) {
    return loadingComponent;
  }

  return (
    <I18nextProvider i18n={instance}>
      <TooltipProvider>
        {children}
        {hasToaster && <Toaster />}
      </TooltipProvider>
    </I18nextProvider>
  );
}
