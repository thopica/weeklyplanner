import { useState } from "react";
import {
  Settings, Plus, Trash2, Check, Droplets, ChevronDown, ChevronUp,
  Download, Upload, Palette
} from "lucide-react";

const THEMES = [
  { id: "boho",     label: "Boho Neutral",       dot: "#C4704F", bg: "#F5F0E8", card: "#FAF7F2", primary: "#C4704F", secondary: "#8FAF8F", text: "#3D2B1F", muted: "#A08070", border: "#E8E0D0", accent: "#8FAF8F" },
  { id: "blush",    label: "Blush Rose",          dot: "#C4838A", bg: "#FDF0F0", card: "#FFF8F8", primary: "#C4838A", secondary: "#E8A4A9", text: "#4A2030", muted: "#B07080", border: "#F0D8DC", accent: "#E8A4A9" },
  { id: "matcha",   label: "Matcha Morning",      dot: "#6B8F6B", bg: "#F2F5EE", card: "#F8FAF5", primary: "#6B8F6B", secondary: "#A8C4A8", text: "#2D4A2D", muted: "#6A8A6A", border: "#D8E8D8", accent: "#A8C4A8" },
  { id: "lavender", label: "Lavender Haze",       dot: "#8B7BB8", bg: "#F3F0F8", card: "#F8F5FE", primary: "#8B7BB8", secondary: "#B8A8D8", text: "#2D2040", muted: "#8878A8", border: "#E0D8F0", accent: "#B8A8D8" },
  { id: "minimal",  label: "Classic Minimalist",  dot: "#3A3A3A", bg: "#FAFAFA", card: "#FFFFFF", primary: "#3A3A3A", secondary: "#7A7A7A", text: "#1A1A1A", muted: "#9A9A9A", border: "#E8E8E8", accent: "#7A7A7A" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [11, 12, 13, 14, 15, 16, 17];
const TODAY_IDX = 3;

const DEMO_TASKS_HIGH = [
  { id: "1", text: "Finish the creative brief for client", done: false },
  { id: "2", text: "Review mood board with the team", done: true },
  { id: "3", text: "Send final invoice to Studio", done: false },
];
const DEMO_TASKS_GENERAL = [
  { id: "4", text: "Reply to Sarah's email", done: true },
  { id: "5", text: "Order new sketchbook", done: false },
  { id: "6", text: "Water the plants", done: false },
  { id: "7", text: "Schedule dentist appointment", done: false },
];
const DEMO_SCHEDULE = [
  { hour: 7, label: "" },
  { hour: 8, label: "Morning Routine & Coffee" },
  { hour: 9, label: "" },
  { hour: 10, label: "Deep Work — Creative Brief" },
  { hour: 11, label: "" },
  { hour: 12, label: "" },
  { hour: 13, label: "Lunch Break" },
  { hour: 14, label: "" },
  { hour: 15, label: "Team Check-in" },
  { hour: 16, label: "" },
  { hour: 17, label: "" },
  { hour: 18, label: "" },
  { hour: 19, label: "Evening Wind Down" },
  { hour: 20, label: "" },
  { hour: 21, label: "" },
];

function formatHour(h: number) {
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

export function RedesignedPlanner() {
  const [themeIdx, setThemeIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState(TODAY_IDX);
  const [highTasks, setHighTasks] = useState(DEMO_TASKS_HIGH);
  const [generalTasks, setGeneralTasks] = useState(DEMO_TASKS_GENERAL);
  const [water, setWater] = useState(3);
  const [mainFocus, setMainFocus] = useState("");
  const [rightTab, setRightTab] = useState<"schedule" | "wellness">("schedule");
  const [gratitude, setGratitude] = useState(["Sunshine today", "Good coffee this morning", ""]);
  const [brainDump, setBrainDump] = useState("Need to remember to call Mom this weekend. Look up recipes for Friday's dinner party.");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const t = THEMES[themeIdx];

  const toggleTask = (list: typeof highTasks, setList: typeof setHighTasks, id: string) => {
    setList(list.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  const dayTaskCount = (idx: number) => {
    if (idx === TODAY_IDX) return highTasks.filter(t => !t.done).length + generalTasks.filter(t => !t.done).length;
    const counts = [2, 5, 3, 0, 4, 1, 0];
    return counts[idx];
  };

  const completedToday = highTasks.filter(t => t.done).length + generalTasks.filter(t => t.done).length;
  const totalToday = highTasks.length + generalTasks.length;

  return (
    <div
      className="min-h-screen flex flex-col font-sans text-sm"
      style={{ background: t.bg, color: t.text, fontFamily: "'Nunito', sans-serif" }}
    >
      {/* HEADER */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ background: t.card, borderColor: t.border }}
      >
        <div>
          <div
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "'Lora', Georgia, serif", color: t.text }}
          >
            Thursday, May 14th
          </div>
          <div className="text-xs mt-0.5 font-medium tracking-widest uppercase" style={{ color: t.muted }}>
            Week 20 · 2026
          </div>
        </div>

        {/* Progress pill */}
        <div
          className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full text-xs font-semibold"
          style={{ background: t.bg, color: t.primary, border: `1px solid ${t.border}` }}
        >
          <div className="flex gap-1">
            {Array.from({ length: totalToday }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: i < completedToday ? t.primary : t.border }}
              />
            ))}
          </div>
          <span style={{ color: t.muted }}>{completedToday}/{totalToday} done</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Theme switcher dots — always visible */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.muted }}
            >
              <Palette size={14} style={{ color: t.primary }} />
              <span className="hidden sm:inline" style={{ color: t.text }}>Theme</span>
              <div className="w-3 h-3 rounded-full" style={{ background: t.primary }} />
            </button>
            {showThemePicker && (
              <div
                className="absolute right-0 top-12 z-50 p-3 rounded-2xl shadow-xl flex flex-col gap-2 w-52"
                style={{ background: t.card, border: `1px solid ${t.border}` }}
              >
                {THEMES.map((theme, i) => (
                  <button
                    key={theme.id}
                    onClick={() => { setThemeIdx(i); setShowThemePicker(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-semibold"
                    style={{
                      background: i === themeIdx ? theme.bg : "transparent",
                      color: theme.text,
                      border: i === themeIdx ? `2px solid ${theme.primary}` : "2px solid transparent"
                    }}
                  >
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: theme.dot }} />
                    {theme.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="p-2 rounded-xl transition-all"
            style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.muted }}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* WEEKLY RIBBON */}
      <div
        className="px-8 py-4 border-b flex items-center gap-3 overflow-x-auto"
        style={{ background: t.card, borderColor: t.border }}
      >
        {DAYS.map((day, i) => {
          const isToday = i === TODAY_IDX;
          const isSelected = i === selectedDay;
          const count = dayTaskCount(i);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all flex-shrink-0 min-w-[64px] relative"
              style={{
                background: isSelected ? t.primary : isToday ? t.bg : "transparent",
                color: isSelected ? "#fff" : isToday ? t.primary : t.muted,
                border: isToday && !isSelected ? `2px solid ${t.primary}` : "2px solid transparent",
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase">{day}</span>
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
              >{DATES[i]}</span>
              {count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : t.accent,
                    color: isSelected ? "#fff" : t.card
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="ml-auto flex-shrink-0 text-xs" style={{ color: t.muted }}>
          Week of May 11
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* LEFT PANEL — 60% — Focus + Tasks */}
        <div
          className="flex-1 flex flex-col gap-0 overflow-y-auto"
          style={{ borderRight: `1px solid ${t.border}` }}
        >
          {/* Main Focus */}
          <div className="px-8 pt-8 pb-6" style={{ borderBottom: `1px solid ${t.border}` }}>
            <label
              className="text-[10px] font-bold tracking-widest uppercase mb-3 block"
              style={{ color: t.primary }}
            >
              Today's Main Focus
            </label>
            <input
              value={mainFocus}
              onChange={e => setMainFocus(e.target.value)}
              placeholder="What is the one thing you must accomplish today?"
              className="w-full bg-transparent border-none outline-none resize-none text-2xl font-bold leading-snug placeholder:font-normal"
              style={{
                fontFamily: "'Lora', Georgia, serif",
                color: t.text,
                borderBottom: `2px solid ${t.border}`,
                paddingBottom: "12px",
              }}
            />
          </div>

          {/* HIGH PRIORITY */}
          <div className="px-8 py-6" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <label
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: t.primary }}
              >
                High Priority
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.muted }}>
                {highTasks.filter(t => !t.done).length} remaining
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {highTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                  style={{
                    background: task.done ? "transparent" : t.bg,
                    border: `1px solid ${task.done ? "transparent" : t.border}`,
                    opacity: task.done ? 0.55 : 1
                  }}
                >
                  <button
                    onClick={() => toggleTask(highTasks, setHighTasks, task.id)}
                    className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    style={{
                      background: task.done ? t.primary : "transparent",
                      borderColor: task.done ? t.primary : t.border
                    }}
                  >
                    {task.done && <Check size={11} color="#fff" strokeWidth={3} />}
                  </button>
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? t.muted : t.text
                    }}
                  >
                    {task.text}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                    style={{ color: t.muted }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-3 flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl w-full transition-all"
              style={{ background: t.bg, color: t.muted, border: `1px dashed ${t.border}` }}
            >
              <Plus size={14} style={{ color: t.primary }} />
              Add high priority task
            </button>
          </div>

          {/* GENERAL TASKS */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <label
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: t.secondary }}
              >
                General Tasks
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.muted }}>
                {generalTasks.filter(t => !t.done).length} remaining
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {generalTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                  style={{
                    background: task.done ? "transparent" : t.bg,
                    border: `1px solid ${task.done ? "transparent" : t.border}`,
                    opacity: task.done ? 0.5 : 1
                  }}
                >
                  <button
                    onClick={() => toggleTask(generalTasks, setGeneralTasks, task.id)}
                    className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    style={{
                      background: task.done ? t.secondary : "transparent",
                      borderColor: task.done ? t.secondary : t.border
                    }}
                  >
                    {task.done && <Check size={11} color="#fff" strokeWidth={3} />}
                  </button>
                  <span
                    className="flex-1 text-sm"
                    style={{
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? t.muted : t.text
                    }}
                  >
                    {task.text}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                    style={{ color: t.muted }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-3 flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl w-full transition-all"
              style={{ background: t.bg, color: t.muted, border: `1px dashed ${t.border}` }}
            >
              <Plus size={14} style={{ color: t.secondary }} />
              Add task
            </button>
          </div>

          {/* WATER TRACKER — always visible at bottom of left panel */}
          <div
            className="px-8 py-5 mt-auto border-t flex items-center gap-5"
            style={{ background: t.card, borderColor: t.border }}
          >
            <div className="flex items-center gap-2">
              <Droplets size={15} style={{ color: "#5B9BD5" }} />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: t.muted }}>Hydration</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setWater(i < water ? i : i + 1)}
                  className="transition-all"
                  title={`${i + 1} glass${i > 0 ? "es" : ""}`}
                >
                  <Droplets
                    size={20}
                    strokeWidth={1.5}
                    style={{
                      color: i < water ? "#5B9BD5" : t.border,
                      fill: i < water ? "#AECFE8" : "none",
                      transition: "all 0.2s"
                    }}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold ml-1" style={{ color: t.muted }}>{water}/8</span>
          </div>
        </div>

        {/* RIGHT PANEL — 40% — Schedule + Wellness */}
        <div className="w-[38%] flex flex-col overflow-hidden" style={{ minWidth: 300 }}>

          {/* Tab switcher */}
          <div
            className="flex border-b"
            style={{ borderColor: t.border, background: t.card }}
          >
            {(["schedule", "wellness"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className="flex-1 py-3.5 text-xs font-bold tracking-widest uppercase transition-all"
                style={{
                  color: rightTab === tab ? t.primary : t.muted,
                  borderBottom: rightTab === tab ? `2px solid ${t.primary}` : "2px solid transparent",
                  background: "transparent"
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {rightTab === "schedule" && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-0">
                {DEMO_SCHEDULE.map(({ hour, label }) => (
                  <div
                    key={hour}
                    className="flex items-start gap-3 group min-h-[44px]"
                  >
                    <span
                      className="text-[10px] font-bold w-12 flex-shrink-0 pt-1.5 text-right"
                      style={{ color: t.muted }}
                    >
                      {formatHour(hour)}
                    </span>
                    <div className="flex flex-col items-center flex-shrink-0 mt-1.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: label ? t.primary : t.border }}
                      />
                      <div className="w-px flex-1 mt-1" style={{ background: t.border, minHeight: 32 }} />
                    </div>
                    <div className="flex-1 pb-2">
                      {label ? (
                        <div
                          className="px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}
                        >
                          {label}
                        </div>
                      ) : (
                        <div
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-2 rounded-xl cursor-pointer"
                          style={{ color: t.muted, border: `1px dashed ${t.border}` }}
                        >
                          + Add event
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightTab === "wellness" && (
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
              {/* Meals */}
              <div>
                <div
                  className="text-[10px] font-bold tracking-widest uppercase mb-3"
                  style={{ color: t.secondary }}
                >
                  Meals
                </div>
                <div className="flex flex-col gap-2">
                  {["Breakfast", "Lunch", "Dinner"].map(meal => (
                    <div
                      key={meal}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: t.bg, border: `1px solid ${t.border}` }}
                    >
                      <span className="text-xs font-bold w-16 flex-shrink-0" style={{ color: t.muted }}>{meal}</span>
                      <input
                        placeholder={`What's for ${meal.toLowerCase()}?`}
                        className="bg-transparent outline-none text-xs flex-1"
                        style={{ color: t.text }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Gratitude */}
              <div>
                <div
                  className="text-[10px] font-bold tracking-widest uppercase mb-3"
                  style={{ color: t.secondary }}
                >
                  Gratitude
                </div>
                <div className="flex flex-col gap-2">
                  {gratitude.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: t.bg, border: `1px solid ${t.border}` }}
                    >
                      <span className="text-xs font-bold" style={{ color: t.accent }}>#{i + 1}</span>
                      <input
                        value={item}
                        onChange={e => {
                          const g = [...gratitude]; g[i] = e.target.value; setGratitude(g);
                        }}
                        placeholder="Today I'm grateful for..."
                        className="bg-transparent outline-none text-xs flex-1"
                        style={{ color: t.text }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Brain Dump */}
              <div>
                <div
                  className="text-[10px] font-bold tracking-widest uppercase mb-3"
                  style={{ color: t.secondary }}
                >
                  Brain Dump
                </div>
                <textarea
                  value={brainDump}
                  onChange={e => setBrainDump(e.target.value)}
                  placeholder="Dump all those thoughts here..."
                  rows={5}
                  className="w-full resize-none outline-none text-xs leading-relaxed rounded-xl px-4 py-3"
                  style={{
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    color: t.text
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
