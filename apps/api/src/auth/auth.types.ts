export type SteamProfile = {
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string;
};

export type AuthenticatedUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  steam: {
    id: string;
    profileUrl: string | null;
  };
};

export type OpenIdCallbackQuery = Record<string, string | string[] | undefined>;
