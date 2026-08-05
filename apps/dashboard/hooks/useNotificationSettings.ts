import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import * as usersService from "../services/users.service";

export function useUpdateNotificationSettings() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: usersService.NotificationSettingsInput) =>
      usersService.updateNotificationSettings(input),
    onSuccess: (user) => {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        setSession({ accessToken, user });
      }
    },
  });
}
