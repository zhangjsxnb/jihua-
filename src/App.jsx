import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, LayoutGrid, Trophy, Trash2, Edit3, X, Check, LogOut, User,
  Moon, Sun, PieChart, Save, Download, ListTodo, PlusCircle
} from 'lucide-react';

// --- Supabase 环境配置 ---
const getEnv = (key) => {
  try { return import.meta.env[key]; } catch (e) { return null; }
};
const supabaseUrl = getEnv('https://ncbzklntlyiqvpmezpnk.supabase.co') || 'YOUR_SUPABASE_URL';
const supabaseKey = getEnv('sb_publishable_OsNM8K_bgwUQhGosWMrCfA_Lt4k93DL') || 'YOUR_SUPABASE_ANON_KEY';

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

const App = () => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [commonPlans, setCommonPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'task', mode: 'add', dateStr: '', target: null });
  const [templateModal, setTemplateModal] = useState({ isOpen: false, mode: 'save' });
  const [templateTitle, setTemplateTitle] = useState('');
  
  const [formTitle, setFormTitle] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formTime, setFormTime] = useState('');
  const [formSubtasks, setFormSubtasks] = useState([]);

  const [isDark, setIsDark] = useState(() => localStorage.getItem('jihua_theme') === 'dark');
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isOffline, setIsOffline] = useState(true);

  // 初始化 & 动态脚本加载
  useEffect(() => {
    if (supabaseUrl !== 'YOUR_SUPABASE_URL' && !window.supabase) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = () => setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
      document.head.appendChild(script);
    } else if (window.supabase) {
      setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
    } else {
      setIsOffline(true);
    }

    if (!document.getElementById('confetti-script')) {
      const script = document.createElement('script');
      script.id = 'confetti-script';
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jihua_theme', isDark ? 'dark' : 'light');
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const triggerConfetti = (e) => {
    if (window.confetti) {
      const rect = e.target.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      window.confetti({ particleCount: 40, spread: 60, origin: { x, y }, colors: ['#CDE7C7', '#ECC3C9', '#F5ECBE'] });
    }
  };

  useEffect(() => {
    if (!supabaseClient) return;
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); setShowAuth(false); setIsOffline(false); }
    });
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); setIsOffline(false); } else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, [supabaseClient]);

  useEffect(() => {
    if (isOffline || !user || !supabaseClient || showAuth) {
      try {
        setTasks(JSON.parse(localStorage.getItem('jihua_tasks') || '[]'));
        setTemplates(JSON.parse(localStorage.getItem('jihua_templates') || '[]'));
        const localPlans = JSON.parse(localStorage.getItem('jihua_commonPlans') || '[]');
        setCommonPlans(localPlans.length > 0 ? localPlans : DEFAULT_COMMON_PLANS);
      } catch (e) { setCommonPlans(DEFAULT_COMMON_PLANS); }
      return;
    }

    const fetchData = async (table, setter, localKey) => {
      const { data, error } = await supabaseClient.from(table).select('*').eq('user_id', user.id);
      if (data && !error) { setter(data); localStorage.setItem(localKey, JSON.stringify(data)); return data; }
      return null;
    };

    fetchData('tasks', setTasks, 'jihua_tasks');
    fetchData('templates', setTemplates, 'jihua_templates');
    fetchData('common_plans', (data) => {
      if (data.length > 0) setCommonPlans(data);
      else {
        const defaults = DEFAULT_COMMON_PLANS.map(p => ({ ...p, user_id: user.id }));
        supabaseClient.from('common_plans').insert(defaults).then(() => setCommonPlans(DEFAULT_COMMON_PLANS));
      }
    }, 'jihua_commonPlans');

    const subs = ['tasks', 'common_plans', 'templates'].map(table => 
      supabaseClient.channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` }, () => {
          if (table === 'tasks') fetchData('tasks', setTasks, 'jihua_tasks');
          if (table === 'common_plans') fetchData('common_plans', setCommonPlans, 'jihua_commonPlans');
          if (table === 'templates') fetchData('templates', setTemplates, 'jihua_templates');
        }).subscribe()
    );

    return () => subs.forEach(sub => supabaseClient.removeChannel(sub));
  }, [user, showAuth, isOffline, supabaseClient]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const syncData = async (table, action, id, payload, localKey, setLocal) => {
    if (!isOffline && user && supabaseClient) {
      if (action === 'delete') await supabaseClient.from(table).delete().eq('id', id).eq('user_id', user.id);
      if (action === 'update') await supabaseClient.from(table).update(payload).eq('id', id).eq('user_id', user.id);
      if (action === 'insert') await supabaseClient.from(table).insert([{ ...payload, user_id: user.id }]);
    } else {
      setLocal(prev => {
        let n = prev;
        if (action === 'delete') n = prev.filter(item => item.id !== id);
        if (action === 'update') n = prev.map(item => item.id === id ? { ...item, ...payload } : item);
        if (action === 'insert') n = [...prev, payload];
        localStorage.setItem(localKey, JSON.stringify(n));
        return n;
      });
    }
  };

  const toggleComplete = (id, e, currentStatus) => {
    e.stopPropagation();
    if (!currentStatus) triggerConfetti(e);
    syncData('tasks', 'update', id, { completed: !currentStatus }, 'jihua_tasks', setTasks);
  };

  const saveTask = () => {
    if (!formTitle.trim()) return;
    const payload = { title: formTitle.trim(), color: formColor, time: formTime, subtasks: formSubtasks };
    if (modalConfig.mode === 'add') {
      syncData('tasks', 'insert', null, { id: Date.now().toString(), date: modalConfig.dateStr, completed: false, ...payload }, 'jihua_tasks', setTasks);
    } else {
      syncData('tasks', 'update', modalConfig.target.id, payload, 'jihua_tasks', setTasks);
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const openTaskModal = (mode, dateStr, task = null) => {
    setFormTitle(task ? task.title : '');
    setFormColor(task ? task.color : COLORS[0]);
    setFormTime(task?.time || '');
    setFormSubtasks(task?.subtasks || []);
    setModalConfig({ isOpen: true, type: 'task', mode, dateStr, target: task });
  };

  const onDrop = (e, targetDateStr) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const payload = JSON.parse(e.dataTransfer.getData('payload'));
    if (type === 'common') {
      syncData('tasks', 'insert', null, { id: Date.now().toString(), title: payload.title, date: targetDateStr, color: payload.color, completed: false, time: '', subtasks: [] }, 'jihua_tasks', setTasks);
    } else if (type === 'task') {
      syncData('tasks', 'update', payload.id, { date: targetDateStr }, 'jihua_tasks', setTasks);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault(); setAuthError('');
    if (isOffline || !supabaseClient) { localStorage.setItem('jihua_offline_user', email); setShowAuth(false); return; }
    setIsLoading(true);
    try {
      if (!isOtpSent) {
        const { error } = await supabaseClient.auth.signInWithOtp({ email });
        if (error) throw error;
        setIsOtpSent(true);
      } else {
        const { error } = await supabaseClient.auth.verifyOtp({ email, token: otpCode, type: 'email' });
        if (error) throw error;
      }
    } catch (err) { setAuthError(err.message || '操作失败'); }
    finally { setIsLoading(false); }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#FFFBF8] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-xl border border-[#F0EBE7]">
          <div className="flex flex-col items-center gap-4 mb-8">
            <img src="/pwa-512x512.png" className="w-16 h-16 rounded-[24px] shadow-lg" alt="Logo" />
            <h1 className="text-2xl font-black italic tracking-tighter text-[#554D4D]">PLANNER</h1>
          </div>
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {!isOtpSent ? (
              <input type="email" placeholder="邮箱账号" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 bg-[#FAF9F9] rounded-[20px] outline-none font-bold text-sm" />
            ) : (
              <input type="text" placeholder="6位验证码" required value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full px-5 py-4 bg-[#FAF9F9] rounded-[20px] outline-none font-bold text-sm tracking-widest text-center" maxLength={6} />
            )}
            <button type="submit" className="w-full py-4 bg-[#CDE7C7] text-white rounded-[20px] font-bold uppercase tracking-widest">{isLoading ? '请稍候' : (isOtpSent ? '登 录' : '发送验证码')}</button>
          </form>
          <button onClick={() => { setIsOffline(true); setShowAuth(false); }} className="mt-4 text-[10px] font-bold text-[#AFA4A4] w-full underline">以访客身份体验</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF8] dark:bg-[#121212] text-[#554D4D] dark:text-[#EAEAEA] flex flex-col md:flex-row transition-colors duration-300">
      {/* 侧边栏/底部导航 */}
      <aside className="w-full md:w-[280px] bg-white dark:bg-[#1E1E1E] border-b md:border-b-0 md:border-r border-[#F0EBE7] dark:border-[#333] py-4 md:py-10 px-6 flex flex-col md:gap-10 z-20 shrink-0 shadow-sm sticky top-0 md:relative">
        <div className="flex items-center justify-between md:justify-start gap-4 mb-4 md:mb-0">
          <div className="flex items-center gap-3">
            <img src="/pwa-512x512.png" className="w-10 h-10 md:w-12 md:h-12 rounded-[16px] shadow-sm" alt="Logo" />
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-black italic leading-none">PLANNER</h1>
              <p className="text-[9px] font-bold tracking-widest text-[#AFA4A4] uppercase mt-1">{isOffline ? 'Local' : 'Cloud'}</p>
            </div>
          </div>
          <div className="flex md:hidden items-center gap-3">
             <button onClick={() => setIsDark(!isDark)} className="p-2 text-[#AFA4A4]"><Moon size={20}/></button>
             <button onClick={() => { if (supabaseClient) supabaseClient.auth.signOut(); setShowAuth(true); }} className="p-2 text-[#AFA4A4]"><LogOut size={20}/></button>
          </div>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
          {[
            { id: 'day', icon: Clock, label: '今日' },
            { id: 'week', icon: LayoutGrid, label: '本周' },
            { id: 'month', icon: CalendarIcon, label: '月度' },
            { id: 'stats', icon: PieChart, label: '看板' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-[16px] transition-all font-bold text-[13px] whitespace-nowrap ${view === item.id ? 'bg-[#F5ECBE] dark:bg-[#8D825A]/30 text-[#8D825A] dark:text-[#EAEAEA]' : 'text-[#AFA4A4] hover:bg-[#FAF9F9] dark:hover:bg-[#252525]'}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden md:flex flex-1 flex-col gap-4 overflow-hidden mt-6">
          <h3 className="text-[11px] font-black text-[#AFA4A4] tracking-widest uppercase">常用计划</h3>
          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1">
            {commonPlans.map(p => (
              <div key={p.id} draggable onDragStart={(e) => { e.dataTransfer.setData('type', 'common'); e.dataTransfer.setData('payload', JSON.stringify(p)); }}
                className="group p-3 rounded-[18px] bg-[#FAF9F9] dark:bg-[#252525] border border-[#F0EBE7] dark:border-[#333] flex items-center gap-3 hover:border-[#E5B5BC] transition-all cursor-grab">
                <div className={`w-2 h-2 rounded-full ${p.color.dot}`}></div>
                <span className="text-[12px] font-bold truncate flex-1">{p.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex pt-6 border-t border-[#F0EBE7] dark:border-[#333] justify-between items-center text-[#AFA4A4]">
          <div className="flex items-center gap-2 text-[10px] font-bold truncate max-w-[140px]">
            <User size={14} /> {isOffline ? 'Offline' : user?.email}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={14}/> : <Moon size={14}/>}</button>
            <button onClick={() => { if (supabaseClient) supabaseClient.auth.signOut(); setShowAuth(true); }}><LogOut size={14}/></button>
          </div>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 p-4 md:p-10 flex flex-col gap-6 md:gap-10 overflow-y-auto pb-24 md:pb-10">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex bg-white dark:bg-[#1E1E1E] rounded-full shadow-sm border border-[#F0EBE7] dark:border-[#333] p-1">
              <button onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() - 1); else if (view === 'week') d.setDate(d.getDate() - 7); else d.setDate(d.getDate() - 1);
                setCurrentDate(d);
              }} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[#AFA4A4] hover:bg-[#F6EDE7] rounded-full transition-colors"><ChevronLeft size={18}/></button>
              <button onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() + 1); else if (view === 'week') d.setDate(d.getDate() + 7); else d.setDate(d.getDate() + 1);
                setCurrentDate(d);
              }} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[#AFA4A4] hover:bg-[#F6EDE7] rounded-full transition-colors"><ChevronRight size={18}/></button>
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-tight whitespace-nowrap">
              {currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}
              {view === 'day' && <span className="text-[#AFA4A4]"> / {currentDate.getDate()}</span>}
            </h2>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2 bg-white dark:bg-[#1E1E1E] border border-[#F0EBE7] dark:border-[#333] rounded-full font-bold text-[#AFA4A4] text-xs shadow-sm">Today</button>
        </header>

        <div className="flex-1">
          {view === 'month' && <MonthView currentDate={currentDate} tasks={tasks} openTaskModal={openTaskModal} toggleComplete={toggleComplete} onDrop={onDrop} formatDate={formatDate} />}
          {view === 'week' && <WeekView currentDate={currentDate} tasks={tasks} openTaskModal={openTaskModal} toggleComplete={toggleComplete} onDrop={onDrop} formatDate={formatDate} />}
          {view === 'day' && <DayView currentDate={currentDate} tasks={tasks} openTaskModal={openTaskModal} toggleComplete={toggleComplete} formatDate={formatDate} />}
          {view === 'stats' && <StatsView tasks={tasks} />}
        </div>
      </main>

      {/* 弹窗等保持原逻辑 */}
      {modalConfig.isOpen && <Modal modalConfig={modalConfig} setModalConfig={setModalConfig} formTitle={formTitle} setFormTitle={setFormTitle} formColor={formColor} setFormColor={setFormColor} formTime={formTime} setFormTime={setFormTime} formSubtasks={formSubtasks} setFormSubtasks={setFormSubtasks} saveTask={saveTask} deleteTask={deleteTask} />}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://gs.jurieo.com/gemini/fonts-googleapis/css2?family=Quicksand:wght@600;700;900&display=swap');
        body { font-family: 'Quicksand', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      ` }} />
    </div>
  );
};

// 分离出的子视图组件 (简化示例，保留核心结构)
const MonthView = ({ currentDate, tasks, openTaskModal, toggleComplete, onDrop, formatDate }) => {
  const y = currentDate.getFullYear(), m = currentDate.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const firstDay = first === 0 ? 6 : first - 1;
  const calendarDays = Array(firstDay).fill(null).concat([...Array(days).keys()].map(i => i + 1));
  const fullCalendar = calendarDays.concat(Array((7 - (calendarDays.length % 7)) % 7).fill(null));

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-[24px] border border-[#F0EBE7] dark:border-[#333] overflow-hidden shadow-sm flex flex-col">
      <div className="grid grid-cols-7 border-b border-[#F0EBE7] dark:border-[#333] bg-[#FAF9F9] dark:bg-[#1A1A1A]">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="text-center text-[11px] font-bold text-[#AFA4A4] py-3">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 bg-[#F0EBE7] dark:bg-[#333] gap-px">
        {fullCalendar.map((day, idx) => {
          const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
          const dateStr = date ? formatDate(date) : '';
          const dayTasks = tasks.filter(t => t.date === dateStr);
          return (
            <div key={idx} onDragOver={(e) => e.preventDefault()} onDrop={(e) => date && onDrop(e, dateStr)}
              onClick={() => date && openTaskModal('add', dateStr)}
              className={`min-h-[100px] md:min-h-[140px] p-1.5 md:p-3 transition-all flex flex-col gap-1 md:gap-2 ${day ? 'bg-white dark:bg-[#1E1E1E] hover:bg-[#FAF9F9] dark:hover:bg-[#252525] cursor-pointer' : 'bg-[#FAF9F9] dark:bg-[#1A1A1A]'}`}>
              {day && <span className={`text-[11px] md:text-[13px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${formatDate(new Date()) === dateStr ? 'bg-[#CDE7C7] text-white' : 'text-[#8D7D7D] dark:text-[#aaa]'}`}>{day}</span>}
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayTasks.map(t => (
                  <div key={t.id} onClick={(e) => { e.stopPropagation(); openTaskModal('edit', t.date, t); }} className={`text-[9px] md:text-[11px] px-1.5 py-1 rounded-[6px] flex items-center gap-1.5 ${t.color.bg} ${t.color.text} font-bold ${t.completed ? 'opacity-40 line-through' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.completed ? t.color.text.replace('text-', 'bg-') : t.color.dot}`} />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 其他视图组件(WeekView, DayView, StatsView, Modal)在此略，结构同上，主要是样式上的响应式微调...

export default App;