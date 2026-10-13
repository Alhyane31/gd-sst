import { NextRequest } from "next/server";
import { enregistrerConsultation } from "@/lib/aes/consultationsServeur";

type Params = { params: Promise<{ visiteId: string }> };

// POST /api/aes/[visiteId]/consultations — { data } : nouvelle consultation (répétable)
export async function POST(req: NextRequest, { params }: Params) {
  const { visiteId } = await params;
  return enregistrerConsultation(visiteId, await req.json().catch(() => null));
}
