export const MENU_KEYS = {
  HOME:           "HOME",
  PERSONNEL:      "PERSONNEL",
  CONVOCATIONS:   "CONVOCATIONS",
  BORDEREAUX:     "BORDEREAUX",
  VISITES:        "VISITES",
  CALENDRIER:     "CALENDRIER",
  JOURS_FERIES:   "JOURS_FERIES",
  REF_CIM11:      "REF_CIM11",
  REF_POSTES:     "REF_POSTES",
  REF_FORMATIONS: "REF_FORMATIONS",
  REF_SERVICES:   "REF_SERVICES",
  ADMIN_USERS:    "ADMIN_USERS",
  ADMIN_ROLES:    "ADMIN_ROLES",
} as const;

export type MenuKey = (typeof MENU_KEYS)[keyof typeof MENU_KEYS];

export const ALL_MENU_KEYS = Object.values(MENU_KEYS);

export const MENU_LABELS: Record<string, string> = {
  HOME:           "Accueil",
  PERSONNEL:      "Personnel",
  CONVOCATIONS:   "Convocations",
  BORDEREAUX:     "Bordereaux",
  VISITES:        "Visites",
  CALENDRIER:     "Calendrier",
  JOURS_FERIES:   "Jours fériés",
  REF_CIM11:      "CIM 11",
  REF_POSTES:     "Postes",
  REF_FORMATIONS: "Formations",
  REF_SERVICES:   "Services",
  ADMIN_USERS:    "Utilisateurs",
  ADMIN_ROLES:    "Rôles",
};
