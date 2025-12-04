import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Activity, Shield, AlertTriangle, Share2, Download, Mail, ArrowRight, Layers, Lock, RefreshCw, Plus, Trash2, CheckCircle, XCircle, Wallet, FileText, Database, Import, Copy } from 'lucide-react';

/**
 * coeff.io - Portfolio Risk & Correlation Analyzer
 * VERSION: Production v2.21 (Rebrand: "The Indigo Engine" Logo)
 */

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-950 border border-slate-800 rounded-lg p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

// --- BRAND ASSET: THE INDIGO ENGINE LOGO ---
const CoeffLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4f46e5" /> {/* Indigo 600 */}
        <stop offset="1" stopColor="#1e1b4b" /> {/* Indigo 950 */}
      </linearGradient>
    </defs>
    
    {/* App Icon Container with Gradient */}
    <rect width="40" height="40" rx="10" fill="url(#logoGradient)" />
    
    {/* The Correlation Link */}
    <path d="M12 28L28 12" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.5"/>
    
    {/* Asset A (Cyan - Tech/Cold) */}
    <circle cx="12" cy="28" r="5" fill="#22d3ee" />
    
    {/* Asset B (Amber - Value/Hot) */}
    <circle cx="28" cy="12" r="5" fill="#fbbf24" />
  </svg>
);

const XLogo = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PROXY_URL = "https://coeff-data-proxy.wrighttim.workers.dev"; 
const MAX_ASSETS = 10;

// --- MATH UTILS ---
const getCorrelation = (x, y) => {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const den = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0) * y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
  return den === 0 ? 0 : num / den;
};

const getCurrencySymbol = (isoCode) => {
    if (!isoCode) return '$';
    const map = { 'USD': '$', 'GBP': '£', 'EUR': '€', 'JPY': '¥', 'CNY': '¥' };
    return map[isoCode] || isoCode;
};

const DEFAULT_ASSETS = [
  { ticker: 'BTCUSD', weight: 40 },
  { ticker: 'ETHUSD', weight: 30 },
  { ticker: 'AMD', weight: 30 },
];

export default function CoeffRiskAnalyzer() {
  const [apiKey, setApiKey] = useState("");
  const [assets, setAssets] = useState(DEFAULT_ASSETS);
  const [benchmark, setBenchmark] = useState("SPY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [email, setEmail] = useState("");
  const [formStatus, setFormStatus] = useState("idle"); 
  const [walletAddress, setWalletAddress] = useState("");
  const [dataQualityMsg, setDataQualityMsg] = useState("");
  const [latestPrices, setLatestPrices] = useState({}); 
  const [copyStatus, setCopyStatus] = useState("idle");

  const totalWeight = useMemo(() => assets.reduce((sum, a) => sum + (a.weight || 0), 0), [assets]);
  const isWeightError = totalWeight > 100;
  const isMaxAssets = assets.length >= MAX_ASSETS;

  useEffect(() => {
    if (!PROXY_URL) {
        const params = new URLSearchParams(window.location.search);
        const urlKey = params.get('key');
        const localKey = localStorage.getItem('coeff_fmp_key');
        if (urlKey) { setApiKey(urlKey); window.history.replaceState({}, document.title, "/"); }
        else if (localKey) setApiKey(localKey);
    }
  }, []);

  const saveKey = (val) => { setApiKey(val); localStorage.setItem('coeff_fmp_key', val); };
  
  const updateAsset = (i, f, v) => { 
      const n = [...assets]; 
      n[i][f] = f === 'weight' ? Number(v) : v.toUpperCase(); 
      setAssets(n); 
  };
  
  const addAsset = () => {
      if (assets.length < MAX_ASSETS) {
          setAssets([...assets, { ticker: '', weight: 0 }]);
      }
  };

  const removeAsset = (i) => setAssets(assets.filter((_, idx) => idx !== i));

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try { const a = await window.ethereum.request({ method: 'eth_requestAccounts' }); setWalletAddress(a[0]); } catch (e) { console.error(e); }
    } else {
      const useDemo = window.confirm("No Web3 Wallet detected. Simulate a connected wallet?");
      if (useDemo) setWalletAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
    }
  };

  const importFromWallet = async () => {
      if (!walletAddress) {
          await connectWallet();
          return;
      }
      
      setIsProcessing(true);
      setTimeout(() => {
          const simulatedHoldings = [
              { ticker: "BTCUSD", value: 50000 },
              { ticker: "ETHUSD", value: 30000 },
              { ticker: "SOLUSD", value: 15000 },
              { ticker: "XRPUSD", value: 8000 },
              { ticker: "ADAUSD", value: 5000 },
              { ticker: "DOTUSD", value: 2000 },
              { ticker: "LINKUSD", value: 1000 },
              { ticker: "DOGEUSD", value: 500 },
              { ticker: "PEPEUSD", value: 10 }, 
              { ticker: "SHIBUSD", value: 5 },  
          ];

          const sorted = simulatedHoldings.sort((a, b) => b.value - a.value).slice(0, MAX_ASSETS);
          const meaningful = sorted.filter(item => item.value > 100);
          const totalVal = meaningful.reduce((sum, item) => sum + item.value, 0);
          
          const normalizedAssets = meaningful.map(item => ({
              ticker: item.ticker,
              weight: Number(((item.value / totalVal) * 100).toFixed(1))
          }));

          setAssets(normalizedAssets);
          setIsProcessing(false);
          alert(`Imported ${normalizedAssets.length} crypto assets from wallet.\n\nYou have ${MAX_ASSETS - normalizedAssets.length} slots remaining.`);
      }, 800);
  };

  const formatAddress = (addr) => `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { alert("Invalid email."); return; }
    setFormStatus("submitting");
    const ACCESS_KEY = "c8dcbf23-8df8-429d-988f-656351726d99"; 
    try {
        await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_key: ACCESS_KEY, email, message: "Waitlist Signup" })
        });
        setFormStatus("success");
    } catch { setFormStatus("error"); }
  };

  const handleExportPDF = () => window.print();
  const handleShareTwitter = () => {
    if (!results) return;
    const text = `My Portfolio Fragility Score: ${results.fragilityScore}/100 🚨\nBenchmark Beta: ${results.beta}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=https://coeff.io`, '_blank');
  };

  const handleCopyData = async () => {
    if (!results) return;

    const portfolioStr = assets.map(a => {
        const price = latestPrices[a.ticker];
        const priceStr = price 
            ? `${getCurrencySymbol(price.currency)}${price.price.toLocaleString('en-US', {minimumFractionDigits: 2})}` 
            : "";
        return `- ${a.ticker}: ${a.weight}% ${priceStr ? `(${priceStr})` : ''}`;
    }).join("\n");

    const tickers = assets.map(a => a.ticker);
    let matrixStr = "      " + tickers.map(t => t.substring(0,4).padEnd(6)).join(""); 
    results.matrix.forEach((row, i) => {
        matrixStr += "\n" + tickers[i].substring(0,4).padEnd(6) + row.map(v => v.toFixed(2).padEnd(6)).join("");
    });

    const textToCopy = `coeff.io Risk Report

⚠️ Fragility Score: ${results.fragilityScore}/100
📈 Benchmark Beta: ${results.beta} (vs ${benchmark})

PORTFOLIO:
${portfolioStr}

CORRELATION MATRIX:
${matrixStr}

Analyze this data at https://coeff.io`;

    try {
        await navigator.clipboard.writeText(textToCopy);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
        console.error("Copy failed", err);
        alert("Failed to copy to clipboard");
    }
  };

  // --- ANALYSIS ENGINE ---
  const runAnalysis = async () => {
    if (isWeightError) { alert("Total allocation cannot exceed 100%."); return; }
    if (!PROXY_URL && !apiKey) { alert("Missing API Key"); return; }
    
    setIsProcessing(true);
    setResults(null);
    setDataQualityMsg("");

    try {
      const tickers = [...assets.map(a => a.ticker), benchmark];
      
      const requests = tickers.map(t => {
          if (PROXY_URL) {
              return fetch(`${PROXY_URL}?ticker=${t}`).then(r => r.ok ? r.json() : { error: true });
          } else {
              return fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${t}?apikey=${apiKey}`).then(r => r.json());
          }
      });
      
      const responses = await Promise.all(requests);
      
      const priceMaps = {};
      let commonDates = new Set();
      let firstPass = true;
      let isUsingSynthetic = false;
      const fetchedPrices = {};

      responses.forEach((res, i) => {
          const ticker = tickers[i];
          let hist = [];

          if (res && res.meta) {
             if (res.meta.isSynthetic) isUsingSynthetic = true;
             fetchedPrices[ticker] = {
                 price: res.meta.currentPrice,
                 currency: res.meta.currency
             };
          }

          if (res && Array.isArray(res)) hist = res; 
          else if (res && res.historical && Array.isArray(res.historical)) hist = res.historical;
          
          if (!hist || hist.length === 0) throw new Error(`No data for ${ticker}`);

          if (!fetchedPrices[ticker] && hist.length > 0) {
               fetchedPrices[ticker] = { price: hist[0].close, currency: 'USD' };
          }

          const map = new Map();
          const dates = new Set();

          hist.forEach(day => {
             const d = day.date.split('T')[0]; 
             map.set(d, day.close);
             dates.add(d);
          });

          priceMaps[ticker] = map;

          if (firstPass) { commonDates = dates; firstPass = false; } 
          else { commonDates = new Set([...commonDates].filter(d => dates.has(d))); }
      });

      setLatestPrices(fetchedPrices);
      if (isUsingSynthetic) setDataQualityMsg("⚠️ Demo Mode: Using simulated data (API Limit)");

      const sortedDates = Array.from(commonDates).sort().reverse().slice(0, 100);
      if (sortedDates.length < 30) throw new Error(`Insufficient data overlap.`);

      const alignedReturns = {};
      tickers.forEach(t => {
          const prices = sortedDates.map(d => priceMaps[t].get(d));
          const returns = [];
          for(let i=0; i < prices.length - 1; i++) {
              const pToday = prices[i];
              const pYesterday = prices[i+1];
              if (pYesterday === 0) returns.push(0);
              else returns.push((pToday - pYesterday) / pYesterday);
          }
          alignedReturns[t] = returns;
      });

      const matrix = [];
      assets.forEach(a1 => {
        const row = [];
        assets.forEach(a2 => {
          const corr = getCorrelation(alignedReturns[a1.ticker], alignedReturns[a2.ticker]);
          row.push(corr);
        });
        matrix.push(row);
      });

      const portfolioReturns = alignedReturns[tickers[0]].map((_, i) => {
        return assets.reduce((sum, asset) => {
          const r = alignedReturns[asset.ticker][i] || 0;
          return sum + (r * (asset.weight / 100));
        }, 0);
      });
      
      const benchRetStream = alignedReturns[benchmark];
      const correlationPM = getCorrelation(portfolioReturns, benchRetStream);
      
      const stdDev = (arr) => {
          const mean = arr.reduce((a,b) => a+b, 0) / arr.length;
          return Math.sqrt(arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / arr.length);
      };
      
      const sigmaP = stdDev(portfolioReturns);
      const sigmaM = stdDev(benchRetStream);
      const beta = correlationPM * (sigmaP / sigmaM);

      let weightedSum = 0;
      let weightsSum = 0;
      let count = 0;

      for(let i=0; i<assets.length; i++) {
        for(let j=i+1; j<assets.length; j++) {
            const w_i = assets[i].weight / 100;
            const w_j = assets[j].weight / 100;
            const corr = matrix[i][j];
            
            if (w_i > 0 && w_j > 0) {
                weightedSum += (w_i * w_j * corr);
                weightsSum += (w_i * w_j);
                count++;
            }
        }
      }

      let avgCorr = 0;
      if (count === 0) avgCorr = 1; 
      else if (weightsSum > 0) avgCorr = weightedSum / weightsSum;
      
      const riskCurve = avgCorr > 0 ? Math.sqrt(avgCorr) : 0;
      const fragilityScore = Math.min(Math.max((riskCurve * 100), 0), 100).toFixed(0);

      setResults({
        matrix,
        beta: beta.toFixed(2),
        fragilityScore,
        avgCorr: avgCorr.toFixed(2)
      });

    } catch (e) {
      console.error(e);
      alert(`Analysis Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getHeatmapColor = (value) => {
    if (value > 0) return `rgba(244, 63, 94, ${value})`;
    return `rgba(99, 102, 241, ${Math.abs(value)})`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400 font-sans selection:bg-indigo-500/30">
      
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: #020617 !important; color: #94a3b8 !important; zoom: 0.65; }
          nav, button, .no-print { display: none !important; }
          input { display: block !important; background-color: transparent !important; border: none !important; color: #cbd5e1 !important; padding: 0 !important; font-weight: 600; }
          .recharts-wrapper { background-color: #020617 !important; }
          .bg-slate-950 { background-color: #020617 !important; border: 1px solid #1e293b !important; break-inside: avoid; margin-bottom: 1rem; }
          main { padding: 0 !important; margin: 0 !important; }
          .text-center.mb-12 { margin-bottom: 2rem !important; }
        }
      `}</style>

      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-1.5 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <CoeffLogo className="w-8 h-8" />
            </div>
            <span className="text-xl font-bold text-slate-100 tracking-tight">coeff.io</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
             {!PROXY_URL && <input type="password" placeholder="Dev Mode: API Key" value={apiKey} onChange={(e) => saveKey(e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs w-32 focus:w-48 transition-all outline-none" />}
             {PROXY_URL && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/20 border border-indigo-900/50 rounded"><Lock className="w-3 h-3 text-indigo-400" /><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Secure</span></div>}
             {walletAddress ? <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs font-mono"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>{formatAddress(walletAddress)}</div> : <button onClick={connectWallet} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"><Wallet className="w-4 h-4" /> Connect Wallet</button>}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            How fragile is your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">portfolio?</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Most investors think they are diversified. The math says otherwise. 
            Calculate your <span className="text-slate-300 font-mono">Correlation Matrix</span> and <span className="text-slate-300 font-mono">Fragility Score</span> in seconds.
          </p>
          {dataQualityMsg && <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/20 border border-amber-900/50 text-amber-400 text-xs font-bold animate-in fade-in slide-in-from-top-2"><AlertTriangle className="w-4 h-4" />{dataQualityMsg}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Portfolio Composition</h3>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-slate-500 font-mono mr-2">{assets.length}/{MAX_ASSETS}</span>
                 <button onClick={importFromWallet} className="text-indigo-400 hover:text-indigo-300 p-1" title="Import from Wallet"><Import className="w-4 h-4" /></button>
                 <button onClick={addAsset} disabled={isMaxAssets} className={`text-indigo-400 transition-colors ${isMaxAssets ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-300'}`} title="Add Asset"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="flex gap-2 px-1 mb-1">
                <span className="flex-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Asset</span>
                <span className="w-24 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Last Price</span>
                <span className="w-16 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right pr-2">Weight</span>
                <span className="w-6"></span>
            </div>

            <div className="space-y-3">
              {assets.map((asset, i) => (
                <div key={i} className="flex gap-2 items-center group">
                  <input value={asset.ticker} onChange={(e) => updateAsset(i, 'ticker', e.target.value)} placeholder="TICKER" className="flex-[2] bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-sm font-mono uppercase focus:border-indigo-500 outline-none min-w-0" />
                  <div className="flex-[1.5] bg-slate-950 border border-slate-800 rounded px-2 py-2 text-xs font-mono text-right flex items-center justify-end min-w-[80px] overflow-hidden whitespace-nowrap">
                      {latestPrices[asset.ticker] ? <span className="text-emerald-400 font-bold truncate">{getCurrencySymbol(latestPrices[asset.ticker].currency)}{latestPrices[asset.ticker].price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> : <span className="text-slate-600">-</span>}
                  </div>
                  <input type="number" value={asset.weight} onChange={(e) => updateAsset(i, 'weight', e.target.value)} placeholder="%" className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-2 text-white text-sm font-mono text-right focus:border-indigo-500 outline-none" />
                  <button onClick={() => removeAsset(i)} className="text-slate-600 hover:text-rose-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 px-2">
                <span className="text-xs text-slate-500">Total Allocation:</span>
                <span className={`text-xs font-mono font-bold ${isWeightError ? "text-rose-400" : totalWeight === 100 ? "text-emerald-400" : "text-amber-400"}`}>
                    {totalWeight}%
                </span>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">BENCHMARK:</span>
                <input value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())} className="bg-transparent border-b border-slate-700 w-16 text-xs text-slate-300 font-mono uppercase text-center" />
              </div>
              <button 
                onClick={runAnalysis} 
                disabled={isProcessing || isWeightError} 
                className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isWeightError ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/20"}`}
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : isWeightError ? <AlertTriangle className="w-4 h-4"/> : <Activity className="w-4 h-4" />}
                {isWeightError ? "ADJUST WEIGHTS" : "RUN DIAGNOSTIC"}
              </button>
              {results && (
                <div className="grid grid-cols-3 gap-3 mt-4 animate-in fade-in slide-in-from-top-2 no-print">
                    <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 rounded-md text-xs font-bold uppercase transition-colors border border-slate-700"><FileText className="w-3 h-3" /> Save PDF</button>
                    <button onClick={handleShareTwitter} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-sky-400 py-2 rounded-md text-xs font-bold uppercase transition-colors border border-slate-700"><XLogo className="w-3 h-3" /> Share</button>
                    <button onClick={handleCopyData} className={`flex items-center justify-center gap-2 border transition-colors py-2 rounded-md text-xs font-bold uppercase ${copyStatus === "copied" ? "bg-emerald-900 border-emerald-700 text-emerald-400" : "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300"}`}>{copyStatus === "copied" ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copyStatus === "copied" ? "Copied" : "Copy Data"}</button>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex flex-col justify-center items-center min-h-[400px] relative overflow-hidden">
            {!results ? (
              <div className="text-center space-y-4 opacity-50">
                <Layers className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-sm text-slate-500">Waiting for data...</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Fragility Score</p>
                    <p className={`text-4xl font-mono font-bold mt-1 ${results.fragilityScore > 70 ? "text-rose-400" : "text-emerald-400"}`}>
                      {results.fragilityScore}/100
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">{results.fragilityScore > 70 ? "CRITICAL RISK" : "WELL DIVERSIFIED"}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Benchmark Beta</p>
                    <p className="text-4xl font-mono font-bold text-indigo-400 mt-1">{results.beta}</p>
                    <p className="text-[10px] text-slate-500 mt-1">vs {benchmark}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">Correlation Matrix</h4>
                  <div className="grid" style={{ gridTemplateColumns: `40px repeat(${assets.length}, 1fr)` }}>
                    <div className="h-8"></div>
                    {assets.map(a => (
                      <div key={a.ticker} className="flex items-center justify-center text-[9px] font-mono text-slate-500 font-bold h-8">
                        {a.ticker}
                      </div>
                    ))}
                    {results.matrix.map((row, i) => (
                      <React.Fragment key={i}>
                        <div className="flex items-center justify-end pr-2 text-[9px] font-mono text-slate-500 font-bold h-10">
                          {assets[i].ticker}
                        </div>
                        {row.map((val, j) => (
                          <div key={`${i}-${j}`} className="h-10 flex items-center justify-center text-[10px] font-mono border border-slate-900/50 relative group transition-all hover:scale-105 hover:z-10 hover:border-slate-700" style={{ backgroundColor: getHeatmapColor(val) }}>
                            <span className="relative z-10 text-white drop-shadow-md opacity-80 group-hover:opacity-100 font-bold">{val.toFixed(2)}</span>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" title={`${assets[i].ticker} vs ${assets[j].ticker}`} />
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {results && (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-indigo-500/30 rounded-xl p-8 text-center animate-in zoom-in duration-500 relative overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Want to automate this protection?</h2>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto relative z-10">We are building <strong>linest.io</strong>, a real-time StatArb scanner that alerts you when correlations break down.</p>
            {formStatus === "success" ? (
              <div className="text-emerald-400 font-bold flex items-center justify-center gap-2 py-2 animate-in fade-in"><CheckCircle className="w-5 h-5" /> You're on the list. We'll be in touch.</div>
            ) : (
              <form onSubmit={handleJoin} className="flex max-w-sm mx-auto gap-2 relative z-10">
                <input type="email" name="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={formStatus === "submitting"} className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white focus:border-indigo-500 outline-none disabled:opacity-50" />
                <button type="submit" disabled={formStatus === "submitting"} className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">{formStatus === "submitting" ? <RefreshCw className="w-4 h-4 animate-spin"/> : "Join Waitlist"}</button>
              </form>
            )}
            {formStatus === "error" && <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Something went wrong. Please try again.</p>}
            <div className="mt-6 flex justify-center gap-8 opacity-50 relative z-10">
               <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-slate-500" /><span className="text-xs">Institutional Encryption</span></div>
               <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /><span className="text-xs">Real-Time Data</span></div>
            </div>
        </div>
        )}

      </main>
    </div>
  );
}