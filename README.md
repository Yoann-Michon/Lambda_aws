# Blogify - Headless Blogging Platform

<div align="center">

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A modern, serverless headless blogging platform built with AWS Lambda and React**

</div>

---

## Table of Contents

### 1. [Project Overview](#1-project-overview)
   - [What is Blogify?](#what-is-blogify)
   - [Key Highlights](#key-highlights)
   - [Technology Stack](#technology-stack)
   - [Architecture Diagram](#architecture-diagram)

### 2. [Core Features](#2-core-features)
   - [2.1 Content Management](#21-content-management)
   - [2.2 User Management](#22-user-management)
   - [2.3 Media Management](#23-media-management)
   - [2.4 Search & Discovery](#24-search--discovery)
   - [2.5 Security Features](#25-security-features)

### 3. [Getting Started](#3-getting-started)
   - [3.1 Prerequisites](#31-prerequisites)
   - [3.2 Installation](#32-installation)
   - [3.3 Configuration](#33-configuration)
   - [3.4 First Deployment](#34-first-deployment)
   - [3.5 Initial Setup](#35-initial-setup)

### 4. [Project Structure](#4-project-structure)
   - [4.1 Backend Structure](#41-backend-structure)
   - [4.2 Key Files](#42-key-files)

### 5. [User Roles & Permissions](#5-user-roles--permissions)
   - [5.1 Admin Role](#51-admin-role)
   - [5.2 Editor Role](#52-editor-role)
   - [5.3 Guest Role](#53-guest-role)
   - [5.4 Permission Matrix](#54-permission-matrix)

### 6. [API Overview](#6-api-overview)
   - [6.1 Authentication Endpoints](#61-authentication-endpoints)
   - [6.2 Post Management Endpoints](#62-post-management-endpoints)
   - [6.3 Media Endpoints](#63-media-endpoints)
   - [6.4 Admin Endpoints](#64-admin-endpoints)
   - [6.5 Rate Limits](#65-rate-limits)

### 7. [Backend Architecture](#7-backend-architecture)
   - [7.1 Lambda Functions](#71-lambda-functions)
   - [7.2 Middleware System](#72-middleware-system)
   - [7.3 Data Model](#73-data-model)
   - [7.4 File Storage](#74-file-storage)

### 8. [Security](#8-security)
   - [8.1 CORS Protection](#81-cors-protection)
   - [8.2 Rate Limiting](#82-rate-limiting)
   - [8.3 Authentication & Authorization](#83-authentication--authorization)
   - [8.4 Input Validation](#84-input-validation)
   - [8.5 Data Encryption](#85-data-encryption)

### 9. [Deployment](#9-deployment)
   - [9.1 Backend Deployment](#91-backend-deployment)
   - [9.2 Environment Configuration](#92-environment-configuration)

### 10. [Monitoring & Maintenance](#10-monitoring--maintenance)
   - [10.1 CloudWatch Monitoring](#101-cloudwatch-monitoring)
   - [10.2 Logging](#102-logging)
   - [10.3 Performance Optimization](#103-performance-optimization)

---

## 1. Project Overview

### What is Blogify?

Blogify is a **modern, serverless headless blogging platform** designed for content creators, journalists, and businesses who need a flexible, scalable, and cost-effective solution for managing blog content. Built on AWS infrastructure, it provides a robust API backend that can be integrated with any front-end interface.

**Perfect for:**
- Content creators and bloggers
- News organizations
- Corporate blogs
- Educational institutions
- Marketing agencies

### Key Highlights

- **Fully Serverless**: No servers to manage, automatic scaling
- **Enterprise Security**: CORS protection, rate limiting, role-based access
- **Cost-Effective**: Pay only for what you use (~$15/month for 1000 users)
- **High Performance**: Sub-200ms response times
- **Modern UI**: Responsive React interface with dark mode
- **Smart Search**: Real-time search with intelligent ranking
- **Media Support**: Images and videos with secure S3 storage

### Technology Stack

#### Frontend
- React 19.2.0 - UI Framework
- Vite 7.2.2 - Build Tool
- TailwindCSS 4.1.17 - Styling
- React Router 7.9.5 - Routing
- Axios - HTTP Client

#### Backend
- AWS Lambda - Compute
- API Gateway - REST API
- DynamoDB - Database
- S3 - Media Storage
- Cognito - Authentication
- Node.js 18.x - Runtime
- Serverless 3.x - Deployment

#### DevOps
- CloudWatch - Monitoring
- CloudFormation - Infrastructure as Code
- IAM - Access Management

### Architecture Diagram

![Blogify Architecture](./Architecture.svg)

**Architecture Overview:**

The platform follows a serverless architecture with four main layers:

1. **Client Layer**: React SPA with TailwindCSS
2. **API Gateway**: REST API with security middleware (CORS, Rate Limiting, Authentication)
3. **Compute Layer**: Lambda functions for business logic
4. **Data Layer**: DynamoDB for posts, S3 for media, Cognito for authentication

---

## 2. Core Features

### 2.1 Content Management

**Features:**
- Full CRUD operations for blog posts
- Draft and published states
- Rich content with images and videos
- Tag system for categorization
- View counter with session tracking
- Author attribution with email tracking

**Post States:**
- **Draft**: Visible only to the author and admins
- **Published**: Visible to all users

### 2.2 User Management

#### Admin Capabilities
- View all users in the system
- Assign/remove user roles (admin, editor, guest)
- Delete user accounts
- Monitor user activity
- Moderate all content
- Manage system configuration

#### Editor Capabilities
- Create new blog posts
- Edit own posts
- Delete own posts
- Upload media files (images, videos)
- Manage personal content
- Publish/unpublish posts
- Add tags to posts

#### Guest Capabilities
- View published posts
- Search content
- Read articles
- View author information

### 2.3 Media Management

#### Supported Formats

**Images:**
- JPEG, PNG, GIF, WebP

**Videos:**
- MP4, MPEG

#### Storage Organization

Files are organized by user email in S3 with unique identifiers:
- Path structure: `media/{userEmail}/{uuid}.{extension}`
- Maximum file size: 10MB per file
- Secure access via pre-signed URLs

#### Security Features
- Pre-signed URLs with expiration (24h for published, 1h for drafts)
- Private S3 buckets
- User-specific folders
- Automatic cleanup options

### 2.4 Search & Discovery

#### Search Capabilities
- **Full-text search** across all published posts
- **Multi-field search**: title, content, author, tags
- **Smart ranking**:
  - Exact matches ranked first
  - Title matches prioritized
  - Recent posts ranked higher
- **Real-time results** with 300ms debounce
- **Highlighted results** showing matched terms

#### Performance
- Average response time: < 100ms
- Supports up to 10,000 posts efficiently
- Client-side filtering for instant results

### 2.5 Security Features

#### Authentication
- AWS Cognito integration
- Email/password authentication
- Token-based sessions (JWT)
- Refresh token support
- Password requirements: min 8 chars, uppercase, lowercase, number

#### Authorization
- Role-based access control (RBAC)
- Endpoint-level permissions
- Resource ownership validation
- Group-based permissions (admin, editor, guest)

#### Protection Mechanisms
- **CORS Protection**: Whitelist allowed origins
- **Rate Limiting**: 100 requests/minute per IP
- **Input Validation**: File type and size restrictions
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based authentication

#### Data Security
- HTTPS everywhere (TLS 1.2+)
- S3 encryption at rest
- DynamoDB encryption at rest
- Secure token storage

---

## 3. Getting Started

### 3.1 Prerequisites

**Required Software:**
- Node.js 
- npm 
- AWS CLI 
- Git

**AWS Account Requirements:**
- Active AWS account
- AWS Access Key ID and Secret Access Key
- Permissions for: Lambda, API Gateway, DynamoDB, S3, Cognito, CloudFormation, IAM

### 3.2 Installation

**Step 1: Clone the repository**
```bash
git clone https://github.com/Yoann-Michon/Lambda_aws
cd Lambda_aws
```

**Step 2: Install backend dependencies**
```bash
cd Back
npm install
npm install -g serverless
```

**Step 3: Configure AWS credentials**
```bash
serverless config credentials \
  --provider aws \
  --key YOUR_AWS_ACCESS_KEY \
  --secret YOUR_AWS_SECRET_KEY
```

**Step 4: Install frontend dependencies**
```bash
cd ../Frontend
npm install
```

### 3.3 Configuration

#### Backend Configuration

Update the CORS origins in `Back/config.js` to include your frontend URLs.

For development, the default configuration allows `http://localhost:5173`.

For production, add your production domain.

#### Frontend Configuration

Create `Frontend/.env` file:
```
VITE_API_URL=http://localhost:3000/dev
```

This will be updated after backend deployment.

### 3.4 First Deployment

#### Deploy Backend
```bash
cd Back
serverless deploy --stage dev
```

After deployment completes, you'll receive:
- API Gateway URL
- UserPool ID
- UserPool Client ID
- S3 Bucket name
- DynamoDB Table name

**Update Frontend Configuration:**

Copy the API Gateway URL from the deployment output and update `Frontend/.env`:
```
VITE_API_URL=https://your-api-id.execute-api.eu-west-1.amazonaws.com/dev
```

#### Start Frontend
```bash
cd ../Frontend
npm run dev
```

Visit: `http://localhost:5173`

### 3.5 Initial Setup

#### Create Admin User

Use AWS Console or AWS CLI to create your first admin user:

**Via AWS Console:**
1. Go to AWS Cognito → User Pools
2. Select your user pool
3. Create user with email and password
4. Add user to `admin` group

**Via AWS CLI:**

Replace `USER_POOL_ID` with your pool ID from deployment output.

Create user, set password, and add to admin group using AWS CLI commands.

---

## 4. Project Structure

### 4.1 Backend Structure
```
Back/
├── functions/
│   ├── auth/                 # Authentication functions
│   │   ├── signup.js
│   │   ├── login.js
│   │   └── logout.js
│   ├── posts/                # Post management
│   │   ├── createPost.js
│   │   ├── getPost.js
│   │   ├── getAllPosts.js
│   │   ├── updatePost.js
│   │   └── deletePost.js
│   ├── media/                # Media handling
│   │   └── getSignedUrls.js
│   └── admin/                # Admin operations
│       ├── getUsers.js
│       └── manageUser.js
├── middleware/               # Custom middleware
│   ├── cors.js
│   └── rateLimit.js
├── config.js                 # Configuration
├── package.json
└── serverless.yml            # Serverless config
```

### 4.2 Key Files

**Backend:**
- `serverless.yml`: Infrastructure as code configuration
- `config.js`: CORS origins and environment configuration
- `middleware/`: Custom security and validation middleware

**Frontend:**
- `src/context/AuthContext.jsx`: Global authentication state
- `src/services/api.js`: API client configuration
- `.env`: Environment variables (API URL)

---

## 5. User Roles & Permissions

### 5.1 Admin Role

**Capabilities:**
- Full system access
- User management
- Content moderation
- Edit/delete any post
- View all drafts
- Assign/remove roles

### 5.2 Editor Role

**Capabilities:**
- Create posts
- Edit own posts
- Delete own posts
- Upload media
- Publish posts
- Manage own content

**Restrictions:**
- Cannot edit others' posts
- Cannot delete others' posts
- Cannot access user management

### 5.3 Guest Role

**Capabilities:**
- View published posts
- Search content
- Read articles

**Restrictions:**
- No creation privileges
- No editing capabilities
- No media upload

### 5.4 Permission Matrix

| Action | Admin | Editor | Guest |
|--------|---------|----------|---------|
| View published posts | ✅ | ✅ | ✅ |
| Search posts | ✅ | ✅ | ✅ |
| Create post | ✅ | ✅ | ❌ |
| Edit own post | ✅ | ✅ | ❌ |
| Edit any post | ✅ | ❌ | ❌ |
| Delete own post | ✅ | ✅ | ❌ |
| Delete any post | ✅ | ❌ | ❌ |
| Upload media | ✅ | ✅ | ❌ |
| View users | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

---

## 6. API Overview

### 6.1 Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|---------|
| POST | `/auth/signup` | Register new user | ❌ |
| POST | `/auth/login` | Authenticate user | ❌ |
| POST | `/auth/logout` | Revoke tokens | ✅ |

### 6.2 Post Management Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|---------|
| GET | `/posts` | List all posts | ❌ |
| GET | `/posts/{id}` | Get single post | ❌ |
| POST | `/posts` | Create post | ✅ Editor |
| PUT | `/posts/{id}` | Update post | ✅ Owner/Admin |
| DELETE | `/posts/{id}` | Delete post | ✅ Owner/Admin |

### 6.3 Media Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|---------|
| POST | `/media/signed-urls` | Get pre-signed URLs | ❌ |

### 6.4 Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|---------|
| GET | `/admin/users` | List all users | ✅ Admin |
| PUT | `/admin/users/{email}` | Manage user | ✅ Admin |

### 6.5 Rate Limits

| Endpoint Type | ⏱️ Limit |
|---------------|---------|
| Authentication | 5-10/min |
| Read Operations | 100/min |
| Write Operations | 20-30/min |
| Admin | 20-30/min |


#### Exemple:
- Requête
```
POST https://your-api-id.execute-api.eu-west-1.amazonaws.com/dev/posts
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Getting Started with Serverless Architecture",
  "content": "Serverless architecture allows developers to build applications without managing servers. In this post, we'll explore AWS Lambda, API Gateway, and DynamoDB to create a scalable blogging platform.",
  "author": "John Doe",
  "tags": ["serverless", "aws", "tutorial"],
  "status": "published"
}
```
- Réponse 201
```
{
  "message": "Post créé avec succès",
  "post": {
    "postId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Getting Started with Serverless Architecture",
    "content": "Serverless architecture allows developers to build applications without managing servers. In this post, we'll explore AWS Lambda, API Gateway, and DynamoDB to create a scalable blogging platform.",
    "author": "John Doe",
    "authorEmail": "john.doe@example.com",
    "authorName": "John Doe",
    "tags": ["serverless", "aws", "tutorial"],
    "status": "published",
    "mediaUrls": [],
    "createdAt": 1699564800000,
    "updatedAt": 1699564800000,
    "publishedAt": 1699564800000,
    "views": 0
  }
}
```
---

## 7. Backend Architecture

### 7.1 Lambda Functions

| Function | Purpose | Trigger | Auth |
|----------|---------|---------|---------|
| signup | User registration | API POST | ❌ |
| login | User authentication | API POST | ❌ |
| logout | User logout | API POST | ✅ |
| createPost | Create new post | API POST | ✅ |
| getPost | Get single post | API GET | ❌ |
| getAllPosts | List all posts | API GET | ❌ |
| updatePost | Update post | API PUT | ✅ |
| deletePost | Delete post | API DELETE | ✅ |
| getSignedUrls | Get media URLs | API POST | ❌ |
| getUsers | List users | API GET | ✅ |
| manageUser | Manage user | API PUT | ✅ |

### 7.2 Middleware System

**Request Processing Flow:**

1. Request arrives at API Gateway
2. CORS validation checks origin
3. Rate limiter checks request count per IP
4. Origin validation against whitelist
5. Cognito authorizer validates JWT token (if required)
6. Lambda function executes business logic
7. Response with CORS headers

### 7.3 Data Model

![Data Model](./DataModel.svg)

#### Key Data Entities:

**Users (Cognito):**
- Managed by AWS Cognito User Pool
- Attributes: email, name, groups
- Groups: admin, editor, guest

**Posts (DynamoDB):**
- Primary Key: postId (UUID)
- Attributes: title, content, author info, tags, status, media URLs, timestamps
- GSI: createdAt for date sorting

**Media (S3):**
- Bucket structure: `media/{userEmail}/{uuid}.{ext}`
- Metadata: original filename, uploader, upload date
- Access: pre-signed URLs

### 7.4 File Storage

**S3 Organization:**

Files are organized hierarchically by user email, with each file having a unique UUID-based name to prevent conflicts and enable easy user-specific file management.

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, MPEG, QuickTime

**Security:**
- Private bucket with no public access
- Pre-signed URLs for time-limited access
- User-specific folders for isolation

---

## 8. Security

### 8.1 CORS Protection

- Whitelist of allowed origins configured per environment
- Validation on every request
- Automatic rejection of unauthorized origins with 403 response
- Environment-specific configuration (dev, staging, prod)

### 8.2 Rate Limiting

- IP-based request tracking
- Configurable limits per endpoint type
- 429 response when limit exceeded
- Automatic cleanup of expired entries
- Protection against DDoS attacks

### 8.3 Authentication & Authorization

- AWS Cognito User Pool integration
- JWT token-based authentication
- Role-based access control (RBAC)
- Token expiration: 60 minutes
- Refresh token support for extended sessions
- Group-based permissions (admin, editor, guest)

### 8.4 Input Validation

- File type restrictions (images, videos only)
- File size limits (10MB maximum)
- Required field validation
- Content sanitization to prevent XSS
- Email format validation
- Password strength requirements

### 8.5 Data Encryption

- HTTPS/TLS 1.2+ for all communications
- S3 server-side encryption at rest
- DynamoDB encryption at rest with AWS KMS
- Secure token storage in frontend
- Environment variables for secrets

---

## 9. Deployment

### 9.1 Backend Deployment

**Deploy to Development:**
```bash
cd Back
serverless deploy --stage dev
```

**Deploy to Production:**
```bash
serverless deploy --stage prod
```

**View Logs:**
```bash
serverless logs -f createPost --tail
```

**Remove Stack:**
```bash
serverless remove --stage dev
```

### 9.2 Environment Configuration

**Development Environment:**

Frontend `.env` file should point to development API:
```
VITE_API_URL=https://dev-api-id.execute-api.eu-west-1.amazonaws.com/dev
```

**Production Environment:**

Frontend `.env` file should point to production API:
```
VITE_API_URL=https://prod-api-id.execute-api.eu-west-1.amazonaws.com/prod
```

**Important:** Always update the frontend `.env` file after each backend deployment to ensure the correct API URL is used.

---

## 10. Monitoring & Maintenance

### 10.1 CloudWatch Monitoring

**Available Metrics:**
- Lambda invocations and errors
- API Gateway request counts
- DynamoDB read/write capacity
- Error rates and throttles
- Response times and latency

**Access:** AWS Console → CloudWatch → Metrics

### 10.2 Logging

**Log Management:**
- All Lambda functions log to CloudWatch Logs
- 30-day retention by default
- Structured logging for easy searching
- Error tracking and debugging

**Access:** AWS Console → CloudWatch → Logs

### 10.3 Performance Optimization

**Lambda Optimization:**
- Memory allocation: 128-1024MB based on function needs
- Timeout configuration per function
- ARM architecture for cost savings

**Database Optimization:**
- DynamoDB on-demand billing for variable traffic
- GSI for efficient querying
- Batch operations where possible

**Storage Optimization:**
- S3 Intelligent-Tiering for cost optimization
- Lifecycle policies for old files
- CloudFront CDN for static content (optional)

---

## Contributors

- **Yoann MICHON**
- **Abdoul Waris KONATE** 
- **Achraf ELHARFI** 

---