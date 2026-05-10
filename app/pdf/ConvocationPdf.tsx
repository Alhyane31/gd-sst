import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import path from "path";

const logoGauche = path.join(process.cwd(), "public", "images", "image2.jpg"); // Ministère
const logoDroite = path.join(process.cwd(), "public", "images", "image1.jpg"); // CHU Ibn Rochd

const s = StyleSheet.create({
  page:      { padding: 30, fontFamily: "Helvetica", fontSize: 9.5, color: "#000" },
  header:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoG:     { width: 65, height: 55, objectFit: "contain" },
  logoD:     { width: 75, height: 55, objectFit: "contain" },
  titleBloc: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  titleMain: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginBottom: 4, textAlign: "center" },
  titleSub:  { fontFamily: "Helvetica-Bold", fontSize: 9.5, textAlign: "center" },
  fieldRow:  { flexDirection: "row", marginBottom: 7 },
  bold:      { fontFamily: "Helvetica-Bold" },
  fcPoste:   { marginBottom: 14 },
  para:      { marginBottom: 9, lineHeight: 1.6, textAlign: "justify" },
  bullet:    { marginLeft: 20, marginBottom: 4 },
  closing:   { marginTop: 14, lineHeight: 1.6, textAlign: "justify" },
});

export type ConvocationPdfProps = {
  categorie: "SMR" | "VP";
  formation: string;
  service:   string;
  numero:    string;
  nomPrenom: string;
  fc:        string;
  poste:     string;
  date:      string;
  heure:     string;
};

export function ConvocationPdf({
  categorie, formation, service, numero, nomPrenom, fc, poste, date, heure,
}: ConvocationPdfProps) {
  const isSmr     = categorie === "SMR";
  const titleMain = isSmr
    ? "Surveillance Médicale Rapprochée (SMR)"
    : "Surveillance Médicale Périodique";
  const typeTexte = isSmr ? "rapprochée" : "périodique";
  const fcPoste   = [fc, poste].filter(Boolean).join("  ");

  return (
    <Document>
      <Page size="A5" style={s.page}>
        {/* En-tête : Ministère (gauche) | Titre | CHU (droite) */}
        <View style={s.header}>
          <Image src={logoGauche} style={s.logoG} />
          <View style={s.titleBloc}>
            <Text style={s.titleMain}>{titleMain}</Text>
            <Text style={s.titleSub}>Convocation à la visite médicale</Text>
          </View>
          <Image src={logoDroite} style={s.logoD} />
        </View>

        {/* Champs */}
        <View style={s.fieldRow}>
          <Text style={s.bold}>Formation : </Text>
          <Text>{formation}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.bold}>Service : </Text>
          <Text>{service}</Text>
          {numero ? (
            <>
              <Text style={[s.bold, { marginLeft: 15 }]}>  N° : </Text>
              <Text>{numero}</Text>
            </>
          ) : null}
        </View>
        <View style={s.fieldRow}>
          <Text style={s.bold}>Nom et prénom : </Text>
          <Text>{nomPrenom}</Text>
        </View>
        {fcPoste
          ? <Text style={s.fcPoste}>{fcPoste}</Text>
          : <View style={{ marginBottom: 14 }} />}

        {/* Corps */}
        <Text style={s.para}>
          Dans le cadre de ses missions, le Service de Santé au Travail du Centre
          Hospitalier Universitaire Ibn Rochd, organise la surveillance médicale{" "}
          {typeTexte} au profit du personnel hospitalier.
        </Text>

        <Text style={s.para}>
          Aussi, vous êtes prié de vous présenter le :{" "}
          <Text style={s.bold}>{date} à {heure}</Text>, au Service de Santé au Travail
          muni des documents suivants :
        </Text>

        <Text style={s.bullet}>-   La présente convocation</Text>
        <Text style={s.bullet}>-   Votre pièce d'identité</Text>

        <Text style={s.closing}>
          Veuillez agréer, Madame/Monsieur, l'expression de nos salutations distinguées.
        </Text>
      </Page>
    </Document>
  );
}
