"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { EventInput, DatesSetArg } from "@fullcalendar/core";

type ConvocationStatut =
  | "A_CONVOQUER"
  | "CONVOCATION_GENEREE"
  | "A_TRAITER"
  | "A_RELANCER"
  | "RELANCEE"
  | "REALISEE"
  | "ANNULEE";

type Holiday = {
  date: string; // "YYYY-MM-DD"
  label?: string | null;
};

type ConvocationMini = {
  id: string;
  statut: ConvocationStatut;
  datePrevue: string; // ISO
};

function toDayKey(dateIso: string) {
  return dayjs(dateIso).format("YYYY-MM-DD");
}

export default function BigCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);

  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);

  // ===== 1) Fetch jours fériés
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/jours-feries");
        if (!res.ok) {
          setHolidays([]);
          return;
        }

        
        const data = await res.json();
        const items: Holiday[] = Array.isArray(data) ? data : data.items ?? [];
        setHolidays(items);
      } catch {
        setHolidays([]);
      }
    };
    run();
  }, []);

  // ===== 2) Fetch convocations du range visible + agrégation
  const loadConvocations = useCallback(async (start: Date, end: Date) => {
    try {
      const params = new URLSearchParams();
      params.set("page", "0");
params.set("pageSize", "3000"); // ou 1000
      params.set("from", start.toISOString());
      params.set("to", end.toISOString());

      const res = await fetch(`/api/convocations?${params.toString()}`);
      
console.log("📡 Response status /api/convocations:", res.status);



      if (!res.ok) {
        setEvents([]);
        return;
      }

      const data = await res.json();
      console.log("📦 Data brute /api/convocations:", data);
      const rows: ConvocationMini[] = Array.isArray(data) ? data : data.items ?? [];

      // on garde seulement les 3 statuts à afficher
      const wanted: ConvocationStatut[] = ["A_CONVOQUER", "CONVOCATION_GENEREE", "REALISEE"];
      const filtered = rows.filter((c) => wanted.includes(c.statut));

      // agg: day -> {A_CONVOQUER, CONVOCATION_GENEREE, REALISEE}
      const agg = new Map<string, { a: number; g: number; r: number }>();

      for (const c of filtered) {
        if (!c.datePrevue) continue;
        const day = toDayKey(c.datePrevue);

        const cur = agg.get(day) ?? { a: 0, g: 0, r: 0 };
        if (c.statut === "A_CONVOQUER") cur.a += 1;
        if (c.statut === "CONVOCATION_GENEREE") cur.g += 1;
        if (c.statut === "REALISEE") cur.r += 1;

        agg.set(day, cur);
      }

      // 1 seul event par jour (qui contient a/g/r)
      const newEvents: EventInput[] = [];
      for (const [day, counts] of agg.entries()) {
        if (counts.a + counts.g + counts.r === 0) continue;

        newEvents.push({
          start: day, // all-day
          allDay: true,
          title: "",
          extendedProps: { ...counts },
        });
      }

      setEvents(newEvents);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    if (!range) return;
    loadConvocations(range.start, range.end);
  }, [range, loadConvocations]
);

  return (
    <Box sx={{ maxWidth: "100%", px: 2 }}>
      {/* ===== Légende ===== */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 14, height: 14, bgcolor: "#1976d2", borderRadius: 0.5 }} />
          <Typography variant="body2">À convoquer</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 14, height: 14, bgcolor: "#ed6c02", borderRadius: 0.5 }} />
          <Typography variant="body2">Convoquée</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 14, height: 14, bgcolor: "#2e7d32", borderRadius: 0.5 }} />
          <Typography variant="body2">Réalisée</Typography>
        </Box>
      </Box>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        fixedWeekCount={false}
        dayMaxEvents={true}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        datesSet={(arg: DatesSetArg) => {
          setRange({ start: arg.start, end: arg.end });
        }}
        dayCellClassNames={(arg) => {
          const dateStr = dayjs(arg.date).format("YYYY-MM-DD");
          if (arg.date.getDay() === 0 || arg.date.getDay() === 6) return "fc-weekend";
          if (holidaySet.has(dateStr)) return "fc-holiday";
          return "";
        }}
        // ===== rendu custom : chiffres uniquement
        eventContent={(arg) => {
          const { a, g, r } = (arg.event.extendedProps ?? {}) as any;

          return (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {a ? (
                <span
                  style={{
                    background: "#1976d2",
                    color: "white",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 12,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {a}
                </span>
              ) : null}

              {g ? (
                <span
                  style={{
                    background: "#ed6c02",
                    color: "white",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 12,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {g}
                </span>
              ) : null}

              {r ? (
                <span
                  style={{
                    background: "#2e7d32",
                    color: "white",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 12,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {r}
                </span>
              ) : null}
            </div>
          );
        }}
      />

      <style jsx global>{`
        .fc-daygrid-day-frame {
          min-height: 140px;
          padding: 6px;
        }

        .fc-weekend {
          background-color: #f0f0f0 !important;
        }

        .fc-holiday {
          background-color: #e0e0e0 !important;
        }

        /* IMPORTANT: ne pas écraser nos badges */
        .fc-event {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .fc-event-main {
          padding: 0 !important;
        }

        .fc-toolbar-title {
          font-size: 1.4rem;
          font-weight: 600;
        }
      `}</style>
    </Box>
  );
}
