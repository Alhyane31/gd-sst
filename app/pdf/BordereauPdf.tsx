import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const s = StyleSheet.create({
  page:           { padding: 30, fontFamily: "Helvetica", fontSize: 8, flexDirection: "row" },

  // Colonne gauche
  sidebar:        { width: 115, paddingRight: 8, borderRightWidth: 1, borderRightColor: "#000" },
  sidebarTitle:   { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4, textTransform: "uppercase" },
  sidebarHr:      { borderBottomWidth: 1, borderBottomColor: "#000", marginBottom: 6 },
  sidebarSection: { marginBottom: 5 },
  sidebarHead:    { fontFamily: "Helvetica-Bold", fontSize: 7, marginBottom: 1 },
  sidebarLine:    { fontSize: 7, marginBottom: 1 },

  // Colonne droite
  main:           { flex: 1, paddingLeft: 15 },
  dateRight:      { textAlign: "right", marginBottom: 25, fontSize: 9 },
  lettre:         { textAlign: "center", fontSize: 16, marginBottom: 10 },
  destinataire:   { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "center", marginBottom: 25 },

  // Tableau
  table:          { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#000", marginBottom: 20 },
  row:            { flexDirection: "row" },
  cellObjet:      { flex: 4, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#000", padding: 5 },
  cellNombre:     { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#000", padding: 5, textAlign: "center" },
  cellObs:        { flex: 2, borderBottomWidth: 1, borderColor: "#000", padding: 5 },
  headerText:     { fontFamily: "Helvetica-Bold", fontSize: 8 },
  objetTitle:     { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4 },
  objetDate:      { fontFamily: "Helvetica-Bold", fontSize: 7, marginTop: 3, marginBottom: 1 },
  objetNom:       { fontSize: 7, marginLeft: 8 },

  signature:      { textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 30 },
});

type ConvItem = {
  nom:        string;
  prenom:     string;
  datePrevue: Date;
  categorie:  "SMR" | "VP";
};

type Props = {
  serialNumber: string;
  dateEdition:  Date;
  service:      string;
  convocations: ConvItem[];
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function groupByDate(items: ConvItem[]) {
  const map = new Map<string, ConvItem[]>();
  for (const c of items) {
    const key = fmtDate(c.datePrevue);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries());
}

function ObjetCell({ titre, items }: { titre: string; items: ConvItem[] }) {
  const groups = groupByDate(items);
  return (
    <View style={s.cellObjet}>
      <Text style={s.objetTitle}>{titre}</Text>
      {groups.map(([date, persons]) => (
        <View key={date}>
          <Text style={s.objetDate}>Le {date}</Text>
          {persons.map((p, i) => (
            <Text key={i} style={s.objetNom}>
              {p.prenom} {p.nom.toUpperCase()}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function BordereauPdf({ serialNumber, dateEdition, service, convocations }: Props) {
  const smr = convocations.filter((c) => c.categorie === "SMR");
  const vp  = convocations.filter((c) => c.categorie === "VP");

  const rows: Array<{ titre: string; items: ConvItem[] }> = [];
  if (smr.length) rows.push({ titre: "Convocations pour la Visite Médicale Rapprochée", items: smr });
  if (vp.length)  rows.push({ titre: "Convocations pour la Visite Médicale Périodique",  items: vp });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Colonne gauche ─────────────────────── */}
        <View style={s.sidebar}>
          <Text style={s.sidebarTitle}>Service de Santé au Travail</Text>
          <View style={s.sidebarHr} />

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Chef de Service Par Intérim :</Text>
            <Text style={s.sidebarLine}>Pr. Kamal WIFAQ</Text>
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Enseignants :</Text>
            {["Pr. Ag. Loubna TAHRI", "Pr. Ass. Sara SOLTANI", "Pr. Ass. Asmaa OMALI"].map((n) => (
              <Text key={n} style={s.sidebarLine}>{n}</Text>
            ))}
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Médecin Spécialiste :</Text>
            <Text style={s.sidebarLine}>Dr. Fadwa DARID</Text>
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Résidents :</Text>
            {[
              "Dr. Meriem JBARA",
              "Dr. Imane MAZROUI",
              "Dr. Asmaa HAMMAL",
              "Dr. Malak BENJDYA",
              "Dr. Kawtar ES-SAADI",
              "Dr. Imane ZERRAD",
              "Dr. Soukaina KADDA",
              "Dr. Soumia HAMIL",
              "Dr. Saad LEKBIRI",
              "Dr. Sara LAHMAMI",
              "Dr. Salma AALAILA",
            ].map((n) => <Text key={n} style={s.sidebarLine}>{n}</Text>)}
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Secrétariat :</Text>
            <Text style={s.sidebarLine}>Mme Najat YAFIT</Text>
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Infirmière Chef :</Text>
            <Text style={s.sidebarLine}>Mlle Karima MOTRANE</Text>
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Infirmières :</Text>
            {[
              "Mme Narjiss HAMMOUNE",
              "Mme Amina NOUHI",
              "Mme Touria ZOUINE",
              "Mme Assia BENDAQ",
            ].map((n) => <Text key={n} style={s.sidebarLine}>{n}</Text>)}
          </View>

          <View style={s.sidebarSection}>
            <Text style={s.sidebarHead}>Activités :</Text>
            {[
              "Médecine du Travail du Personnel Hospitalier",
              "Consultation de Pathologie Professionnelle",
              "Toxicologie Industrielle",
              "Hygiène et Sécurité au Travail",
              "Expertise en Aptitude au Travail",
              "Assistance, Conseil et Vigilance Professionnelle",
            ].map((n) => <Text key={n} style={s.sidebarLine}>{n}</Text>)}
          </View>
        </View>

        {/* ── Colonne droite ─────────────────────── */}
        <View style={s.main}>
          <Text style={s.dateRight}>Casablanca, le {fmtDate(dateEdition)}</Text>
          <Text style={s.lettre}>A</Text>
          <Text style={s.destinataire}>
            Monsieur / Madame le Chef de Service de {service}
          </Text>

          {/* Tableau */}
          <View style={s.table}>
            <View style={s.row}>
              <View style={s.cellObjet}>
                <Text style={s.headerText}>Objet</Text>
              </View>
              <View style={s.cellNombre}>
                <Text style={s.headerText}>Nombre</Text>
              </View>
              <View style={s.cellObs}>
                <Text style={s.headerText}>Observation</Text>
              </View>
            </View>

            {rows.map((r) => (
              <View key={r.titre} style={s.row}>
                <ObjetCell titre={r.titre} items={r.items} />
                <View style={s.cellNombre}>
                  <Text>{r.items.length}</Text>
                </View>
                <View style={s.cellObs}>
                  <Text>Convocations jointes</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.signature}>Pr. K. WIFAQ</Text>
        </View>
      </Page>
    </Document>
  );
}
