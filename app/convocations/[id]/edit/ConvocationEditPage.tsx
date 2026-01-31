"use client";

import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PersonnelHeaderReadonly from "../../components/PersonnelHeaderReadonly";
type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE"
  | "ANNULEE";

type ConvocationType = "INITIALE" | "RELANCE_1" | "RELANCE_2" | "RELANCE_3";
type VisiteType = "ANNUELLE" | "RAPPROCHEE";

export default function ConvocationEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [c, setC] = useState<any>(null);

  const [form, setForm] = useState({
    type: "ANNUELLE" as VisiteType,
    statut: "A_CONVOQUER" as ConvocationStatut,
    convocationType: "INITIALE" as ConvocationType,
    dateConvocation: "",
    datePrevue: "",
   
    commentaire: "",
  });

  const [openCancel, setOpenCancel] = useState(false);
  const [motif, setMotif] = useState("");
const toDatetimeLocalValue = (value: any) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocalToISO = (value: string) => {
  // value: "YYYY-MM-DDTHH:mm"
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/convocations/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setC(data);

      

       setForm({
  type: data.type,
  statut: data.statut,
  convocationType: data.convocationType,
  dateConvocation: toDatetimeLocalValue(data.dateConvocation),
  datePrevue: toDatetimeLocalValue(data.datePrevue),
  commentaire: data.commentaire ?? "",
});

      } catch {
        setC(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/convocations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dateConvocation: form.dateConvocation ? new Date(form.dateConvocation).toISOString() : null,
          datePrevue: form.datePrevue ? new Date(form.datePrevue).toISOString() : null,
          
          commentaire: form.commentaire || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Erreur sauvegarde");
        return;
      }

      router.push(`/convocations/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAnnuler = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/convocations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif: motif || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Erreur annulation");
        return;
      }
      router.push(`/convocations/${id}`);
    } finally {
      setSaving(false);
      setOpenCancel(false);
      setMotif("");
    }
  };

  if (loading) return <Box p={4}>Chargement...</Box>;
  if (!c) return <Box p={4}>Convocation introuvable</Box>;

  return (
    
    <Box p={4}>
      


      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Modifier convocation</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => router.push(`/convocations`)}>
            Retour
          </Button>
          <Button color="error" variant="outlined" onClick={() => setOpenCancel(true)} disabled={saving}>
            Annuler convocation
          </Button>
        </Box>
      </Box>
<Box >
  

  {/* 🔒 Personnel rappelé (non modifiable) */}
  <PersonnelHeaderReadonly personnel={c.personnel} />

 
</Box>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} fullWidth>
          

          <Grid item xs={12}  md={3}>
            <TextField select fullWidth size="small" label="Statut" name="statut" value={form.statut} onChange={handleChange}>
              <MenuItem value="A_CONVOQUER">À convoquer</MenuItem>
              <MenuItem value="CONVOCATION_GENEREE">Convocation générée</MenuItem>
              <MenuItem value="A_TRAITER">À traiter</MenuItem>
              <MenuItem value="A_RELANCER">À relancer</MenuItem>
              <MenuItem value="RELANCEE">Relancé</MenuItem>
              <MenuItem value="REALISEE">Réalisé</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type convocation"
              name="convocationType"
              value={form.convocationType}
              onChange={handleChange}
            >
              <MenuItem value="INITIALE">Initiale</MenuItem>
              <MenuItem value="RELANCE_1">Relance 1</MenuItem>
              <MenuItem value="RELANCE_2">Relance 2</MenuItem>
              <MenuItem value="RELANCE_3">Relance 3</MenuItem>
            </TextField>
          </Grid>


          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="Date convocation"
              name="dateConvocation"
              value={form.dateConvocation}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              
              size="small"
              type="datetime-local"
              label="Date prévue"
              name="datePrevue"
              value={form.datePrevue}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

       
        </Grid>
        <Grid item xs={12}>
  <Box
    sx={{
      
    
      
      mt: 1
    }}>
           <Grid item xs={12} md={6}>
            <TextField
              
              
              size="small"
      
      multiline
      minRows={2}
      sx={{ flex: "0 0 70%" }}
      fullWidth
              label="Commentaire"
              name="commentaire"
              value={form.commentaire}
              onChange={handleChange}
            />
           
              <Grid item xs={12}>
  <Box sx={{ height: 30
   }} /> {/* espace visuel clair */}
</Grid>
           <Box
   sx={{
            flexBasis: { xs: "100%", md: "20%" },
            flexGrow: 1,
            minWidth: 200,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
          >
            
            <Button  variant="outlined" onClick={() => router.push(`/convocations/${id}`)} disabled={saving}>
              Annuler
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button></Box>
          </Grid>

          </Box>
</Grid>
      </Paper>

      <Dialog open={openCancel} onClose={() => setOpenCancel(false)} fullWidth maxWidth="sm">
        <DialogTitle>Annuler la convocation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Motif (optionnel)"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancel(false)} disabled={saving}>Fermer</Button>
          <Button color="error" variant="contained" onClick={handleAnnuler} disabled={saving}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
