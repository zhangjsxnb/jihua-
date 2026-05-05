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

// --- 常量配置 ---
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
  // --- UI 状态管理 ---
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [commonPlans, setCommonPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'task', mode: 'add', dateStr: '', target: null });
  const [templateModal, setTemplateModal] = useState({ isOpen: false, mode: 'save' }); // save | load
  const [templateTitle, setTemplateTitle] = useState('');
  
  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formTime, setFormTime] = useState('');
  const [formSubtasks, setFormSubtasks] = useState([]); // {title, completed}

  const [isDark, setIsDark] = useState(() => localStorage.getItem('jihua_theme') === 'dark');

  // --- Supabase 认证与离线状态 ---
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isOffline, setIsOffline] = useState(true);

  // --- 动态加载依赖 (Supabase + Confetti) ---
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

  // --- 切换暗黑模式 ---
  useEffect(() => {
    localStorage.setItem('jihua_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // --- 音效与特效 ---
  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const triggerConfetti = (e) => {
    if (window.confetti) {
      const rect = e.target.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      window.confetti({ particleCount: 60, spread: 70, origin: { x, y }, colors: ['#CDE7C7', '#ECC3C9', '#F5ECBE'], disableForReducedMotion: true });
    }
  };

  // --- Supabase 认证初始化 ---
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

  // --- Supabase 实时数据同步 ---
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

  // --- 核心业务逻辑 ---
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
    if (!currentStatus) { playDing(); triggerConfetti(e); }
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

  const saveCommonPlan = () => {
    if (!formTitle.trim()) return;
    const payload = { title: formTitle.trim(), color: formColor };
    if (modalConfig.mode === 'add') syncData('common_plans', 'insert', null, { id: Date.now().toString(), ...payload }, 'jihua_commonPlans', setCommonPlans);
    else syncData('common_plans', 'update', modalConfig.target.id, payload, 'jihua_commonPlans', setCommonPlans);
    setModalConfig({ ...modalConfig, isOpen: false });
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

  // --- 模板逻辑 ---
  const handleSaveTemplate = () => {
    if (!templateTitle.trim()) return;
    const dateStr = formatDate(currentDate);
    const dayTasks = tasks.filter(t => t.date === dateStr).map(t => ({ title: t.title, color: t.color, time: t.time || '', subtasks: t.subtasks || [] }));
    if (dayTasks.length === 0) return alert("今天没有计划，无法保存为模板");
    
    syncData('templates', 'insert', null, { id: Date.now().toString(), title: templateTitle.trim(), tasks_data: dayTasks }, 'jihua_templates', setTemplates);
    setTemplateModal({ isOpen: false, mode: 'save' });
  };

  const handleApplyTemplate = (template) => {
    const dateStr = formatDate(currentDate);
    template.tasks_data.forEach(t => {
      syncData('tasks', 'insert', null, { id: Date.now().toString() + Math.random(), date: dateStr, completed: false, ...t }, 'jihua_tasks', setTasks);
    });
    setTemplateModal({ isOpen: false, mode: 'load' });
    playDing();
  };

  // --- 身份认证 UI ---
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
    } catch (err) { setAuthError(err.message || '操作失败，请检查邮箱或验证码'); }
    finally { setIsLoading(false); }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#FFFBF8] font-sans flex items-center justify-center p-6 relative">
        <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `radial-gradient(#8D7D7D 1px, transparent 0)`, backgroundSize: '32px 32px' }}></div>
        <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-10 w-full max-w-sm shadow-xl border border-[#F0EBE7] z-10 animate-in zoom-in-95">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-[#ECC3C9] rounded-[24px] flex items-center justify-center text-white shadow-lg"><CalendarIcon size={32} strokeWidth={2.5} /></div>
            <div className="text-center">
              <h1 className="text-2xl font-black italic tracking-tighter text-[#554D4D]">PLANNER</h1>
              <p className="text-[10px] font-bold text-[#AFA4A4] tracking-widest uppercase mt-1">Supabase Synced</p>
            </div>
          </div>
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {!isOtpSent ? (
              <input type="email" placeholder="邮箱账号" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 bg-[#FAF9F9] border border-transparent focus:border-[#CDE7C7] rounded-[20px] outline-none font-bold text-[#554D4D] text-sm transition-all" />
            ) : (
              <>
                <div className="text-sm font-bold text-[#AFA4A4] px-2 truncate">已发送至: {email}</div>
                <input type="text" placeholder="6位验证码" required value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full px-5 py-4 bg-[#FAF9F9] border border-transparent focus:border-[#CDE7C7] rounded-[20px] outline-none font-bold text-[#554D4D] text-sm tracking-widest transition-all text-center" maxLength={6} />
              </>
            )}
            {authError && <p className="text-red-400 text-xs font-bold text-center">{authError}</p>}
            <button type="submit" disabled={isLoading} className="w-full py-4 mt-2 bg-[#CDE7C7] text-white rounded-[20px] font-bold uppercase tracking-widest shadow-md hover:brightness-95 transition-all disabled:opacity-50">
              {isLoading ? '请稍候...' : (!isOtpSent ? '发送验证码' : '登 录')}
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-3 items-center">
            {isOtpSent && <button onClick={() => { setIsOtpSent(false); setOtpCode(''); setAuthError(''); }} className="text-xs font-bold text-[#AFA4A4] hover:text-[#8D7D7D] transition-colors">修改邮箱账号 / 重新发送</button>}
            <button onClick={() => { setIsOffline(true); setShowAuth(false); }} className="text-[10px] font-bold text-[#D1C7C7] underline hover:text-[#AFA4A4] transition-colors">先不登录，以访客身份体验</button>
          </div>
        </div>
      </div>
    );
  }

  // --- 视图组件 ---
  const openTaskModal = (mode, dateStr, task = null) => {
    setFormTitle(task ? task.title : '');
    setFormColor(task ? task.color : COLORS[0]);
    setFormTime(task?.time || '');
    setFormSubtasks(task?.subtasks || []);
    setModalConfig({ isOpen: true, type: 'task', mode, dateStr, target: task });
  };

  const renderTaskBadges = (t) => {
    const completedSubs = t.subtasks?.filter(s => s.completed).length || 0;
    const totalSubs = t.subtasks?.length || 0;
    return (
      <div className="flex gap-2 mt-1.5 opacity-60">
        {t.time && <span className="flex items-center gap-1 text-[9px] font-bold"><Clock size={10} /> {t.time}</span>}
        {totalSubs > 0 && <span className="flex items-center gap-1 text-[9px] font-bold"><ListTodo size={10} /> {completedSubs}/{totalSubs}</span>}
      </div>
    );
  };

  const MonthView = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const firstDay = first === 0 ? 6 : first - 1;
    const calendarDays = Array(firstDay).fill(null).concat([...Array(days).keys()].map(i => i + 1));
    const paddingDays = (7 - (calendarDays.length % 7)) % 7;
    const fullCalendar = calendarDays.concat(Array(paddingDays).fill(null));

    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[28px] border border-[#F0EBE7] dark:border-[#333] overflow-hidden shadow-sm flex flex-col transition-colors">
        <div className="grid grid-cols-7 border-b border-[#F0EBE7] dark:border-[#333]">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="text-center text-[13px] font-bold text-[#AFA4A4] dark:text-[#888] py-5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 bg-[#F0EBE7] dark:bg-[#333] gap-px">
          {fullCalendar.map((day, idx) => {
            const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
            const dateStr = date ? formatDate(date) : '';
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = day && formatDate(new Date()) === dateStr;

            return (
              <div key={idx} onDragOver={(e) => e.preventDefault()} onDrop={(e) => date && onDrop(e, dateStr)}
                onClick={() => date && openTaskModal('add', dateStr)}
                className={`min-h-[140px] p-3 transition-all flex flex-col gap-2 ${day ? 'bg-white dark:bg-[#1E1E1E] hover:bg-[#FAF9F9] dark:hover:bg-[#252525] cursor-pointer' : 'bg-[#FAF9F9] dark:bg-[#1A1A1A]'}`}>
                {day && <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#CDE7C7] dark:bg-[#4A6D46] text-white' : 'text-[#8D7D7D] dark:text-[#aaa]'}`}>{day}</span>}
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  {dayTasks.map(t => (
                    <div key={t.id} draggable onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('type', 'task'); e.dataTransfer.setData('payload', JSON.stringify(t)); }}
                      onClick={(e) => { e.stopPropagation(); openTaskModal('edit', t.date, t); }}
                      className={`text-[11px] px-2 py-1.5 rounded-[8px] flex flex-col ${t.color.bg} ${t.color.text} dark:brightness-75 font-bold hover:brightness-95 transition-all ${t.completed ? 'opacity-40 line-through' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={(e) => toggleComplete(t.id, e, t.completed)}
                          className="w-4 h-4 rounded-full border border-white/50 shrink-0 flex items-center justify-center bg-white shadow-sm hover:scale-110 transition-transform">
                          {t.completed ? <Check size={10} strokeWidth={3} /> : <div className={`w-1.5 h-1.5 rounded-full ${t.color.dot}`} />}
                        </button>
                        <span className="leading-tight break-words truncate flex-1">{t.title}</span>
                      </div>
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
              className={`bg-white dark:bg-[#1E1E1E] rounded-[24px] border border-[#F0EBE7] dark:border-[#333] flex flex-col overflow-hidden min-h-[450px] shadow-sm transition-all ${isToday ? 'ring-2 ring-[#CDE7C7] dark:ring-[#4A6D46]' : ''}`}>
              <div className={`p-4 text-center border-b border-[#F0EBE7] dark:border-[#333] ${isToday ? 'bg-[#F6FBF6] dark:bg-[#1C2A1C]' : 'bg-[#FAF9F9] dark:bg-[#252525]'}`}>
                <div className="text-[12px] font-bold text-[#AFA4A4] dark:text-[#888] uppercase mb-1">{['一', '二', '三', '四', '五', '六', '日'][idx]}</div>
                <div className={`text-2xl font-black ${isToday ? 'text-[#839E7B] dark:text-[#8AA882]' : 'text-[#554D4D] dark:text-[#EAEAEA]'}`}>{date.getDate()}</div>
              </div>
              <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto no-scrollbar cursor-pointer hover:bg-[#FAF9F9]/50 dark:hover:bg-[#252525]/50 transition-colors"
                onClick={() => openTaskModal('add', dateStr)}>
                {dayTasks.map(t => (
                  <div key={t.id} onClick={(e) => { e.stopPropagation(); openTaskModal('edit', t.date, t); }}
                    className={`flex items-start gap-2 p-2.5 rounded-[16px] border ${t.color.border} ${t.color.bg} ${t.color.text} dark:brightness-75 cursor-pointer hover:brightness-95 transition-all shadow-sm`}>
                    <button onClick={(e) => toggleComplete(t.id, e, t.completed)}
                      className="w-4 h-4 rounded-full border border-white/50 shrink-0 mt-0.5 flex items-center justify-center bg-white shadow-sm">
                      {t.completed ? <Check size={10} strokeWidth={3} /> : <div className={`w-1.5 h-1.5 rounded-full ${t.color.dot}`} />}
                    </button>
                    <div className="flex flex-col flex-1">
                      <span className={`text-[12px] font-bold leading-snug break-words ${t.completed ? 'line-through opacity-50' : ''}`}>{t.title}</span>
                      {renderTaskBadges(t)}
                    </div>
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
      <div className="max-w-3xl mx-auto w-full bg-white dark:bg-[#1E1E1E] rounded-[40px] p-8 md:p-12 shadow-sm border border-[#F0EBE7] dark:border-[#333] transition-colors">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#CDE7C7] dark:bg-[#4A6D46] rounded-[24px] flex flex-col items-center justify-center text-white shadow-sm">
              <span className="text-[11px] font-bold opacity-90 uppercase tracking-wider">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()]}</span>
              <span className="text-3xl font-black mt-0.5">{currentDate.getDate()}</span>
            </div>
            <div>
              <h2 className="text-[28px] font-black text-[#554D4D] dark:text-[#EAEAEA] leading-tight">今日焦点</h2>
              <p className="text-[#AFA4A4] dark:text-[#888] font-bold text-[13px] mt-1">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemplateModal({ isOpen: true, mode: 'load' })} className="px-4 py-3 bg-[#FAF9F9] dark:bg-[#252525] text-[#8D7D7D] dark:text-[#aaa] rounded-[16px] font-bold text-[12px] hover:bg-[#EFEBE7] dark:hover:bg-[#333] flex items-center gap-2 transition-all">
              <Download size={16} /> 导入模板
            </button>
            <button onClick={() => setTemplateModal({ isOpen: true, mode: 'save' })} className="px-4 py-3 bg-[#FAF9F9] dark:bg-[#252525] text-[#8D7D7D] dark:text-[#aaa] rounded-[16px] font-bold text-[12px] hover:bg-[#EFEBE7] dark:hover:bg-[#333] flex items-center gap-2 transition-all">
              <Save size={16} /> 存为模板
            </button>
            <button onClick={() => openTaskModal('add', dateStr)} className="w-12 h-12 bg-[#F6EDE7] dark:bg-[#3A3232] text-[#8D7D7D] dark:text-[#EAEAEA] rounded-[16px] flex items-center justify-center hover:scale-105 shadow-sm transition-all">
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {dayTasks.map(t => (
            <div key={t.id} onClick={() => openTaskModal('edit', t.date, t)}
              className={`group flex flex-col p-6 rounded-[24px] border-l-[8px] ${t.color.border.replace('border-', 'border-l-')} ${t.color.bg.replace('bg-', 'bg-opacity-20 bg-')} dark:brightness-90 bg-white dark:bg-[#252525] shadow-sm hover:shadow-md transition-all cursor-pointer border border-y-[#F0EBE7] border-r-[#F0EBE7] dark:border-y-[#333] dark:border-r-[#333]`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 flex-1">
                  <button onClick={(e) => toggleComplete(t.id, e, t.completed)}
                    className={`w-8 h-8 rounded-full border-2 ${t.color.border} flex items-center justify-center transition-colors shadow-sm ${t.completed ? t.color.text.replace('text-', 'bg-') : 'bg-white dark:bg-[#1E1E1E]'}`}>
                    {t.completed ? <Check size={16} strokeWidth={3} className="text-white" /> : <div className={`w-2.5 h-2.5 rounded-full ${t.color.dot}`} />}
                  </button>
                  <span className={`text-[18px] font-bold text-[#554D4D] dark:text-[#EAEAEA] ${t.completed ? 'line-through opacity-40' : ''}`}>{t.title}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }} className="p-3 text-[#D1C7C7] dark:text-[#666] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={20} strokeWidth={2.5}/>
                </button>
              </div>
              {(t.time || (t.subtasks && t.subtasks.length > 0)) && (
                <div className="ml-[52px] mt-3 flex items-center gap-4 opacity-70">
                  {t.time && <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#8D7D7D] dark:text-[#aaa]"><Clock size={14} /> {t.time}</span>}
                  {t.subtasks?.length > 0 && <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#8D7D7D] dark:text-[#aaa]"><ListTodo size={14} /> {t.subtasks.filter(s=>s.completed).length} / {t.subtasks.length} 项</span>}
                </div>
              )}
            </div>
          ))}
          {dayTasks.length === 0 &&
            <div className="py-24 text-center opacity-40 flex flex-col items-center gap-5">
              <Trophy size={64} strokeWidth={1.5} className="dark:text-[#aaa]" />
              <p className="font-bold tracking-widest text-[15px] dark:text-[#aaa]">完美！暂时没有计划</p>
            </div>}
        </div>
      </div>
    );
  };

  const StatsView = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
      <div className="max-w-3xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[32px] border border-[#F0EBE7] dark:border-[#333] shadow-sm col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16">
          <div className="w-32 h-32 rounded-full border-[12px] border-[#F6EDE7] dark:border-[#333] flex items-center justify-center relative mb-6">
            <div className="absolute inset-0 rounded-full border-[12px] border-[#CDE7C7] dark:border-[#4A6D46]" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${rate}%, 0 ${rate}%)` }}></div>
            <span className="text-4xl font-black text-[#554D4D] dark:text-[#EAEAEA] z-10">{rate}%</span>
          </div>
          <h2 className="text-2xl font-black text-[#554D4D] dark:text-[#EAEAEA]">总体完成率</h2>
          <p className="text-[#AFA4A4] dark:text-[#888] font-bold mt-2">共创建了 {total} 个计划，完成了 {completed} 个</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#FFFBF8] dark:bg-[#121212] text-[#554D4D] dark:text-[#EAEAEA] font-sans flex flex-col md:flex-row relative selection:bg-[#F5ECBE] transition-colors duration-300">
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: `radial-gradient(${isDark ? '#EAEAEA' : '#8D7D7D'} 1px, transparent 0)`, backgroundSize: '32px 32px' }}></div>

        {/* 侧边栏 */}
        <aside className="w-full md:w-[300px] bg-white dark:bg-[#1E1E1E] border-b md:border-b-0 md:border-r border-[#F0EBE7] dark:border-[#333] py-10 px-8 flex flex-col gap-10 z-20 shrink-0 shadow-sm transition-colors">
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] bg-[#ECC3C9] dark:bg-[#8D5A65] rounded-[18px] flex items-center justify-center text-white shadow-sm">
              <CalendarIcon size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[22px] font-black italic tracking-tighter leading-none">PLANNER</h1>
              <p className={`text-[10px] font-bold tracking-widest mt-1.5 uppercase ${isOffline ? 'text-[#AFA4A4]' : 'text-[#839E7B] dark:text-[#8AA882]'}`}>
                {isOffline ? 'Local Edition' : 'Supabase Pro'}
              </p>
            </div>
          </div>

          {/* 导航 */}
          <nav className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible no-scrollbar">
            {[
              { id: 'day', icon: Clock, label: '今日视图' },
              { id: 'week', icon: LayoutGrid, label: '本周规划' },
              { id: 'month', icon: CalendarIcon, label: '月度总览' },
              { id: 'stats', icon: PieChart, label: '数据看板' },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`flex-1 md:w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all font-bold text-[14px] whitespace-nowrap ${view === item.id ? 'bg-[#F5ECBE] dark:bg-[#8D825A]/30 text-[#8D825A] dark:text-[#EAEAEA] shadow-sm' : 'text-[#AFA4A4] dark:text-[#888] hover:bg-[#FAF9F9] dark:hover:bg-[#252525]'}`}>
                <item.icon size={20} strokeWidth={view === item.id ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* 常用计划 */}
          <div className="hidden md:flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-[12px] font-black text-[#AFA4A4] dark:text-[#888] tracking-widest">常用计划</h3>
              <button onClick={() => {
                setFormTitle(''); setFormColor(COLORS[0]); setModalConfig({ isOpen: true, type: 'common', mode: 'add', dateStr: '', target: null });
              }} className="text-[#AFA4A4] dark:text-[#888] hover:text-[#554D4D] dark:hover:text-[#EAEAEA] w-6 h-6 flex items-center justify-center transition-colors">
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-4 px-1">
              {commonPlans.map(p => (
                <div key={p.id} draggable onDragStart={(e) => { e.dataTransfer.setData('type', 'common'); e.dataTransfer.setData('payload', JSON.stringify(p)); }}
                  className="group px-5 py-4 rounded-[24px] bg-white dark:bg-[#252525] border border-[#F0EBE7] dark:border-[#333] shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-[#E5B5BC] dark:hover:border-[#8D5A65] hover:shadow-md transition-all">
                  <div className={`w-3 h-3 rounded-full ${p.color.dot}`}></div>
                  <span className="text-[13px] font-bold flex-1 truncate">{p.title}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#AFA4A4]">
                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                      setFormTitle(p.title); setFormColor(p.color); setModalConfig({ isOpen: true, type: 'common', mode: 'edit', dateStr: '', target: p });
                    }} className="hover:text-[#8D7D7D] dark:hover:text-[#EAEAEA]"><Edit3 size={16} /></button>
                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => syncData('common_plans', 'delete', p.id, null, 'jihua_commonPlans', setCommonPlans)}
                      className="hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部用户栏 */}
          <div className="pt-4 flex justify-between items-center px-2">
            <div className="flex items-center gap-2 text-[#AFA4A4] dark:text-[#888]">
              <User size={16} />
              <span className="text-[11px] font-bold max-w-[90px] truncate">
                {isOffline ? (localStorage.getItem('jihua_offline_user') || '离线用户') : (user?.email || '访客用户')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDark(!isDark)} className="text-[#AFA4A4] dark:text-[#888] hover:text-[#8D7D7D] dark:hover:text-[#EAEAEA] transition-colors">
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={async () => { if (supabaseClient) await supabaseClient.auth.signOut(); localStorage.removeItem('jihua_offline_user'); setShowAuth(true); setTasks([]); setCommonPlans([]); }} 
                className="text-[#AFA4A4] dark:text-[#888] hover:text-[#8D7D7D] dark:hover:text-[#EAEAEA] transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 p-6 md:p-12 flex flex-col gap-10 z-10 overflow-y-auto">
          <header className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex bg-white dark:bg-[#1E1E1E] rounded-full shadow-sm border border-[#F0EBE7] dark:border-[#333] p-1 transition-colors">
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (view === 'month') d.setMonth(d.getMonth() - 1); else if (view === 'week') d.setDate(d.getDate() - 7); else d.setDate(d.getDate() - 1);
                  setCurrentDate(d);
                }} className="w-10 h-10 flex items-center justify-center text-[#AFA4A4] hover:bg-[#F6EDE7] dark:hover:bg-[#333] rounded-full transition-colors"><ChevronLeft size={20} strokeWidth={2.5}/></button>
                <button onClick={() => {
                  const d = new Date(currentDate);
                  if (view === 'month') d.setMonth(d.getMonth() + 1); else if (view === 'week') d.setDate(d.getDate() + 7); else d.setDate(d.getDate() + 1);
                  setCurrentDate(d);
                }} className="w-10 h-10 flex items-center justify-center text-[#AFA4A4] hover:bg-[#F6EDE7] dark:hover:bg-[#333] rounded-full transition-colors"><ChevronRight size={20} strokeWidth={2.5}/></button>
              </div>
              <h2 className="text-[36px] font-black tracking-tight">
                {currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}
                {view === 'day' && ` / ${currentDate.getDate()}`}
              </h2>
            </div>
            <button onClick={() => setCurrentDate(new Date())}
              className="px-6 py-2.5 bg-white dark:bg-[#1E1E1E] border border-[#F0EBE7] dark:border-[#333] rounded-full font-bold text-[#AFA4A4] dark:text-[#888] shadow-sm hover:bg-[#FAF9F9] dark:hover:bg-[#252525] transition-colors text-[13px]">
              Today
            </button>
          </header>
          <div className="flex-1">
            {view === 'month' && <MonthView />}
            {view === 'week' && <WeekView />}
            {view === 'day' && <DayView />}
            {view === 'stats' && <StatsView />}
          </div>
        </main>

        {/* 新增/编辑弹窗 (带子任务与时间) */}
        {modalConfig.isOpen && (
          <div className="fixed inset-0 bg-[#554D4D]/20 dark:bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setModalConfig({ ...modalConfig, isOpen: false }); }}>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-[#F5F2F2] dark:border-[#333] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#554D4D] dark:text-[#EAEAEA]">
                  {modalConfig.mode === 'add' ? (modalConfig.type === 'task' ? '新计划' : '新增常用计划') : (modalConfig.type === 'task' ? '编辑计划' : '编辑常用计划')}
                </h3>
                <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="text-[#AFA4A4] hover:text-[#554D4D]"><X size={20} /></button>
              </div>

              <input autoFocus value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="计划名称..."
                className="w-full text-xl p-6 bg-[#FAF9F9] dark:bg-[#252525] rounded-[24px] outline-none mb-6 font-bold text-[#554D4D] dark:text-[#EAEAEA] border border-transparent focus:border-[#F0EBE7] dark:focus:border-[#444] transition-all placeholder:text-[#D1C7C7]" />
              
              {modalConfig.type === 'task' && (
                <>
                  <div className="flex items-center gap-4 mb-6 px-2">
                    <Clock size={18} className="text-[#AFA4A4] shrink-0" />
                    <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                      className="bg-[#FAF9F9] dark:bg-[#252525] px-4 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-[#F0EBE7] dark:focus:border-[#444] dark:text-[#EAEAEA]" />
                  </div>

                  <div className="mb-8 px-2">
                    <div className="flex items-center gap-2 mb-3 text-[#AFA4A4] font-bold text-xs"><ListTodo size={14}/> 子任务拆解</div>
                    <div className="space-y-2">
                      {formSubtasks.map((st, i) => (
                        <div key={i} className="flex gap-3 items-center bg-[#FAF9F9] dark:bg-[#252525] p-2 rounded-xl">
                          <button onClick={() => setFormSubtasks(prev => prev.map((s, idx) => idx === i ? {...s, completed: !s.completed} : s))}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${st.completed ? 'bg-[#CDE7C7] border-[#CDE7C7] text-white' : 'border-[#D1C7C7] bg-white dark:bg-[#1E1E1E]'}`}>
                            {st.completed && <Check size={12} strokeWidth={3}/>}
                          </button>
                          <input value={st.title} onChange={(e) => setFormSubtasks(prev => prev.map((s, idx) => idx === i ? {...s, title: e.target.value} : s))}
                            className={`flex-1 bg-transparent outline-none text-sm font-bold dark:text-[#EAEAEA] ${st.completed ? 'line-through opacity-50' : ''}`} placeholder="步骤内容..." />
                          <button onClick={() => setFormSubtasks(prev => prev.filter((_, idx) => idx !== i))} className="text-[#D1C7C7] hover:text-red-400 shrink-0"><X size={16}/></button>
                        </div>
                      ))}
                      <button onClick={() => setFormSubtasks(prev => [...prev, { title: '', completed: false }])}
                        className="text-xs font-bold text-[#AFA4A4] hover:text-[#8D7D7D] dark:hover:text-[#EAEAEA] flex items-center gap-1 mt-2 py-1 transition-colors">
                        <PlusCircle size={14}/> 添加步骤
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between mb-10 no-scrollbar px-2">
                {COLORS.map(c => (
                  <button key={c.name} onClick={() => setFormColor(c)}
                    className={`w-10 h-10 rounded-full shrink-0 ${c.bg} border-[3px] transition-all ${formColor.hex === c.hex ? 'border-[#8D7D7D] dark:border-[#EAEAEA] scale-110 shadow-md' : 'border-transparent'}`} />
                ))}
              </div>

              <div className="flex gap-4">
                {modalConfig.mode === 'edit' && (
                  <button onClick={() => modalConfig.type === 'task' ? deleteTask(modalConfig.target.id) : syncData('common_plans', 'delete', modalConfig.target.id, null, 'jihua_commonPlans', setCommonPlans)(setModalConfig({...modalConfig, isOpen: false}))}
                    className="w-[72px] flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-300 rounded-[24px] hover:bg-red-100 transition-colors">
                    <Trash2 size={22} />
                  </button>
                )}
                <button onClick={() => modalConfig.type === 'task' ? saveTask() : saveCommonPlan()}
                  className="flex-1 py-5 bg-[#CDE7C7] dark:bg-[#4A6D46] text-white rounded-[24px] font-bold uppercase tracking-widest shadow-lg hover:brightness-95 transition-all text-sm">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 模板操作弹窗 */}
        {templateModal.isOpen && (
          <div className="fixed inset-0 bg-[#554D4D]/20 dark:bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setTemplateModal({ ...templateModal, isOpen: false }); }}>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-[#F5F2F2] dark:border-[#333] animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-[#554D4D] dark:text-[#EAEAEA]">{templateModal.mode === 'save' ? '保存今日为模板' : '选择模板导入'}</h3>
                <button onClick={() => setTemplateModal({ ...templateModal, isOpen: false })} className="text-[#AFA4A4]"><X size={20} /></button>
              </div>
              
              {templateModal.mode === 'save' ? (
                <>
                  <input autoFocus value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} placeholder="例如：期末复习日、工作日..."
                    className="w-full text-lg p-5 bg-[#FAF9F9] dark:bg-[#252525] rounded-[20px] outline-none mb-8 font-bold text-[#554D4D] dark:text-[#EAEAEA] border border-transparent focus:border-[#CDE7C7]" />
                  <button onClick={handleSaveTemplate} className="w-full py-5 bg-[#CDE7C7] dark:bg-[#4A6D46] text-white rounded-[24px] font-bold uppercase tracking-widest shadow-lg hover:brightness-95 transition-all text-sm">确认保存</button>
                </>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {templates.length === 0 ? (
                    <p className="text-center text-[#AFA4A4] py-8 text-sm font-bold">暂无已存模板</p>
                  ) : templates.map(tmp => (
                    <div key={tmp.id} className="flex items-center justify-between p-4 bg-[#FAF9F9] dark:bg-[#252525] rounded-[20px] border border-[#F0EBE7] dark:border-[#333]">
                      <div>
                        <div className="font-bold text-[#554D4D] dark:text-[#EAEAEA] text-sm">{tmp.title}</div>
                        <div className="text-[10px] text-[#AFA4A4] mt-1">包含 {tmp.tasks_data.length} 个任务</div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleApplyTemplate(tmp)} className="px-4 py-2 bg-[#CDE7C7] text-white font-bold text-xs rounded-xl hover:brightness-95">导入</button>
                         <button onClick={() => syncData('templates', 'delete', tmp.id, null, 'jihua_templates', setTemplates)} className="p-2 text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;