"use client";

import { ReactNode, useState } from "react";
import { Box, List, ListItemButton, ListItemText, Collapse, Typography } from "@mui/material";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface SidebarMenuProps {
  userName: string;
  userSurname: string;
  children?: ReactNode;
}

export default function SidebarMenu({ userName, userSurname, children }: SidebarMenuProps) {
  const [openVisite, setOpenVisite] = useState(false);
  const handleClickVisite = () => setOpenVisite(!openVisite);
  const handleLogout = () => signOut({ callbackUrl: "/login" });
const router = useRouter();
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box
        width="100%"
        height={100}
        bgcolor="#f5f5f5"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={3}
      >
        {/* Logo */}
        <Box display="flex" alignItems="center">
          <Image src="/images/image1.jpg" alt="Logo" height={100} width={100}  />
        </Box>

        {/* Infos utilisateur */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="subtitle1">{userName}</Typography>
          <Typography variant="subtitle2">{userSurname}</Typography>
          <LogoutIcon
            sx={{ cursor: "pointer", fontSize: 30 }}
            onClick={handleLogout}
            color="action"
          />
        </Box>
      </Box>

      {/* Sidebar + contenu */}
      <Box display="flex" flex={1} overflow="hidden">
        <Box width={300} bgcolor="#1976d2" color="white" p={2} position="sticky" top={0} height="100%" overflow="auto">
          <Typography variant="h6" mb={2}>Menu</Typography>
         <List component="nav">

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/")}>
    <HomeIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Accueil" />
  </ListItemButton>

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/personnel")}>
    <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Personnel" />
  </ListItemButton>

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/referentiels/cim11")}>
    <MedicalInformationIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Référentiel CIM-11" />
  </ListItemButton>

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/convocations")}>
    <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Convocations" />
  </ListItemButton>

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/bordereaux")}>
    <ReceiptLongIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Bordereaux" />
  </ListItemButton>

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/visites")}>
    <EventNoteIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Visites" />
  </ListItemButton>

  <ListItemButton sx={{ gap: 1.5 }} onClick={() => router.push("/calendrier")}>
    <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} />
    <ListItemText primary="Calendrier" />
  </ListItemButton>

</List>
        </Box>

        <Box flex={1} p={3} bgcolor="#e0e0e0" overflow="auto"  maxHeight="100vh" >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
