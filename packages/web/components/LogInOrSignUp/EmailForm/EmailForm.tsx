import { TextInput, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { PlutomiEmails } from "@plutomi/shared";
import type { Schema } from "@plutomi/validation";
import { useAuthContext } from "@/hooks";
import { useEffect, useRef } from "react";

type LoginEmailFormProps = {
  form: UseFormReturnType<Schema.LogInOrSignUp.email.UIValues>;
  isSubmitting: boolean;
};

// ! TODO: use this?:
// https://mantine.dev/core/loading-overlay/
export const LoginEmailForm: React.FC<LoginEmailFormProps> = ({
  form,
  isSubmitting
}) => {
  const authContext = useAuthContext();
  const actionText = authContext === "login" ? "logging" : "signing";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSubmitting) {
      inputRef.current?.focus();
    }
  }, [isSubmitting]);

  return (
    <>
      <TextInput
        {...form.getInputProps("email")}
        required
        label="Email"
        type="email"
        placeholder={PlutomiEmails.JOSE}
        radius="md"
        disabled={isSubmitting}
        ref={inputRef}
        autoFocus
      />
      <Text c="dimmed">
        We won&apos;t send you spam. This is just for {actionText} in.
      </Text>
    </>
  );
};