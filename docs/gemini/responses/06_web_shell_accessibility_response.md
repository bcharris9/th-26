Here is the accessibility guidance for your Web Shell, optimized for seniors (your user persona) and judges (your demo audience).

1. Layout Recommendation: "The Big Card" Strategy
For seniors and distance visibility, avoid dense data grids. Use a Single-Column Card Layout.
The Focal Point: The active transaction (Proposal) should live in a central, high-contrast "Card" that occupies 60% of the screen width.
Action Zone: Primary actions ("Confirm", "Send") should be full-width bars at the bottom of the card or distinct, large floating buttons. Avoid small text links.
History as Context: Relegate transaction history to a muted list below the active card. Do not let history compete with the current decision.
Judge Visibility: Use a Split View for the demo:
Left (User View): The simple Senior UI.
Right (System View): A high-contrast "Terminal" log showing the JSON actions and Risk Scores in real-time. This proves the backend logic is working.

2. Typography Sizes & Spacing
Assume the demo will be projected or screen-shared. "Standard" web sizes are too small.
Element
Size (Desktop/Demo)
Line Height
Weight
Notes
H1 (Headlines)
32px - 36px
1.2
Bold
Use for "Confirm Transfer?"
H2 (Amounts)
48px
1.1
Bold
The money is the most important data.
Body Text
20px
1.6
Regular
Minimum for senior readability.
Secondary/Meta
16px
1.5
Medium
Dates, Account IDs. Don't go smaller.
Buttons
20px
Semi-Bold
Uppercase labels often help clarity here.

Spacing: Use 24px (1.5rem) margins minimum between major elements.
Touch Targets: Ensure all interactive elements (buttons, inputs) are at least 48x48px (ideally 60px height for main buttons).

3. 8 Accessibility Checks (The "Demo-Safe" Checklist)
[ ] The "Back of Room" Test:
Can you read the Risk Score and Dollar Amount from 10 feet away? If not, zoom the browser to 125%.
[ ] ARIA Live for Assistant:
Wrap the text div where the Assistant's response appears in <div aria-live="polite" aria-atomic="true">. This ensures screen readers (and judges watching the DOM) see updates immediately.
[ ] Assertive Alerts:
For High Risk warnings, swap the container to aria-live="assertive". This interrupts other announcements to prioritize the "Scam Detected" warning.
[ ] Focus Management (The "Trap"):
When the "Two-Step Confirmation" modal appears, programmatically move focus to the modal container (element.focus()). Prevent tab navigation behind the modal.
[ ] High Contrast Borders:
Don't rely on color alone for status.
Bad: Red text for error.
Good: Red text plus a thick 4px Red border on the card plus an icon (⚠️).
[ ] No Auto-Advance:
Ensure the UI never jumps to the next screen automatically. Seniors need time to read. Wait for explicit "Yes/No" voice or click input.
[ ] Clear Focus Rings:
Override default outline styles. Use a thick, high-contrast outline (outline: 3px solid #005fcc) so it's obvious which element is active during keyboard navigation demos.
[ ] Plain English Errors:
Never show "Error 500". Show: "We couldn't reach the bank. Please try again."
