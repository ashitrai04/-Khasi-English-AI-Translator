import { useState } from "react";
import "./index.css";

const ADMIN_SESSION_KEY = "khasi_admin_authed";

export default function App() {
  const [viewMode, setViewMode] = useState("translator");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [docId, setDocId] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  const [adminUserInput, setAdminUserInput] = useState("Ashit");
  const [adminPassInput, setAdminPassInput] = useState("");
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
  const [adminAuthMsg, setAdminAuthMsg] = useState("");
  const [adminLogs, setAdminLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const API_BASE = import.meta.env.DEV ? "http://localhost:3000" : "";

  async function handleTranslate() {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setErrorMsg("");
    setTranslatedText("");
    setDetectedLang("");

    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");

      setTranslatedText(data.translated_text || "");
      setDetectedLang(data.detected_language || "Unknown");
      setDocId(data.doc_id || null);
      setReviewStatus(data.doc_id ? "pending" : "");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsTranslating(false);
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatting(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg, direction: "en2kha" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      setChatHistory(prev => [...prev, { role: "bot", content: data.reply || "No reply." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "bot", content: `❌ Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  }

  async function submitReview(reviewValue) {
    if (!docId) return;
    setReviewStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, review: reviewValue }),
      });
      if (res.ok) setReviewStatus("done");
      else setReviewStatus("pending");
    } catch (err) {
      console.error(err);
      setReviewStatus("pending");
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setAdminAuthMsg("");
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin_logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adminUserInput, pass: adminPassInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login Failed");

      setIsAdminAuthed(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      setAdminLogs(data.logs || []);
    } catch (err) {
      setAdminAuthMsg(err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function refreshLogs() {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin_logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "Ashit", pass: "Ashit@123" }),
      });
      const data = await res.json();
      if (res.ok) setAdminLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  }

  function handleLogout() {
    setIsAdminAuthed(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminLogs([]);
    setAdminUserInput("Ashit");
    setAdminPassInput("");
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🌍 Khasi-English AI Translator</h1>
        <p>Yantrikaran Innovations</p>
      </div>

      <section className="mode-switch">
        <button
          className={viewMode === "translator" ? "btn btn-primary" : "btn btn-ghost"}
          onClick={() => setViewMode("translator")}
        >
          Translator
        </button>
        <button
          className={viewMode === "admin" ? "btn btn-primary" : "btn btn-ghost"}
          onClick={() => setViewMode("admin")}
        >
          Admin Logs
        </button>
      </section>

      {viewMode === "translator" ? (
        <main className="grid" style={{maxWidth: 800, margin: "0 auto"}}>
          <div className="card">
            <h2 className="card-title">English ↔ Khasi</h2>
            <p className="status" style={{textAlign:"left", margin: "0 0 16px 0"}}>Enter text in either language. The AI will auto-detect and translate it.</p>
            
            <textarea
              className="input text-area"
              rows={5}
              placeholder="Enter text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{marginBottom: 12, resize: "vertical"}}
            />
            
            <button className="btn btn-primary" onClick={handleTranslate} disabled={isTranslating}>
              {isTranslating ? "Translating..." : "Translate →"}
            </button>
            {errorMsg && <p className="status error">{errorMsg}</p>}

            <div style={{marginTop: 24}}>
              <label className="form-label">Translation</label>
              <div className="translation-box">
                {translatedText ? translatedText : <span style={{color: "var(--muted)"}}>Translation will appear here...</span>}
              </div>
              {detectedLang && (
                <p className="status success" style={{textAlign: "left", marginTop: 8}}>
                  Detected: <strong>{detectedLang}</strong>
                </p>
              )}
              {docId && reviewStatus === "pending" && (
                <div style={{marginTop: 16, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)"}}>
                  <p style={{marginBottom: 10, fontSize: "0.9rem", color: "var(--text-muted)"}}>Rate this translation (helps improve the model):</p>
                  <div style={{display: "flex", gap: 10, flexWrap: "wrap"}}>
                    <button className="btn btn-ghost btn-sm" style={{borderColor: "var(--green)", color: "var(--green)"}} onClick={() => submitReview("Correct")}>✅ Correct</button>
                    <button className="btn btn-ghost btn-sm" style={{borderColor: "var(--orange)", color: "var(--orange)"}} onClick={() => submitReview("Few words incorrect")}>⚠️ Few words incorrect</button>
                    <button className="btn btn-ghost btn-sm" style={{borderColor: "var(--red)", color: "var(--red)"}} onClick={() => submitReview("Incorrect")}>❌ Incorrect</button>
                  </div>
                </div>
              )}
              {reviewStatus === "submitting" && <p className="status" style={{textAlign: "left", marginTop: 16}}>Submitting feedback...</p>}
              {reviewStatus === "done" && <p className="status success" style={{textAlign: "left", marginTop: 16}}>Thank you for your feedback!</p>}
            </div>
          </div>

          {/* CHAT BOT SECTION */}
          <div className="card" style={{marginTop: 24}}>
            <h2 className="card-title">Bilingual Chat Assistant</h2>
            <p className="status" style={{textAlign:"left", margin: "0 0 16px 0"}}>Have a conversational chat in English or Khasi.</p>
            
            <div className="chat-history" style={{background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, minHeight: 200, maxHeight: 400, overflowY: "auto", marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)"}}>
              {chatHistory.length === 0 && (
                <p style={{color: "var(--muted)", textAlign: "center", marginTop: 80}}>Say hello to start the conversation!</p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12}}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                    borderBottomLeftRadius: msg.role === "bot" ? "4px" : "16px",
                    background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.1)",
                    color: "white",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    whiteSpace: "pre-wrap"
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div style={{display: "flex", justifyContent: "flex-start", marginBottom: 12}}>
                  <div style={{padding: "10px 14px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", color: "var(--muted)"}}>
                    typing...
                  </div>
                </div>
              )}
            </div>

            <div style={{display: "flex", gap: 10}}>
              <input 
                type="text" 
                className="input" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type your message..."
                style={{flex: 1}}
              />
              <button className="btn btn-primary" onClick={handleSendChat} disabled={isChatting || !chatInput.trim()}>
                Send
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="admin-grid" style={{maxWidth: 960, margin: "0 auto"}}>
          {!isAdminAuthed ? (
            <section className="card admin-login-card" style={{maxWidth: 400, margin: "40px auto"}}>
              <h2>Admin Login</h2>
              <p className="status" style={{textAlign: "left"}}>View Google Cloud Storage interaction logs.</p>
              <form className="form-grid" onSubmit={handleAdminLogin} style={{display: "flex", flexDirection: "column", gap: 12, marginTop: 16}}>
                <input
                  className="input"
                  value={adminUserInput}
                  onChange={(e) => setAdminUserInput(e.target.value)}
                  placeholder="Admin ID"
                />
                <input
                  className="input"
                  type="password"
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="Password"
                />
                <button className="btn btn-primary" type="submit" disabled={isLoadingLogs} style={{justifyContent: "center"}}>
                  {isLoadingLogs ? "Verifying..." : "Login"}
                </button>
              </form>
              {adminAuthMsg && <p className="status error">{adminAuthMsg}</p>}
            </section>
          ) : (
            <section className="card admin-table-wrap">
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10}}>
                <h2 style={{margin: 0}}>Cloud Storage Translater Logs</h2>
                <div style={{display: "flex", gap: 10}}>
                  <button className="btn btn-primary" onClick={refreshLogs} disabled={isLoadingLogs}>
                     {isLoadingLogs ? "Refreshing..." : "Refresh Logs"}
                  </button>
                  <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </div>
              </div>
              
              <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Direction</th>
                        <th>Detected Lang</th>
                        <th>Original Text</th>
                        <th>Translated Text</th>
                        <th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLogs.length === 0 ? (
                        <tr><td colSpan="6" style={{textAlign: "center", padding: 20}}>No logs found in Firestore. Submit a translation first!</td></tr>
                      ) : (
                        adminLogs.map((log, i) => (
                          <tr key={i}>
                            <td>{new Date(log.Timestamp).toLocaleString()}</td>
                            <td><span className="badge pending">{log.Direction}</span></td>
                            <td>{log["Detected Language"]}</td>
                            <td className="wrap">{log["Original Text"]}</td>
                            <td className="wrap">{log["Translated Text"]}</td>
                            <td>
                              <span className={`badge ${log.Review === "Correct" ? "success" : log.Review === "Incorrect" ? "danger" : "pending"}`}>
                                {log.Review || "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              </div>
            </section>
          )}
        </main>
      )}

      <footer className="company-footer">
        © 2026 Yantrikaran Innovations Private Limited
      </footer>
    </div>
  );
}
