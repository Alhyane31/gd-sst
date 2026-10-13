// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { REFERENTIEL_AES_DEFAUT as REF } from "@/lib/aes/referentiel";
import { contexteAes } from "@/lib/aes/contexte";
import Consultations from "./Consultations";
import DeclarationForm from "./DeclarationForm";
import { DECLARATION_AES, S9_PRISE_EN_CHARGE } from "../config/declaration";
import { lignesSection } from "../lecture";
import type { DeclarationApi } from "../types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const declaration = (patch: Partial<DeclarationApi> = {}): DeclarationApi => ({
  id: "d1",
  statut: "VALIDEE",
  data: { tpe: "NON_INDIQUE", declarationAT: "NON_FAITE" },
  motifArretSuivi: null,
  validatedAt: null,
  clotureAt: null,
  createdAt: "2026-10-12",
  updatedAt: "2026-10-12",
  suivis: [{ id: "s1", code: "J1_J7", datePrevue: "2026-10-19T00:00:00.000Z", statut: "PREVUE", bilans: ["VIH", "VHC", "ALAT"] }],
  consultations: [],
  ...patch,
});

describe("Déclaration AES (interface)", () => {
  it("la section « Description de la plaie » apparaît pour une piqûre, pas pour une projection", () => {
    render(<DeclarationForm visiteId="v1" declaration={null} referentiel={REF} onSaved={() => {}} />);
    expect(screen.queryByText("4. Description de la plaie")).toBeNull();
    fireEvent.click(screen.getByLabelText("Piqûre"));
    expect(screen.getByText("4. Description de la plaie")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Projection sur muqueuse"));
    expect(screen.queryByText("4. Description de la plaie")).toBeNull();
    expect(screen.getByText("5. Description de la projection")).toBeTruthy();
  });

  it("valider sans les champs obligatoires : bloqué, sans appel serveur", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<DeclarationForm visiteId="v1" declaration={null} referentiel={REF} onSaved={() => {}} />);
    fireEvent.click(screen.getByText("Valider la déclaration"));
    expect(screen.getByText(/Champs obligatoires manquants/)).toBeTruthy();
    expect(screen.getAllByText("Obligatoire").length).toBeGreaterThan(5);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("dossier clôturé : lecture seule, pas de bouton d'enregistrement", () => {
    render(<DeclarationForm visiteId="v1" declaration={declaration({ statut: "CLOTUREE" })} referentiel={REF} onSaved={() => {}} />);
    expect(screen.queryByText("Enregistrer")).toBeNull();
  });
});

describe("Consultations de résultats (répétables)", () => {
  it("une fiche par consultation enregistrée et un bouton « Ajouter une consultation »", () => {
    const d = declaration({
      consultations: [
        { id: "c1", visite: "J1_J7", dateConsultation: "2026-10-19", data: { resultats: { VIH: "POSITIF" } }, createdAt: "", updatedAt: "" },
        { id: "c2", visite: "NON_PROGRAMMEE", dateConsultation: "2026-10-25", data: {}, createdAt: "", updatedAt: "" },
      ],
    });
    render(<Consultations visiteId="v1" declaration={d} referentiel={REF} onSaved={() => {}} />);
    expect(screen.getByText("J1–J7")).toBeTruthy();
    expect(screen.getByText("Non programmée")).toBeTruthy();
    expect(screen.getByText("Positif : VIH")).toBeTruthy();
    fireEvent.click(screen.getByText("Ajouter une consultation"));
    expect(screen.getByText("Nouvelle consultation de résultats")).toBeTruthy();
  });

  it("rappel AT tant que la déclaration n'est pas faite", () => {
    render(<Consultations visiteId="v1" declaration={declaration()} referentiel={REF} onSaved={() => {}} />);
    expect(screen.getByText(/accident du travail n.est pas faite/)).toBeTruthy();
  });

  it("indisponible tant que la déclaration est en brouillon", () => {
    render(<Consultations visiteId="v1" declaration={declaration({ statut: "BROUILLON" })} referentiel={REF} onSaved={() => {}} />);
    expect(screen.getByText(/après validation de la déclaration/)).toBeTruthy();
  });
});

describe("compte rendu : valeurs lisibles", () => {
  it("libellés des options et champs calculés", () => {
    const ctx = contexteAes(declaration(), REF, true);
    const lignes = lignesSection(DECLARATION_AES[0], { dateAes: "2026-10-12", heureAes: "08:00", dateHeureDeclaration: "2026-10-12T10:30", lieu: "BLOC" }, ctx);
    expect(lignes).toEqual(
      expect.arrayContaining([
        { label: "Date de l'AES", valeur: "12/10/2026" },
        { label: "Délai AES → déclaration", valeur: "< 4 h (2 h 30 min)" },
        { label: "Lieu", valeur: "Bloc opératoire" },
      ])
    );
    const tpe = lignesSection(S9_PRISE_EN_CHARGE, { tpe: "ACCEPTE", schemaTpe: "OMS_2024" }, ctx);
    expect(tpe.find((l) => l.label === "Schéma prescrit")?.valeur).toContain("Actuel (OMS 2024)");
  });
});
