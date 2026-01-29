"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box } from "@mui/material";
import dayjs from "dayjs";

interface CalendarEvent {
  date: string;     // "2026-01-05"
  title: string;    // "+24 RDV"
}

interface BigCalendarProps {
  events: CalendarEvent[];
}

/** 🔴 Jours fériés (exemple Maroc – adapte si besoin) */
const holidays = [
  "2026-01-01",
  "2026-05-01",
  "2026-07-30",
];

export default function BigCalendar({ events }: BigCalendarProps) {
  return (
    <Box sx={{ maxWidth: "100%", px: 2 }}>
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

        /** 🎨 Styliser chaque cellule */
        dayCellClassNames={(arg) => {
          const dateStr = dayjs(arg.date).format("YYYY-MM-DD");

          if (arg.date.getDay() === 0 || arg.date.getDay() === 6) {
            return "fc-weekend";
          }

          if (holidays.includes(dateStr)) {
            return "fc-holiday";
          }

          return "";
        }}
      />

      {/* Styles custom */}
      <style jsx global>{`
        /* Taille des cellules */
        .fc-daygrid-day-frame {
          min-height: 140px;
          padding: 6px;
        }

        /* Week-ends */
        .fc-weekend {
          background-color: #f0f0f0 !important;
        }

        /* Jours fériés */
        .fc-holiday {
          background-color: #e0e0e0 !important;
        }

        /* Badge événement */
        .fc-event {
          background-color: #1976d2 !important;
          border-radius: 6px;
          font-size: 0.75rem;
          padding: 2px 6px;
        }

        /* Titre mois */
        .fc-toolbar-title {
          font-size: 1.4rem;
          font-weight: 600;
        }
      `}</style>
    </Box>
  );
}
