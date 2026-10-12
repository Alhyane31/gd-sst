// Moteur déclaratif des examens (clinique 4.x, paraclinique 5.x).
// Chaque section est décrite une fois (config/*.ts) et rendue par SectionRenderer.
import type { Alerte, Severite } from "@/lib/clinique/mesures";

export type Option = {
  value: string;
  label: string;
  /** valeur « normale » : non comptée comme anomalie, cible du bouton « Tout … » */
  normal?: boolean;
};

/** Valeurs d'une section : { [fieldId]: valeur } */
export type SectionValues = Record<string, unknown>;

/** Contexte de la visite, utilisé par les conditions d'affichage et les alertes */
export type ExamCtx = {
  visiteId?: string;
  visiteType?: string;
  sexe?: string;
  posteCode?: string;
  readOnly?: boolean;
};

type Condition = (values: SectionValues, ctx: ExamCtx) => boolean;

type BaseField = {
  id: string;
  label: string;
  /** texte d'aide / valeurs usuelles affichées sous le champ */
  help?: string;
  showIf?: Condition;
};

/** Grille lignes × colonnes (une seule réponse par ligne, non obligatoire) */
export type GridFieldDef = BaseField & { kind: "grid"; rows: Option[]; columns: Option[] };

export type MeasureFieldDef = BaseField & {
  kind: "measure";
  unit?: string;
  min?: number;
  max?: number;
  integer?: boolean;
};

export type Movement = {
  id: string;
  label: string;
  /** valeur normale affichée en aide, ex. "N 180°" */
  normal?: string;
  /** mode "actif" uniquement : un champ D et un champ G (sinon un seul champ) */
  bilateral?: boolean;
};

/**
 * Mobilités articulaires.
 * - "actif-passif" : 4 champs par mouvement (actif D, actif G, passif D, passif G)
 * - "actif" : 1 champ par mouvement, ou D/G si `bilateral`
 */
export type MobilityFieldDef = BaseField & {
  kind: "mobility";
  movements: Movement[];
  mode?: "actif-passif" | "actif";
  max?: number;
};

export type EvaFieldDef = BaseField & { kind: "eva" };

export type ChoiceFieldDef = BaseField & { kind: "choice"; options: Option[] };

export type CheckboxesFieldDef = BaseField & {
  kind: "checkboxes";
  options: Option[];
  /** option qui exclut les autres (ex. « Aucun ») */
  exclusive?: string;
};

export type SelectFieldDef = BaseField & { kind: "select"; options: Option[] };

export type TextFieldDef = BaseField & { kind: "text" | "textarea" | "date" };

export type AttachmentFieldDef = BaseField & { kind: "attachment" };

export type ComputedFieldDef = BaseField & {
  kind: "computed";
  compute: (values: SectionValues, ctx: ExamCtx) => { text: string; severite?: Severite } | null;
};

export type HeadingDef = { kind: "heading"; id: string; label: string; showIf?: Condition };

export type FieldDef =
  | GridFieldDef
  | MeasureFieldDef
  | MobilityFieldDef
  | EvaFieldDef
  | ChoiceFieldDef
  | CheckboxesFieldDef
  | SelectFieldDef
  | TextFieldDef
  | AttachmentFieldDef
  | ComputedFieldDef
  | HeadingDef;

export type SectionDef = {
  id: string;
  title: string;
  intro?: string;
  fields: FieldDef[];
  alerts?: (values: SectionValues, ctx: ExamCtx) => Alerte[];
  showIf?: (ctx: ExamCtx) => boolean;
};

/** Pièce jointe référencée dans les valeurs d'un champ "attachment" */
export type PieceJointeRef = { id: string; nom: string };
