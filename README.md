# 🚀 Challenge Técnico – Nivel Senior

<p align="center">
  <img src="https://img.shields.io/badge/nivel-senior-blue" />
  <img src="https://img.shields.io/badge/backend-node.js-green" />
  <img src="https://img.shields.io/badge/framework-nestjs-red" />
  <img src="https://img.shields.io/badge/database-postgresql-blue" />
  <img src="https://img.shields.io/badge/queue-bullmq-orange" />
</p>

---

## 📌 Descripción General

> **Challenge técnico de Backend (nivel Senior)** enfocado en arquitectura, consistencia de datos, manejo de concurrencia y procesamiento asíncrono, simulando escenarios reales de producción.

El objetivo principal de esta solución es diseñar un sistema robusto y escalable para la **facturación de servicios logísticos**, priorizando la integridad transaccional, la correcta separación de dominios y la preparación para integraciones externas (ERP).

---

## 🧠 Principios de Diseño

- Domain-Driven Design (DDD)
- Separación estricta de responsabilidades por dominio
- Idempotencia en procesos críticos
- Manejo explícito de concurrencia
- Procesamiento asíncrono orientado a eventos
- Arquitectura preparada para entornos productivos

---

## 📚 Documentación de Diseño y Arquitectura

<details>
<summary><strong>Ver decisiones técnicas y de arquitectura</strong></summary>

### 1. Decisiones de Modelado (Domain-Driven Design)

Se optó por separar estrictamente el **Dominio de Logística** del **Dominio de Facturación**, evitando acoplamiento y contaminación de responsabilidades.

#### 🧱 Dominio de Logística

**Entidad: `Service`**

- Maneja únicamente estados operativos:
  - `PENDING`
  - `IN_TRANSIT`
  - `DELIVERED`
- Un servicio **no conoce si fue facturado o no**.
- Su responsabilidad finaliza al momento de la entrega.

#### 💰 Dominio de Facturación

**Entidad: `BillingPending` (Nexo)**

- Representa un **snapshot inmutable** del servicio al momento de generar un pendiente de facturación.
- Se copia el valor `amount` desde Logística.

**Justificación**:
Si la tarifa del servicio cambia posteriormente en Logística, la contabilidad histórica no debe verse afectada.

**Relación**:
- `Service (1) → (N) BillingPending`
- Permite re-facturaciones o ajustes futuros sin romper el modelo.

---

### 2. Concurrencia e Idempotencia

En procesos de facturación masiva, es común que múltiples procesos intenten facturar los mismos registros.

#### 🔒 Estrategia de Bloqueo (Pessimistic Locking)

```ts
queryRunner.manager.find(Entity, {
  lock: { mode: 'pessimistic_write' }
})
```

**Efecto**:
- La base de datos bloquea físicamente las filas seleccionadas.
- Otros procesos deben esperar a que la transacción finalice.

#### ♻️ Idempotencia del Proceso

- Dentro de la transacción se valida estrictamente:
  - `status === 'PENDING'`
- Si otro proceso ya modificó el estado a `INVOICED`, el segundo intento falla inmediatamente.

---

### 3. Alcance del Challenge

- Se priorizó la **robustez del Backend** por sobre la estética del Frontend.
- El foco estuvo en:
  - Transacciones complejas
  - Integridad de datos
  - Procesamiento asíncrono

#### 🔐 Autenticación

- La autenticación con AWS Cognito fue **simulada (mock)**.
- Se mantuvo la estructura real de:
  - Guards
  - Strategies JWT

Esto permite un reemplazo inmediato por un proveedor real sin refactor estructural.

---

### 4. Preparación de Datos para ERP

Se diseñó una salida JSON estandarizada y agnóstica mediante el endpoint:

```http
GET /billing/batch/:id/erp-export
```

#### 📦 Campos Clave

- `external_id`: ID interno enviado al ERP para evitar duplicados (idempotencia del lado del ERP).
- `tax_breakdown`: desglose impositivo (IVA 21%).

**Decisión de negocio**:
El sistema de facturación es el dueño de la regla impositiva vigente. El ERP solo debe asentar contabilidad, evitando recálculos y diferencias por redondeo.

---

### 5. Procesamiento Asíncrono

Para evitar timeouts en lotes grandes, se implementó una arquitectura basada en jobs.

#### 🧰 Tecnología

- **BullMQ + Redis**

**Justificación**:
- Integración nativa con Node/NestJS
- Menor overhead operativo que RabbitMQ para este caso de uso

#### 🔄 Flujo de Procesamiento

1. La API recibe el request
2. Valida el DTO
3. Encola el trabajo (`billing-queue`)
4. Retorna `202 Accepted`
5. Un worker (`BillingProcessor`) procesa el job en segundo plano

#### ⚠️ Manejo de Errores

- `attempts: 3`
- `backoff: 5000ms`
- Rollback completo ante fallos transaccionales
- Reintentos automáticos gestionados por BullMQ

---

### 6. Migraciones y Seeds

La integridad de la base de datos se gestiona **exclusivamente mediante código**.

#### 🗄️ Migraciones (TypeORM)

- `synchronize: false`
- Migración inicial: `InitFullSchema`
- Creación de:
  - Tablas
  - ENUMs
  - Relaciones

**Automatización**:
- `docker-compose.yml` ejecuta las migraciones antes de levantar la API

#### 🌱 Seeds

Endpoint:
```http
POST /seed
```

Funcionalidad:
- Limpieza de la base respetando claves foráneas
- Generación de 50 servicios
- Estados aleatorios (`DELIVERED`, `IN_TRANSIT`)
- Fechas distribuidas para pruebas de carga y filtrado

---

### 7. Mejoras Futuras

#### 🛠️ Técnicas

- Dead Letter Queue (DLQ) para jobs fallidos
- Circuit Breaker para integración con ERP
- Testing E2E con Supertest

#### 📈 De Negocio

- Notas de crédito
- Integración real con AFIP (facturación electrónica)
- Soporte multi-moneda (USD con tipo de cambio al momento de emisión)

</details>

---

## ⚙️ Stack Tecnológico

- Node.js / TypeScript
- NestJS
- TypeORM
- PostgreSQL
- BullMQ + Redis
- Docker & Docker Compose

---

## 🧪 Ejecución Local

### Backend

```bash
# Instalar dependencias
npm install

# Levantar infraestructura (DB + Redis)
docker-compose up -d

# Ejecutar migraciones
npm run typeorm:run

# Iniciar la API
npm run start:dev
```

### Frontend

```bash
# Instalar dependencias
npm install

# Levantar aplicación Frontend
npm run start
```

### Tests Unitarios

```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests uno por uno
npm run test src/billing/billing.service.spec.ts
npm run test src/billing/billing.processor.spec.ts
npm run test src/auth/strategies/jwt.strategy.spec.ts


```

```bash
# Instalar dependencias
npm install

# Levantar infraestructura (DB + Redis)
docker-compose up -d

# Ejecutar migraciones
npm run typeorm:run

# Iniciar la API
npm run start:dev
```

---

## 📡 Endpoints Principales

```http
POST   /billing/batch
GET    /billing/batch/:id
GET    /billing/batch/:id/erp-export
POST   /seed
```

---

## 📈 Aspectos Clave para Producción

- Integridad transaccional con garantías de rollback
- Bloqueo pesimista para prevenir condiciones de carrera
- Proceso de facturación completamente idempotente
- Procesamiento asíncrono con reintentos y backoff configurado
- Esquema de base de datos gestionado exclusivamente mediante migraciones
- Límites de dominio claramente definidos y alineados a principios DDD

---

## 👤 Autor

**Fabio Adrian Arias**  
Senior FullStack Developer

🔗 LinkedIn: https://www.linkedin.com/in/fabio-arias-0515691b9/

---

📌 _Este proyecto fue desarrollado como un challenge técnico, aplicando criterios y estándares propios de sistemas empresariales en producción._

