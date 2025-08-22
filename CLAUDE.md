- we are doing tdd:Here’s a more compact, step-by-step version of that workflow:

Compacted Prompt for Claude (TDD workflow):
    1.    Write tests only – Based on explicit input/output pairs. Be clear this is test-driven development and it should not write any implementation code.
    2.    Run tests – Confirm they fail.
    3.    Commit tests – Once you’re satisfied with them.
    4.    Implement code – Write code to make tests pass. Instruct Claude not to modify the tests.
    5.    Iterate – Run tests, adjust code, and repeat until all pass.
    6.    Cross-check – Ask independent subagents to verify the code isn’t overfitting to the tests.
    7.    Commit code – Once satisfied with correctness.

⸻

Do you want me to rewrite this into an even tighter one-liner instruction you could just drop into Claude, or keep it as this ordered checklist?