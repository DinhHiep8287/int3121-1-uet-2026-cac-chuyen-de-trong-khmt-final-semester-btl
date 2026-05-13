# Software Requirements Specification
## For ViSignAR

Version 1.2  
Prepared by Project Team  
UET  
2026-05-13

## Table of Contents
<!-- TOC -->
* [1. Introduction](#1-introduction)
    * [1.1 Document Purpose](#11-document-purpose)
    * [1.2 Product Scope](#12-product-scope)
    * [1.3 Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
    * [1.4 References](#14-references)
    * [1.5 Document Overview](#15-document-overview)
* [2. Product Overview](#2-product-overview)
    * [2.1 Product Perspective](#21-product-perspective)
    * [2.2 Product Functions](#22-product-functions)
    * [2.3 Product Constraints](#23-product-constraints)
    * [2.4 User Characteristics](#24-user-characteristics)
    * [2.5 Assumptions and Dependencies](#25-assumptions-and-dependencies)
    * [2.6 Apportioning of Requirements](#26-apportioning-of-requirements)
* [3. Requirements](#3-requirements)
    * [3.1 External Interfaces](#31-external-interfaces)
    * [3.2 Functional](#32-functional)
    * [3.3 Quality of Service](#33-quality-of-service)
    * [3.4 Compliance](#34-compliance)
    * [3.5 Design and Implementation](#35-design-and-implementation)
    * [3.6 AI/ML](#36-aiml)
* [4. Verification](#4-verification)
* [5. Appendixes](#5-appendixes)
<!-- TOC -->

## Revision History

| Name | Date | Reason For Changes | Version |
|------|------|--------------------|---------|
| Project Team | 2026-05-13 | Initial ViSignAR SRS draft | 1.0 |
| Project Team | 2026-05-13 | One-way speech-only scope, Expo-first delivery, deterministic dictionary and animation specification | 1.2 |

## 1. Introduction
This SRS defines requirements for ViSignAR, a mobile app that converts live Vietnamese speech into Vietnamese Sign Language (VSL) 3D animation output.

### 1.1 Document Purpose
This SRS defines concrete, testable requirements for product, engineering, and QA so that any team can implement ViSignAR consistently in Unity and Expo.

### 1.2 Product Scope
ViSignAR supports one direction only: live Vietnamese speech -> VSL 3D sign animation.  
ViSignAR does not include typed text input, reverse translation, account systems, or non-core modules.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| VSL | Vietnamese Sign Language |
| SRS | Software Requirements Specification |
| UI | User Interface |
| STT | Speech-to-Text |
| Expo | Expo tooling/runtime for React Native app development and distribution |

### 1.4 References
- React Native docs: [https://reactnative.dev/docs/getting-started](https://reactnative.dev/docs/getting-started)
- Expo docs: [https://docs.expo.dev/](https://docs.expo.dev/)
- Unity Manual: [https://docs.unity3d.com/Manual/index.html](https://docs.unity3d.com/Manual/index.html)
- OpenAI Speech-to-Text guide: [https://platform.openai.com/docs/guides/speech-to-text](https://platform.openai.com/docs/guides/speech-to-text)
- Vietnamese sign dictionary portal: [https://tudienngonngukyhieu.com/](https://tudienngonngukyhieu.com/)
- Vietnamese sign lesson portal: [https://nnkh.thaiphong.net/](https://nnkh.thaiphong.net/)
- Example Vietnamese sign entry (chao): [https://www.tudienngonngukyhieu.com/tu-ngu/chao-2471](https://www.tudienngonngukyhieu.com/tu-ngu/chao-2471)
- Example Vietnamese sign entry (cam on): [https://www.tudienngonngukyhieu.com/tu-ngu/cam-on-2424](https://www.tudienngonngukyhieu.com/tu-ngu/cam-on-2424)
- Example Vietnamese sign entry (nuoc): [https://www.tudienngonngukyhieu.com/tu-ngu/nuoc-1441](https://www.tudienngonngukyhieu.com/tu-ngu/nuoc-1441)

### 1.5 Document Overview
Section 2 defines product boundaries. Section 3 defines implementation requirements. Section 4 defines verification criteria. Section 5 provides dictionary and animation specification appendixes.

## 2. Product Overview

### 2.1 Product Perspective
ViSignAR is a mobile translation app with deterministic speech-to-sign conversion and Unity-based 3D avatar rendering.

### 2.2 Product Functions
- Capture live Vietnamese speech.
- Transcribe speech to Vietnamese text using STT API.
- Normalize and tokenize transcript deterministically.
- Resolve tokens/phrases into sign IDs via dictionary.
- Play an ordered VSL animation sequence in Unity.
- Show clear status for success and unknown terms.

### 2.3 Product Constraints
- UI colors must be exactly `#000000`, `#FFFFFF`, `#013392`.
- Input channel is live speech only.
- Translation engine is deterministic dictionary mapping.
- Stack is minimal: Expo + React Native app shell, Unity embedded runtime, OpenAI STT API.

### 2.4 User Characteristics
- Primary user: Vietnamese speaker requiring VSL visual output.
- Interaction style: short speech sessions with single-tap controls.
- Technical profile: non-technical end user.

### 2.5 Assumptions and Dependencies
- Device microphone is available.
- Device network is available for STT API.
- Dictionary and Unity animation clips are prepared according to Appendix C and D.

### 2.6 Apportioning of Requirements

| Allocation | Requirement Areas | Notes |
|-----------|--------------------|-------|
| Mobile shell | REQ-INT-001..REQ-INT-007 | Expo/RN UI and session control |
| Translation runtime | REQ-FUNC-001..REQ-FUNC-010 | Speech -> transcript -> dictionary -> animation |
| Deterministic data assets | REQ-ML-001..REQ-ML-005 | Dictionary and animation manifest governance |

## 3. Requirements

### 3.1 External Interfaces

#### 3.1.1 User Interfaces
| Fields | Descriptions |
|---|---|
| ID | REQ-INT-001 |
| Title | Strict Three-Color Palette |
| Statement | The UI shall use only `#000000`, `#FFFFFF`, and `#013392` for all visual components. |
| Rationale | Ensures consistent visual identity. |
| Acceptance Criteria | No non-approved color appears in stylesheet or runtime theme tokens. |
| Verification Method | Inspection |
| More Information | Gradients and additional accent colors are prohibited. |

| Fields | Descriptions |
|---|---|
| ID | REQ-INT-002 |
| Title | Minimal Screen Structure |
| Statement | The app shall expose exactly three screens: Home, Speech-to-Sign, and Settings/About. |
| Rationale | Keeps navigation minimal. |
| Acceptance Criteria | Navigation map includes no additional destinations. |
| Verification Method | Inspection |
| More Information | Debug screens are allowed only in development profile. |

| Fields | Descriptions |
|---|---|
| ID | REQ-INT-003 |
| Title | Speech Session Controls |
| Statement | The Speech-to-Sign screen shall provide Start, Stop, and Reset controls and visual status badges (`idle`, `listening`, `processing`, `playing`, `unknown`, `error`). |
| Rationale | User needs explicit control and state visibility. |
| Acceptance Criteria | Controls update session state deterministically in all test runs. |
| Verification Method | Test |
| More Information | Status badge transitions must be logged. |

#### 3.1.2 Hardware Interfaces
| Fields | Descriptions |
|---|---|
| ID | REQ-INT-004 |
| Title | Microphone Capture Interface |
| Statement | The app shall capture mono microphone audio stream during active speech session only. |
| Rationale | Enforces bounded capture behavior. |
| Acceptance Criteria | Audio capture starts only after Start and stops immediately on Stop/Reset. |
| Verification Method | Test |
| More Information | No background capture outside active screen session. |

#### 3.1.3 Software Interfaces
| Fields | Descriptions |
|---|---|
| ID | REQ-INT-005 |
| Title | Expo Runtime Interface |
| Statement | The app shall be runnable through Expo workflow (development build and production build pipeline). |
| Rationale | Simplifies build and test iteration. |
| Acceptance Criteria | Project runs via Expo start command and produces installable build via Expo build pipeline. |
| Verification Method | Demonstration |
| More Information | Project setup must include explicit Expo commands. |

| Fields | Descriptions |
|---|---|
| ID | REQ-INT-006 |
| Title | OpenAI STT Service Interface |
| Statement | Speech transcription shall use OpenAI STT API with explicit timeout, retry, and error code handling in app state. |
| Rationale | Provides modern low-cost speech transcription. |
| Acceptance Criteria | Interim/final transcript events are received and mapped to UI state; failure responses produce deterministic error state. |
| Verification Method | Test |
| More Information | API key configuration must be externalized from source code. |

| Fields | Descriptions |
|---|---|
| ID | REQ-INT-007 |
| Title | Unity Playback Bridge |
| Statement | RN shell shall call Unity bridge method `playSequence(signIds, delayMs)` to play ordered sign clips. |
| Rationale | Creates deterministic playback handoff to avatar renderer. |
| Acceptance Criteria | Bridge call with valid sign IDs triggers ordered playback in Unity scene. |
| Verification Method | Test |
| More Information | Bridge must return playback completion callback. |

### 3.2 Functional

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-001 |
| Title | Speech-Only Input Scope |
| Statement | The system shall accept live Vietnamese speech only as translation input. |
| Rationale | Enforces strict one-channel scope. |
| Acceptance Criteria | No typed input field exists in production UI. |
| Verification Method | Inspection |
| More Information | Any non-speech source is out of scope. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-002 |
| Title | Continuous Transcript Session |
| Statement | During active speech session, system shall accumulate final transcript segments in FIFO order. |
| Rationale | Preserves phrase order for deterministic mapping. |
| Acceptance Criteria | Segment sequence order equals speech finalization order across stress tests. |
| Verification Method | Test |
| More Information | Queue depth metric must be logged. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-003 |
| Title | Deterministic Normalization |
| Statement | Final transcript text shall be normalized by lowercase conversion, trim, and space collapsing while preserving Vietnamese diacritics. |
| Rationale | Stabilizes dictionary lookup. |
| Acceptance Criteria | Identical raw transcript inputs always produce identical normalized output. |
| Verification Method | Test |
| More Information | Normalization step output must be traceable in debug logs. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-004 |
| Title | Phrase-First Dictionary Lookup |
| Statement | Lookup engine shall resolve phrase entries before token entries and use longest-match strategy at each cursor position. |
| Rationale | Prevents phrase fragmentation errors. |
| Acceptance Criteria | For overlapping entries, selected output always matches longest valid phrase. |
| Verification Method | Test |
| More Information | Tie-break rule: explicit `priority` field, then lexical order. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-005 |
| Title | Unknown-Term Handling |
| Statement | Unresolved units shall emit `Khong nhan dang duoc` status and shall not produce placeholder sign playback. |
| Rationale | Avoids fabricated sign output. |
| Acceptance Criteria | Forced OOV test set always yields fallback status only. |
| Verification Method | Test |
| More Information | OOV report includes unresolved source term and position. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-006 |
| Title | Ordered Sign Queue Playback |
| Statement | Resolved sign IDs shall be enqueued and played sequentially by a single playback worker. |
| Rationale | Ensures readable non-overlapping output. |
| Acceptance Criteria | No two clips overlap within same hand channel in playback logs. |
| Verification Method | Test |
| More Information | Queue worker state is observable (`idle`, `running`, `completed`). |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-007 |
| Title | Inter-Sign Delay Rule |
| Statement | Playback engine shall insert default 1000 ms delay between signs unless per-entry override is defined. |
| Rationale | Controls sign readability and rhythm. |
| Acceptance Criteria | 95% of measured inter-sign intervals are within +/-100 ms of configured value. |
| Verification Method | Test |
| More Information | Delay value is configurable in settings. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-008 |
| Title | Session Reset Behavior |
| Statement | Reset action shall clear transcript queue, lookup state, and playback queue before accepting new speech. |
| Rationale | Prevents stale data propagation across sessions. |
| Acceptance Criteria | After reset, first new speech segment starts from clean state with no previous output carry-over. |
| Verification Method | Test |
| More Information | Reset event must include timestamped audit log entry. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-009 |
| Title | Unity Avatar Output |
| Statement | Each resolved sign ID shall map to a Unity animation clip with defined start pose, stroke movement, hold, and return phases. |
| Rationale | Guarantees implementable and consistent sign rendering. |
| Acceptance Criteria | For every sign in mandatory dictionary, corresponding clip exists and passes phase validation. |
| Verification Method | Inspection |
| More Information | Phase specification is defined in Appendix D. |

| Fields | Descriptions |
|---|---|
| ID | REQ-FUNC-010 |
| Title | Scope Enforcement |
| Statement | The app shall not implement reverse translation, typed input, or additional functional modules outside speech-to-sign workflow. |
| Rationale | Keeps product boundary unambiguous. |
| Acceptance Criteria | Scope audit report confirms absence of excluded capabilities. |
| Verification Method | Inspection |
| More Information | Applies to UI, API, and runtime modules. |

### 3.3 Quality of Service

#### 3.3.1 Security
| Fields | Descriptions |
|---|---|
| ID | REQ-SEC-001 |
| Title | Minimal Permission Surface |
| Statement | App shall request only microphone permission in production mode. |
| Rationale | Reduces privacy surface and permission friction. |
| Acceptance Criteria | Manifest and runtime prompts include only microphone access. |
| Verification Method | Inspection |
| More Information | Camera permission is excluded from production mode. |

#### 3.3.2 Reliability
| Fields | Descriptions |
|---|---|
| ID | REQ-REL-001 |
| Title | STT Failure Recovery |
| Statement | On STT timeout/network errors, app shall keep current screen responsive and allow immediate retry from same session. |
| Rationale | Maintains user continuity under service disruptions. |
| Acceptance Criteria | Failure injection tests show no crash and successful retry path. |
| Verification Method | Test |
| More Information | Error state message must be explicit and user-readable. |

#### 3.3.3 Availability
| Fields | Descriptions |
|---|---|
| ID | REQ-AVAIL-001 |
| Title | Demo Stability Requirement |
| Statement | App shall complete speech-to-sign workflow repeatedly for a 30-minute session without forced reinstall or redeploy. |
| Rationale | Ensures practical demo readiness. |
| Acceptance Criteria | Five consecutive end-to-end runs pass in same app installation. |
| Verification Method | Demonstration |
| More Information | Includes stop/reset/restart control usage. |

#### 3.3.4 Observability
| Fields | Descriptions |
|---|---|
| ID | REQ-OBS-001 |
| Title | Required Runtime Logs |
| Statement | App shall log session state transitions, transcript queue events, lookup outcomes, playback events, and STT service errors. |
| Rationale | Enables deterministic debugging and acceptance verification. |
| Acceptance Criteria | Log schema includes all required event families and timestamps. |
| Verification Method | Inspection |
| More Information | Log schema is specified in Appendix E. |

### 3.4 Compliance
| Fields | Descriptions |
|---|---|
| ID | REQ-COMP-001 |
| Title | Speech Capture Notice |
| Statement | Before first session start, app shall present a Vietnamese consent notice for microphone capture and STT processing. |
| Rationale | Provides clear user consent boundary. |
| Acceptance Criteria | Notice requires explicit acknowledgment before Start is enabled. |
| Verification Method | Demonstration |
| More Information | Notice text must be concise and visible. |

### 3.5 Design and Implementation

#### 3.5.1 Installation
| Fields | Descriptions |
|---|---|
| ID | REQ-INST-001 |
| Title | Expo Run Command |
| Statement | Developer setup shall support running the app via Expo command workflow. |
| Rationale | Standardizes execution path for all engineers. |
| Acceptance Criteria | Fresh environment runs app using documented Expo commands only. |
| Verification Method | Demonstration |
| More Information | Setup instructions must include exact command sequence. |

#### 3.5.2 Build and Delivery
| Fields | Descriptions |
|---|---|
| ID | REQ-BUILD-001 |
| Title | Expo Build Pipeline |
| Statement | Build and release artifacts shall be generated through Expo build pipeline. |
| Rationale | Simplifies reproducible packaging. |
| Acceptance Criteria | Build artifacts are generated from Expo pipeline without manual native project edits. |
| Verification Method | Test |
| More Information | Versioned build profile must be committed. |

#### 3.5.3 Distribution
| Fields | Descriptions |
|---|---|
| ID | REQ-DIST-001 |
| Title | Expo Distribution Path |
| Statement | Prototype distribution shall use Expo-supported distribution path for internal testers. |
| Rationale | Reduces release complexity. |
| Acceptance Criteria | Tester can install and run build delivered through Expo channel. |
| Verification Method | Demonstration |
| More Information | Distribution guide must contain one canonical path. |

#### 3.5.4 Portability
| Fields | Descriptions |
|---|---|
| ID | REQ-PORT-001 |
| Title | Expo Cross-Platform Runtime |
| Statement | The same Expo project shall run on Android and iOS test devices without branch-specific feature logic. |
| Rationale | Maintains single implementation path. |
| Acceptance Criteria | One test Android and one test iOS device complete full speech-to-sign flow successfully. |
| Verification Method | Test |
| More Information | Platform-specific bug fixes are allowed only if behavior remains equivalent. |

### 3.6 AI/ML

#### 3.6.1 Deterministic Translation Core
| Fields | Descriptions |
|---|---|
| ID | REQ-ML-001 |
| Title | Deterministic Mapping Requirement |
| Statement | Speech transcript conversion to sign sequence shall be dictionary-driven and deterministic. |
| Rationale | Guarantees repeatable output behavior. |
| Acceptance Criteria | Same normalized transcript always yields identical sign ID sequence. |
| Verification Method | Test |
| More Information | Applies to all entries in mandatory dictionary set. |

#### 3.6.2 Dictionary Asset Governance
| Fields | Descriptions |
|---|---|
| ID | REQ-ML-002 |
| Title | Versioned Dictionary Asset |
| Statement | Dictionary file and animation manifest shall be versioned and shipped together. |
| Rationale | Prevents mapping/playback mismatch. |
| Acceptance Criteria | Release artifact includes matching dictionary and manifest versions. |
| Verification Method | Inspection |
| More Information | Version mismatch blocks release. |

#### 3.6.3 Guardrails
| Fields | Descriptions |
|---|---|
| ID | REQ-ML-003 |
| Title | Unknown-Term Guardrail |
| Statement | Unknown transcript units shall produce fallback status and no animation playback for that unit. |
| Rationale | Prevents invalid output generation. |
| Acceptance Criteria | OOV test pack always triggers fallback only. |
| Verification Method | Test |
| More Information | Fallback status string must be consistent system-wide. |

#### 3.6.4 Ethics
| Fields | Descriptions |
|---|---|
| ID | REQ-ML-004 |
| Title | Dictionary Coverage Notice |
| Statement | App shall notify users that output coverage is limited to configured dictionary entries. |
| Rationale | Sets explicit usage expectation. |
| Acceptance Criteria | Notice appears before first translation session. |
| Verification Method | Demonstration |
| More Information | Notice language is Vietnamese. |

#### 3.6.5 Operational Boundary
| Fields | Descriptions |
|---|---|
| ID | REQ-ML-005 |
| Title | No Training Pipeline Requirement |
| Statement | Release pipeline shall not depend on model training/retraining stages for translation core. |
| Rationale | Keeps runtime deterministic and implementation minimal. |
| Acceptance Criteria | Build process completes without training jobs or model artifact generation. |
| Verification Method | Inspection |
| More Information | Translation output depends only on dictionary and animation assets. |

## 4. Verification

| Requirement ID | Verification Method | Test/Artifact Link | Status | Evidence |
|----------------|---------------------|--------------------|--------|----------|
| REQ-INT-001 | inspection | audit-color-palette.md | Planned | Style audit report |
| REQ-INT-005 | demonstration | verify-expo-run.md | Planned | Expo run recording |
| REQ-INT-006 | test | test-stt-timeout-retry.md | Planned | API event traces |
| REQ-FUNC-002 | test | test-transcript-queue-order.md | Planned | Queue log snapshots |
| REQ-FUNC-004 | test | test-phrase-first-lookup.md | Planned | Lookup trace logs |
| REQ-FUNC-006 | test | test-playback-worker-order.md | Planned | Unity playback logs |
| REQ-FUNC-009 | inspection | inspect-sign-clip-phases.md | Planned | Clip phase checklist |
| REQ-FUNC-010 | inspection | scope-audit.md | Planned | Scope compliance report |
| REQ-REL-001 | test | retry-flow-validation.md | Planned | Failure-recovery run output |
| REQ-BUILD-001 | test | expo-build-validation.md | Planned | Build artifact evidence |
| REQ-PORT-001 | test | android-ios-parity.md | Planned | Device test sheet |
| REQ-ML-002 | inspection | dictionary-manifest-version-check.md | Planned | Version lock report |

## 5. Appendixes

### Appendix A: Out-of-Scope
- Reverse translation (sign-to-text).
- Typed text input.
- User accounts, profiles, cloud sync, admin portal.
- Training/retraining pipeline for translation core.

### Appendix B: Prototype Success Criteria
- Speech-to-sign flow is operational end-to-end.
- Unity avatar plays deterministic sign sequences from dictionary.
- App runs and builds through Expo workflow.

### Appendix C: Minimal Dictionary Schema

#### C.1 Schema
```json
{
  "version": "1.0.0",
  "entries": [
    { "source": "xin chao", "signIds": ["SIGN-CHAO"] },
    { "source": "cam on", "signIds": ["SIGN-CAM_ON"] }
  ]
}
```

#### C.2 Required Rules
1. `source` must be normalized Vietnamese text.
2. `signIds` must be ordered playback IDs.
3. `source` must be unique.
4. Empty `signIds` is invalid.

### Appendix D: Mandatory v1 Dictionary and Animation Specification

#### D.1 Mandatory v1 Word Set
The following words/phrases are required in v1 dictionary:
- Greetings/politeness: `xin chao`, `cam on`
- Pronouns: `toi`, `ban`, `chung toi`, `chung ta`
- Question words: `ai`, `o dau`, `gi`, `bao nhieu`, `luc nao`
- Family core: `gia dinh`, `cha`, `me`, `ong`, `ba`, `anh`, `chi`, `em`
- Core actions/objects: `an`, `uong`, `nuoc`, `nha`

#### D.2 Canonical reference sources
- For `chao`: [https://www.tudienngonngukyhieu.com/tu-ngu/chao-2471](https://www.tudienngonngukyhieu.com/tu-ngu/chao-2471)
- For `cam on`: [https://www.tudienngonngukyhieu.com/tu-ngu/cam-on-2424](https://www.tudienngonngukyhieu.com/tu-ngu/cam-on-2424)
- For `nuoc`: [https://www.tudienngonngukyhieu.com/tu-ngu/nuoc-1441](https://www.tudienngonngukyhieu.com/tu-ngu/nuoc-1441)
- Lesson index references for additional mandatory words:
  - Pronouns: [https://nnkh.thaiphong.net/bai-hoc/bai-3.php](https://nnkh.thaiphong.net/bai-hoc/bai-3.php)
  - Question words: [https://nnkh.thaiphong.net/bai-hoc/bai-5.php](https://nnkh.thaiphong.net/bai-hoc/bai-5.php)
  - Family words: [https://nnkh.thaiphong.net/bai-hoc/bai-8.php](https://nnkh.thaiphong.net/bai-hoc/bai-8.php)

#### D.3 Animation clip contract per sign
Each `SIGN-*` clip in Unity shall implement:
1. `phase_start` (0.0s-0.2s): neutral pose acquisition.
2. `phase_stroke` (0.2s-0.8s): main sign movement.
3. `phase_hold` (0.8s-0.95s): endpoint hold for readability.
4. `phase_return` (0.95s-1.2s): return toward neutral.

Each clip must be exported at 30 FPS and tagged with:
- `signId`
- `sourceReferenceUrl`
- `handedness` (`right`, `left`, `both`)
- `bodyAnchor` (`face`, `chest`, `neutral-space`)

#### D.4 Required motion specifics for core signs
- `SIGN-CHAO` (`xin chao`): right hand starts near right temple/forehead, palm oriented forward, outward greeting stroke, return to neutral.
- `SIGN-CAM_ON` (`cam on`): right hand starts near mouth/chin region, forward-outward gratitude stroke, soft hold, return.
- `SIGN-UONG` (`uong` / `nuoc` compound component): hand forms cup-like grasp near mouth, tilt motion indicating drinking action.
- `SIGN-TOI` (`toi`): chest-pointing motion anchored at sternum.
- `SIGN-BAN` (`ban`): forward pointing motion toward interlocutor space.

These motions must be authored to visually match canonical VSL reference videos linked in D.2.

### Appendix E: Minimal Runtime Log Schema
```json
{
  "ts": "2026-05-13T22:00:00Z",
  "event": "lookup_resolved",
  "session": "S-001",
  "value": "xin chao -> SIGN-CHAO"
}
```

Required `event` values:
- `session_start`
- `session_stop`
- `transcript_final`
- `lookup_resolved`
- `lookup_unresolved`
- `playback_start`
- `playback_complete`
- `stt_error`

