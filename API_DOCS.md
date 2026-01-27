
📬 Documentación de API (Postman Guide)

Esta guía detalla los endpoints disponibles en el Sistema de Facturación por Lote.

Base URL: http://localhost:3000

🔐 1. Autenticación

El sistema utiliza JWT (JSON Web Tokens).

Ejecute el login primero.

Copie el accessToken recibido.

En los siguientes requests, utilice la pestaña Auth -> Type: Bearer Token.

👤 Login (Mock)

Obtiene el token de acceso.

Método: POST

Endpoint: /auth/login

Body (JSON):

code
JSON
download
content_copy
expand_less
{
  "username": "admin",
  "password": "123"
}
🛠️ 2. Utilidades (Setup)

Endpoints para preparar el entorno de pruebas.

🌱 Seed (Poblar Datos)

Limpia la base de datos y genera 50 servicios logísticos de prueba con estados aleatorios (DELIVERED, IN_TRANSIT, PENDING).

Método: POST

Endpoint: /seed

Auth: Pública (para facilitar testing).

💰 3. Facturación (Core)

Endpoints protegidos (Requieren Token).

🔄 Generar Pendientes

Busca todos los servicios en estado DELIVERED que aún no tienen un proceso de facturación iniciado y crea los registros en BillingPending (Snapshot de precio).

Método: POST

Endpoint: /billing/generate-pendings

Auth: Bearer Token.

📋 Listar Pendientes

Devuelve la lista de servicios listos para ser facturados. Use estos IDs para crear un lote.

Método: GET

Endpoint: /billing/pendings

Auth: Bearer Token.

⚡ Crear Lote (Asíncrono)

Inicia el proceso de facturación masiva.

Método: POST

Endpoint: /billing/batch

Auth: Bearer Token.

Body (JSON):

code
JSON
download
content_copy
expand_less
{
  "pendingIds": [1, 2, 3],       // Reemplazar con IDs reales obtenidos en el paso anterior
  "receiptBook": "0001",         // Número de talonario (Punto de venta)
  "issueDate": "2023-10-27"      // Fecha de emisión de las facturas
}

Respuesta esperada: 202 Accepted con jobId y estado QUEUED.

📤 Exportar a ERP

Obtiene el JSON formateado con las facturas generadas, desglose de impuestos y datos del cliente.

Método: GET

Endpoint: /billing/batch/:id/erp-export

Parámetro URL: :id (El ID del lote generado, visible en los logs del Worker).

Auth: Bearer Token.

💡 Flujo de Prueba Sugerido

POST /seed -> Resetea datos.

POST /auth/login -> Obtiene Token.

POST /billing/generate-pendings -> Detecta qué facturar.

GET /billing/pendings -> Mira los IDs disponibles (ej: 45, 46).

POST /billing/batch -> Envía los IDs 45 y 46.

Wait 2 seconds... (Worker procesa en background).

GET /billing/batch/{BATCH_ID_DEL_LOG}/erp-export -> Verifica el resultado.