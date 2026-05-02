import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// /api/visites/[id]/formulaire
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id: visiteId } = await params;

    if (!visiteId) {
      return NextResponse.json({ message: "visiteId manquant" }, { status: 400 });
    }

    const v = await prisma.visite.findUnique({
      where: { id: visiteId },
      include: {
        personnel: {
          include: {
            poste:      true,
            posteDetail: true,
            service:    true,
            formation:  true,
            pathologies: {
              include: { cim11: true },
              orderBy: { date: "desc" },
            },
          },
        },
        formulaire: {
          include: {
            formation:  true,
            service:    true,
            filledBy:   { select: { id: true, firstName: true, lastName: true } },
            submittedBy: { select: { id: true, firstName: true, lastName: true } },
            verifiedBy:  { select: { id: true, firstName: true, lastName: true } },
            pathologies: {
              include: { cim11: true },
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    if (!v) {
      return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
    }

    if (!v.formulaire) {
      return NextResponse.json(
        { message: "Aucun formulaire pour cette visite" },
        { status: 404 }
      );
    }

    // Extraire les sections du JSON data
    const data = (v.formulaire.data ?? {}) as Record<string, any>;
    const renseignements  = data.renseignementsProfessionnels ?? {};
    const suiviRapproche  = data.suiviRapproche ?? {};

    return NextResponse.json({
      visite: {
        id:        v.id,
        statut:    v.statut,
        type:      v.type,
        typeAutre: v.typeAutre,
        dateDebut: v.dateDebut,
        dateFin:   v.dateFin,
      },
      personnel: {
        ...v.personnel,
        // pathologies issues du dossier complet (pas seulement ce formulaire)
        pathologiesHistory: v.personnel.pathologies,
      },
      formulaire: {
        id:             v.formulaire.id,
        statut:         v.formulaire.statut,
        schemaVersion:  v.formulaire.schemaVersion,
        sectionsEnabled: v.formulaire.sectionsEnabled,
        createdAt:      v.formulaire.createdAt,
        updatedAt:      v.formulaire.updatedAt,
        submittedAt:    v.formulaire.submittedAt,
        verifiedAt:     v.formulaire.verifiedAt,
        filledBy:       v.formulaire.filledBy,
        submittedBy:    v.formulaire.submittedBy,
        verifiedBy:     v.formulaire.verifiedBy,

        // snapshot infos générales
        nom:            v.formulaire.snapshotLastName,
        prenom:         v.formulaire.snapshotFirstName,
        matricule:      v.formulaire.snapshotMatricule,
        dateNaissance:  v.formulaire.dateNaissance,
        statutSocial:   v.formulaire.statutSocial,

        // snapshot infos pro
        formationId:        v.formulaire.formationId,
        formation:          v.formulaire.formation,
        serviceId:          v.formulaire.serviceId,
        service:            v.formulaire.service,
        posteId:            (data.raw as any)?.posteId ?? null,
        poste:              (data.raw as any)?.poste ?? null,
        detailPosteId:      (data.raw as any)?.detailPosteId ?? null,
        detailPoste:        (data.raw as any)?.detailPoste ?? null,
        dateAffectation:    v.formulaire.dateAffectation,
        aTravailleHorsCHUIR: v.formulaire.aTravailleHorsCHUIR,
        autreLieuTravail:   v.formulaire.autreLieuTravail,
        autreDureeAnnees:   v.formulaire.autreDureeAnnees,
        autreHoraires:      v.formulaire.autreHoraires,

        // renseignements professionnels (depuis JSON)
        renseignementsProfessionnels: renseignements,

        // antécédents
        antecedents:       data.antecedents ?? "",
        pathologiesToAdd:  v.formulaire.pathologies.map((p) => ({
          cim11Code:    p.cim11.code,
          cim11Libelle: p.cim11.libelle,
          date:         p.date,
          commentaire:  p.commentaire,
          source:       p.source,
        })),

        // suivi rapproché (depuis JSON)
        necessitatSuiviRapproche: suiviRapproche.necessitatSuiviRapproche ?? null,
        nePlusNecessiterSuivi:    suiviRapproche.nePlusNecessiterSuivi    ?? null,
        motifsSuiviRapproche:     suiviRapproche.motifsSuiviRapproche    ?? [],
        prochainVisiteMois:       suiviRapproche.prochainVisiteMois      ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

import { Prisma, FormulaireStatut, FormSectionKey } from "@prisma/client";

type PathologieItem = {
  cim11Code?: string;
  cim11Libelle?: string;
  date?: string;
  commentaire?: string;
  source?: string;
};
type FormPayload = {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  statutSocial?: string;
  matricule?: string;

  formationId?: string | null;
  serviceId?: string | null;
  dateAffectationChu?: string;

  autreEtablissement?: "oui" | "non";
  lieuTravail?: string;
  dureeAnnees?: string;
  horaires?: string;

  travailGarde?: "oui" | "non";
  heuresGarde?: string;
  rythmeGarde?: string;

  travailNuit?: "oui" | "non";
  nbNuitsMois?: string;
  horairesNuit?: string;

  pathologiesToAdd?: PathologieItem[];
  antecedents?: string;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseIntOrNull(value?: string | null) {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id: visiteId } = await params;
    const body = (await req.json()) as FormPayload;

    const visite = await prisma.visite.findUnique({
      where: { id: visiteId },
      include: {
        personnel: true,
        formulaire: true,
      },
    });

    if (!visite) {
      return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
    }

    if (visite.formulaire) {
      return NextResponse.json(
        { message: "Un formulaire existe déjà pour cette visite" },
        { status: 409 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email ?? "" },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
    }

    const jsonData: Prisma.InputJsonValue = {
      renseignementsProfessionnels: {
        travailGarde: body.travailGarde ?? "non",
        heuresGarde: body.heuresGarde ?? "",
        rythmeGarde: body.rythmeGarde ?? "",
        travailNuit: body.travailNuit ?? "non",
        nbNuitsMois: body.nbNuitsMois ?? "",
        horairesNuit: body.horairesNuit ?? "",
      },
      antecedents: body.antecedents ?? "",
      pathologiesToAdd: body.pathologiesToAdd ?? [],
      raw: body,
    };

    const formulaire = await prisma.formulaire.create({
      data: {
        visiteId: visite.id,
        personnelId: visite.personnelId,

        statut: FormulaireStatut.DRAFT,
        schemaVersion: 1,
        sectionsEnabled: [
          FormSectionKey.INFORMATIONS_GENERALES,
          FormSectionKey.INFORMATIONS_PROFESSIONNELLES,
          FormSectionKey.RENSEIGNEMENTS_PROFESSIONNELS,
          FormSectionKey.ANTECEDENTS,
        ],

        snapshotFirstName: body.prenom ?? visite.personnel.firstName,
        snapshotLastName: body.nom ?? visite.personnel.lastName,
        snapshotMatricule: body.matricule ?? visite.personnel.matricule ?? null,
        dateNaissance: parseDate(body.dateNaissance) ?? visite.personnel.dateNaissance ?? null,
        statutSocial: (body.statutSocial as any) ?? visite.personnel.statutSocial ?? null,

        aTravailleHorsCHUIR:
          body.autreEtablissement === "oui"
            ? true
            : body.autreEtablissement === "non"
            ? false
            : null,

        autreLieuTravail: body.lieuTravail ?? null,
        autreDureeAnnees: parseIntOrNull(body.dureeAnnees),
        autreHoraires: body.horaires ?? null,

        formationId: body.formationId ?? visite.personnel.formationId ?? null,
        serviceId: body.serviceId ?? visite.personnel.serviceId ?? null,
        dateAffectation: parseDate(body.dateAffectationChu) ?? visite.personnel.dateAffectation ?? null,

        data: jsonData,

        createdById: user.id,
        filledById: user.id,
      },
      include: {
        formation: true,
        service: true,
        pathologies: true,
      },
    });

    return NextResponse.json(formulaire, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
function mapStatutSocial(value?: string | null) {
  if (!value) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "celibataire") return "CELIBATAIRE";
  if (normalized === "marie" || normalized === "mariee") return "MARIE";
  if (normalized === "divorce" || normalized === "divorcee") return "DIVORCE";
  if (normalized === "veuf" || normalized === "veuve") return "VEUF";

  return null;
}


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id: visiteId } = await params;
    const body = await req.json();

    const visite = await prisma.visite.findUnique({
      where: { id: visiteId },
      include: {
        formulaire: true,
        personnel: true,
      },
    });

    if (!visite) {
      return NextResponse.json({ message: "Visite introuvable" }, { status: 404 });
    }

    if (!visite.formulaire) {
      return NextResponse.json(
        { message: "Aucun formulaire à mettre à jour pour cette visite" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email ?? "" },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
    }

    const statutSocial = mapStatutSocial(body.statutSocial);

    if (body.statutSocial && !statutSocial) {
      return NextResponse.json(
        {
          message:
            "Statut social invalide. Valeurs autorisées : CELIBATAIRE, MARIE, DIVORCE, VEUF.",
        },
        { status: 400 }
      );
    }

    const currentStatut = visite.formulaire.statut;

    let nextStatut = currentStatut;
    if (currentStatut === "DRAFT") {
      nextStatut = "SUBMITTED";
    } else if (currentStatut === "SUBMITTED") {
      nextStatut = "VERIFIED";
    } else if (currentStatut === "VERIFIED") {
      nextStatut = "VERIFIED";
    }

    const pathologiesToAdd = Array.isArray(body.pathologiesToAdd)
      ? body.pathologiesToAdd
      : [];

    // ── Calcul suivi rapproché (avant transaction) ──────────────────────────
    const necessitatSuivi =
      body.necessitatSuiviRapproche === true ||
      body.necessitatSuiviRapproche === "true";
    const isTypeRapprochee = visite.type === "RAPPROCHEE";
    const nePlusNecessiter =
      body.nePlusNecessiterSuivi === true ||
      body.nePlusNecessiterSuivi === "true";

    const devraitEtreSMR =
      !nePlusNecessiter && (necessitatSuivi || isTypeRapprochee);

    const prochainVisiteMois = body.prochainVisiteMois
      ? Math.min(12, Math.max(1, parseInt(body.prochainVisiteMois, 10)))
      : null;

    const dateProchainVisite =
      !nePlusNecessiter && prochainVisiteMois
        ? (() => {
            const base = visite.dateDebut ?? new Date();
            const d = new Date(base);
            d.setMonth(d.getMonth() + prochainVisiteMois);
            return d;
          })()
        : null;

    const jsonData: Prisma.InputJsonValue = {
      renseignementsProfessionnels: {
        travailGarde: body.travailGarde ?? "non",
        heuresGarde: body.heuresGarde ?? "",
        rythmeGarde: body.rythmeGarde ?? "",
        travailNuit: body.travailNuit ?? "non",
        nbNuitsMois: body.nbNuitsMois ?? "",
        horairesNuit: body.horairesNuit ?? "",
        horairesTravail: body.horairesTravail ?? "",
        horaireTravailPrecision: body.horaireTravailPrecision ?? "",
        formesHoraireAtypique: Array.isArray(body.formesHoraireAtypique)
          ? body.formesHoraireAtypique
          : [],
        posteNuitFixe: body.posteNuitFixe ?? "",
        rythmeTravailNuit: body.rythmeTravailNuit ?? "",
        heuresNuitMois: body.heuresNuitMois ?? "",
        joursReposAnnee: body.joursReposAnnee ?? "",
      },
      antecedents: body.antecedents ?? "",
      pathologiesToAdd,
      suiviRapproche: {
        necessitatSuiviRapproche: body.necessitatSuiviRapproche ?? null,
        nePlusNecessiterSuivi: body.nePlusNecessiterSuivi ?? null,
        // reset serveur si "ne nécessite plus" coché
        motifsSuiviRapproche: nePlusNecessiter
          ? []
          : Array.isArray(body.motifsSuiviRapproche)
          ? body.motifsSuiviRapproche
          : [],
        prochainVisiteMois: nePlusNecessiter ? null : (body.prochainVisiteMois ?? null),
      },
      raw: body,
    };

    const result = await prisma.$transaction(async (tx) => {
      const formulaire = await tx.formulaire.update({
        where: { id: visite.formulaire!.id },
        data: {
          statut: nextStatut,

          snapshotFirstName: body.prenom ?? null,
          snapshotLastName: body.nom ?? null,
          snapshotMatricule: body.matricule ?? null,
          dateNaissance: parseDate(body.dateNaissance),
          statutSocial,

          aTravailleHorsCHUIR:
            body.autreEtablissement === "oui"
              ? true
              : body.autreEtablissement === "non"
              ? false
              : null,

          autreLieuTravail: body.lieuTravail ?? null,
          autreDureeAnnees: parseIntOrNull(body.dureeAnnees),
          autreHoraires: body.horaires ?? null,

          formationId: body.formationId ?? null,
          serviceId: body.serviceId ?? null,
          dateAffectation: parseDate(body.dateAffectationChu),

          data: jsonData,
          filledById: user.id,

          submittedById:
            nextStatut === "SUBMITTED" && currentStatut !== "SUBMITTED"
              ? user.id
              : undefined,
          submittedAt:
            nextStatut === "SUBMITTED" && currentStatut !== "SUBMITTED"
              ? new Date()
              : undefined,

          verifiedById:
            nextStatut === "VERIFIED" && currentStatut !== "VERIFIED"
              ? user.id
              : undefined,
          verifiedAt:
            nextStatut === "VERIFIED" && currentStatut !== "VERIFIED"
              ? new Date()
              : undefined,
        },
      });

      if (currentStatut !== "VERIFIED" && nextStatut === "VERIFIED") {
        const nouvelleFormationId =
          body.formationId ?? visite.personnel.formationId;
        const nouveauServiceId =
          body.serviceId ?? visite.personnel.serviceId;
        const nouvelleDateAffectation =
          parseDate(body.dateAffectationChu) ?? visite.personnel.dateAffectation;

        const ancienneDateAffectation = visite.personnel.dateAffectation;

        const affectationChanged =
          nouvelleFormationId !== visite.personnel.formationId ||
          nouveauServiceId !== visite.personnel.serviceId ||
          nouvelleDateAffectation?.getTime() !==
            ancienneDateAffectation?.getTime();

        if (
          affectationChanged &&
          visite.personnel.formationId &&
          visite.personnel.serviceId
        ) {
          await tx.personnelAffectationHistory.create({
            data: {
              personnelId: visite.personnelId,
              formationId: visite.personnel.formationId,
              serviceId: visite.personnel.serviceId,
              dateAffectation:
                visite.personnel.dateAffectation ?? new Date(),
              formulaireId: formulaire.id,
              note: "Ancienne affectation historisée lors de la validation du formulaire.",
            },
          });
        }

        await tx.personnel.update({
          where: { id: visite.personnelId },
          data: {
            firstName: body.prenom ?? visite.personnel.firstName,
            lastName: body.nom ?? visite.personnel.lastName,
            matricule: body.matricule ?? visite.personnel.matricule,
            dateNaissance: parseDate(body.dateNaissance),
            statutSocial,

            formationId: body.formationId ?? visite.personnel.formationId,
            serviceId: body.serviceId ?? visite.personnel.serviceId,
            posteId: body.posteId ?? visite.personnel.posteId,
            posteDetailId: body.detailPosteId || null,
            dateAffectation: parseDate(body.dateAffectationChu),

            categorie: devraitEtreSMR ? "SMR" : "VP",
            dateProchainVisite: nePlusNecessiter ? null : dateProchainVisite,
          },
        });

        await tx.personnelPathologie.deleteMany({
          where: { formulaireId: formulaire.id },
        });

        for (const p of pathologiesToAdd) {
          if (!p.cim11Code) continue;

          const cim11 = await tx.cim11Node.findUnique({
            where: { code: p.cim11Code },
            select: { id: true },
          });

          if (!cim11) {
            throw new Error(`Code CIM-11 introuvable: ${p.cim11Code}`);
          }

          await tx.personnelPathologie.create({
            data: {
              personnelId: visite.personnelId,
              cim11NodeId: cim11.id,
              formulaireId: formulaire.id,
              date: parseDate(p.date) ?? new Date(),
              commentaire: p.commentaire ?? null,
              source: p.source ?? "formulaire validé",
              createdById: user.id,
            },
          });
        }
      }

      return tx.formulaire.findUnique({
        where: { id: formulaire.id },
        include: {
          formation: true,
          service: true,
          pathologies: {
            include: { cim11: true },
            orderBy: { date: "desc" },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}