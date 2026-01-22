# 🚀 Technical Challenge – Senior Level

<p align="center">
  <img src="https://img.shields.io/badge/level-senior-blue" />
  <img src="https://img.shields.io/badge/backend-node.js-green" />
  <img src="https://img.shields.io/badge/framework-nestjs-red" />
  <img src="https://img.shields.io/badge/database-postgresql-blue" />
  <img src="https://img.shields.io/badge/queue-bullmq-orange" />
</p>


## 📌 Overview

> **Senior Backend Technical Challenge** focused on architecture, data integrity, concurrency control, and asynchronous processing.

Este repositorio contiene la solución a un **challenge técnico de nivel Senior**, con foco en **arquitectura backend**, **consistencia de datos**, **procesamiento asíncrono** y **preparación para entornos productivos reales**.

El objetivo principal fue diseñar un sistema robusto y escalable para la **facturación de servicios logísticos**, priorizando la integridad transaccional y la correcta separación de responsabilidades por dominio.

---

## 🧠 Design Principles

- **Domain-Driven Design (DDD)**
- **Separación estricta de dominios**
- **Idempotencia y manejo de concurrencia**
- **Procesamiento asíncrono orientado a eventos**
- **Arquitectura preparada para escalar**

---

## 📚 Architecture & Design Documentation

<details>
<summary><strong>Click to expand technical details</strong></summary>



### 1. Decisiones de Modelado (DDD)

Se definieron dominios claramente desacoplados para evitar dependencias implícitas y contaminación de responsabilidades.

#### 🧱 Dominio de Logística
**Entidad: `Service`**
- Maneja exclusivamente estados operativos:
  - `PENDING`
  - `IN_TRANSIT`
  - `DELIVERED`
- **Decisión clave**: un servicio no conoce si fue facturado.
- Su responsabilidad finaliza una vez entregado.

#### 💰 Dominio de Facturación
**Entidad: `BillingPending` (Nexo)**
- Representa un **snapshot inmutable** del servicio al momento de generar el pendiente.
- Se copia el `amount` desde Logística.

**Motivación**:
Si Logística modifica tarifas posteriormente, la contabilidad histórica no debe verse afectada.

**Relación**:
- `Service (1) → (N) BillingPending`
- Permite futuras re-facturaciones o ajustes sin romper el modelo.

---

### 2. Concurrencia e Idempotencia

En escenarios de facturación masiva, múltiples procesos pueden intentar facturar los mismos registros.

#### 🔒 Estrategia: Pessimistic Locking

```ts
queryRunner.manager.find(Entity, {
  lock: { mode: 'pessimistic_write' }
})
```

**Efecto**:
- La base de datos bloquea físicamente las filas seleccionadas.
- Otros procesos deben esperar a que la transacción finalice.

#### ♻️ Idempotencia
- Dentro de la transacción se valida estrictamente:
  - `status === 'PENDING'`
- Si otro proceso ya facturó el registro, el segundo request falla inmediatamente.

---

### 3. Alcance del Challenge

- Se priorizó **robustez backend** sobre estética frontend.
- Enfoque en:
  - Transacciones complejas
  - Procesamiento asíncrono
  - Integridad de datos

#### 🔐 Autenticación
- AWS Cognito fue **mockeado**.
- Se mantuvo la estructura real de:
  - Guards
  - JWT Strategies

Esto permite un switch inmediato a un proveedor real sin refactor estructural.

---

### 4. Preparación de Datos para ERP

Se implementó un endpoint de exportación:

```http
GET /billing/batch/:id/erp-export
```

#### 📦 Payload JSON Estandarizado

Campos clave:
- `external_id`: ID interno para evitar duplicados en el ERP.
- `tax_breakdown`: desglose impositivo (IVA 21%).

**Decisión de negocio**:
El sistema de facturación es el dueño de la regla impositiva.
El ERP solo asienta contabilidad, evitando recalcular y generar diferencias por redondeo.

---

### 5. Procesamiento Asíncrono

Para evitar timeouts en lotes grandes, se implementó una arquitectura basada en jobs.

#### 🧰 Tecnología
- **BullMQ + Redis**

**Justificación**:
- Integración nativa con Node/NestJS
- Menor overhead operativo que RabbitMQ para job queues

#### 🔄 Flujo
1. API recibe request
2. Valida DTO
3. Encola el job (`billing-queue`)
4. Retorna `202 Accepted`
5. Worker (`BillingProcessor`) procesa en background

#### ⚠️ Manejo de Errores
- `attempts: 3`
- `backoff: 5000ms`
- Rollback completo ante error
- Reintentos automáticos gestionados por BullMQ

---

### 6. Migraciones y Seeds

La base de datos se gestiona **exclusivamente por código**.

#### 🗄️ Migraciones (TypeORM)
- `synchronize: false`
- Migración inicial: `InitFullSchema`
- Incluye:
  - Tablas
  - ENUMs
  - Relaciones

**Automatización**:
- `docker-compose.yml` ejecuta migraciones antes de levantar la API

#### 🌱 Seeds

Endpoint:
```http
POST /seed
```

Funcionalidad:
- Limpieza ordenada respetando Foreign Keys
- Generación de:
  - 50 servicios
  - Estados aleatorios (`DELIVERED`, `IN_TRANSIT`)
  - Fechas distribuidas para pruebas de carga

---

### 7. Mejoras Futuras

#### 🛠️ Técnicas
- **Dead Letter Queue (DLQ)**: manejo de jobs fallidos tras reintentos
- **Circuit Breaker**: protección ante fallos del ERP
- **Testing E2E**: Supertest para flujos HTTP completos

#### 📈 De Negocio
- **Notas de Crédito**: anulación de facturas
- **Integración AFIP real**: reemplazo del mock de CAE
- **Multi-moneda**: soporte USD con tipo de cambio al momento de emisión

---

</details>

## ✅ Conclusion

La solución prioriza estándares de calidad propios de un entorno productivo real, con foco en **escalabilidad**, **consistencia**, **observabilidad** y **mantenibilidad**, alineados a expectativas de un **rol Senior Backend**.

---

📌 _This project was designed as a technical challenge but follows standards directly applicable to real-world, mission-critical enterprise systems._

---

## ⚙️ Tech Stack

- **Node.js / TypeScript**
- **NestJS** (Modular Architecture)
- **TypeORM** (Transactions & Migrations)
- **PostgreSQL**
- **BullMQ + Redis** (Asynchronous Processing)
- **Docker & Docker Compose**

---

## 🧪 Local Setup

```bash
# Install dependencies
npm install

# Start infrastructure (DB + Redis)
docker-compose up -d

# Run migrations
npm run typeorm:run

# Start API
npm run start:dev
```

---

## 📡 Key Endpoints

```http
POST   /billing/batch
GET    /billing/batch/:id
GET    /billing/batch/:id/erp-export
POST   /seed
```

---

## 📈 Production Readiness Highlights

- Transactional integrity with rollback guarantees
- Pessimistic locking for race-condition prevention
- Fully idempotent billing process
- Async job processing with retries and backoff
- Database schema managed exclusively via migrations
- Clear domain boundaries aligned with DDD principles

---

## 👤 Author

**Fabio Arias**  
Senior Backend Developer  

🔗 LinkedIn: _(add link)_  
📧 Email: _(add contact)_

