"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Task = { id: string; title: string; category: string; priority: boolean; due: string; completed: boolean };
type View = "All tasks" | "Today" | "Important" | "Completed";
const KEY = "daylight-tasks-v1";
const categories = ["Personal", "Work", "Learning"];
const paths: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  calendar: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z",
  check: "m5 12 4 4L19 6", plus: "M12 5v14 M5 12h14",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  edit: "m15 4 5 5 M4 20l4-1L21 6l-5-5L3 14z",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  close: "m6 6 12 12 M6 18 18 6", arrow: "M5 12h14 m-5-5 5 5-5 5",
};
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.check} /></svg>;
}
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function samples(): Task[] { return [
  { id: "sample-1", title: "Plan the week ahead", category: "Personal", priority: true, due: todayKey(), completed: false },
  { id: "sample-2", title: "Make progress on that big idea", category: "Work", priority: true, due: todayKey(), completed: false },
  { id: "sample-3", title: "Read a chapter of a good book", category: "Learning", priority: false, due: "", completed: false },
  { id: "sample-4", title: "Get outside for a little fresh air", category: "Personal", priority: false, due: todayKey(), completed: false },
  { id: "sample-5", title: "Set up my own little task space", category: "Personal", priority: false, due: "", completed: true },
]; }
function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Task;
  return typeof t.id === "string" && typeof t.title === "string" && categories.includes(t.category) && typeof t.priority === "boolean" && typeof t.completed === "boolean" && typeof t.due === "string" && (!t.due || /^\d{4}-\d{2}-\d{2}$/.test(t.due));
}
export default function Home() {
  const [data, setData] = useState<{ tasks: Task[]; ready: boolean }>({ tasks: [], ready: false });
  const [view, setView] = useState<View>("All tasks");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Personal");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [deleted, setDeleted] = useState<Task | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let tasks = samples();
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) { const parsed: unknown = JSON.parse(saved); if (!Array.isArray(parsed) || !parsed.every(isTask)) throw new Error("Invalid data"); tasks = parsed; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Report failure while loading browser-only storage after hydration.
    } catch { setStorageWarning("Your saved tasks could not be read. Changes will stay in this session if browser storage is unavailable."); }
    setData({ tasks, ready: true });
  }, []);
  useEffect(() => {
    if (!data.ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(data.tasks)); }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Surface browser storage failure instead of silently losing tasks.
    catch { setStorageWarning("Browser storage is unavailable. Your tasks will only last for this session."); }
  }, [data]);
  useEffect(() => { if (modal) { dialog.current?.showModal(); input.current?.focus(); } else dialog.current?.close(); }, [modal]);

  const tasks = data.tasks;
  const active = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const today = todayKey();
  const todayTasks = tasks.filter(t => t.due === today);
  const progress = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
  const counts: Record<View, number> = { "All tasks": active.length, Today: todayTasks.filter(t => !t.completed).length, Important: active.filter(t => t.priority).length, Completed: completed.length };
  const filtered = tasks.filter(t =>
    (view === "Completed" ? t.completed : view === "Today" ? t.due === today : view === "Important" ? t.priority && !t.completed : true) &&
    (!category || t.category === category) && t.title.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sort === "alphabetical") return a.title.localeCompare(b.title);
    if (sort === "due") return (a.due || "9999").localeCompare(b.due || "9999");
    if (sort === "priority") return Number(b.priority) - Number(a.priority);
    return Number(a.completed) - Number(b.completed);
  });
  function change(updater: (tasks: Task[]) => Task[]) { setData(prev => ({ ...prev, tasks: updater(prev.tasks) })); }
  function openEditor(task: Task | null = null) {
    setEditing(task); setTitle(task?.title || ""); setFormCategory(task?.category || category || "Personal"); setDue(task?.due || (view === "Today" ? today : "")); setPriority(task?.priority || view === "Important"); setModal(true);
  }
  function save(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    const task: Task = { id: editing?.id || crypto.randomUUID(), title: title.trim(), category: formCategory, due, priority, completed: editing?.completed || false };
    change(ts => editing ? ts.map(t => t.id === editing.id ? task : t) : [task, ...ts]);
    setModal(false); setDeleted(null); setNotice(editing ? "Task updated." : "Task added.");
  }
  function navigate(next: View, cat = "") { setView(next); setCategory(cat); setSearch(""); }
  function dueLabel(date: string) {
    if (date === today) return "Today";
    const d = new Date(`${date}T12:00:00`);
    return Number.isNaN(d.getTime()) ? "No date" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Daylight home"><span className="brand-mark"><Icon name="check" size={23} /></span>daylight<span className="brand-dot">.</span></Link>
      <div className="workspace-label">YOUR PERSONAL SPACE</div>
      <nav aria-label="Task views">{(["All tasks", "Today", "Important", "Completed"] as View[]).map((item, i) => <button key={item} className={`nav-item ${view === item && !category ? "selected" : ""}`} onClick={() => navigate(item)}><Icon name={["grid", "calendar", "star", "check"][i]} /><span>{item}</span><span className="nav-count">{counts[item]}</span></button>)}</nav>
      <div className="sidebar-section">MY LISTS <span>3</span></div>
      <nav aria-label="Task categories">{categories.map(c => <button key={c} className={`nav-item ${category === c ? "selected" : ""}`} onClick={() => navigate("All tasks", c)}><span className={`category-dot ${c.toLowerCase()}`} /><span>{c}</span><span className="nav-count">{active.filter(t => t.category === c).length}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="little-sun">✺</div><h3>A little progress, every day.</h3><p>Big things start with one small task.</p><div className="local-note"><span className="online-dot" /> Saved on this device</div></div>
      <div className="profile"><div className="avatar">Y</div><div><strong>Your workspace</strong><span>Make room for what matters</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><span>My workspace <span className="breadcrumb">/</span> <strong>{category || view}</strong></span><span className="date"><Icon name="calendar" size={16} />{data.ready ? new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Your day, your pace"}</span></header>
      <div className="content">
        <section className="page-heading"><div><div className="eyebrow">A CLEAR MIND STARTS HERE</div><h1>{category || view}<span className="heading-dot">.</span></h1><p>{view === "Completed" ? "Look at everything you’ve accomplished. Nice work." : "A little structure. A lot more headspace. Let’s get things done."}</p></div><button className="primary" onClick={() => openEditor()} disabled={!data.ready}><Icon name="plus" size={18} /> New task</button></section>
        <section className="stats" aria-label="Task overview"><div className="stat"><span className="stat-icon green"><Icon name="grid" /></span><div><span>Tasks to do</span><strong>{active.length}<small>one step at a time</small></strong></div></div><div className="stat"><span className="stat-icon amber"><Icon name="calendar" /></span><div><span>Due today</span><strong>{counts.Today}<small>make today count</small></strong></div></div><div className="stat"><span className="stat-icon purple"><Icon name="check" /></span><div><span>Completed</span><strong>{completed.length}<small>little wins add up</small></strong></div></div></section>
        <section className="task-panel" aria-label="Your tasks">
          <div className="panel-header"><h2>{category ? `${category} tasks` : view === "All tasks" ? "Your tasks" : view}<span>{filtered.length}</span></h2><label className="sort-label">Sort by <select aria-label="Sort tasks" value={sort} onChange={e => setSort(e.target.value)}><option value="default">Default</option><option value="due">Due date</option><option value="priority">Priority</option><option value="alphabetical">Name</option></select></label></div>
          <div className="panel-tools"><div className="filter-tabs">{(["All tasks", "Today", "Important", "Completed"] as View[]).map(v => <button key={v} className={view === v ? "active" : ""} onClick={() => { setView(v); }}>{v === "All tasks" ? "All" : v}</button>)}</div><label className="search"><Icon name="search" size={17} /><input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} /></label></div>
          {!data.ready ? <div className="empty">Loading your workspace…</div> : filtered.length === 0 ? <div className="empty"><span className="empty-icon"><Icon name="check" size={26} /></span><h3>{search ? "No matching tasks" : "A little breathing room"}</h3><p>{search ? "Try another search or switch your filters." : "Nothing here just yet. Add a task or enjoy the quiet."}</p>{!search && <button className="text-button" onClick={() => openEditor()}>Create a task <Icon name="arrow" size={16} /></button>}</div> : <ul className="task-list">{filtered.map(task => <li key={task.id} className={`task-row ${task.completed ? "done" : ""}`}>
            <button className="task-checkbox" aria-label={`${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`} aria-pressed={task.completed} onClick={() => { change(ts => ts.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)); setNotice(task.completed ? "Task marked incomplete." : "Another little win. Task completed!"); setDeleted(null); }}>{task.completed && <Icon name="check" size={15} />}</button>
            <div className="task-info"><button className="task-title" onClick={() => openEditor(task)}>{task.title}</button><div className="task-meta"><span className={`tag ${task.category.toLowerCase()}`}>{task.category}</span>{task.due && <span className={`due ${task.due < today && !task.completed ? "overdue" : ""}`}><Icon name="calendar" size={13} />{task.due < today && !task.completed ? "Overdue · " : ""}{dueLabel(task.due)}</span>}</div></div>
            <button className={`star-button ${task.priority ? "is-priority" : ""}`} aria-label={`${task.priority ? "Remove priority" : "Prioritize"}: ${task.title}`} aria-pressed={task.priority} onClick={() => change(ts => ts.map(t => t.id === task.id ? { ...t, priority: !t.priority } : t))}><Icon name="star" size={18} /></button>
            <button className="row-action" aria-label={`Edit: ${task.title}`} onClick={() => openEditor(task)}><Icon name="edit" size={16} /></button><button className="row-action delete" aria-label={`Delete: ${task.title}`} onClick={() => { change(ts => ts.filter(t => t.id !== task.id)); setDeleted(task); setNotice("Task deleted."); }}><Icon name="trash" size={16} /></button>
          </li>)}</ul>}
          <button className="add-row" onClick={() => openEditor()} disabled={!data.ready}><Icon name="plus" size={18} /> Add a task <span>A small step toward something good</span></button>
          <div className="panel-footer"><span>{active.length} tasks left to do</span>{completed.length > 0 && <button onClick={() => { change(ts => ts.filter(t => !t.completed)); setNotice("Completed tasks cleared."); setDeleted(null); }}>Clear completed ({completed.length})</button>}</div>
        </section>
        <section className="progress-card"><div className="progress-symbol">✦</div><div className="progress-copy"><h3>You’re making room for a better day.</h3><p>{completed.length ? `${completed.length} of ${tasks.length} tasks complete. Keep going at your own pace.` : "Every small step counts. Start wherever you are."}</p></div><div className="progress-meter"><div><span>Your progress</span><strong>{progress}%</strong></div><progress aria-label="Overall task completion" value={progress} max={100} /></div></section>
        <footer className="bottom-note">Less overwhelm. More intention. <span>Made for your everyday.</span></footer>
        {storageWarning && <p className="storage-warning" role="alert">{storageWarning}</p>}
      </div>
    </main>
    {notice && <div className="toast" role="status"><Icon name="check" size={17} /><span>{notice}</span>{deleted && <button onClick={() => { change(ts => [deleted, ...ts]); setDeleted(null); setNotice("Task restored."); }}>Undo</button>}<button aria-label="Dismiss notification" onClick={() => { setNotice(""); setDeleted(null); }}><Icon name="close" size={15} /></button></div>}
    <dialog ref={dialog} aria-labelledby="task-dialog-title" onCancel={() => setModal(false)} onClick={e => { if (e.target === dialog.current) setModal(false); }}>
      <form onSubmit={save}><div className="dialog-heading"><div><div className="eyebrow">ONE SMALL STEP</div><h2 id="task-dialog-title">{editing ? "Edit your task" : "Make a little plan"}</h2></div><button type="button" className="icon-button" aria-label="Close task form" onClick={() => setModal(false)}><Icon name="close" /></button></div><label className="form-label">What would you like to do?<input ref={input} required maxLength={200} placeholder="e.g. Take a walk after lunch" value={title} onChange={e => setTitle(e.target.value)} /></label><div className="form-grid"><label className="form-label">List<select aria-label="List" value={formCategory} onChange={e => setFormCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label className="form-label"><span className="label-title">Due date <small>(optional)</small></span><input aria-label="Due date" type="date" value={due} onChange={e => setDue(e.target.value)} /></label></div><label className="priority-toggle"><input type="checkbox" checked={priority} onChange={e => setPriority(e.target.checked)} /><Icon name="star" size={18} /> Mark as important</label><div className="dialog-footer"><button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button><button className="primary" type="submit" disabled={!title.trim()}>{editing ? "Save changes" : "Add task"}<Icon name="plus" size={17} /></button></div></form>
    </dialog>
  </div>;
}
