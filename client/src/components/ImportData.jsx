import { useMemo, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, ArrowRight, X } from 'lucide-react';
import { api, money } from '../lib/api.js';
import { parseCSV, autoMap, applyMapping, IMPORT_FIELDS, SAMPLE_CSV } from '../lib/csv.js';

const STATUSES = ['lead', 'opportunity', 'booked', 'in_progress', 'completed', 'lost', 'cancelled'];

export default function ImportData() {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [records, setRecords] = useState([]);
  const [mapping, setMapping] = useState({});
  const [createJobs, setCreateJobs] = useState(true);
  const [defaultStatus, setDefaultStatus] = useState('lead');
  const [source, setSource] = useState('SmartMoving');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setFileName(''); setHeaders([]); setRecords([]); setMapping({});
    setResult(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (file) => {
    if (!file) return;
    setError(''); setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { headers, records } = parseCSV(String(e.target.result || ''));
        if (!headers.length || !records.length) { setError('That file looks empty. Export your data as CSV and try again.'); return; }
        setFileName(file.name);
        setHeaders(headers);
        setRecords(records);
        setMapping(autoMap(headers));
      } catch {
        setError('Could not read that file. Make sure it is a .csv export.');
      }
    };
    reader.readAsText(file);
  };

  const mapped = useMemo(() => applyMapping(records, mapping), [records, mapping]);
  const hasName = !!(mapping.first_name || mapping.name);
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  const runImport = async () => {
    setBusy(true); setError('');
    try {
      const res = await api('/import', { method: 'POST', body: { records: mapped, createJobs, defaultStatus, source } });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'movecrm-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Success screen -----------------------------------------------------
  if (result) {
    return (
      <div className="card" style={{ maxWidth: 620 }}>
        <div className="card-body" style={{ textAlign: 'center', padding: 36 }}>
          <CheckCircle2 size={54} color="#22c55e" />
          <h2 style={{ margin: '14px 0 6px' }}>Import complete 🎉</h2>
          <p className="muted" style={{ marginTop: 0 }}>Your data is now in MoveCRM.</p>
          <div className="row" style={{ justifyContent: 'center', gap: 28, margin: '18px 0' }}>
            <div><div style={{ fontSize: 30, fontWeight: 800 }}>{result.customers}</div><div className="muted">customers</div></div>
            {result.jobs > 0 && <div><div style={{ fontSize: 30, fontWeight: 800 }}>{result.jobs}</div><div className="muted">jobs / leads</div></div>}
            {result.skipped > 0 && <div><div style={{ fontSize: 30, fontWeight: 800, color: '#f59e0b' }}>{result.skipped}</div><div className="muted">skipped</div></div>}
          </div>
          {result.errors?.length > 0 && (
            <div className="muted" style={{ fontSize: 12, textAlign: 'left', maxWidth: 420, margin: '0 auto 16px' }}>
              Skipped rows: {result.errors.map((e) => `#${e.row} (${e.error})`).join(', ')}
            </div>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={reset}>Import another file</button>
            <a className="btn primary" href="/customers">View customers</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="card" style={{ background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', borderColor: '#dbeafe' }}>
        <div className="card-body">
          <div className="row spread" style={{ alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Import from SmartMoving &amp; other platforms</h2>
              <p className="muted" style={{ margin: 0, maxWidth: 560 }}>
                Bring your customers and jobs across in one step. In SmartMoving (or your current CRM/spreadsheet),
                export your customers or opportunities to <b>CSV</b>, then drop the file below. We’ll match the
                columns automatically — you just confirm and import.
              </p>
            </div>
            <button className="btn sm" onClick={downloadSample}><Download size={14} /> Sample CSV</button>
          </div>
        </div>
      </div>

      {/* Step 1 — file drop */}
      {headers.length === 0 && (
        <div
          className="card mt"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          style={{ border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`, background: dragOver ? '#eff6ff' : '#fff' }}
        >
          <div className="card-body" style={{ textAlign: 'center', padding: 40, cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
            <UploadCloud size={44} color="var(--primary)" />
            <div style={{ fontWeight: 700, marginTop: 10 }}>Drop your CSV here, or click to choose a file</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Exports from SmartMoving, Excel, Google Sheets and most CRMs work.</div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        </div>
      )}

      {error && <div className="card mt"><div className="card-body error-text" style={{ margin: 0 }}>{error}</div></div>}

      {/* Step 2 — column mapping + options */}
      {headers.length > 0 && (
        <>
          <div className="card mt">
            <div className="card-head">
              <span className="row" style={{ gap: 8 }}><FileSpreadsheet size={16} /> {fileName} · {records.length} rows</span>
              <button className="btn icon sm" title="Choose a different file" onClick={reset}><X size={14} /></button>
            </div>
            <div className="card-body">
              <div className="section-title" style={{ marginTop: 0 }}>Match your columns ({mappedCount} matched automatically)</div>
              <div className="import-map-grid">
                {IMPORT_FIELDS.map((f) => (
                  <label key={f.key} className="import-map-row">
                    <span className="import-map-label">{f.label}</span>
                    <ArrowRight size={13} className="muted" />
                    <select value={mapping[f.key] || ''} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}>
                      <option value="">— skip —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              {!hasName && (
                <div className="row" style={{ gap: 8, color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>
                  <AlertTriangle size={15} /> Map a <b>First name</b> or <b>Full name</b> column to continue.
                </div>
              )}
            </div>
          </div>

          <div className="card mt">
            <div className="card-head">Import options</div>
            <div className="card-body">
              <label className="row" style={{ cursor: 'pointer', gap: 8 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={createJobs} onChange={(e) => setCreateJobs(e.target.checked)} />
                <span>Also create a job / pipeline lead for each row <span className="muted">(recommended — brings your moves across, not just contacts)</span></span>
              </label>
              <div className="form-grid" style={{ marginTop: 14 }}>
                <label className="field">
                  <span>Default status (when a row has none)</span>
                  <select value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value)} disabled={!createJobs}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Lead source label</span>
                  <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="SmartMoving" />
                </label>
              </div>
            </div>
          </div>

          {/* Step 3 — preview */}
          <div className="card mt">
            <div className="card-head">Preview · first {Math.min(5, mapped.length)} of {mapped.length}</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Phone</th>
                    {createJobs && <><th>Move date</th><th>Route</th><th>Status</th><th>Est.</th></>}
                  </tr>
                </thead>
                <tbody>
                  {mapped.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td><b>{[r.first_name, r.last_name].filter(Boolean).join(' ') || r.name || <span className="muted">—</span>}</b></td>
                      <td className="muted">{r.email || '—'}</td>
                      <td className="muted">{r.phone || '—'}</td>
                      {createJobs && <>
                        <td>{r.move_date || '—'}</td>
                        <td className="muted">{[r.origin_city, r.dest_city].filter(Boolean).join(' → ') || '—'}</td>
                        <td>{r.status || defaultStatus}</td>
                        <td>{r.estimated_total ? money(r.estimated_total) : '—'}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-body row spread">
              <span className="muted">Ready to import <b>{mapped.length}</b> {createJobs ? 'customers + jobs' : 'customers'}.</span>
              <button className="btn primary" disabled={!hasName || busy} onClick={runImport}>
                {busy ? 'Importing…' : `Import ${mapped.length} rows`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
