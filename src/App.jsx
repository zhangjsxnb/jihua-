import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, LayoutGrid, Trophy, Trash2, Edit3, X, Check
} from 'lucide-react';

const COLORS = [
  { name: '开心果白', bg: 'bg-[#F6EDE7]', text: 'text-[#8D7D7D]', dot: 'bg-[#D6C7C7]', border: 'border-[#F2E8E1]', hex: '#F6EDE7' },
  { name: '柔雾粉', bg: 'bg-[#ECC3C9]', text: 'text-[#7D5A5E]', dot: 'bg-[#C79DA3]', border: 'border-[#E5B5BC]', hex: '#ECC3C9' },
  { name: '日光黄', bg: 'bg-[#F5ECBE]', text: 'text-[#8D825A]', dot: 'bg-[#DED29F]', border: 'border-[#EEE4AE]', hex: '#F5ECBE' },
  { name: '鼠尾草绿', bg: 'bg-[#CDE7C7]', text: 'text-[#5E7D5A]', dot: 'bg-[#A9C7A3]', border: 'border-[#C2DFC1]', hex: '#CDE7C7' },
  { name: 'BABY蓝', bg: 'bg-[#BACFE5]', text: 'text-[#5A6D8D]', dot: 'bg-[#98AFD0]', border: 'border-[#AFCAE2]', hex: '#BACFE5' },
];

const DEFAULT_COMMON_PLANS = [
  { id: 'c1', title: '早起瑜伽', color: COLORS[1] },
  { id: 'c2', title: '深度阅读', color: COLORS[0] },
];

const loadTasks = () => {
  try {
    return JSON.parse(localStorage.getItem('jihua_tasks') || '[]');
  } catch (e) { return []; }
};

const saveTasks = (tasks) => {
  try { localStorage.setItem('jihua_tasks', JSON.stringify(tasks)); } catch (e) {}
};

const loadCommonPlans = () => {
  try {
    const data = JSON.parse(localStorage.getItem('jihua_commonPlans') || '[]');
    return data.length > 0 ? data : null;
  } catch (e) { return null; }
};

const saveCommonPlans = (plans) => {
  try { localStorage.setItem('jihua_commonPlans', JSON.stringify(plans)); } catch (e) {}
};

const App = () => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState(loadTasks);
  const [commonPlans, setCommonPlans] = useState(() => {
    const loaded = loadCommonPlans();
    return loaded || DEFAULT_COMMON_PLANS;
  });
  const [editingCommon, setEditingCommon] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, mode: 'add', dateStr: '', task: null });
  const [formTitle, setFormTitle] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);

  useEffect(() => { saveTasks(tasks); }, [tasks]);
  useEffect(() => { saveCommonPlans(commonPlans); }, [commonPlans]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const toggleComplete = (id, e, currentStatus) => {
    e.stopPropagation();
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !currentStatus } : t));
  };

  const saveTask = () => {
    if (!formTitle.trim()) return;
    if (modalConfig.mode === 'add') {
      const newTask = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        date: modalConfig.dateStr,
        color: formColor,
        completed: false,
      };
      setTasks((prev) => [...prev, newTask]);
    } else {
      setTasks((prev) => prev.map((t) =>
        t.id === modalConfig.task.id ? { ...t, title: formTitle.trim(), color: formColor } : t
      ));
    }
    setModalConfig({ isOpen: false, mode: 'add', dateStr: '', task: null });
  };

  const onDrop = (e, targetDateStr) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const payload = JSON.parse(e.dataTransfer.getData('payload'));
    if (type === 'common') {
      const newTask = {
        id: Date.now().toString(),
        title: payload.title,
        date: targetDateStr,
        color: payload.color,
        completed: false,
      };
      setTasks((prev) => [...prev, newTask]);
    } else if (type === 'task') {
      setTasks((prev) => prev.map((t) => t.id === payload.id ? { ...t, date: targetDateStr } : t));
    }
  };

  const MonthView = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const firstDay = first === 0 ? 6 : first - 1;
    const calendarDays = Array(firstDay).fill(null).concat([...Array(days).keys()].map(i => i + 1));
    return (
      <div className="grid grid-cols-7 gap-px bg-[#EFEBE7] border border-[#EFEBE7] rounded-[24px] overflow-hidden shadow-sm">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <div key={d} className="bg-white/80 text-center text-[11px] font-bold text-[#AFA4A4] py-3">{d}</div>
        ))}
        {calendarDays.map((day, idx) => {
          const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
          const dateStr = date ? formatDate(date) : '';
          const dayTasks = tasks.filter(t => t.date === dateStr);
          return (
            <div key={idx} onDragOver={(e) => e.preventDefault()} onDrop={(e) => date && onDrop(e, dateStr)}
              onClick={() => date && setModalConfig({ isOpen: true, mode: 'add', dateStr, task: null })}
              className={`min-h-[120px] p-1.5 transition-all flex flex-col gap-1 ${day ? 'bg-white/90 hover:bg-[#FAF9F9] cursor-pointer' : 'bg-white/20'}`}>
              {day && (
                <span className={`text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${formatDate(new Date()) === dateStr ? 'bg-[#CDE7C7] text-white' : 'text-[#8D7D7D]'}`}>
                  {day}
                </span>
              )}
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayTasks.map(t => (
                  <div key={t.id} draggable
                    onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('type', 'task'); e.dataTransfer.setData('payload', JSON.stringify(t)); }}
                    onClick={(e) => { e.stopPropagation(); setFormTitle(t.title); setFormColor(t.color); setModalConfig({ isOpen: true, mode: 'edit', dateStr: t.date, task: t }); }}
                    className={`text-[10px] px-1.5 py-1 rounded-[6px] flex items-center gap-1.5 ${t.color.bg} ${t.color.text} font-bold ${t.completed ? 'opacity-40 line-through' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.completed ? t.color.text.replace('text-', 'bg-') : t.color.dot}`} />
                    <span className="leading-tight break-words">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const WeekView = () => {
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - (day === 0 ? 6 : day - 1);
    const weekDays = [...Array(7).keys()].map(i => { const d = new Date(currentDate); d.setDate(diff + i); return d; });
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((date, idx) => {
          const dateStr = formatDate(date);
          const dayTasks = tasks.filter(t => t.date === dateStr);
          const isToday = formatDate(new Date()) === dateStr;
          return (
            <div key={idx} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, dateStr)}
              className={`bg-white/80 rounded-[28px] border border-[#F0EBE7] flex flex-col overflow-hidden min-h-[450px] shadow-sm ${isToday ? 'ring-2 ring-[#CDE7C7]' : ''}`}>
              <div className={`p-4 text-center border-b border-[#F0EBE7] ${isToday ? 'bg-[#F6FBF6]' : ''}`}>
                <div className="text-xs font-bold text-[#AFA4A4] uppercase mb-1">{['一', '二', '三', '四', '五', '六', '日'][idx]}</div>
                <div className={`text-2xl font-black ${isToday ? 'text-[#839E7B]' : 'text-[#554D4D]'}`}>{date.getDate()}</div>
              </div>
              <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto no-scrollbar"
                onClick={() => setModalConfig({ isOpen: true, mode: 'add', dateStr, task: null })}>
                {dayTasks.map(t => (
                  <div key={t.id}
                    onClick={(e) => { e.stopPropagation(); setFormTitle(t.title); setFormColor(t.color); setModalConfig({ isOpen: true, mode: 'edit', dateStr: t.date, task: t }); }}
                    className={`flex items-start gap-2 p-2 rounded-2xl border ${t.color.border} ${t.color.bg} ${t.color.text} cursor-pointer hover:translate-y-[-1px] transition-all`}>
                    <button onClick={(e) => toggleComplete(t.id, e, t.completed)}
                      className="w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center bg-white">
                      {t.completed ? <Check size={10} /> : <div className={`w-1.5 h-1.5 rounded-full ${t.color.dot}`} />}
                    </button>
                    <span className={`text-[11px] font-bold leading-snug break-words ${t.completed ? 'line-through opacity-50' : ''}`}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const DayView = () => {
    const dateStr = formatDate(currentDate);
    const dayTasks = tasks.filter(t => t.date === dateStr);
    return (
      <div className="max-w-2xl mx-auto bg-white/90 rounded-[40px] p-8 md:p-12 shadow-sm border border-[#F0EBE7]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#CDE7C7] rounded-[30px] flex flex-col items-center justify-center text-white shadow-lg">
              <span className="text-xs font-bold opacity-80">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()]}</span>
              <span className="text-3xl font-black">{currentDate.getDate()}</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#554D4D]">今日焦点</h2>
              <p className="text-[#AFA4A4] font-bold">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</p>
            </div>
          </div>
          <button onClick={() => { setFormTitle(''); setModalConfig({ isOpen: true, mode: 'add', dateStr, task: null }); }}
            className="w-14 h-14 bg-[#F6EDE7] text-[#8D7D7D] rounded-full flex items-center justify-center hover:scale-110 shadow-inner transition-all">
            <Plus size={28} />
          </button>
        </div>
        <div className="space-y-4">
          {dayTasks.map(t => (
            <div key={t.id}
              onClick={() => { setFormTitle(t.title); setFormColor(t.color); setModalConfig({ isOpen: true, mode: 'edit', dateStr: t.date, task: t }); }}
              className={`group flex items-center justify-between p-6 rounded-[28px] border-l-[10px] ${t.color.border.replace('border-', 'border-l-')} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer`}>
              <div className="flex items-center gap-5">
                <button onClick={(e) => toggleComplete(t.id, e, t.completed)}
                  className={`w-8 h-8 rounded-full border-2 ${t.color.border} flex items-center justify-center transition-colors ${t.completed ? t.color.text.replace('text-', 'bg-') : 'bg-white'}`}>
                  {t.completed ? <Check size={18} className="text-white" /> : <div className={`w-3 h-3 rounded-full ${t.color.dot}`} />}
                </button>
                <span className={`text-xl font-bold text-[#554D4D] ${t.completed ? 'line-through opacity-40' : ''}`}>{t.title}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}
                className="p-2 text-[#D1C7C7] hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {dayTasks.length === 0 &&
            <div className="py-20 text-center opacity-40 flex flex-col items-center gap-4">
              <Trophy size={60} />
              <p className="font-bold tracking-widest text-lg">完美！暂时没有计划</p>
            </div>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFBF8] text-[#554D4D] font-sans flex flex-col md:flex-row relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: `radial-gradient(#8D7D7D 1px, transparent 0)`, backgroundSize: '32px 32px' }}></div>

      {/* 侧边栏 */}
      <aside className="w-full md:w-80 bg-white/60 border-b md:border-b-0 md:border-r border-[#F0EBE7] p-8 flex flex-col gap-8 z-20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ECC3C9] rounded-[20px] flex items-center justify-center text-white shadow-lg">
            <CalendarIcon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter leading-none">PLANNER</h1>
            <p className="text-[10px] font-bold text-[#AFA4A4] tracking-widest mt-1 uppercase">Local Edition</p>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible no-scrollbar">
          {[
            { id: 'day', icon: Clock, label: '今日视图' },
            { id: 'week', icon: LayoutGrid, label: '本周规划' },
            { id: 'month', icon: CalendarIcon, label: '月度总览' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`flex-1 md:w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all font-bold text-sm whitespace-nowrap ${view === item.id ? 'bg-[#F5ECBE] text-[#8D825A] shadow-md scale-[1.02]' : 'text-[#AFA4A4] hover:bg-white/60'}`}>
              <item.icon size={18} /><span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 常用计划 */}
        <div className="hidden md:flex flex-1 flex-col gap-5 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-[#AFA4A4] uppercase tracking-[0.2em]">常用计划</h3>
            <button onClick={() => {
              const np = { id: Date.now().toString(), title: '新计划', color: COLORS[0] };
              setCommonPlans((prev) => [...prev, np]);
            }} className="bg-white/80 text-[#AFA4A4] w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#ECC3C9] hover:text-white shadow-sm transition-all">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
            {commonPlans.map(p => (
              <div key={p.id} draggable={editingCommon !== p.id}
                onDragStart={(e) => { e.dataTransfer.setData('type', 'common'); e.dataTransfer.setData('payload', JSON.stringify(p)); }}
                className="group px-5 py-4 rounded-full border shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing border-transparent bg-white/50 relative transition-all hover:scale-[1.02]">
                <div className={`w-2.5 h-2.5 rounded-full ${p.color.dot}`}></div>
                {editingCommon === p.id ? (
                  <input autoFocus className="bg-transparent outline-none w-full font-bold text-sm"
                    defaultValue={p.title}
                    onBlur={(e) => { setCommonPlans((prev) => prev.map(x => x.id === p.id ? { ...x, title: e.target.value } : x)); setEditingCommon(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} />
                ) : (
                  <span className="text-sm font-bold flex-1 truncate">{p.title}</span>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#AFA4A4]">
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setEditingCommon(p.id)}
                    className="hover:text-[#8D7D7D]"><Edit3 size={14} /></button>
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setCommonPlans((prev) => prev.filter(x => x.id !== p.id))}
                    className="hover:text-red-300"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 p-4 md:p-10 flex flex-col gap-8 z-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex bg-white/80 p-1.5 rounded-[20px] shadow-sm border border-[#F5F2F2]">
              <button onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() - 1);
                else if (view === 'week') d.setDate(d.getDate() - 7);
                else d.setDate(d.getDate() - 1);
                setCurrentDate(d);
              }} className="p-3 text-[#AFA4A4] hover:bg-[#F6EDE7] rounded-xl"><ChevronLeft size={22} /></button>
              <button onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() + 1);
                else if (view === 'week') d.setDate(d.getDate() + 7);
                else d.setDate(d.getDate() + 1);
                setCurrentDate(d);
              }} className="p-3 text-[#AFA4A4] hover:bg-[#F6EDE7] rounded-xl"><ChevronRight size={22} /></button>
            </div>
            <h2 className="text-3xl font-black text-[#554D4D] tracking-tighter">
              {currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}
              {view === 'day' && ` / ${currentDate.getDate()}`}
            </h2>
          </div>
          <button onClick={() => setCurrentDate(new Date())}
            className="px-6 py-3.5 bg-white/90 border-2 border-[#F5F2F2] rounded-[22px] font-bold text-[10px] text-[#AFA4A4] shadow-sm">Today</button>
        </header>
        <div className="flex-1">
          {view === 'month' && <MonthView />}
          {view === 'week' && <WeekView />}
          {view === 'day' && <DayView />}
        </div>
      </main>

      {/* 新增/编辑弹窗 */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#554D4D]/10 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setModalConfig({ ...modalConfig, isOpen: false }); }}>
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-[#F5F2F2] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#554D4D]">{modalConfig.mode === 'add' ? '新计划' : '编辑计划'}</h3>
              <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}><X size={18} /></button>
            </div>
            <input autoFocus value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xl p-6 bg-[#FAF9F9] rounded-[28px] outline-none mb-8 font-bold text-[#554D4D]"
              onKeyDown={(e) => e.key === 'Enter' && saveTask()} />
            <div className="flex justify-between mb-10 no-scrollbar">
              {COLORS.map(c => (
                <button key={c.name} onClick={() => setFormColor(c)}
                  className={`w-10 h-10 rounded-full shrink-0 ${c.bg} border-2 ${formColor.hex === c.hex ? 'border-[#8D7D7D] scale-110 shadow-md' : 'border-transparent'}`} />
              ))}
            </div>
            <div className="flex gap-4">
              {modalConfig.mode === 'edit' && (
                <button onClick={() => deleteTask(modalConfig.task.id)}
                  className="w-16 flex items-center justify-center bg-red-50 text-red-300 rounded-[24px] hover:bg-red-100 transition-colors">
                  <Trash2 size={22} />
                </button>
              )}
              <button onClick={saveTask}
                className="flex-1 py-5 bg-[#CDE7C7] text-white rounded-[24px] font-bold uppercase tracking-widest shadow-lg hover:brightness-95 transition-all">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&display=swap');
        body { font-family: 'Quicksand', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
};

export default App;
