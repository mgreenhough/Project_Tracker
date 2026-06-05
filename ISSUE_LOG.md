# Current issue @ 20/05

1. [x] Tasks need to be word wrapped so entire task is visable.

2. [x] Add ability to De-archive projects

3. [X] Auto capitalise first letter of each task

4. [x] Project drag is a bit clunky and needs improvement, there is not preview of where current drag position will locate the project. Almost needs to be "live" move. Tasks within projects drag beautifully.

5. [x] Due date is having No effect on COLOUR

6. [x] Task checkbox is not visible until checked. Needs to be atleast a blank box.

7. [x] Enable delete project functionality to archived projects. projects remain editable in current archive view but but entire bottom line of "+ step" "archive" and "delete" is not there... you have made edits pertaining to issues above which are not reflected in the GIT but you have not made edits pertaining to this issue. apparently the code for the button already exist. I would look deeper.

8. [x] Projects are cascading down. They actually need to cascade upwards because project title is not visible behind project infront. Change PROMT_AND_SPEC.md and any other relevant files to reflect this also.

    8.1. [x] It looks like dropping (now raising) the project by one line will not be enough. Project title is hidden behind the border of the project infront.

    8.2. [x] Ensure zoom is adequate to display all project elements on given width of page. should fit on mobile in portrait

9. [x] Add Red "Desision Point" to check box options and make task text coulor red when it is selected

10. [x] Clicking on project should bring it to the front for viewing and editing. clicking elswhere should send it back to the original position. at the moment you can not edit a card if it is behind another.

11. [x] Project stack title at top is in plain white. add some custom mordern tech neon font or somthing. Hype it up a bit!

12. [x] Browser icon appears to be a lightning bolt. is this a automatic standard or somthing that is defined somewhere?

13. [x] Scroll wheel functionality for zoom on desktop

# COMPLETED

# ISSUES WITH FIXES - numbers pertain to original issue

10.2 [x] Project cards should loose opacity when bringing to the from as too much of back cards is visible especially when borderes are highlighed.

12.2 [x] I updated favicon.svg icon in public directory but icon hasnt changed.

8.3 [x] Projects are dissapearing through top of view port! Virtical page cscroll works but project view port is not adjusting to fit all projects in it.

8.1.2 [x] The 8.1 fix did not work. the project title is still cut in have by the top border of the project bellow. it looks like we can still reduces the gap between top of title and the top border to reduce vertical height. The vertical offset will need to also be increased.

4.2 [issue may have self resolved] Project dag works but virtical cascade is not adjusted for new position in stack

14. [x] Archived projects should have thin neon green border

# COMPLETE

4.3 [] Live drag works but its hard to tell where it is going to land. should we make cards reorder live as well so we can see exactly where it will go?

remove ?v=2 to the favicon URL in frontend/index.html:5.


# ISSUES REMAINING 20/05 1830

1. [x] Horrizontal cascade is not mapping correctly on my android phone. at 100% zoom, the cascade should be measure such that NO projects spill off the right hand side of the screen

2. [x?] Drag project function not working on mobile "failed to excecute 'json' on 'Response': Unexpected end of JSON input

3. [x] Remove scroll wheel function from zoom and apply it to vertical scroll. Apply 'ctrl' + scroll to zoom instead.



FOR FUTURE ISSUES, USE A NUMBERING SYSTEM: FIRST SET OFF ISSUES STARTS AT 100, 101, 102. NEXT SET 200.... SO THAT YOU CAN CALL THEM EASILY.

# Issues 

22/05 1727 series 200

    201. [x] Drag not working on mobile. drag should work by pressing and holding drag, drag to new position, release to drop in new position. At the moment clicking on drag seems to click but has no response.
    202. [x] Archived projects currently position on right hand end of archive stack. They should drop into left most position and bump stack to the right so as to show the most recently completed project first.
    203. [x] Tab bar only showing one tab on mobile when there are currently two saved

Committed 1759: 5bfbf8a

    204. [x] Position of dragged projects not saving. They keep reverting to original positions - Fixed in commit 659b375
    205. [x] Creating new step on selected project De-selects project! this may be a change you implemented when misunderstanding issue 103 of UPGRADES.md earlier. A project should only be deselected when clicking outside of the project! not when clicking the project again! - Fixed in commit 659b375

Committed 1821: 659b375

    206. [x] Clicking on tab immediately opens name edit. edit should only open after second click.

    204. [x] Parent issue 204! DRAG POSITION STILL NOT SAVING! - Fixed: reorderProjects was reverted to fire-and-forget pattern. Restored Promise.all with proper error handling.

Committed 2042: ae2d105

    304. [x] DRAG POSITION STILL NOT SAVING!

    404. [x] 204,304< DRAG POSITION STILL NOT SAVING! FIX RE-APPLIED: reorderProjects now uses async/await + Promise.all to ensure all position updates complete before continuing. Added error handling so failures are visible instead of swallowed.

Committed 2106: e16c23f

    504. [x] STILL NOT FUCKING WORKING!!!!!!! REFACTOR??????

Committed 2120: 22472f6

    604. [x] NOPE! FUCKING WORSE NOW!!!!!!!!!!!

Committed 2126: c1e14df

    704. [x] Back to not saving after refresh

Committed 2133: 497cb7d

    804. [x] And what do you know!...... STILL FUCKED!!!!!!!!!!!!!!!!!

Committed 2154: 2111ec9

    904. [x] NO CHANGE!
    Commit dcf71e6 pushed to add data logging to get to the bottom of API's not being called and database not updating.

Committed 2305: ad4432e

    207. [] Project due dates now broken. were previously working!

# Issues 24/05/26 1000 Series

1001. [x] Project edits aren't saving live. They are only updating after refresh. So they are obviously being save but they're not rendering. This is global too, New projects, task edits, status... everything

1002. [x] zoom setting resets to 100% on return to tab. current zoom setting should be saved and be the same after leaving and returning to tab

1003. [x] Add issue_log.md and issue2.md to ALL gitignores

Committed 1749: 3702b0a

# 28/05/26

1004. [x] Project border highlighting should go back to defult or next due date if task with duedate has been marked as complete. Completed task with due date should have no influence over project boider coulouring.

1005. [x] Getting glitches when entering steps, recieving "failed to update step" error when entering step text. typed text dissapears.

1006. [x] Other intermittent, glitchy errors popping up ('failed to fetch" "expected json somthing") can we get the error log and interrogate them now that we are at a point where everything seems to be functioning as required? Fixed response parsing on delete step / empty-body API responses and added console error logging for API failures.

1007. [x] Added backend error log files and authenticated log endpoint at `/api/logs`; documented server log location and access method.

Committed 1738: 7471582

1008. [x] When adding a step to a project, first attempt fails and produces "step not found" error. Second attempt to edit step text works though.

Committed 1752: 6a1ec89

1008.1 [x] Fix failed. Entered new step text, pressed enter, text dissappeared and produced "step not found" error.

Committed 1844: a75c567 build failed. Fix and re-push 250350b

1008.2 [x] Still same failure!

    Used log API to analyze error - confirmed race condition where frontend tries to update step with client UUID before server returns real ID
    
    Fixed race condition by registering pending promise BEFORE state update in addStep, ensuring any immediate updates wait for server ID. Added pending promise checks to updateStep, reorderSteps, and cycleStepStatus functions.

Committed 2149: 6e7e7ae

1008.3 [x] Failed

Committed 2198: 2b6c491

1008.4 [x] FIXED! Root cause identified: Race condition occurred when user clicked on new step to edit it before server returned real ID. Solution: New steps now start with empty content and automatically enter edit mode, allowing user to type immediately. By the time they press Enter, server has responded with real ID. Also added logic to delete step if user presses Enter on empty content.

Committed 2218: 1a3ad57

1008.5 [x] Fix created new issue: "validation failed" error when adding step, then "step not found" on first Enter, requiring double Enter to save. Root cause: Empty steps were being sent to server immediately, failing validation. Solution: Delay server creation until step has actual content. Empty steps exist only locally until user types content, then created on server during first update.

Committed 2230: 3a387fb

1008.6 [x] Still requires double Enter! Second Enter produces "step not found" error. Root cause: When step is created on server during first update, the state is updated with new server ID, but the updateStep function then tries to call update API with the old client ID. Solution: Apply all updates during step creation and return early - no need to call update API after creation since all data is already applied.

Committed 2237: 1683d5f

1008.7 [x] Error gone but still requires two Enters! Root cause: The auto-enter edit mode useEffect has `editingContent` in dependency array. When user presses Enter, `setEditingContent(false)` triggers the useEffect, which sees `step.content === ''` (state hasn't updated yet) and re-enters edit mode. Solution: Use ref to track if we've already auto-entered edit mode for this step, preventing re-entry until step gets content.

Committed 2240: da683c3

1008.8 [x] STILL requires two Enters! First Enter selects all text, second Enter exits. Root cause: When user presses Enter, updateStep causes a re-render before editingContent becomes false. The focus useEffect runs and calls select() on the input, selecting all text. Solution: Only call select() for empty steps (new steps), not when content exists. This prevents text selection on state updates.

Committed 2245: 7dba42a

1009. [x] "Delete step" causing intermittent failure in not deleting step and producing "step not found" error.
"Step not found for update" errors appearing in backend logs when updating steps. Root cause: The isClientId check used `stepId.includes('-') && stepId.length === 36`, which incorrectly identified server-generated UUIDs as client IDs, causing the system to try creating steps that already existed on the server. Solution: Added `_clientStepIds` Set to explicitly track client-side step IDs. IDs are added when steps are created locally and removed when they're successfully created on the server. This ensures only truly client-side steps trigger server creation in updateStep.

Committed 2305: db595e0

1010. [x] Editing tasks doesnt work on first attempt. produces step not found error. second attempt persists appropriately. Root cause: Race condition when a step is created with content and immediately edited - the component still has the old client ID but the store has already updated to the server ID and removed the pending promise, causing updateStep to try updating with a client ID that doesn't exist on the server. Solution: Added a safety check in updateStep to verify the step exists in the current state before making the API call. If the step doesn't exist with the target ID, it skips the API call (the update was already applied to local state).

Committed 2321: af4fc30


30/05/26

1011. [x] Creating new project in KHORTECH tab produces errors at each step, "validation failed" when first creating project, "project not found" when saving title. sam on delete. This only happens on khortech tab though and not board. That could be because this tab was made before tabs were even implimented. this may be a legacy code issue and not aplicablie going forward? Inspect log api for specific errors on 29/05 and today, 30/05
    
    Root cause: KHORTECH tab was created before tabs were implemented and has a legacy ID that's not in UUID format. The validation schema required `tabId` to be a UUID, causing validation failures when creating/updating projects in that tab.
    
    Solution: Modified `projectCreateSchema` in backend/src/validation/schemas.ts to accept any string for `tabId` instead of requiring UUID format, allowing legacy tab IDs to work properly.

Committed 1010: 0d5bbd5

1012. [x] On fresh open, BOARD tab only appears after a refresh. Tabs not populating properly on first load?

Committed 1030: 45e4346

1013. [x] Due date needs second attempt to save. If entering '15/07/26' on first attemp, text just disappears as soon as the '6' is entered and you have to re-enter it.

1014. [x] Vertical space of project window should be trimmed to size of project stack.

1015. [x] task or project deletes shouldn't be instant. my fat finger just deleted a task on mobile when I was just trying to bring that project to the front. first click, bring project to front. second - delete.

Committed 1626: 367b069 failed due to RAM constraint

# CRITICAL ISSUE - 30/05/26

**Logger Memory Leak - Multiple instances spawning**

Issue: Every time `fetch-logs.mjs` was called to check logs, a new server process would start, creating 40+ log instances since 22/05, consuming huge amounts of RAM.

Root Cause: Logger had no singleton protection or scheduled cleanup. `cleanupOldLogs()` only ran once at server startup, not periodically. No mechanism prevented multiple cleanup intervals from being created.

Solution implemented:
1. Added singleton pattern with `isInitialized` flag to prevent multiple logger initializations
2. Added `cleanupIntervalId` tracking to prevent multiple cleanup intervals
3. Implemented `startScheduledCleanup()` that runs every hour (configurable via `LOG_CLEANUP_INTERVAL_MS`)
4. Added `cleanupLargeLogs()` to trim oversized log files (>10MB default) to last 1000 lines
5. Added `getLoggerStatus()` for health check monitoring
6. Added graceful shutdown handlers (SIGTERM/SIGINT) to stop cleanup intervals
7. Updated `/api/health` endpoint to include logger status
8. Added environment variables: `LOG_RETENTION_DAYS`, `LOG_MAX_SIZE_MB`, `LOG_CLEANUP_INTERVAL_MS`

Files changed:
- `backend/src/logger.ts` - Complete refactor with singleton protection, scheduled cleanup, size-based rotation
- `backend/src/server.ts` - Use `initializeLogger()` and add status to health check
- `backend/.env.example` - Document new logging configuration options

Committed 1818: 0fff0d0

1014.1 [x] Top of project card window is now clipping view of cards!

1016. [x] "Step not found" error upon clicking delete confirmation. get rid of the delete confirmation entirely

Committed 1836: b57842a

---

# 30/05/26 2028 - Disk I/O Alert Fix (Part 1)

**Issue:** Server jocko.ai triggered Disk I/O alert - averaging 719 requests/second (threshold: 500/s)

**Root Cause:** 
1. Logger writing to disk on every `appendLog()` call
2. Race condition warnings triggering excessive disk writes via `appendLog('warn', ...)`
3. No log buffering - synchronous disk I/O on every log entry

**Solution:**
1. Added log buffering to `backend/src/logger.ts` - buffers 100 entries, flushes every 30s
2. Removed `appendLog()` calls from `backend/src/routes/projects.ts` for routine race conditions
3. Added `LOG_BUFFER_SIZE` and `LOG_FLUSH_INTERVAL_MS` environment variables

**Results:**
- Disk I/O reduced from **719/s to ~5/s** (99.3% reduction)
- Well below 500/s alert threshold
- Server restart confirmed via `iostat`

Committed 2028: b9e6b5e

---

# 30/05/26 2250 - Disk I/O Alert Fix (Part 2) - cycleStepStatus Bug

**Issue:** Disk I/O alert triggered AGAIN immediately after clicking task status checkbox on BOARD tab. Status checkboxes unresponsive at first, then glitch.

**Root Cause:** Bug in `frontend/src/store/useProjectStore.ts` `cycleStepStatus` function:
- Calculated `nextStatus` correctly for local state update
- BUT API call used old `step.status` instead of `nextStatus`
- This caused status to NOT actually update on server
- User clicks multiple times rapidly → each click triggers database write → disk I/O spike

**Problem Code:**
```typescript
// Line 467 - correct
const nextStatus = step ? cycle[step.status] : 'CLEAR'

// Line 497 - BUG! Used old status
await updateStep(projectId, targetId, { status: step.status })  // WRONG
```

**Solution:** Calculate `nextStatus` BEFORE state update, then use it in both state update AND API call:
```typescript
// Calculate next status BEFORE state update
const nextStatus = step ? cycle[step.status] : 'CLEAR'

// Use nextStatus in API call
await updateStep(projectId, targetId, { status: nextStatus })  // CORRECT
```

**Results:**
- Status checkbox now works correctly on first click
- Single API call per click instead of multiple rapid retries
- No more I/O spikes when clicking checkboxes

Committed 2250: dba26a5

1017. [x] public users cant cycle between public tabs, theyre stuck on the one admine viewed last - Fixed Part 1: Modified `loadTabs` in useTabStore.ts to validate activeTabId against loaded tabs. Fixed Part 2: Modified `handleNameClick` in TabBar.tsx to not call `e.stopPropagation()` for non-admins, allowing the click to propagate to the parent onClick handler that switches tabs.

Committed 2306: 5ecdf8d
2313: bb85acf

1018. [x] "validation failed" error when i opened a new project, started editing the title but changed it, backspaced to blank, ERROR fired here, continued to re-enter correct title and save. saved fine but i want to make sure the error isnt an issue and stop it from coming up in that circumstance.
    
    Root cause: The `onChange` handler in ProjectCard called `debouncedUpdateTitle` on every keystroke, including when the title was backspaced to blank. The backend validation requires `title: z.string().min(1)`, so an empty string fails validation with "validation failed".
    
    Solution: Added a guard in the `onChange` handler to only call `debouncedUpdateTitle` when `e.target.value.trim()` is truthy (non-empty). When the user backspaces to blank, no API call is made, so no validation error occurs. The `handleTitleConfirm` on blur/Enter already handles empty titles by falling back to the original project title.

1019. [x] task drag reorder seems to only persist on second try. first fails.
    
    Root cause: Race condition between dnd-kit drag event IDs and Zustand state updates.
    When a new step was created, it started with a client UUID. If the server responded
    and updated the store to a server UUID BEFORE the user finished dragging, dnd-kit's
    `active.id` was still the stale client UUID. `handleDragEnd` then called
    `steps.findIndex((s) => s.id === clientId)` which returned `-1` (steps now had server
    IDs). `arrayMove(steps, -1, -1)` then produced an essentially unchanged array,
    making the drag appear to not persist.
    
    Solution: Added `_stepIdMap: Map<string, string>` to the store to track client ID
    → server ID mappings. When a step is successfully created on the server, the mapping
    is stored. `reorderSteps` now resolves any stale client IDs in `orderedIds` to their
    server IDs before processing:
    ```typescript
    const resolvedIds = orderedIds.map((id) => stepIdMap.get(id) ?? id)
    ```
    This ensures the drag always uses the correct step IDs for both state updates and
    API calls, even if the ID changed mid-drag.

1020. [x] part of existing problem that was fixed (you need to click a card to bring it to the front before you can edit it) the front card is already at the fron and should have instants edits when clicked (add/delete step, edit task ect)

    Root cause: The `isFront` flag was only `true` when a card was explicitly clicked to bring it to front (`frontProjectId === project.id`). When no card had been clicked, `frontProjectId` was `null` and `isFront` was `false` for ALL cards - including the leftmost card which is naturally at the front due to z-index ordering. The `requireFront` wrapper in `ProjectCard.tsx` then blocked all edits on this "naturally front" card.

    Solution: Modified `isFront` calculation in `ProjectStack.tsx` to treat the leftmost card as front when no explicit front has been set:
    ```typescript
    const isFront = frontProjectId === project.id || (frontProjectId === null && index === 0)
    ```
    This ensures the leftmost (naturally front) card has instant edit access without requiring a click.

Committed 02/06/26 1019: 8c2281e 
Committed 02/06/26 1155 fix (race condition of 1019): f0d8ff5


1021. [x] date picker upgrade - date not saving. Fixed: Modified `onConfirm` callback to accept optional `confirmedValue` parameter so the date value is passed directly instead of relying on async state updates.

1022. [x] date picker upgrade - requires two clicks to begin edit, should be one. first opend date edit, second opens calender drop dow. drop down should be activated on first click. Fixed: Added `autoFocus` attribute to the date input field so the calendar dropdown opens immediately when the DatePicker component mounts.
