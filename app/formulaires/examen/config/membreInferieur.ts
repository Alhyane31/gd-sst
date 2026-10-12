// 4.5 Membre inférieur. Mobilités : actif D, actif G, passif D, passif G.
// Neurologique L2–S1 : voir Rachis lombaire (4.4).
import type { SectionDef } from "../types";
import { COL_INSPECTION_PALPATION, COL_PALPATION, COL_PRESENCE_DG, COL_TESTS, opts } from "./presets";

export const MEMBRE_INFERIEUR: SectionDef = {
  id: "membreInferieur",
  title: "Membre inférieur",
  intro: "Examen neurologique L2–S1 : voir Rachis lombaire (4.4).",
  fields: [
    // ── Général (debout et à la marche)
    { kind: "heading", id: "h_general", label: "Général (debout et à la marche)" },
    {
      kind: "choice",
      id: "marche",
      label: "Marche",
      options: opts(["NORMALE", "Normale", true], ["ESQUIVE", "Boiterie d'esquive"], ["TRENDELENBURG", "Boiterie de Trendelenburg"], ["AUTRE", "Autre"]),
    },
    {
      kind: "grid",
      id: "morphotype",
      label: "Morphotype",
      columns: COL_PRESENCE_DG,
      rows: opts(
        ["GENU_VARUM", "Genu varum"],
        ["GENU_VALGUM", "Genu valgum"],
        ["GENU_RECURVATUM", "Genu recurvatum"],
        ["PIED_PLAT", "Pied plat"],
        ["PIED_CREUX", "Pied creux"],
        ["HALLUX_VALGUS", "Hallux valgus"]
      ),
    },
    {
      kind: "grid",
      id: "inspection",
      label: "Inspection",
      columns: COL_PRESENCE_DG,
      rows: opts(
        ["AMYO_QUADRICEPS", "Amyotrophie quadriceps"],
        ["AMYO_MOLLET", "Amyotrophie mollet"],
        ["OEDEME", "Œdème"],
        ["VARICES", "Varices"],
        ["CICATRICE", "Cicatrice"],
        ["DEFORMATION", "Déformation"]
      ),
    },
    { kind: "measure", id: "longueurD", label: "Longueur du membre — D", unit: "cm", min: 50, max: 130, help: "Épine iliaque antéro-supérieure → malléole interne" },
    { kind: "measure", id: "longueurG", label: "Longueur du membre — G", unit: "cm", min: 50, max: 130, help: "Épine iliaque antéro-supérieure → malléole interne" },

    // ── Hanche
    { kind: "heading", id: "h_hanche", label: "Hanche" },
    {
      kind: "grid",
      id: "hanchePalpation",
      label: "Palpation",
      columns: COL_PALPATION,
      rows: opts(["PLI_INGUINAL", "Pli inguinal"], ["GRAND_TROCHANTER", "Grand trochanter"], ["ISCHION", "Ischion"]),
    },
    {
      kind: "mobility",
      id: "hancheMobilite",
      label: "Mobilité",
      max: 180,
      movements: [
        { id: "FLEXION", label: "Flexion", normal: "N 120°" },
        { id: "EXTENSION", label: "Extension", normal: "N 20°" },
        { id: "ABDUCTION", label: "Abduction", normal: "N 45°" },
        { id: "ADDUCTION", label: "Adduction", normal: "N 30°" },
        { id: "ROTATION_INTERNE", label: "Rotation interne", normal: "N 30–40°" },
        { id: "ROTATION_EXTERNE", label: "Rotation externe", normal: "N 45–60°" },
      ],
    },
    {
      kind: "grid",
      id: "hancheTests",
      label: "Tests",
      columns: COL_TESTS,
      rows: opts(
        ["FABER", "FABER (Patrick)"],
        ["FADIR", "FADIR (conflit fémoro-acétabulaire)"],
        ["THOMAS", "Thomas (flessum)"],
        ["TRENDELENBURG", "Trendelenburg"],
        ["LOG_ROLL", "Log roll"]
      ),
    },

    // ── Genou
    { kind: "heading", id: "h_genou", label: "Genou" },
    {
      kind: "grid",
      id: "genouInspectionPalpation",
      label: "Inspection-palpation",
      columns: COL_INSPECTION_PALPATION,
      rows: opts(
        ["EPANCHEMENT", "Épanchement (choc rotulien)"],
        ["INTERLIGNE_INTERNE", "Interligne interne"],
        ["INTERLIGNE_EXTERNE", "Interligne externe"],
        ["ROTULE", "Rotule"],
        ["TUBEROSITE_TIBIALE", "Tubérosité tibiale"],
        ["CREUX_POPLITE", "Creux poplité"]
      ),
    },
    {
      kind: "mobility",
      id: "genouMobilite",
      label: "Mobilité",
      max: 180,
      movements: [
        { id: "FLEXION", label: "Flexion", normal: "N 140°" },
        { id: "EXTENSION", label: "Extension", normal: "N 0°" },
        { id: "FLESSUM", label: "Flessum", normal: "N 0°" },
        { id: "RECURVATUM", label: "Recurvatum", normal: "N 0°" },
      ],
    },
    {
      kind: "grid",
      id: "genouMenisques",
      label: "Tests — Ménisques",
      columns: COL_TESTS,
      rows: opts(["MCMURRAY", "McMurray"], ["APLEY", "Apley (grinding)"], ["THESSALY", "Thessaly"]),
    },
    {
      kind: "grid",
      id: "genouCroises",
      label: "Tests — Ligaments croisés",
      columns: COL_TESTS,
      rows: opts(
        ["LACHMAN", "Lachman"],
        ["TIROIR_ANTERIEUR", "Tiroir antérieur"],
        ["PIVOT_SHIFT", "Ressaut (pivot shift)"],
        ["TIROIR_POSTERIEUR", "Tiroir postérieur"],
        ["AVALEMENT_TTA", "Avalement de la TTA"]
      ),
    },
    {
      kind: "grid",
      id: "genouCollateraux",
      label: "Tests — Ligaments collatéraux",
      columns: COL_TESTS,
      rows: opts(["VALGUS_0", "Valgus forcé à 0°"], ["VALGUS_30", "Valgus forcé à 30°"], ["VARUS_0", "Varus forcé à 0°"], ["VARUS_30", "Varus forcé à 30°"]),
    },
    {
      kind: "grid",
      id: "genouFemoroPatellaire",
      label: "Tests — Fémoro-patellaire",
      columns: COL_TESTS,
      rows: opts(["RABOT", "Signe du rabot"], ["APPREHENSION", "Appréhension rotulienne"], ["ZOHLEN", "Zohlen"]),
    },

    // ── Cheville et pied
    { kind: "heading", id: "h_cheville", label: "Cheville et pied" },
    {
      kind: "grid",
      id: "chevilleInspectionPalpation",
      label: "Inspection-palpation",
      columns: COL_INSPECTION_PALPATION,
      rows: opts(
        ["OEDEME", "Œdème"],
        ["MALLEOLE_INTERNE", "Malléole interne"],
        ["MALLEOLE_EXTERNE", "Malléole externe"],
        ["ACHILLE", "Tendon d'Achille"],
        ["BASE_5E_METATARSIEN", "Base du 5e métatarsien"],
        ["VOUTE_PLANTAIRE", "Voûte plantaire"],
        ["AVANT_PIED", "Avant-pied"]
      ),
    },
    {
      kind: "mobility",
      id: "chevilleMobilite",
      label: "Mobilité",
      max: 90,
      movements: [
        { id: "FLEXION_DORSALE", label: "Flexion dorsale", normal: "N 20°" },
        { id: "FLEXION_PLANTAIRE", label: "Flexion plantaire", normal: "N 40–50°" },
        { id: "INVERSION", label: "Inversion", normal: "N 30°" },
        { id: "EVERSION", label: "Éversion", normal: "N 20°" },
      ],
    },
    {
      kind: "grid",
      id: "chevilleTests",
      label: "Tests",
      columns: COL_TESTS,
      rows: opts(
        ["TIROIR_ANTERIEUR", "Tiroir antérieur de cheville"],
        ["TALAR_TILT", "Talar tilt"],
        ["SQUEEZE", "Squeeze test (syndesmose)"],
        ["THOMPSON", "Thompson (rupture d'Achille)"],
        ["TINEL_TARSIEN", "Tinel tarsien"]
      ),
    },
    { kind: "textarea", id: "precisions", label: "Précisions membre inférieur" },
  ],
};
