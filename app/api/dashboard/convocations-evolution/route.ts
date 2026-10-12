import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

const MOIS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mondayOf(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return `${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const now = new Date();
  const defaultTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const defaultFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1);

  const { searchParams } = new URL(req.url);
  const from = parseDateParam(searchParams.get("from"), defaultFrom);
  from.setHours(0, 0, 0, 0);
  const to = parseDateParam(searchParams.get("to"), defaultTo);
  to.setHours(23, 59, 59, 999);

  const [convocations, joursFeries] = await Promise.all([
    prisma.convocation.findMany({
      where: { datePrevue: { gte: from, lte: to } },
      select: { datePrevue: true, dateRealisee: true },
    }),
    prisma.jourFerie.findMany({ where: { date: { gte: from, lte: to } }, select: { date: true } }),
  ]);

  const holidaySet = new Set(joursFeries.map((j) => dayKey(new Date(j.date))));
  const isWorkingDay = (d: Date) => {
    const dow = d.getDay();
    return dow !== 0 && dow !== 6 && !holidaySet.has(dayKey(d));
  };

  // ---------- Agrégation par jour (hors week-ends et jours fériés) ----------
  const dayMap = new Map<string, { convocations: number; presences: number }>();
  {
    const cursor = new Date(from);
    while (cursor <= to) {
      if (isWorkingDay(cursor)) dayMap.set(dayKey(cursor), { convocations: 0, presences: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // ---------- Agrégation par semaine (lundi -> dimanche) ----------
  const weekMap = new Map<string, { label: string; convocations: number; presences: number }>();
  {
    const cursor = mondayOf(from);
    const lastMonday = mondayOf(to);
    while (cursor <= lastMonday) {
      const key = dayKey(cursor);
      weekMap.set(key, { label: dayLabel(cursor), convocations: 0, presences: 0 });
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  // ---------- Agrégation par mois ----------
  const monthMap = new Map<string, { label: string; convocations: number; presences: number }>();
  {
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const last = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cursor <= last) {
      monthMap.set(monthKey(cursor), { label: monthLabel(cursor), convocations: 0, presences: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  for (const c of convocations) {
    const d = new Date(c.datePrevue);
    const isPresent = c.dateRealisee != null;

    const dk = dayKey(d);
    if (dayMap.has(dk)) {
      const entry = dayMap.get(dk)!;
      entry.convocations++;
      if (isPresent) entry.presences++;
    }

    const wk = dayKey(mondayOf(d));
    if (weekMap.has(wk)) {
      const entry = weekMap.get(wk)!;
      entry.convocations++;
      if (isPresent) entry.presences++;
    }

    const mk = monthKey(d);
    if (monthMap.has(mk)) {
      const entry = monthMap.get(mk)!;
      entry.convocations++;
      if (isPresent) entry.presences++;
    }
  }

  const parDay = [...dayMap.entries()].map(([key, v]) => ({ label: dayLabel(new Date(key)), ...v }));
  const parSemaine = [...weekMap.entries()].map(([, v]) => v);
  const parMois = [...monthMap.entries()].map(([, v]) => v);

  const totalConvocations = convocations.length;
  const totalPresences = convocations.filter((c) => c.dateRealisee != null).length;

  const totalConvocationsJoursOuvres = parDay.reduce((sum, d) => sum + d.convocations, 0);
  const totalPresencesJoursOuvres = parDay.reduce((sum, d) => sum + d.presences, 0);

  const nbJours = dayMap.size || 1;
  const nbSemaines = weekMap.size || 1;
  const nbMois = monthMap.size || 1;

  return NextResponse.json({
    periode: { from: from.toISOString(), to: to.toISOString() },
    totaux: { convocations: totalConvocations, presences: totalPresences },
    tauxPresence: totalConvocations > 0 ? (totalPresences / totalConvocations) * 100 : 0,
    moyennes: {
      jour: { convocations: totalConvocationsJoursOuvres / nbJours, presences: totalPresencesJoursOuvres / nbJours },
      semaine: { convocations: totalConvocations / nbSemaines, presences: totalPresences / nbSemaines },
      mois: { convocations: totalConvocations / nbMois, presences: totalPresences / nbMois },
    },
    parJour: parDay,
    parSemaine,
    parMois,
  });
}
