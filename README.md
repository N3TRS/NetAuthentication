# 🔐 NetAuthentication — Microservicio de Autenticación y Usuarios

<div align="center">

### 🛠️ Stack Tecnológico

![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### ☁️ Infraestructura & Calidad

![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![SonarQube](https://img.shields.io/badge/SonarQube-Quality-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-App_Service-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)

### 🏗️ Arquitectura

![Modular](https://img.shields.io/badge/Architecture-Modular_NestJS-blueviolet?style=for-the-badge)
![OAuth](https://img.shields.io/badge/OAuth-GitHub_2.0-181717?style=for-the-badge&logo=github&logoColor=white)
![REST API](https://img.shields.io/badge/REST-API-009688?style=for-the-badge)

</div>

---

## 📑 Tabla de Contenidos

1. [👤 Integrantes](#1--integrantes)
2. [🎯 Objetivo del Microservicio](#2--objetivo-del-microservicio)
3. [⚡ Funcionalidades Principales](#3--funcionalidades-principales)
4. [📋 Estrategia de Versionamiento y Branches](#4--estrategia-de-versionamiento-y-branches)
5. [⚙️ Tecnologías Utilizadas](#5-️-tecnologías-utilizadas)
6. [🧩 Funcionalidad y Endpoints](#6--funcionalidad-y-endpoints)
7. [🏛️ Arquitectura, Patrones y Módulos](#7-️-arquitectura-patrones-y-módulos)
8. [⚠️ Manejo de Errores](#8-️-manejo-de-errores)
9. [🧪 Evidencia de Pruebas y Cobertura](#9--evidencia-de-pruebas-y-cobertura)
10. [🗂️ Organización del Código](#10-️-organización-del-código)
11. [🔗 Conexiones con Servicios Externos](#11--conexiones-con-servicios-externos)
12. [🚀 Ejecución del Proyecto](#12--ejecución-del-proyecto)
13. [⚙️ Pipelines CI/CD](#13-️-pipelines-cicd)
14. [☁️ Despliegue en Azure](#14-️-despliegue-en-azure)
15. [🤝 Integrantes y Contribuciones](#15--integrantes-y-contribuciones)

---

## 1. 👤 Integrantes

- Tulio Riaño Sánchez
- Julian Camilo Lopez Barrero
- Juan Sebastián Puentes Julio
- David Alejandro Patacon Henao

---

## 2. 🎯 Objetivo del Microservicio

**NetAuthentication** gestiona la identidad y el acceso de los usuarios en la plataforma **OmniCode**. Provee registro y autenticación local (email/contraseña), OAuth 2.0 con GitHub, recuperación de contraseña por email, y acceso a repositorios GitHub del usuario autenticado. Emite JWT que los demás microservicios del ecosistema validan como mecanismo de autorización centralizado.

---

## 3. ⚡ Funcionalidades Principales

| Funcionalidad | Descripción |
|---|---|
| **Registro de usuarios** | Crea cuenta con nombre, email y contraseña. Valida formato, longitud y complejidad. |
| **Autenticación local** | Verifica credenciales con bcrypt y emite JWT firmado (HMAC-SHA256). |
| **OAuth GitHub** | Flujo completo OAuth 2.0 con Passport. Crea o actualiza usuario al autenticar con GitHub. |
| **Recuperación de contraseña** | Genera token seguro, lo envía por email (SMTP) y permite resetear en 15 minutos. |
| **Listado de repositorios GitHub** | Retorna los repos del usuario autenticado via GitHub API con token almacenado. |
| **Métricas Prometheus** | Expone conteo de requests y latencia por ruta en `/metrics`. |

---

## 4. 📋 Estrategia de Versionamiento y Branches

### Estrategia de Ramas (Git Flow)

#### `main`
- Rama estable para producción. Dispara deploy a Azure Web App.
- Protegida: PR obligatorio, CI en verde.

#### `develop`
- Integración continua. Recibe merges desde `feature/*`.

#### `feature/*`
- Desarrollo de funcionalidades específicas. **Base:** `develop`.

### 4.1 Convenciones para commits

```
feat: agregar recuperación de contraseña por email
fix: corregir validación de token expirado en reset-password
test: agregar casos de prueba para githubLogin
docs: actualizar README con endpoints OAuth
```

---

## 5. ⚙️ Tecnologías Utilizadas

| **Tecnología** | **Uso en el proyecto** |
|---|---|
| **TypeScript 5.7.3** | Lenguaje base con tipado estático. |
| **NestJS 11.0.1** | Framework modular para la API REST. |
| **Node.js 20** | Runtime de JavaScript. |
| **@nestjs/jwt 11.0.2** | Generación y verificación de tokens JWT. |
| **@nestjs/passport 11.0.5** | Integración con estrategias Passport. |
| **passport-github2 0.1.12** | Estrategia OAuth 2.0 para GitHub. |
| **bcrypt 6.0.0** | Hashing de contraseñas (salt rounds configurable). |
| **mongoose 9.2.4** | ODM para MongoDB con @nestjs/mongoose. |
| **@nestjs-modules/mailer 2.3.4** | Envío de emails con Nodemailer. |
| **class-validator 0.14.0** | Validación de DTOs con decoradores. |
| **prom-client 15.1.3** | Métricas Prometheus. |
| **Jest 30** | Framework de pruebas unitarias. |
| **SonarCloud** | Análisis estático de calidad. |
| **GitHub Actions** | Pipeline CI/CD automatizado. |
| **Azure Web App** | Plataforma de despliegue en producción. |

---

## 6. 🧩 Funcionalidad y Endpoints

---

### 1️⃣ Registro — `POST /auth/signup`

#### 📦 Request

| Campo | Tipo | Restricción | Descripción |
|---|---|:---:|---|
| name | string | Obligatorio, min 1 char | Nombre del usuario |
| email | string | Obligatorio, email válido | Dirección de correo |
| password | string | 8-20 chars, mayúscula + minúscula + (dígito o especial) | Contraseña |
| role | string | Opcional | `'user'` (default) o `'admin'` |

#### 📤 Response (201 CREATED)

```json
{ "token": "eyJhbGci...", "email": "user@example.com", "role": "user" }
```

| HTTP | Escenario |
|:---:|:---|
| 409 | Email ya registrado |
| 400 | Datos inválidos |

---

### 2️⃣ Inicio de sesión — `POST /auth/signin`

```json
{ "email": "user@example.com", "password": "Password1!" }
```

**Response (200):** `{ "token": "eyJhbGci...", "email": "...", "role": "..." }`

| HTTP | Escenario |
|:---:|:---|
| 401 | Credenciales incorrectas |
| 400 | Usuario de GitHub (sin contraseña local) |

---

### 3️⃣ Recuperación de contraseña — `POST /auth/forgot-password`

```json
{ "email": "user@example.com" }
```

Envía email con token de reset válido por 15 minutos.

---

### 4️⃣ Reset de contraseña — `POST /auth/reset-password`

```json
{ "token": "abc123...", "newPassword": "NewPass1!" }
```

| HTTP | Escenario |
|:---:|:---|
| 400 | Token inválido o expirado |
| 200 | Contraseña actualizada |

---

### 5️⃣ OAuth GitHub — `GET /auth/github`

Redirige al flujo OAuth 2.0 de GitHub. Al finalizar, redirige al frontend con JWT en query param.

---

### 6️⃣ Repositorios GitHub — `GET /users/github/repos` 🔒

**Auth:** Bearer JWT requerido.

**Response (200):** Array de objetos repo con nombre, URL, lenguaje, descripción.

---

### 7️⃣ Métricas — `GET /metrics`

Prometheus metrics (http_requests_total, http_request_duration_seconds).

---

## 7. 🏛️ Arquitectura, Patrones y Módulos

### Arquitectura Modular NestJS

```
AppModule
├── ConfigModule (global)
├── MongooseModule (global, Atlas URI)
├── AuthModule
│   ├── UsersModule
│   ├── MailModule
│   ├── PassportModule
│   └── JwtModule (global, registerAsync)
└── MetricsController + MetricsInterceptor (APP_INTERCEPTOR)
```

### Patrones Aplicados

| Patrón | Dónde se aplica | Propósito |
|---|---|---|
| **Guard** | `JwtAuthGuard`, `GithubAuthGuard` | Protege rutas validando Bearer token o disparando OAuth. |
| **Strategy (Passport)** | `github.strategy.ts` | Encapsula el flujo OAuth 2.0 de GitHub. |
| **Interceptor** | `MetricsInterceptor` | Mide duración y cuenta requests por ruta para Prometheus. |
| **DTO + Validación** | `SignUpDto`, `SignInDto`, `ResetPasswordDto` | Separa contrato de API de lógica interna; validado automáticamente. |
| **Dependency Injection** | NestJS IoC | Gestión de dependencias por el framework. |

---

## 8. ⚠️ Manejo de Errores

| ⚠️ Escenario | 🔢 HTTP | 💬 Descripción |
|:---|:---:|:---|
| Email ya existe | 409 | `signUp()` lanza `ConflictException` |
| Credenciales inválidas | 401 | `signIn()` lanza `UnauthorizedException` |
| Usuario GitHub sin contraseña | 400 | Sugiere login con GitHub |
| Token de reset inválido/expirado | 400 | `resetPassword()` valida TTL de 15 minutos |
| Error de envío de email | 200 | Se registra en logs; no falla la respuesta HTTP |
| Validación de DTO | 422 | Global ValidationPipe (whitelist + forbidNonWhitelisted) |

---

## 9. 🧪 Evidencia de Pruebas y Cobertura

### Suites de prueba

```
test/unit/
└── auth.service.spec.ts     (~13 suites, Jest 30 + Mockito NestJS)
    ├── signUp(): 3 casos (éxito, email duplicado, rol personalizado)
    ├── signIn(): 4 casos (válido, usuario inexistente, GitHub sin pwd, contraseña inválida)
    ├── forgotPassword(): 4 casos (no encontrado, GitHub skip, token gen, error SMTP)
    ├── resetPassword(): 2 casos (token inválido, éxito)
    └── githubLogin(): 3 casos (usuario existente, nuevo usuario, email faltante)
```

### Cómo ejecutar

```bash
npm run test          # Pruebas unitarias
npm run test:cov      # Cobertura LCOV (para SonarCloud)
npm run test:e2e      # Pruebas E2E
```

---

## 10. 🗂️ Organización del Código

```
NetAuthentication/
│
├── src/
│   ├── auth/
│   │   ├── dto/               # SignUpDto, SignInDto, ForgotPasswordDto, ResetPasswordDto
│   │   ├── guards/            # JwtAuthGuard, GithubAuthGuard
│   │   ├── strategies/        # github.strategy.ts (Passport)
│   │   ├── auth.controller.ts # /auth/* endpoints
│   │   ├── auth.service.ts    # Lógica de autenticación
│   │   ├── auth.module.ts
│   │   └── bcrypt.service.ts  # Wrapper bcrypt
│   │
│   ├── users/
│   │   ├── dto/               # CreateUserDto
│   │   ├── schemas/           # user.schema.ts (Mongoose)
│   │   ├── users.controller.ts # GET /users/github/repos
│   │   ├── users.service.ts   # CRUD + GitHub API calls
│   │   └── users.module.ts
│   │
│   ├── mail/
│   │   ├── mail.service.ts    # Envío de emails SMTP
│   │   └── mail.module.ts
│   │
│   ├── metrics/
│   │   ├── metrics.controller.ts  # GET /metrics
│   │   ├── metrics.service.ts     # Registry Prometheus
│   │   └── metrics.interceptor.ts # Tracking requests
│   │
│   ├── app.module.ts          # Módulo raíz
│   └── main.ts                # Bootstrap
│
├── test/
│   ├── unit/auth.service.spec.ts
│   └── jest-e2e.json
│
├── sonar-project.properties   # SonarCloud config (org: n3trs)
├── package.json
├── tsconfig.json
└── .github/workflows/develop_omnicode-api-authentication.yml
```

---

## 11. 🔗 Conexiones con Servicios Externos

| Servicio | Tipo | Variable de Entorno | Descripción |
|---|---|---|---|
| **MongoDB Atlas** | Driver Mongoose | `MONGO_URI` | Colección `users` con índice único en email. |
| **GitHub OAuth** | Passport OAuth 2.0 | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` | Autenticación con cuenta GitHub. |
| **GitHub API** | HTTP REST | Token del usuario (BD) | `GET /user/repos` para listar repositorios. |
| **SMTP (Email)** | Nodemailer | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Emails de recuperación de contraseña. |
| **SonarCloud** | CI | `SONAR_TOKEN` | Análisis estático (org: n3trs). |
| **Azure Web App** | PaaS | `AZURE_CREDENTIALS` (OIDC) | `omnicode-api-authentication`. |

---

## 12. 🚀 Ejecución del Proyecto

### 📋 Prerrequisitos

- **Node.js 20+**, **npm**
- MongoDB Atlas URI, GitHub OAuth app registrada

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build && npm run start:prod
```

📍 **URL Local:** `http://localhost:3001`

### ⚙️ Variables de Entorno

| Variable | Requerida | Descripción |
|:---|:---:|:---|
| `MONGO_URI` | ✅ | URI de MongoDB Atlas |
| `JWT_SECRET` | ✅ | Clave de firma JWT |
| `JWT_EXPIRES_IN` | ❌ | Expiración (default: `1h`) |
| `GITHUB_CLIENT_ID` | ✅ | OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | OAuth App Client Secret |
| `GITHUB_CALLBACK_URL` | ✅ | URL de callback OAuth |
| `FRONTEND_URL` | ✅ | URL del frontend (redirect post-OAuth) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | ✅ | Config SMTP para emails |

---

## 13. ⚙️ Pipelines CI/CD

### Pipeline — `develop_omnicode-api-authentication.yml`

**Triggers:** push/PR a `main` y `develop`, `workflow_dispatch`

```
Checkout → Node.js 20.x → npm install → build → test:cov
    → SonarCloud scan
    → [solo develop] Azure login (OIDC) → Deploy omnicode-api-authentication
```

### Secrets requeridos

| Secret | Descripción |
|---|---|
| `SONAR_TOKEN` | Token SonarCloud (org: n3trs) |
| `AZUREAPPSERVICE_CLIENTID` | Service Principal client ID |
| `AZUREAPPSERVICE_TENANTID` | Azure tenant ID |
| `AZUREAPPSERVICE_SUBSCRIPTIONID` | Azure subscription ID |

---

## 14. ☁️ Despliegue en Azure

| Recurso | Valor |
|---|---|
| **App Service** | `omnicode-api-authentication` |
| **Runtime** | Node.js 20, Linux |
| **Slot** | Production |

### Variables en Azure

| Nombre | Descripción |
|---|---|
| `MONGO_URI` | URI de MongoDB Atlas |
| `JWT_SECRET` | Clave compartida con otros microservicios |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth App de producción |
| `FRONTEND_URL` | URL del frontend en producción (Vercel) |

---

## 15. 🤝 Integrantes y Contribuciones

<div align="center">

![Course](https://img.shields.io/badge/Course-ARSW-orange?style=for-the-badge)
![Year](https://img.shields.io/badge/Year-2026--1-blue?style=for-the-badge)

| 👤 Integrante | 🎓 Rol |
|:---|:---|
| Tulio Riaño Sánchez | Desarrollo y arquitectura |
| Julian Camilo Lopez Barrero | Desarrollo y arquitectura |
| Juan Sebastián Puentes Julio | Desarrollo y arquitectura |
| David Alejandro Patacon Henao | Desarrollo y arquitectura |

> 💡 **NetAuthentication** centraliza la identidad de todos los usuarios OmniCode, emitiendo JWT que el resto del ecosistema consume para autorizar operaciones sin consultas adicionales al servicio de autenticación.

**🎓 Escuela Colombiana de Ingeniería Julio Garavito**

</div>
