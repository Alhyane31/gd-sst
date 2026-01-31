"use client";

import { ReactNode, useState } from "react";
import { Box, List, ListItemButton, ListItemText, Collapse, Typography } from "@mui/material";
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
        <Box width={200} bgcolor="#1976d2" color="white" p={2} position="sticky" top={0} height="100%" overflow="auto">
          <Typography variant="h6" mb={2}>Menu</Typography>
          <List component="nav">
            <ListItemButton onClick={() => router.push("/")}>
              <ListItemText primary="Accueil" />
            </ListItemButton>
            <ListItemButton onClick={() => router.push("/personnel")}>
              <ListItemText primary="Personnel" />
            </ListItemButton>
<ListItemButton onClick={() => router.push("/convocations")}>
              <ListItemText primary="Gérer les convocations" />
            </ListItemButton>

            
            <ListItemButton>
              <ListItemText primary="Créer un nouveau dossier" />
            </ListItemButton>

            <ListItemButton onClick={handleClickVisite}>
              <ListItemText primary="Créer une nouvelle visite" />
              {openVisite ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openVisite} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemText primary="Visite annuelle" />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4 }}>
                  <ListItemText primary="Visite rapprochée" />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </Box>

        <Box flex={1} p={3} bgcolor="#e0e0e0" overflow="auto"  maxHeight="100vh" >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
