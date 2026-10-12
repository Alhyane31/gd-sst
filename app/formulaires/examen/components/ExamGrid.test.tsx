// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ExamGrid from "./ExamGrid";
import { COL_TESTS, opts } from "../config/presets";

const rows = opts(["NEER", "Neer"], ["HAWKINS", "Hawkins-Kennedy"]);

afterEach(cleanup);

describe("ExamGrid (grille D/G)", () => {
  it("affiche une ligne par item et une colonne par option", () => {
    render(<ExamGrid label="Conflit" rows={rows} columns={COL_TESTS} value={{}} onChange={() => {}} />);
    expect(screen.getByText("Neer")).toBeTruthy();
    expect(screen.getByText("Anormal D")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(rows.length * COL_TESTS.length);
  });

  it("enregistre la réponse choisie pour une ligne", () => {
    const onChange = vi.fn();
    render(<ExamGrid rows={rows} columns={COL_TESTS} value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Neer — Anormal G"));
    expect(onChange).toHaveBeenCalledWith({ NEER: "ANORMAL_G" });
  });

  it("n'est pas obligatoire : recliquer efface la réponse", () => {
    const onChange = vi.fn();
    render(<ExamGrid rows={rows} columns={COL_TESTS} value={{ NEER: "NORMAL" }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Neer — Normal"));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it("« Tout Normal » remplit toutes les lignes", () => {
    const onChange = vi.fn();
    render(<ExamGrid label="Conflit" rows={rows} columns={COL_TESTS} value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByText("Tout « Normal »"));
    expect(onChange).toHaveBeenCalledWith({ NEER: "NORMAL", HAWKINS: "NORMAL" });
  });

  it("colonnes configurables (ex. Absent / Présent D / Présent G / Bilatéral)", () => {
    const cols = opts(["ABSENT", "Absent", true], ["PRESENT_D", "Présent D"], ["PRESENT_G", "Présent G"], ["BILATERAL", "Bilatéral"]);
    render(<ExamGrid rows={rows} columns={cols} value={{}} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(rows.length * 4);
    expect(screen.queryByText("Non fait")).toBeNull();
  });

  it("lecture seule : radios désactivés, pas de bouton « Tout »", () => {
    render(<ExamGrid label="Conflit" rows={rows} columns={COL_TESTS} value={{}} onChange={() => {}} readOnly />);
    expect((screen.getByLabelText("Neer — Normal") as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByText("Tout « Normal »")).toBeNull();
  });
});
