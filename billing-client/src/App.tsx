import { useEffect, useState } from 'react';
import { api } from './api';
import type { Pending, CreateBatchResponse } from './types';
import { CheckSquare, Square, Filter, FileText, Send, LogOut, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- ESTADOS ---
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [pendings, setPendings] = useState<Pending[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filtros
  const [filterCustomer, setFilterCustomer] = useState('');
  
  // Formulario Lote
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptBook, setReceiptBook] = useState('0001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Resultado
  const [batchResult, setBatchResult] = useState<CreateBatchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    if (token) fetchPendings();
  }, [token]);

  // --- ACCIONES ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Login hardcodeado para demo (Usa el usuario que tengas en tu Auth Mock)
      const res = await api.post('/auth/login', { username: 'admin', password: '123' });
      const newToken = res.data.accessToken;
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } catch (err) {
      alert('Error en login. Revisa que el backend esté corriendo.');
    }
  };

  const fetchPendings = async () => {
    try {
      const res = await api.get('/billing/pendings');
      setPendings(res.data);
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setToken(null);
      }
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreateBatch = async () => {
    setLoading(true);
    try {
      const res = await api.post('/billing/batch', {
        pendingIds: selectedIds,
        receiptBook,
        issueDate
      });
      setBatchResult(res.data);
      setIsModalOpen(false);
      fetchPendings(); // Refrescar lista
      setSelectedIds([]);
    } catch (error) {
      alert('Error creando el lote');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // --- FILTRADO EN FRONTEND ---
  const filteredPendings = pendings.filter(p => 
    filterCustomer ? p.service.customerId.toString().includes(filterCustomer) : true
  );

  // --- VISTAS ---

 if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border border-gray-100 animate-in fade-in zoom-in duration-300">
          
          {/* Header del Login */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <FileText className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Bienvenido</h1>
            <p className="text-gray-500 text-sm mt-1">Sistema de Facturación Logística</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input 
                type="text" 
                defaultValue="admin" // Autocompletado para demo
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ej: admin"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                defaultValue="123" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg flex justify-center gap-2 items-center"
            >
              Iniciar Sesión <Send size={16} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400 bg-gray-50 py-2 rounded">
               🔒 Ambiente Seguro • Demo Técnica
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Gestión de Facturación</h1>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* RESULTADO DE LOTE (Success Banner) */}
        {batchResult && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">¡Lote procesándose!</h3>
              <p className="text-green-700 mt-1">
                El sistema ha aceptado la solicitud. Se está procesando en segundo plano.
              </p>
              <div className="mt-3 text-sm bg-white/50 p-2 rounded text-green-900 font-mono">
                Job ID: {batchResult.jobId} <br/>
                Estado: {batchResult.status}
              </div>
              <button 
                onClick={() => setBatchResult(null)}
                className="mt-4 text-sm text-green-700 underline hover:text-green-900"
              >
                Cerrar notificación
              </button>
            </div>
          </div>
        )}

        {/* TOOLBAR & FILTROS */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border">
            <Filter size={18} className="text-gray-400" />
           <div className="flex flex-col">
  <label className="text-xs font-semibold text-gray-500 uppercase">Filtrar Cliente</label>
  <input 
    type="number" 
    placeholder="ID Cliente..." 
    className="outline-none text-sm bg-transparent"
    value={filterCustomer}
    min="0" // 1. Restricción HTML
    onKeyDown={(e) => {
      // 2. Bloquear signos matemáticos no deseados
      if (["-", "+", "e", "E"].includes(e.key)) {
        e.preventDefault();
      }
    }}
    onChange={(e) => setFilterCustomer(e.target.value)}
  />
</div>
          </div>

          <div className="text-right">
             <span className="text-sm text-gray-500 block mb-1">
               {selectedIds.length} seleccionados
             </span>
             <button
               onClick={() => setIsModalOpen(true)}
               disabled={selectedIds.length === 0}
               className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-md
                 ${selectedIds.length > 0 
                   ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg translate-y-0' 
                   : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
               `}
             >
               <Send size={18} />
               Generar Lote
             </button>
          </div>
        </div>

        {/* TABLA DE PENDIENTES */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 w-12">
                  {/* Select All podría ir aquí */}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">ID Servicio</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha Servicio</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPendings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No hay pendientes disponibles para facturar.
                  </td>
                </tr>
              ) : (
                filteredPendings.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => toggleSelect(p.id)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="px-6 py-4">
                        {isSelected 
                          ? <CheckSquare className="text-blue-600" size={20} /> 
                          : <Square className="text-gray-300" size={20} />}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">#{p.service.id}</td>
                      <td className="px-6 py-4 text-sm">{p.service.serviceDate}</td>
                      <td className="px-6 py-4 text-sm font-medium">Cliente {p.service.customerId}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-bold text-gray-700">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          PENDIENTE
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL DE CONFIRMACIÓN DE LOTE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-white font-bold text-lg">Nuevo Lote de Facturación</h2>
              <p className="text-blue-100 text-sm mt-1">Vas a procesar {selectedIds.length} pendientes</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Talonario / Punto de Venta</label>
                <input 
                  type="text" 
                  value={receiptBook}
                  onChange={e => setReceiptBook(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="0001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión</label>
                <input 
                  type="date" 
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded border text-sm text-gray-600 mt-4">
                <strong>Resumen:</strong> Se generarán facturas correlativas en el talonario {receiptBook} con fecha {issueDate}.
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateBatch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                {loading ? 'Procesando...' : 'Confirmar Emisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}