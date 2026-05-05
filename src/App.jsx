import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, LayoutGrid, Trophy, Trash2, Edit3, X, Check, LogOut, User,
  PieChart, Save, Download, ListTodo, PlusCircle, Sparkles, Wand2, Loader2, Bookmark
} from 'lucide-react';

// --- Supabase 环境配置 ---
const getEnv = (key) => {
  try { return import.meta.env[key]; } catch (e) { return null; }
};
const supabaseUrl = getEnv('https://ncbzklntlyiqvpmezpnk.supabase.co') || 'YOUR_SUPABASE_URL';
const supabaseKey = getEnv('sb_publishable_OsNM8K_bgwUQhGosWMrCfA_Lt4k93DL') || 'YOUR_SUPABASE_ANON_KEY';

// ==========================================
// 🚀 DEEPSEEK API 配置区域
// ==========================================
const DEEPSEEK_API_KEY = "sk-184f5a31a8e841a5abb427a82481a763"; // <--- 在这里替换你的真实 Key

const callDeepSeek = async (prompt, systemPrompt = "") => {
  const url = `https://api.deepseek.com/chat/completions`;
  const payload = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (e) {
    console.error("DeepSeek Error:", e);
    return null;
  }
};
// ==========================================

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
  // --- UI 状态 ---
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [commonPlans, setCommonPlans] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'task', mode: 'add', dateStr: '', target: null });
  const [isMobileCommonOpen, setIsMobileCommonOpen] = useState(false);
  const [isWeekCommonOpen, setIsWeekCommonOpen] = useState(false);

  // 点击连加状态
  const [selectedPlanToPlace, setSelectedPlanToPlace] = useState(null);

  // --- 表单状态 ---
  const [formTitle, setFormTitle] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formTime, setFormTime] = useState('');
  const [formSubtasks, setFormSubtasks] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- AI 灵感状态 ---
  const [aiCoachMsg, setAiCoachCoachMsg] = useState("");
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  // --- Supabase & 离线状态 ---
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isOffline, setIsOffline] = useState(true);

  // 依赖加载
  useEffect(() => {
    if (supabaseUrl !== 'YOUR_SUPABASE_URL' && !window.supabase) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = () => setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
      document.head.appendChild(script);
    } else if (window.supabase) {
      setSupabaseClient(window.supabase.createClient(supabaseUrl, supabaseKey));
    }
    if (!document.getElementById('confetti-script')) {
      const script = document.createElement('script');
      script.id = 'confetti-script';
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
      document.head.appendChild(script);
    }
    document.body.style.backgroundColor = '#FFFBF8'; // 锁定浅色背景
  }, []);

  // --- 音效与动画 ---
  const playDing = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 清脆的A5音
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); 
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio play failed");
    }
  };

  const triggerConfetti = (e) => {
    if (window.confetti) {
      const rect = e?.target?.getBoundingClientRect() || { left: window.innerWidth/2, top: window.innerHeight/2, width: 0, height: 0 };
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      window.confetti({ particleCount: 30, spread: 50, origin: { x, y }, colors: ['#CDE7C7', '#ECC3C9', '#F5ECBE'] });
    }
  };

  // 认证初始化
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

  // 数据同步
  useEffect(() => {
    if (isOffline || !user || !supabaseClient || showAuth) {
      setTasks(JSON.parse(localStorage.getItem('jihua_tasks') || '[]'));
      setCommonPlans(JSON.parse(localStorage.getItem('jihua_commonPlans') || '[]').length > 0 ? JSON.parse(localStorage.getItem('jihua_commonPlans')) : DEFAULT_COMMON_PLANS);
      return;
    }
    const fetchData = async (table, setter, localKey) => {
      const { data, error } = await supabaseClient.from(table).select('*').eq('user_id', user.id);
      if (data && !error) { setter(data); localStorage.setItem(localKey, JSON.stringify(data)); }
    };
    fetchData('tasks', setTasks, 'jihua_tasks');
    fetchData('common_plans', (d) => d.length > 0 ? setCommonPlans(d) : setCommonPlans(DEFAULT_COMMON_PLANS), 'jihua_commonPlans');
  }, [user, showAuth, isOffline, supabaseClient]);

  // 工具函数
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
        if (action === 'delete') n = prev.filter(i => i.id !== id);
        else if (action === 'update') n = prev.map(i => i.id === id ? { ...i, ...payload } : i);
        else if (action === 'insert') n = [...prev, payload];
        localStorage.setItem(localKey, JSON.stringify(n));
        return n;
      });
    }
  };

  const toggleComplete = (id, e, currentStatus) => {
    e.stopPropagation();
    if (!currentStatus) {
      triggerConfetti(e);
      playDing(); // <-- 触发完成音效
    }
    syncData('tasks', 'update', id, { completed: !currentStatus }, 'jihua_tasks', setTasks);
  };

  const openModal = (type, mode, dateStr = '', target = null) => {
    setFormTitle(target ? target.title : '');
    setFormColor(target ? target.color : COLORS[0]);
    setFormTime(target?.time || '');
    setFormSubtasks(target?.subtasks || []);
    setModalConfig({ isOpen: true, type, mode, dateStr, target });
    if (isMobileCommonOpen && type === 'common') setIsMobileCommonOpen(false);
  };

  const saveAction = () => {
    if (!formTitle.trim()) return;
    const isTask = modalConfig.type === 'task';
    const table = isTask ? 'tasks' : 'common_plans';
    const localKey = isTask ? 'jihua_tasks' : 'jihua_commonPlans';
    const setter = isTask ? setTasks : setCommonPlans;
    
    const payload = isTask 
      ? { title: formTitle.trim(), color: formColor, time: formTime, subtasks: formSubtasks }
      : { title: formTitle.trim(), color: formColor };

    if (modalConfig.mode === 'add') {
      const newId = Date.now().toString();
      const fullPayload = isTask ? { id: newId, date: modalConfig.dateStr, completed: false, ...payload } : { id: newId, ...payload };
      syncData(table, 'insert', null, fullPayload, localKey, setter);
    } else {
      syncData(table, 'update', modalConfig.target.id, payload, localKey, setter);
      if (selectedPlanToPlace?.id === modalConfig.target?.id && table === 'common_plans') {
        setSelectedPlanToPlace({ id: modalConfig.target.id, ...payload });
      }
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const deleteAction = () => {
    const isTask = modalConfig.type === 'task';
    const table = isTask ? 'tasks' : 'common_plans';
    const localKey = isTask ? 'jihua_tasks' : 'jihua_commonPlans';
    const setter = isTask ? setTasks : setCommonPlans;
    syncData(table, 'delete', modalConfig.target.id, null, localKey, setter);
    if (table === 'common_plans' && selectedPlanToPlace?.id === modalConfig.target.id) {
      setSelectedPlanToPlace(null);
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const togglePlanSelection = (plan, e) => {
    e.stopPropagation();
    if (selectedPlanToPlace?.id === plan.id) setSelectedPlanToPlace(null);
    else setSelectedPlanToPlace(plan); 
  };

  const handleDateClick = (dateStr) => {
    if (selectedPlanToPlace) {
      const newTask = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        title: selectedPlanToPlace.title,
        date: dateStr,
        color: selectedPlanToPlace.color,
        completed: false,
        time: '',
        subtasks: []
      };
      syncData('tasks', 'insert', null, newTask, 'jihua_tasks', setTasks);
    } else {
      openModal('task', 'add', dateStr);
    }
  };

  // --- ✨ AI 功能 ---
  const handleAiBreakdown = async () => {
    if (!formTitle.trim()) return;
    if (DEEPSEEK_API_KEY === "在这里填入你的DeepSeek_API_KEY") {
       alert("请先在代码第 14 行配置你的 DeepSeek API Key 才能使用 AI 功能哦！");
       return;
    }
    setIsAiLoading(true);
    try {
      const prompt = `请将计划“${formTitle}”拆解为3-5个具体的子步骤。`;
      const system = "你是一个效率专家。请仅返回JSON数组格式的子任务标题，不要有任何其他解释。示例: ['步骤1', '步骤2']";
      const result = await callDeepSeek(prompt, system);
      if(result) {
         const cleanedJson = result.replace(/```json|```/g, "").trim();
         const steps = JSON.parse(cleanedJson);
         if (Array.isArray(steps)) {
           setFormSubtasks(steps.map(s => ({ title: typeof s === 'string' ? s : (s.title || JSON.stringify(s)), completed: false })));
         }
      }
    } catch (e) {
      console.error("AI Breakdown failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchAiCoach = async () => {
    if (DEEPSEEK_API_KEY === "在这里填入你的DeepSeek_API_KEY") {
       alert("请先在代码配置 DeepSeek API Key 才能使用哦！");
       return;
    }
    setIsCoachLoading(true);
    try {
      const dayTasks = tasks.filter(t => t.date === formatDate(currentDate));
      const titles = dayTasks.map(t => t.title).join(", ");
      const prompt = titles ? `我今天的计划有：${titles}。请给我一条鼓励或建议。` : "我今天还没有安排计划，请给我一条开启美好一天的建议。";
      const system = "你是一个温暖、富有洞察力的生活教练。请给出一句简短的反馈（20字以内），语气要可爱亲切。不要使用Markdown符号。";
      const msg = await callDeepSeek(prompt, system);
      if(msg) setAiCoachCoachMsg(msg);
    } catch (e) {
      setAiCoachCoachMsg("即使没有安排，也要记得喝水，保持好心情哦！✨");
    } finally {
      setIsCoachLoading(false);
    }
  };

  // 认证 UI
  const handleEmailAuth = async (e) => {
    e.preventDefault(); setIsLoading(true); setAuthError('');
    try {
      if (!isOtpSent) {
        const { error } = await supabaseClient.auth.signInWithOtp({ email });
        if (error) throw error; setIsOtpSent(true);
      } else {
        const { error } = await supabaseClient.auth.verifyOtp({ email, token: otpCode, type: 'email' });
        if (error) throw error; setShowAuth(false);
      }
    } catch (err) { setAuthError(err.message || '验证码错误或已过期'); }
    finally { setIsLoading(false); }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#FFFBF8] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl border border-[#F0EBE7] text-center">
          <div className="mx-auto mb-6 flex justify-center">
             <img src="/pwa-512x512.png" className="w-20 h-20 rounded-[24px] shadow-lg object-cover" alt="Cat Logo" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-[#554D4D] mb-8">PLANNER</h1>
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 text-left">
            <input type="email" placeholder="邮箱账号" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 bg-[#FAF9F9] rounded-[20px] outline-none font-bold text-sm" />
            {isOtpSent && <input type="text" placeholder="6位验证码" required value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full px-5 py-4 bg-[#FAF9F9] rounded-[20px] outline-none font-bold text-sm text-center tracking-widest" maxLength={6} />}
            <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#CDE7C7] text-white rounded-[20px] font-bold uppercase tracking-widest hover:brightness-95 transition-all">{isLoading ? '加载中...' : (isOtpSent ? '登 录' : '发送验证码')}</button>
          </form>
          {authError && <p className="text-red-400 text-xs mt-4 font-bold">{authError}</p>}
          <button onClick={() => { setIsOffline(true); setShowAuth(false); }} className="mt-6 text-[11px] font-bold text-[#AFA4A4] underline">访客模式体验</button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 视图组件
  // -------------------------------------------------------------

  const MonthView = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const firstDay = first === 0 ? 6 : first - 1;
    const calendarDays = Array(firstDay).fill(null).concat([...Array(days).keys()].map(i => i + 1));
    const paddingDays = (7 - (calendarDays.length % 7)) % 7;
    const fullCalendar = calendarDays.concat(Array(paddingDays).fill(null));

    return (
      <div className="bg-white rounded-[32px] border border-[#F0EBE7] overflow-hidden shadow-sm flex flex-col">
        <div className="grid grid-cols-7 border-b border-[#F0EBE7] bg-[#FAF9F9]">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d} className="text-center text-[11px] font-black text-[#AFA4A4] py-4">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-[#F0EBE7]">
          {fullCalendar.map((day, idx) => {
            const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
            const dateStr = date ? formatDate(date) : '';
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = day && formatDate(new Date()) === dateStr;

            return (
              <div key={idx} onClick={() => date && handleDateClick(dateStr)}
                className={`min-h-[120px] md:min-h-[150px] p-0 flex flex-col border-r border-b border-[#F0EBE7] transition-all ${day ? 'bg-white hover:bg-[#FAF9F9] cursor-pointer' : 'bg-[#FAF9F9]'}`}>
                <div className="p-1.5 flex justify-center md:justify-start">
                   {day && <span className={`text-[12px] md:text-[14px] font-black w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#CDE7C7] text-white shadow-sm' : 'text-[#8D7D7D]'}`}>{day}</span>}
                </div>
                {/* ✨ 无间隙横条设计：填满格子，带完成按钮 */}
                <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar w-full">
                  {dayTasks.map(t => (
                    <div key={t.id} onClick={(e) => { e.stopPropagation(); openModal('task', 'edit', t.date, t); }} 
                      className={`group flex items-start px-1 py-[3px] md:py-1 w-full text-left ${t.color.bg} ${t.color.text} font-bold hover:brightness-95 transition-all whitespace-normal break-words leading-tight ${t.completed ? 'opacity-40 grayscale' : ''}`}>
                      <button onClick={(e) => toggleComplete(t.id, e, t.completed)} className="shrink-0 w-3 h-3 mt-0.5 mr-1 flex items-center justify-center opacity-70 group-hover:opacity-100">
                        {t.completed ? <Check size={10} strokeWidth={4} /> : <div className={`w-1.5 h-1.5 rounded-full ${t.color.dot}`} />}
                      </button>
                      <span className={`text-[9px] md:text-[10px] flex-1 ${t.completed ? 'line-through' : ''}`}>{t.title}</span>
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
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-end mb-1">
          <button onClick={() => setIsWeekCommonOpen(!isWeekCommonOpen)} 
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#F0EBE7] shadow-sm text-xs font-bold text-[#AFA4A4] hover:text-[#554D4D] transition-all">
            <Bookmark size={14}/>
            {isWeekCommonOpen ? '隐藏常用计划' : '展开常用计划'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start w-full transition-all duration-300">
          <div className="flex-1 bg-white rounded-[32px] border border-[#F0EBE7] overflow-hidden shadow-sm flex flex-col w-full">
            {weekDays.map((date, idx) => {
              const dateStr = formatDate(date);
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = formatDate(new Date()) === dateStr;
              return (
                <div key={idx} onClick={() => handleDateClick(dateStr)}
                  className={`flex flex-row min-h-[80px] border-b border-[#F0EBE7] last:border-0 cursor-pointer transition-colors ${isToday ? 'bg-[#F6FBF6]' : 'hover:bg-[#FAF9F9]'}`}>
                  
                  <div className={`w-[70px] md:w-[90px] p-3 md:p-4 flex flex-col justify-center items-center border-r border-[#F0EBE7] shrink-0 ${isToday ? 'text-[#5E7D5A]' : 'text-[#8D7D7D]'}`}>
                    <span className="text-xl md:text-2xl font-black leading-none">{date.getDate()}</span>
                    <span className="text-[10px] md:text-xs font-bold mt-1 uppercase">周{['一', '二', '三', '四', '五', '六', '日'][idx]}</span>
                  </div>

                  <div className="flex-1 p-3 md:p-4 flex flex-col gap-2 justify-center">
                    {dayTasks.map(t => (
                      <div key={t.id} onClick={(e) => { e.stopPropagation(); openModal('task', 'edit', t.date, t); }}
                        className={`flex items-start gap-2 group ${t.completed ? 'opacity-40 line-through' : ''}`}>
                        <button onClick={(e) => toggleComplete(t.id, e, t.completed)} className="shrink-0 w-4 h-4 mt-0.5 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                          {t.completed ? <Check size={10} strokeWidth={4} className="text-[#CDE7C7]"/> : <div className={`w-1.5 h-1.5 rounded-full ${t.color.dot}`} />}
                        </button>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                           <span className={`text-xs md:text-sm font-bold px-2 py-1 rounded-[6px] ${t.color.bg} ${t.color.text} break-words whitespace-normal leading-tight shadow-sm transition-all hover:brightness-95`}>
                             {t.title}
                           </span>
                           {/* ✨ 显示时间 */}
                           {t.time && <span className="text-[10px] font-bold text-[#AFA4A4] flex items-center gap-1"><Clock size={10}/> {t.time}</span>}
                        </div>
                      </div>
                    ))}
                    {dayTasks.length === 0 && <span className="text-[10px] text-[#D1C7C7] font-bold">+ 点击添加计划</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {isWeekCommonOpen && (
            <div className="w-full md:w-[240px] bg-white rounded-[32px] border border-[#F0EBE7] p-5 shadow-sm flex flex-col gap-4 shrink-0 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between border-b border-[#F0EBE7] pb-3">
                <h3 className="text-sm font-black text-[#554D4D]">常用计划库</h3>
                <button onClick={() => openModal('common', 'add')} className="text-[#AFA4A4] hover:text-[#554D4D]"><Plus size={16}/></button>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] no-scrollbar">
                {commonPlans.length === 0 && <span className="text-xs text-gray-400 py-4 text-center">暂无常用计划</span>}
                {commonPlans.map(p => (
                  <div key={p.id} onClick={(e) => togglePlanSelection(p, e)}
                    className={`p-3 rounded-[16px] border flex items-center gap-2 cursor-pointer transition-all ${selectedPlanToPlace?.id === p.id ? 'bg-[#F5ECBE] border-[#8D825A]' : 'bg-[#FAF9F9] border-transparent hover:border-[#F0EBE7]'}`}>
                     <div className={`w-2 h-2 rounded-full shrink-0 ${p.color.dot}`}></div>
                     <span className="text-xs font-bold truncate flex-1">{p.title}</span>
                     <button onClick={(e) => { e.stopPropagation(); openModal('common', 'edit', '', p); }} className="opacity-0 group-hover:opacity-100 text-[#AFA4A4] hover:text-[#554D4D]"><Edit3 size={12}/></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[9px] text-[#AFA4A4] bg-[#FAF9F9] p-2 rounded-xl text-center">
                点击选中一个计划<br/>然后在左侧日历点击添加
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DayView = () => {
    const dateStr = formatDate(currentDate);
    const dayTasks = tasks.filter(t => t.date === dateStr);
    return (
      <div className="max-w-3xl mx-auto w-full bg-white rounded-[48px] p-8 md:p-14 shadow-sm border border-[#F0EBE7]">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#CDE7C7] rounded-[28px] md:rounded-[32px] flex flex-col items-center justify-center text-white shadow-xl rotate-3">
              <span className="text-[10px] md:text-[12px] font-black opacity-90 uppercase tracking-widest">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()]}</span>
              <span className="text-3xl md:text-4xl font-black mt-1">{currentDate.getDate()}</span>
            </div>
            <div>
              <h2 className="text-[26px] md:text-[32px] font-black text-[#554D4D] leading-tight">今日焦点</h2>
              <p className="text-[#AFA4A4] font-black text-[12px] md:text-[14px] mt-1 tracking-widest uppercase">{currentDate.getFullYear()} / {currentDate.getMonth() + 1}</p>
            </div>
          </div>
          <button onClick={() => handleDateClick(dateStr)} className="w-14 h-14 md:w-16 md:h-16 bg-[#F6EDE7] text-[#8D7D7D] rounded-[24px] flex items-center justify-center hover:scale-110 shadow-inner transition-all">
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
        
        <div className="space-y-4 md:space-y-6">
          {dayTasks.map(t => (
            <div key={t.id} onClick={() => openModal('task', 'edit', t.date, t)}
              className={`group flex flex-col p-6 md:p-8 rounded-[28px] md:rounded-[32px] border-l-[8px] md:border-l-[10px] ${t.color.border.replace('border-', 'border-l-')} ${t.color.bg.replace('bg-', 'bg-opacity-20 bg-')} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer border border-y-[#F0EBE7] border-r-[#F0EBE7]`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 md:gap-6 flex-1">
                  <button onClick={(e) => toggleComplete(t.id, e, t.completed)} className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${t.color.border} flex items-center justify-center transition-all ${t.completed ? t.color.text.replace('text-', 'bg-') : 'bg-white'}`}>
                    {t.completed ? <Check size={18} strokeWidth={4} className="text-white" /> : <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${t.color.dot}`} />}
                  </button>
                  <div className="flex flex-col gap-1.5">
                     <span className={`text-[18px] md:text-[22px] font-black text-[#554D4D] break-words whitespace-normal leading-tight ${t.completed ? 'line-through opacity-30' : ''}`}>{t.title}</span>
                     {/* ✨ 显示时间 */}
                     {t.time && (
                       <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md w-fit ${t.completed ? 'opacity-30' : 'bg-[#FAF9F9] text-[#AFA4A4]'}`}>
                         <Clock size={12}/> {t.time}
                       </span>
                     )}
                  </div>
                </div>
              </div>
              {t.subtasks?.length > 0 && (
                <div className="ml-12 md:ml-16 mt-4 space-y-2">
                  {t.subtasks.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] md:text-xs font-bold opacity-60">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.completed ? 'bg-[#CDE7C7]' : 'bg-[#D1C7C7]'}`} />
                      <span className={s.completed ? 'line-through' : ''}>{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {dayTasks.length === 0 && <div className="py-20 md:py-24 text-center opacity-30 flex flex-col items-center gap-6"><Trophy size={64} strokeWidth={1} /><p className="font-black tracking-[0.2em] text-sm md:text-lg uppercase">Wonderful! No plans</p></div>}
        </div>
      </div>
    );
  };

  const StatsView = () => {
    const total = tasks.length, completed = tasks.filter(t => t.completed).length, rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return (
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white p-10 md:p-12 rounded-[48px] border border-[#F0EBE7] shadow-sm flex flex-col items-center justify-center py-16 md:py-20">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[12px] md:border-[15px] border-[#F6EDE7] flex items-center justify-center relative mb-8">
            <div className="absolute inset-0 rounded-full border-[12px] md:border-[15px] border-[#CDE7C7] transition-all duration-1000" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${rate}%, 0 ${rate}%)` }}></div>
            <span className="text-4xl md:text-5xl font-black text-[#554D4D]">{rate}%</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#554D4D]">计划完成率</h2>
          <p className="text-[#AFA4A4] font-black mt-3 tracking-widest uppercase text-xs md:text-sm">Completed: {completed} / Total: {total}</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="min-h-screen bg-[#FFFBF8] text-[#554D4D] font-sans flex flex-col md:flex-row transition-colors duration-300">
        
        {/* 全局连加放置模式提示条 */}
        {selectedPlanToPlace && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#554D4D] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <span className="text-xs md:text-sm font-bold flex items-center gap-2">
              <Wand2 size={16}/> 👉 正在连续放置：「{selectedPlanToPlace.title}」
            </span>
            <button onClick={() => setSelectedPlanToPlace(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2 border border-white/30">
              <X size={14}/>
            </button>
          </div>
        )}

        {/* 桌面端侧边栏 */}
        <aside className="hidden md:flex w-[280px] bg-white border-r border-[#F0EBE7] py-10 px-6 flex-col gap-10 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <img src="/pwa-512x512.png" className="w-12 h-12 rounded-[16px] shadow-sm object-cover" alt="Cat Logo" />
            <div>
              <h1 className="text-xl font-black italic leading-none">PLANNER</h1>
              <p className="text-[9px] font-bold tracking-widest text-[#AFA4A4] uppercase mt-1">DEEPSEEK EDITION</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {[
              { id: 'day', icon: Clock, label: '今日视图' },
              { id: 'week', icon: LayoutGrid, label: '本周规划' },
              { id: 'month', icon: CalendarIcon, label: '月度总览' },
              { id: 'stats', icon: PieChart, label: '数据看板' },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all font-bold text-[14px] ${view === item.id ? 'bg-[#F5ECBE] text-[#8D825A] shadow-sm' : 'text-[#AFA4A4] hover:bg-[#FAF9F9]'}`}>
                <item.icon size={20} strokeWidth={view === item.id ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-[#AFA4A4] tracking-widest uppercase">常用计划</h3>
              <button onClick={() => openModal('common', 'add')} className="text-[#AFA4A4] hover:text-[#554D4D] transition-colors"><Plus size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar pb-4">
              {commonPlans.map(p => (
                <div key={p.id} onClick={(e) => togglePlanSelection(p, e)}
                  className={`group p-4 rounded-[24px] border flex items-center gap-3 transition-all cursor-pointer shadow-sm ${selectedPlanToPlace?.id === p.id ? 'bg-[#F5ECBE] border-[#8D825A]' : 'bg-white border-[#F0EBE7] hover:border-[#E5B5BC]'}`}>
                  <div className={`w-2 h-2 rounded-full ${p.color.dot}`}></div>
                  <span className="text-[13px] font-bold truncate flex-1">{p.title}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); openModal('common', 'edit', '', p); }} className="p-1 text-[#AFA4A4] hover:text-[#8D7D7D]"><Edit3 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#F0EBE7] flex justify-between items-center text-[#AFA4A4]">
            <div className="flex items-center gap-2 text-[10px] font-bold max-w-[120px] truncate"><User size={14} />{isOffline ? 'OFFLINE' : user?.email?.split('@')[0]}</div>
            <div className="flex gap-3">
              <button onClick={async () => { if (supabaseClient) await supabaseClient.auth.signOut(); setShowAuth(true); }} className="hover:text-[#8D7D7D] transition-colors"><LogOut size={18}/></button>
            </div>
          </div>
        </aside>

        {/* 手机端底部 App 导航栏 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#F0EBE7] z-40 px-6 py-3 pb-safe flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
          {[
            { id: 'day', icon: Clock, label: '今日' },
            { id: 'week', icon: LayoutGrid, label: '本周' },
            { id: 'month', icon: CalendarIcon, label: '月度' },
            { id: 'stats', icon: PieChart, label: '看板' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center gap-1.5 transition-all ${view === item.id ? 'text-[#839E7B] scale-110' : 'text-[#AFA4A4] hover:text-[#8D7D7D]'}`}>
              <item.icon size={22} strokeWidth={view === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-black">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setIsMobileCommonOpen(true)} className={`flex flex-col items-center gap-1.5 transition-all ${selectedPlanToPlace ? 'text-[#839E7B] scale-110 animate-pulse' : 'text-[#AFA4A4] hover:text-[#8D7D7D]'}`}>
             <Bookmark size={22} strokeWidth={2} />
             <span className="text-[10px] font-black">常用</span>
          </button>
        </nav>

        {/* 主内容区 */}
        <main className="flex-1 p-4 md:p-10 flex flex-col gap-6 overflow-y-auto pb-28 md:pb-10 transition-all">
          <header className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
               <div className="flex bg-white rounded-full shadow-sm border border-[#F0EBE7] p-1">
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    if (view === 'month') d.setMonth(d.getMonth() - 1); else if (view === 'week') d.setDate(d.getDate() - 7); else d.setDate(d.getDate() - 1);
                    setCurrentDate(d);
                  }} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-[#AFA4A4] hover:bg-[#F6EDE7] rounded-full"><ChevronLeft size={20}/></button>
                  <button onClick={() => {
                    const d = new Date(currentDate);
                    if (view === 'month') d.setMonth(d.getMonth() + 1); else if (view === 'week') d.setDate(d.getDate() + 7); else d.setDate(d.getDate() + 1);
                    setCurrentDate(d);
                  }} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-[#AFA4A4] hover:bg-[#F6EDE7] rounded-full"><ChevronRight size={20}/></button>
               </div>
               <h2 className="text-xl md:text-3xl font-black tracking-tight">
                 {currentDate.getFullYear()}/{String(currentDate.getMonth() + 1).padStart(2, '0')}
                 {view === 'day' && <span className="text-[#AFA4A4]"> / {currentDate.getDate()}</span>}
               </h2>
            </div>
            <div className="flex items-center gap-3 z-10">
              {/* ✨ 手机端极简的重新登录按钮 */}
              {isOffline && (
                <button onClick={() => setShowAuth(true)} className="md:hidden p-2.5 text-[#AFA4A4] bg-white border border-[#F0EBE7] rounded-full shadow-sm hover:text-[#554D4D]">
                  <User size={16}/>
                </button>
              )}
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 md:px-6 md:py-2.5 bg-white border border-[#F0EBE7] rounded-full font-bold text-[#AFA4A4] text-xs shadow-sm hover:brightness-95 transition-all">Today</button>
            </div>
          </header>

          {/* ✨ AI 智能教练挂件 */}
          {view === 'day' && (
            <div className="w-full bg-[#F6FBF6] p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-[#CDE7C7] shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#CDE7C7] rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  {isCoachLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[11px] md:text-[12px] font-black text-[#5E7D5A] tracking-widest uppercase">✨ DeepSeek 灵感</h4>
                    {!aiCoachMsg && !isCoachLoading && (
                      <button onClick={fetchAiCoach} className="text-[10px] font-bold text-[#5E7D5A] underline">获取建议</button>
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[#554D4D] leading-relaxed italic">
                    {isCoachLoading ? "DeepSeek 正在分析你的日程..." : (aiCoachMsg || "点击右侧魔法棒，让我为你提供今日能量！✨")}
                  </p>
                </div>
                {aiCoachMsg && (
                  <button onClick={fetchAiCoach} className="p-2 text-[#CDE7C7] hover:rotate-180 transition-transform duration-500"><Wand2 size={16} /></button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1">
            {view === 'month' && <MonthView />}
            {view === 'week' && <WeekView />}
            {view === 'day' && <DayView />}
            {view === 'stats' && <StatsView />}
          </div>
        </main>

        {/* ---------------- 弹窗区域 ---------------- */}
        {modalConfig.isOpen && (
          <div className="fixed inset-0 bg-[#554D4D]/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6"
            onClick={(e) => e.target === e.currentTarget && setModalConfig({ ...modalConfig, isOpen: false })}>
            <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 w-full max-w-md shadow-2xl border border-[#F5F2F2] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-black text-[#554D4D]">
                  {modalConfig.mode === 'add' ? (modalConfig.type === 'task' ? '新计划' : '新增常用') : '修改计划'}
                </h3>
                <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="text-[#AFA4A4] bg-[#FAF9F9] p-2 rounded-full hover:text-[#554D4D]"><X size={18} /></button>
              </div>

              <input autoFocus value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="准备做什么？"
                className="w-full text-lg md:text-xl p-5 bg-[#FAF9F9] rounded-[20px] outline-none mb-6 font-bold text-[#554D4D] border border-transparent focus:border-[#CDE7C7] transition-all" />

              {modalConfig.type === 'task' && (
                <>
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#AFA4A4]" />
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                        className="bg-[#FAF9F9] px-3 py-2 rounded-[12px] font-bold text-xs outline-none" />
                    </div>
                    <button onClick={handleAiBreakdown} disabled={isAiLoading || !formTitle.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#F5ECBE] text-[#8D825A] rounded-[12px] font-bold text-xs hover:scale-105 transition-all disabled:opacity-50">
                      {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}✨ DeepSeek 拆解
                    </button>
                  </div>

                  <div className="mb-6 px-1">
                    <div className="flex items-center gap-2 mb-2 text-[#AFA4A4] font-black text-[10px] uppercase tracking-widest"><ListTodo size={12}/> 子步骤</div>
                    <div className="space-y-2">
                      {formSubtasks.map((st, i) => (
                        <div key={i} className="flex gap-2 items-center bg-[#FAF9F9] p-2 rounded-[14px] border border-transparent hover:border-[#F0EBE7]">
                          <button onClick={() => setFormSubtasks(prev => prev.map((s, idx) => idx === i ? {...s, completed: !s.completed} : s))}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${st.completed ? 'bg-[#CDE7C7] border-[#CDE7C7] text-white' : 'border-[#D1C7C7] bg-white'}`}>
                            {st.completed && <Check size={12} strokeWidth={4}/>}
                          </button>
                          <input value={st.title} onChange={(e) => setFormSubtasks(prev => prev.map((s, idx) => idx === i ? {...s, title: e.target.value} : s))}
                            className={`flex-1 bg-transparent outline-none text-xs font-bold ${st.completed ? 'line-through opacity-40' : ''}`} placeholder="描述步骤..." />
                          <button onClick={() => setFormSubtasks(prev => prev.filter((_, idx) => idx !== i))} className="text-[#D1C7C7] hover:text-red-400 p-1"><X size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => setFormSubtasks(prev => [...prev, { title: '', completed: false }])}
                        className="text-[11px] font-bold text-[#AFA4A4] hover:text-[#8D7D7D] flex items-center gap-1 mt-2 px-1">
                        <PlusCircle size={12}/> 添加一步
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between mb-8 no-scrollbar px-1">
                {COLORS.map(c => (
                  <button key={c.name} onClick={() => setFormColor(c)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 ${c.bg} border-[3px] transition-all ${formColor.hex === c.hex ? 'border-[#8D7D7D] scale-110 shadow-md' : 'border-transparent'}`} />
                ))}
              </div>

              <div className="flex gap-3">
                {modalConfig.mode === 'edit' && (
                  <button onClick={deleteAction} className="w-14 md:w-[72px] flex items-center justify-center bg-red-50 text-red-300 rounded-[20px] hover:bg-red-100 transition-colors">
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={saveAction} className="flex-1 py-4 bg-[#CDE7C7] text-white rounded-[20px] font-black uppercase tracking-widest shadow-lg hover:brightness-95 transition-all text-xs md:text-sm">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 手机端: 常用计划专属底部面板 */}
        {isMobileCommonOpen && (
          <div className="fixed inset-0 bg-[#554D4D]/30 backdrop-blur-sm z-[100] flex items-end md:hidden" onClick={(e) => e.target === e.currentTarget && setIsMobileCommonOpen(false)}>
            <div className="bg-white w-full rounded-t-[32px] p-6 pb-12 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-[#554D4D] text-lg">常用计划库</h3>
                <div className="flex gap-2">
                  <button onClick={() => openModal('common', 'add')} className="p-2 bg-[#F6EDE7] rounded-full text-[#8D7D7D]"><Plus size={16} strokeWidth={3}/></button>
                  <button onClick={() => setIsMobileCommonOpen(false)} className="p-2 bg-[#FAF9F9] rounded-full text-[#AFA4A4]"><X size={16} strokeWidth={3}/></button>
                </div>
              </div>
              <div className="overflow-y-auto space-y-3 no-scrollbar flex-1">
                {commonPlans.length === 0 ? <p className="text-center text-xs text-[#AFA4A4] py-10 font-bold">空空如也，点右上角添加吧</p> : null}
                {commonPlans.map(p => (
                  <div key={p.id} onClick={(e) => { togglePlanSelection(p, e); setIsMobileCommonOpen(false); }}
                    className={`flex items-center justify-between p-4 rounded-[20px] border shadow-sm active:scale-95 transition-all cursor-pointer ${selectedPlanToPlace?.id === p.id ? 'bg-[#F5ECBE] border-[#8D825A]' : 'bg-[#FAF9F9] border-[#F0EBE7]'}`}>
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${p.color.dot}`}></div>
                      <span className="font-bold text-[#554D4D] text-sm truncate">{p.title}</span>
                      {selectedPlanToPlace?.id === p.id ? (
                        <span className="text-[10px] text-white bg-[#554D4D] px-3 py-1 rounded-full shadow-sm ml-auto shrink-0 animate-pulse">取消选中</span>
                      ) : (
                        <span className="text-[10px] text-[#AFA4A4] bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm ml-auto shrink-0">点击选中</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-3 ml-2 border-l border-[#EFEBE7]">
                      <button onClick={(e) => { e.stopPropagation(); openModal('common', 'edit', '', p); }} className="text-[#AFA4A4] hover:text-[#8D7D7D] p-1"><Edit3 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-[11px] text-[#AFA4A4] font-bold">
                💡 选中计划后，在日历上点哪里就加到哪里
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://gs.jurieo.com/gemini/fonts-googleapis/css2?family=Quicksand:wght@600;700;900&display=swap');
        body { font-family: 'Quicksand', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      ` }} />
    </div>
  );
};

export default App;