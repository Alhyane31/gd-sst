"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Box, Collapse, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Tooltip, Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SecurityIcon from "@mui/icons-material/Security";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface SidebarMenuProps {
  userName: string;
  userSurname: string;
  children?: ReactNode;
}

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 64;

type NavItem = { label: string; icon: ReactNode; path: string; menuKey: string };
type NavGroup = { label: string; icon: ReactNode; groupKey: string; items: NavItem[] };
type NavEntry = NavItem | ({ type: "group" } & NavGroup);

const FLAT_ITEMS: NavItem[] = [
  { label: "Accueil",       icon: <HomeIcon />,         path: "/",             menuKey: "HOME" },
  { label: "Personnel",     icon: <PeopleIcon />,        path: "/personnel",    menuKey: "PERSONNEL" },
  { label: "Convocations",  icon: <AssignmentIcon />,    path: "/convocations", menuKey: "CONVOCATIONS" },
  { label: "Bordereaux",    icon: <ReceiptLongIcon />,   path: "/bordereaux",   menuKey: "BORDEREAUX" },
  { label: "Visites",       icon: <EventNoteIcon />,     path: "/visites",      menuKey: "VISITES" },
  { label: "Calendrier",    icon: <CalendarMonthIcon />, path: "/calendrier",   menuKey: "CALENDRIER" },
  { label: "Jours fériés",  icon: <BeachAccessIcon />,   path: "/jours-feries", menuKey: "JOURS_FERIES" },
];

const REF_ITEMS: NavItem[] = [
  { label: "CIM 11",      icon: <MedicalInformationIcon />, path: "/referentiels/cim11",      menuKey: "REF_CIM11" },
  { label: "Postes",      icon: <WorkIcon />,               path: "/referentiels/postes",     menuKey: "REF_POSTES" },
  { label: "Formations",  icon: <SchoolIcon />,             path: "/referentiels/formations", menuKey: "REF_FORMATIONS" },
  { label: "Services",    icon: <ApartmentIcon />,          path: "/referentiels/services",   menuKey: "REF_SERVICES" },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Utilisateurs", icon: <ManageAccountsIcon />, path: "/admin/utilisateurs", menuKey: "ADMIN_USERS" },
  { label: "Rôles",        icon: <SecurityIcon />,        path: "/admin/roles",        menuKey: "ADMIN_ROLES" },
];

export default function SidebarMenu({ userName, userSurname, children }: SidebarMenuProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [menuAccess, setMenuAccess] = useState<string[] | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) { setMenuAccess(null); return; }
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setMenuAccess(d?.appRole?.menuAccess ?? []))
      .catch(() => setMenuAccess([]));
  }, [isAdmin]);

  const canSee = (menuKey: string) => {
    if (isAdmin) return true;
    if (menuAccess === null) return false;
    return menuAccess.includes(menuKey);
  };

  const visibleFlat = FLAT_ITEMS.filter((i) => canSee(i.menuKey));
  const visibleRef  = REF_ITEMS.filter((i) => canSee(i.menuKey));
  const visibleAdm  = ADMIN_ITEMS.filter((i) => canSee(i.menuKey));

  const isActive = (path: string) => path === "/" ? pathname === "/" : pathname.startsWith(path);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const renderItem = (item: NavItem) => (
    <Tooltip key={item.path} title={collapsed ? item.label : ""} placement="right">
      <ListItemButton
        onClick={() => router.push(item.path)}
        selected={isActive(item.path)}
        sx={{
          px: collapsed ? 0 : 2,
          justifyContent: collapsed ? "center" : "flex-start",
          minHeight: 44,
          color: "white",
          "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
          "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.25)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } },
        }}
      >
        <ListItemIcon sx={{ color: "white", minWidth: collapsed ? 0 : 36, justifyContent: "center" }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && <ListItemText primary={item.label} slotProps={{ primary: { fontSize: "0.875rem" } }} />}
      </ListItemButton>
    </Tooltip>
  );

  const renderGroup = (
    label: string,
    icon: ReactNode,
    items: NavItem[],
    open: boolean,
    toggle: () => void,
    groupPath: string,
  ) => {
    if (items.length === 0) return null;
    return (
      <>
        <Tooltip title={collapsed ? label : ""} placement="right">
          <ListItemButton
            onClick={toggle}
            sx={{
              px: collapsed ? 0 : 2,
              justifyContent: collapsed ? "center" : "flex-start",
              minHeight: 44,
              color: "rgba(255,255,255,0.9)",
              bgcolor: (open || pathname.startsWith(groupPath)) ? "rgba(255,255,255,0.1)" : "transparent",
              "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: collapsed ? 0 : 36, justifyContent: "center" }}>
              {icon}
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText primary={label} slotProps={{ primary: { fontSize: "0.875rem", fontWeight: 600 } }} />
                {open ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
              </>
            )}
          </ListItemButton>
        </Tooltip>
        {!collapsed && (
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List disablePadding>
              {items.map((item) => (
                <Tooltip key={item.path} title="" placement="right">
                  <ListItemButton
                    onClick={() => router.push(item.path)}
                    selected={isActive(item.path)}
                    sx={{
                      pl: 4,
                      pr: 2,
                      minHeight: 40,
                      color: "white",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                      "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } },
                    }}
                  >
                    <ListItemIcon sx={{ color: "rgba(255,255,255,0.8)", minWidth: 32 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} slotProps={{ primary: { fontSize: "0.8rem" } }} />
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  return (
    <Box display="flex" height="100vh" overflow="hidden">
      {/* ── Sidebar ── */}
      <Box
        sx={{
          width: sidebarWidth,
          bgcolor: "#1976d2",
          color: "white",
          flexShrink: 0,
          transition: "width 0.25s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Logo + toggle */}
        <Box
          sx={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            px: collapsed ? 0 : 2,
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 40, height: 40, borderRadius: "8px", overflow: "hidden", bgcolor: "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image src="/images/image1.jpg" alt="Logo" height={36} width={36} style={{ objectFit: "contain" }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: "white", letterSpacing: 0.5 }}>
                GD-SST
              </Typography>
            </Box>
          )}
          <Tooltip title={collapsed ? "Développer" : "Réduire"} placement="right">
            <IconButton size="small" onClick={() => setCollapsed((v) => !v)} sx={{ color: "white" }}>
              {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Nav items */}
        <List component="nav" disablePadding sx={{ flex: 1, pt: 1, overflowY: "auto", overflowX: "hidden" }}>
          {visibleFlat.map(renderItem)}

          {/* Référentiels group */}
          {renderGroup(
            "Référentiels",
            <LibraryBooksIcon />,
            visibleRef,
            refOpen,
            () => setRefOpen((v) => !v),
            "/referentiels",
          )}

          {/* Administration group */}
          {(isAdmin || visibleAdm.length > 0) &&
            renderGroup(
              "Administration",
              <AdminPanelSettingsIcon />,
              visibleAdm,
              adminOpen,
              () => setAdminOpen((v) => !v),
              "/admin",
            )}
        </List>

        {/* Utilisateur + déconnexion */}
        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            px: collapsed ? 0 : 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 1,
          }}
        >
          {!collapsed && (
            <Typography variant="caption" noWrap sx={{ color: "rgba(255,255,255,0.85)" }}>
              {userName} {userSurname}
            </Typography>
          )}
          <Tooltip title="Déconnexion" placement="right">
            <IconButton size="small" onClick={() => signOut({ callbackUrl: "/login" })} sx={{ color: "white" }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Contenu principal ── */}
      <Box flex={1} display="flex" flexDirection="column" overflow="hidden" bgcolor="#e0e0e0">
        <Box flex={1} overflow="auto">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
