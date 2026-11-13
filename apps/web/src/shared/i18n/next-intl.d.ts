import type { Locale } from "./locale";
import type { Messages } from "./messages/ru";

// Makes translation keys type-checked: t("nav.hom") is a compile error
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
