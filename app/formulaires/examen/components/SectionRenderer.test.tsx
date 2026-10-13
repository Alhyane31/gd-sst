// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import SectionRenderer from "./SectionRenderer";
import { CONSTANTES } from "../config/constantes";
import { ANTECEDENTS_PROFESSIONNELS } from "../config/antecedentsProfessionnels";
import { EXAMEN_CLINIQUE } from "../config/examenClinique";
import { EXAMEN_PARACLINIQUE } from "../config/paraclinique";
import { RACHIS_LOMBAIRE } from "../config/rachis";
import type { SectionDef, SectionValues } from "../types";

afterEach(cleanup);

function Harness({ section, initial = {}, sexe }: { section: SectionDef; initial?: SectionValues; sexe?: string }) {
  const [values, setValues] = useState<SectionValues>(initial);
  return <SectionRenderer section={section} values={values} onChange={setValues} ctx={{ sexe }} champPrefix="examen" />;
}

describe("SectionRenderer", () => {
  it.each([...EXAMEN_CLINIQUE, ...EXAMEN_PARACLINIQUE].flatMap((g) => g.sections).map((s) => [s.id, s] as const))("affiche %s sans erreur", (_id, s) => {
    render(<Harness section={s} />);
    expect(screen.getAllByText(/./).length).toBeGreaterThan(0);
  });

  it("« Oui » ouvre les détails, « Non » les masque", () => {
    render(<Harness section={ANTECEDENTS_PROFESSIONNELS} />);
    expect(screen.queryByText("Détails des séquelles")).toBeNull();
    const radiosAT = screen.getAllByRole("radio", { name: "Oui" });
    fireEvent.click(radiosAT[0]); // accident de travail = Oui
    expect(screen.getAllByText("Déclaré").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("radio", { name: "Non" })[0]); // repasse à Non
    expect(screen.queryByText("Déclaré")).toBeNull();
  });

  it("affiche l'alerte d'urgence dès qu'un signe de queue de cheval est coché", () => {
    render(<Harness section={RACHIS_LOMBAIRE} />);
    expect(screen.queryByText(/URGENCE/)).toBeNull();
    fireEvent.click(screen.getByLabelText("Troubles urinaires"));
    expect(screen.getByText(/URGENCE/)).toBeTruthy();
  });

  it("« Aucun » décoche les autres signes et inversement", () => {
    const onChange = vi.fn();
    render(
      <SectionRenderer section={RACHIS_LOMBAIRE} values={{ queueDeCheval: ["URINAIRES"] }} onChange={onChange} ctx={{}} champPrefix="examen" />
    );
    fireEvent.click(screen.getByLabelText("Aucun"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ queueDeCheval: ["AUCUN"] }));
  });

  it("calcule l'IMC en direct et signale une valeur hors bornes", () => {
    render(<Harness section={CONSTANTES} initial={{ poids: "70", taille: "175", pasD: "300" }} />);
    expect(screen.getByText("22,9 kg/m² — Normal")).toBeTruthy();
    expect(screen.getByText("Maximum 260")).toBeTruthy();
  });
});

describe("SectionRenderer : suggestions et obligatoires", () => {
  const s: SectionDef = {
    id: "sugg",
    title: "Sugg",
    fields: [{ kind: "choice", id: "risque", label: "Risque", required: true, options: [{ value: "IMPORTANT", label: "Important" }, { value: "MINIME", label: "Minime" }] }],
    alerts: (v) => (v.risque ? [] : [{ severite: "info", message: "Suggestion : Important", appliquer: { libelle: "Appliquer", valeurs: { risque: "IMPORTANT" } } }]),
  };

  it("la suggestion n'est appliquée que sur clic, et reste modifiable", () => {
    const onChange = vi.fn();
    render(<SectionRenderer section={s} values={{}} onChange={onChange} ctx={{}} champPrefix="aes" />);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Appliquer"));
    expect(onChange).toHaveBeenCalledWith({ risque: "IMPORTANT" });
  });

  it("marque les champs obligatoires et signale ceux qui manquent", () => {
    render(<SectionRenderer section={s} values={{}} onChange={() => {}} ctx={{}} champPrefix="aes" missing={["risque"]} />);
    expect(screen.getByText("Risque *")).toBeTruthy();
    expect(screen.getByText("Obligatoire")).toBeTruthy();
  });
});
