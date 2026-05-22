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

    504. [] STILL NOT FUCKING WORKING!!!!!!! REFACTOR??????