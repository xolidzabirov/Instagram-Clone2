import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClassName, type ButtonProps } from "./Button";

type ButtonLinkProps = ComponentProps<typeof Link> & Pick<ButtonProps, "variant" | "size" | "fullWidth">;

/** A navigation link styled as a button ("Edit profile", "Message") */
export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, size, fullWidth, className })} {...props} />;
}
