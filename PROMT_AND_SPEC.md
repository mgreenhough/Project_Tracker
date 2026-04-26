# Priority Stack Project Tracker — Full Product & Architecture Specification

## Overview

Build a lightweight, highly visual, dark themed, low-friction project prioritization and tracking system optimized for rapid reprioritisation and operational visibility.

This is NOT intended to be enterprise project management software.

The core philosophy is:

* projects exist in a left to right ordered priority stack with sub tasks listed underneath vertically
* projects must be rapidly reorderable via drag-and-drop
* critical information must remain visible at all times
* editing must require minimal clicks/friction
* the interface must remain visually clean, minimalist and cognitively lightweight
* mobile usability is mandatory
* system must support public read-only access and FRICTIONLESS (ONE TIME) authenticated admin editing access
* system must support access from anywhere
* upon completion, projects will be archived and moved to a "completed" row below the active projects

---

# Core Concept

The application behaves like a "live operational stack."

Projects are displayed as Left to right ordered cards.

Each project contains:

* title
* Due date, optional (none or dd/mm/yy)
* visible ordered step list with check boxes and optional due date (none or dd/mm/yy)
    **IMPORTANT DETAIL: Checkboxes must support THREE cyclically selectable states: CLEAR → HOLD_POINT → COMPLETE**
* optional expandable notes
* optional future metadata

Projects can be reordered by drag-and-drop.

Priority is determined entirely by horizontal order.

Left = highest operational priority.

---

# Users

## Admin User

Capabilities:

* create/edit/delete projects
* reorder projects
* edit steps
* reorder steps
* archive projects
* manage metadata
* edit all content

Authentication required but needs to be one time only.

---

## Public Viewer

Capabilities:

* view all projects
* view priority ordering
* view steps
* view status indicators

No editing permissions.

No authentication required.

---

# Technical Goals

## Required

* mobile responsive
* fast UI
* low-friction editing
* persistent cloud-backed storage
* accessible from anywhere
* drag-and-drop interaction
* auto-save
* public read-only mode
* authenticated admin mode

---

# Recommended Architecture

## Frontend

Framework:

* React

Styling:

* TailwindCSS

Drag-and-drop:

* dnd-kit

State management:

* Zustand

---

# Hosting

Frontend hosting options:

Preferred:

* GitHub Pages

Backend:

* Tiny Node.js API on my linux server

Database:

* SQL lite

---

# Authentication Requirements

Use authenticated admin access.

Requirements:

* secure login
* persistent session
* protected edit routes
* public read-only access without login

Preferred auth:

* email/password
* optional GitHub OAuth later

---

# UI Philosophy

The UI must prioritize:

* visibility
* speed
* low cognitive load
* minimal navigation depth

Avoid:

* excessive menus
* modal-heavy interaction
* complex dashboards
* corporate PM aesthetics

---

# Layout Specification

## Desktop Layout

Horizontally stacked cards.

Example:

```txt
================================================
PROJECT STACK
================================================

[≡] UART Emulator                   [≡] UHF Radio                        [≡] Governance Architecture
    Current: Due: dd/mm/yy                Current: Due: None                     Current: Due: None
    - fix timing parser        []         - test filter topology     []            - refine scoring logic           []
    - validate edge cases      []         - redesign enclosure dd/mm []            - update documentation  dd/mm/yy []
    - test hardware interface  []
    
```

---

## Mobile Layout

Rotatable view

Requirements:

* thumb-friendly drag handles
* large touch targets
* inline editing must remain usable
* no hover-dependent interactions

---

# Core Features

## Project Features

### Create Project

Fields:

* title
* Due date (none or dd/mm/yy)
* visibility (public/private)
* archived state

---

### Edit Project

Inline editing preferred.

Avoid separate edit screens.

---

### Delete Project

Soft delete preferred.

---

### Archive Project

Archived projects moved to a "completed" horizontal row below the active projects and re colour coded.

---

## Step Features

Each project contains ordered steps.

Requirements:

* inline editable
* reorderable
* add/remove steps and due dates quickly

Recommended limits:

* <10 visible steps

---

# Drag-and-Drop Requirements

## Projects

Must support:

* mouse drag
* touch drag

Animations should be subtle and fast.

---

## Due Date Colouring

* due dates should be highlighted based on urgency in THREE stages
* high urgency (within 7 days): red, medium urgency (within 14 days): orange, low urgency (beyond 14 days): white
* Tasks and projects with a due date of high and medium urgency should make project cards visually distinct by using appropriate highlighting of project card and bold labels

---

## Views

* Zoom should be enabled but in a unique manner
* Zooming should not change text or card size
* Zoom should adjust horizontal overlap of cards so that many cards can be fit on the screen efficiently or zooming in will show each card separately

* **IMPORTANT DETAIL: When cards are overlapped, they should be vertically cascaded by at least one line to ensure that the full title and due date (if any) of each card remain visible. Left-most card (highest priority) should be in front, cascading up and to the right.**

---

## Future Automation

* reminders

---

# Database Schema

## projects

Fields:

```sql
id UUID PRIMARY KEY
title TEXT
description TEXT
priority_index INTEGER
is_public BOOLEAN
is_archived BOOLEAN
due_date DATE
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## steps

Fields:

```sql
id UUID PRIMARY KEY
project_id UUID
content TEXT
step_order INTEGER
due_date DATE
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

# API Requirements

## Public Endpoints

### GET /projects

---

## Admin Endpoints

### POST /project

### PUT /project/:id

### DELETE /project/:id

### POST /step

### PUT /step/:id

### DELETE /step/:id

Authentication required.

---

# Performance Requirements

Must remain extremely responsive with:

* up to 30 projects
* 10 steps per project

Avoid unnecessary re-renders.

---

# Design Direction

Visual style should be:

* dark theme
* minimalist, modern
* information-dense
* clean typography
* subtle separators
* no excessive gradients

---

# Suggested Color Usage

Neons

---

# Editing UX Requirements

Must support:

* click-to-edit
* Enter to confirm
* Escape to cancel
* fast keyboard workflows

Auto-save.

---

# Security Requirements

Public users:

* read-only access

Admin users:

* authenticated only

Do not expose admin endpoints publicly.

---

# Deployment Requirements

Must support:

* deployment from GitHub repository
* automated frontend deployment
* environment variables for API keys

---

# Recommended AI Coding Workflow

Use iterative generation.

Order:

1. scaffold frontend
2. build project card component
3. build drag system
4. build persistence
5. build authentication
6. build public/admin modes
7. optimize mobile UX
8. polish interactions

Do NOT attempt full generation in one pass.

---

# Final Product Goal

The final system should feel like:

* a live operational command stack
* fast to update
* visually stable
* cognitively lightweight
* always visible
* frictionless to reprioritize

The system should encourage continuous operational clarity rather than bureaucratic task management.
