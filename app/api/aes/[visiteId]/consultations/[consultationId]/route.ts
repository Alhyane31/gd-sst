import { NextRequest } from "next/server";
import { enregistrerConsultation } from "@/lib/aes/consultationsServeur";

type Params = { params: Promise<{ visiteId: string; consultationId: string }> };

// PUT /api/aes/[visiteId]/consultations/[consultationId] — { data } : mise à jour (pas de suppression : dossier médical)
export async function PUT(req: NextRequest, { params }: Params) {
  const { visiteId, consultationId } = await params;
  return enregistrerConsultation(visiteId, await req.json().catch(() => null), consultationId);
}
