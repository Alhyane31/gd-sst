// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import PersonnelFormStepper from "./PersonnelFormStepper";
import { REFERENTIEL_AES_DEFAUT } from "@/lib/aes/referentiel";
import { emptyData } from "../mapper";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function monter(onSubmit = vi.fn(), onSave = vi.fn()) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ declaration: null, referentiel: REFERENTIEL_AES_DEFAUT, visite: {}, dossier: {} }), { status: 200 })
  );
  render(
    <PersonnelFormStepper
      mode="edit"
      visiteId="v1"
      initialData={{ ...emptyData, typeVisite: "AES", aes: {} }}
      categoriePersonnel="VP"
      onSave={onSave}
      onSubmit={onSubmit}
    />
  );
  return { onSubmit, onSave };
}

describe("formulaire de visite AES", () => {
  it("affiche les étapes AES dans le même formulaire", () => {
    monter();
    expect(screen.getByText("AES – Circonstances")).toBeTruthy();
    expect(screen.getByText("AES – Consultations de résultats")).toBeTruthy();
    expect(screen.queryByText("AES – Description de la plaie")).toBeNull();
  });

  it("une étape AES affiche la section de la déclaration", () => {
    monter();
    fireEvent.click(screen.getByText("AES – Type d'exposition"));
    expect(screen.getByText("3. Type d'exposition")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Coupure"));
    expect(screen.getByText("AES – Description de la plaie")).toBeTruthy();
  });

  it("« Valider » est bloqué tant que les obligatoires AES manquent, et ouvre la 1re étape incomplète", async () => {
    const { onSubmit } = monter();
    fireEvent.click(screen.getByText("AES – Consultations de résultats"));
    fireEvent.click(await screen.findByText("Valider"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/AES — champs obligatoires manquants/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText("1. Circonstances")).toBeTruthy());
  });
});
